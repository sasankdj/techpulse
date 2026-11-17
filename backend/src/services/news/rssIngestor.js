import Parser from 'rss-parser';
import { getSupabaseAdmin } from '../../config/supabase.js';
import { normalizeArticleUrl } from './urlNormalizer.js';
import { classifyArticle } from './categorizer.js';
import { extractImageUrl, buildExcerpt } from './extractor.js';
import { generateArticleSummary } from './summarizer.js';
import { clusterSimilarArticles, evaluateArticleImportance } from './intelligence.js';

const USER_AGENT = 'TechPulseRSSAggregator/1.0 (+https://techpulse.app; respectful-feed-reader)';

export function createRssParser(timeoutMs = 12000) {
  return new Parser({
    timeout: timeoutMs,
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
    },
    customFields: {
      item: [
        ['media:content', 'media:content', { keepArray: true }],
        ['media:thumbnail', 'media:thumbnail', { keepArray: true }],
        ['content:encoded', 'content:encoded'],
      ],
    },
  });
}

/**
 * Parses raw XML string or fetches a remote RSS/Atom feed and returns normalized raw articles.
 */
export async function parseFeedItems(source, { parser = createRssParser(), xmlString = null, maxItems = 25 } = {}) {
  const feed = xmlString
    ? await parser.parseString(xmlString)
    : await parser.parseURL(source.feed_url);

  const items = Array.isArray(feed?.items) ? feed.items.slice(0, maxItems) : [];
  const normalized = [];
  const seenUrls = new Set();

  for (const item of items) {
    const rawLink = item.link || item.guid;
    const urlCheck = normalizeArticleUrl(rawLink);
    if (!urlCheck.valid) continue;
    if (seenUrls.has(urlCheck.normalizedUrl)) continue;
    seenUrls.add(urlCheck.normalizedUrl);

    const title = (item.title || '').replace(/\s+/g, ' ').trim();
    if (!title || title.length < 4) continue;

    const rawExcerpt = buildExcerpt(item, 500);
    const summaryResult = await generateArticleSummary({
      title,
      text: rawExcerpt,
      useOllama: false,
    });

    const publishedDate = parsePublishedDate(item.isoDate || item.pubDate || item.date);
    const rawCategories = Array.isArray(item.categories)
      ? item.categories.map((c) => (typeof c === 'string' ? c : c?._ || '')).filter(Boolean)
      : [];

    const categorySlugs = classifyArticle({
      title,
      description: rawExcerpt,
      sourceCategory: source.category,
      rawCategories,
    });

    normalized.push({
      title: title.slice(0, 320),
      url: urlCheck.url,
      normalizedUrl: urlCheck.normalizedUrl,
      description: rawExcerpt.slice(0, 420) || null,
      contentExcerpt: summaryResult.excerpt || null,
      summarySource: summaryResult.summarySource,
      imageUrl: extractImageUrl(item),
      sourceId: source.id,
      sourceName: source.name,
      sourceReliability: source.reliability_score ?? 75,
      publishedAt: publishedDate.toISOString(),
      categorySlugs,
    });
  }

  return normalized;
}

function parsePublishedDate(value) {
  if (!value) return new Date();
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return new Date();
  // Guard against future-dated RSS feed timestamps (> 1 hour ahead)
  const maxFuture = Date.now() + 3600000;
  if (parsed.getTime() > maxFuture) return new Date();
  return parsed;
}

/**
 * Runs a full polite ingestion cycle across all enabled sources in Supabase.
 * - Never overwrites user_articles (read/bookmark state).
 * - Updates source health (last_fetched_at, last_success_at, last_error).
 * - Deduplicates on normalized_url.
 * - Computes event clusters and rule-based importance scores.
 */
