import { Router } from 'express';
import { z } from 'zod';
import { requireSupabase } from '../config/supabase.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { runIngestionCycle } from '../services/news/rssIngestor.js';

const router = Router();

const articleStateSchema = z.object({
  is_read: z.boolean().optional(),
  is_bookmarked: z.boolean().optional(),
});

function formatArticleRow(row, userStateMap) {
  const state = userStateMap?.get(row.id) || { is_read: false, is_bookmarked: false };
  const categories = (row.article_categories || [])
    .map((ac) => ac.categories)
    .filter(Boolean);

  return {
    id: row.id,
    title: row.title,
    url: row.url,
    normalized_url: row.normalized_url,
    description: row.description,
    content_excerpt: row.content_excerpt,
    summary_source: row.summary_source,
    image_url: row.image_url,
    source_id: row.source_id,
    source: row.sources || null,
    published_at: row.published_at,
    fetched_at: row.fetched_at,
    importance_score: Number(row.importance_score || 0),
    importance_label: row.importance_label || 'General',
    cluster_id: row.cluster_id,
    corroboration_count: row.corroboration_count || 1,
    keywords: row.keywords || [],
    categories,
    is_read: Boolean(state.is_read),
    is_bookmarked: Boolean(state.is_bookmarked),
  };
}

async function fetchUserArticleStates(supabase, userId, articleIds) {
  const map = new Map();
  if (!userId || !articleIds.length) return map;
  const { data } = await supabase
    .from('user_articles')
    .select('article_id, is_read, is_bookmarked')
    .eq('user_id', userId)
    .in('article_id', articleIds);

  for (const row of data || []) {
    map.set(row.article_id, row);
  }
  return map;
}

router.get('/categories', async (_req, res, next) => {
  try {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, slug, group_name')
      .order('name');

    if (error) throw error;
    res.json({ categories: data || [] });
  } catch (err) {
    next(err);
  }
});

router.get('/sources', async (_req, res, next) => {
  try {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from('sources')
      .select('id, name, feed_url, website_url, favicon_url, category, reliability_score, enabled, last_fetched_at, last_success_at, last_error, failure_count')
      .order('name');

    if (error) throw error;
    res.json({ sources: data || [] });
  } catch (err) {
    next(err);
  }
});

router.get('/clusters/:clusterId', optionalAuth, async (req, res, next) => {
  try {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from('articles')
      .select('*, sources(id, name, website_url, favicon_url, reliability_score), article_categories(categories(id, name, slug, group_name))')
      .eq('cluster_id', req.params.clusterId)
      .order('importance_score', { ascending: false });

    if (error) throw error;
    const states = await fetchUserArticleStates(
      supabase,
      req.user?.id,
      (data || []).map((a) => a.id)
    );
    res.json({
      clusterId: req.params.clusterId,
      articles: (data || []).map((row) => formatArticleRow(row, states)),
    });
  } catch (err) {
    next(err);
  }
});