export async function runIngestionCycle({ concurrency = 4 } = {}) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return {
      skipped: true,
      reason: 'SUPABASE_NOT_CONFIGURED',
      sourcesProcessed: 0,
      articlesInserted: 0,
      errors: [],
    };
  }

  const startedAt = new Date().toISOString();
  const { data: sources, error: sourcesError } = await supabase
    .from('sources')
    .select('*')
    .eq('enabled', true)
    .order('name');

  if (sourcesError) {
    throw new Error(`Failed to load RSS sources: ${sourcesError.message}`);
  }

  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('id, slug');

  if (catError) {
    throw new Error(`Failed to load categories: ${catError.message}`);
  }

  const categorySlugToId = new Map((categories || []).map((c) => [c.slug, c.id]));
  const parser = createRssParser(12000);

  const collectedArticles = [];
  const errors = [];
  let sourcesSucceeded = 0;

  // Polite batched concurrency
  for (let i = 0; i < (sources || []).length; i += concurrency) {
    const batch = sources.slice(i, i + concurrency);
    await Promise.all(
      batch.map(async (source) => {
        const fetchedAt = new Date().toISOString();
        try {
          const items = await parseFeedItems(source, { parser });
          collectedArticles.push(...items);
          sourcesSucceeded += 1;

          await supabase
            .from('sources')
            .update({
              last_fetched_at: fetchedAt,
              last_success_at: fetchedAt,
              last_error: null,
              failure_count: 0,
            })
            .eq('id', source.id);
        } catch (err) {
          const errorMessage = (err?.message || 'Feed fetch error').slice(0, 400);
          errors.push({ source: source.name, feedUrl: source.feed_url, error: errorMessage });

          await supabase
            .from('sources')
            .update({
              last_fetched_at: fetchedAt,
              last_error: errorMessage,
              failure_count: (source.failure_count || 0) + 1,
            })
            .eq('id', source.id);
        }
      })
    );
  }

  if (collectedArticles.length === 0) {
    return {
      startedAt,
      finishedAt: new Date().toISOString(),
      sourcesProcessed: (sources || []).length,
      sourcesSucceeded,
      articlesCollected: 0,
      articlesInserted: 0,
      errors,
    };
  }

  // Deduplicate across the collected batch by normalizedUrl
  const uniqueMap = new Map();
  for (const article of collectedArticles) {
    if (!uniqueMap.has(article.normalizedUrl)) {
      uniqueMap.set(article.normalizedUrl, article);
    }
  }
  const uniqueBatch = Array.from(uniqueMap.values());

  // Cluster similar events & evaluate importance
  const clustered = clusterSimilarArticles(uniqueBatch);
  const now = new Date();
  const scoredArticles = clustered.map((art) => {
    const intelligence = evaluateArticleImportance({
      title: art.title,
      description: art.description || art.contentExcerpt || '',
      sourceReliability: art.sourceReliability,
      publishedAt: art.publishedAt,
      categorySlugs: art.categorySlugs,
      corroborationCount: art.corroborationCount,
      now,
    });
    return { ...art, ...intelligence };
  });

  // Check existing normalized URLs to report newly inserted articles accurately
  const urls = scoredArticles.map((a) => a.normalizedUrl);
  const existingSet = new Set();
  for (let i = 0; i < urls.length; i += 100) {
    const chunk = urls.slice(i, i + 100);
    const { data: existingRows } = await supabase
      .from('articles')
      .select('normalized_url')
      .in('normalized_url', chunk);
    for (const row of existingRows || []) {
      existingSet.add(row.normalized_url);
    }
  }

  const fetchedAt = new Date().toISOString();
  const rowsToUpsert = scoredArticles.map((art) => ({
    title: art.title,
    url: art.url,
    normalized_url: art.normalizedUrl,
    description: art.description,
    content_excerpt: art.contentExcerpt,
    summary_source: art.summarySource,
    image_url: art.imageUrl,
    source_id: art.sourceId,
    published_at: art.publishedAt,
    fetched_at: fetchedAt,
    importance_score: art.importanceScore,
    importance_label: art.importanceLabel,
    cluster_id: art.clusterId,
    corroboration_count: art.corroborationCount,
    keywords: art.keywords,
  }));

  const upsertedArticles = [];
  for (let i = 0; i < rowsToUpsert.length; i += 50) {
    const chunk = rowsToUpsert.slice(i, i + 50);
    const { data, error } = await supabase
      .from('articles')
      .upsert(chunk, { onConflict: 'normalized_url' })
      .select('id, normalized_url');

    if (error) {
      errors.push({ stage: 'upsert_articles', error: error.message });
    } else if (data) {
      upsertedArticles.push(...data);
    }
  }

  // Link article_categories
  const slugMapByUrl = new Map(scoredArticles.map((a) => [a.normalizedUrl, a.categorySlugs]));
  const categoryLinks = [];
  for (const row of upsertedArticles) {
    const slugs = slugMapByUrl.get(row.normalized_url) || [];
    for (const slug of slugs) {
      const categoryId = categorySlugToId.get(slug);
      if (categoryId) {
        categoryLinks.push({ article_id: row.id, category_id: categoryId });
      }
    }
  }

  for (let i = 0; i < categoryLinks.length; i += 100) {
    const chunk = categoryLinks.slice(i, i + 100);
    await supabase
      .from('article_categories')
      .upsert(chunk, { onConflict: 'article_id,category_id', ignoreDuplicates: true });
  }

  const newlyInserted = upsertedArticles.filter((r) => !existingSet.has(r.normalized_url));

  return {
    startedAt,
    finishedAt: new Date().toISOString(),
    sourcesProcessed: (sources || []).length,
    sourcesSucceeded,
    articlesCollected: uniqueBatch.length,
    articlesInserted: newlyInserted.length,
    newArticleIds: newlyInserted.map((r) => r.id),
    errors,
  };
}