async function handleListNews(req, res, next) {
  try {
    const supabase = requireSupabase();
    const {
      category,
      group,
      source,
      q,
      dateRange,
      sort = 'latest',
      label,
      bookmarked,
      unread,
      page = '1',
      limit = '24',
    } = req.query;

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(60, Math.max(1, Number(limit) || 24));
    const offset = (pageNum - 1) * limitNum;

    // Resolve category filter article IDs if category or group provided
    let categoryArticleIds = null;
    if (category || group) {
      let catQuery = supabase.from('categories').select('id');
      if (category) {
        const slugs = String(category).split(',').map((s) => s.trim()).filter(Boolean);
        catQuery = catQuery.in('slug', slugs);
      } else if (group) {
        catQuery = catQuery.eq('group_name', String(group));
      }
      const { data: catRows } = await catQuery;
      const catIds = (catRows || []).map((c) => c.id);
      if (catIds.length === 0) {
        return res.json({ articles: [], pagination: { page: pageNum, limit: limitNum, total: 0 } });
      }

      const { data: links } = await supabase
        .from('article_categories')
        .select('article_id')
        .in('category_id', catIds);

      categoryArticleIds = Array.from(new Set((links || []).map((l) => l.article_id)));
      if (categoryArticleIds.length === 0) {
        return res.json({ articles: [], pagination: { page: pageNum, limit: limitNum, total: 0 } });
      }
    }

    // Resolve bookmarked filter if requested
    let bookmarkedIds = null;
    if (bookmarked === 'true') {
      if (!req.user) {
        return res.status(401).json({ error: 'Sign in required to view saved articles', code: 'UNAUTHORIZED' });
      }
      const { data: savedRows } = await supabase
        .from('user_articles')
        .select('article_id')
        .eq('user_id', req.user.id)
        .eq('is_bookmarked', true);
      bookmarkedIds = (savedRows || []).map((r) => r.article_id);
      if (bookmarkedIds.length === 0) {
        return res.json({ articles: [], pagination: { page: pageNum, limit: limitNum, total: 0 } });
      }
    }

    // Resolve read IDs to exclude when unread=true
    let readIdsToExclude = [];
    if (unread === 'true' && req.user) {
      const { data: readRows } = await supabase
        .from('user_articles')
        .select('article_id')
        .eq('user_id', req.user.id)
        .eq('is_read', true);
      readIdsToExclude = (readRows || []).map((r) => r.article_id);
    }

    let query = supabase
      .from('articles')
      .select(
        '*, sources!inner(id, name, website_url, favicon_url, reliability_score), article_categories(categories(id, name, slug, group_name))',
        { count: 'exact' }
      );

    if (categoryArticleIds && bookmarkedIds) {
      const bookmarkedSet = new Set(bookmarkedIds);
      const intersection = categoryArticleIds.filter((id) => bookmarkedSet.has(id));
      if (intersection.length === 0) {
        return res.json({ articles: [], pagination: { page: pageNum, limit: limitNum, total: 0 } });
      }
      query = query.in('id', intersection);
    } else if (categoryArticleIds) {
      query = query.in('id', categoryArticleIds);
    } else if (bookmarkedIds) {
      query = query.in('id', bookmarkedIds);
    }

    if (readIdsToExclude.length > 0) {
      query = query.not('id', 'in', `(${readIdsToExclude.join(',')})`);
    }

    if (source) {
      if (/^[0-9a-f-]{36}$/i.test(String(source))) {
        query = query.eq('source_id', String(source));
      } else {
        query = query.ilike('sources.name', `%${String(source).trim()}%`);
      }
    }

    if (label && ['Breaking', 'Important', 'Trending', 'General'].includes(String(label))) {
      query = query.eq('importance_label', String(label));
    }

    if (q && String(q).trim()) {
      const term = String(q).trim().replace(/[%_,]/g, '');
      query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%`);
    }

    if (dateRange) {
      const now = Date.now();
      let ms = 0;
      if (dateRange === '24h' || dateRange === 'today') ms = 24 * 3600000;
      else if (dateRange === '7d') ms = 7 * 24 * 3600000;
      else if (dateRange === '30d') ms = 30 * 24 * 3600000;
      if (ms > 0) {
        query = query.gte('published_at', new Date(now - ms).toISOString());
      }
    }

    if (sort === 'important') {
      query = query.order('importance_score', { ascending: false }).order('published_at', { ascending: false });
    } else {
      query = query.order('published_at', { ascending: false });
    }

    query = query.range(offset, offset + limitNum - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    const states = await fetchUserArticleStates(
      supabase,
      req.user?.id,
      (data || []).map((a) => a.id)
    );

    res.json({
      articles: (data || []).map((row) => formatArticleRow(row, states)),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limitNum),
      },
    });
  } catch (err) {
    next(err);
  }
}

router.get('/', optionalAuth, handleListNews);
router.get('/search', optionalAuth, handleListNews);

router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from('articles')
      .select('*, sources(id, name, website_url, favicon_url, reliability_score), article_categories(categories(id, name, slug, group_name))')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Article not found', code: 'NOT_FOUND' });
    }

    const states = await fetchUserArticleStates(supabase, req.user?.id, [data.id]);
    res.json({ article: formatArticleRow(data, states) });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/state', requireAuth, validateBody(articleStateSchema), async (req, res, next) => {
  try {
    const supabase = requireSupabase();
    const articleId = req.params.id;
    const userId = req.user.id;

    const { data: existing } = await supabase
      .from('user_articles')
      .select('*')
      .eq('user_id', userId)
      .eq('article_id', articleId)
      .maybeSingle();

    const nowIso = new Date().toISOString();
    const nextIsRead = req.body.is_read ?? existing?.is_read ?? false;
    const nextIsBookmarked = req.body.is_bookmarked ?? existing?.is_bookmarked ?? false;

    const { data, error } = await supabase
      .from('user_articles')
      .upsert(
        {
          user_id: userId,
          article_id: articleId,
          is_read: nextIsRead,
          is_bookmarked: nextIsBookmarked,
          read_at: nextIsRead ? existing?.read_at || nowIso : null,
          bookmarked_at: nextIsBookmarked ? existing?.bookmarked_at || nowIso : null,
        },
        { onConflict: 'user_id,article_id' }
      )
      .select('*')
      .single();

    if (error) throw error;
    res.json({ state: data });
  } catch (err) {
    next(err);
  }
});

let lastManualRefreshMs = 0;
router.post('/refresh', requireAuth, async (_req, res, next) => {
  try {
    requireSupabase();
    const now = Date.now();
    if (now - lastManualRefreshMs < 60000) {
      return res.status(429).json({
        error: 'Feed refresh was run recently. Please wait 60 seconds before refreshing again.',
        code: 'RATE_LIMITED',
      });
    }
    lastManualRefreshMs = now;
    const result = await runIngestionCycle();
    res.json({ message: 'RSS ingestion completed', result });
  } catch (err) {
    next(err);
  }
});

export default router;
