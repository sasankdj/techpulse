import crypto from 'node:crypto';

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'into', 'over', 'after',
  'about', 'your', 'will', 'have', 'been', 'more', 'than', 'what', 'when', 'where',
  'how', 'why', 'new', 'now', 'its', 'are', 'was', 'were', 'has', 'had', 'not',
  'but', 'can', 'could', 'would', 'should', 'all', 'out', 'off', 'says', 'said',
  'using', 'via', 'just', 'first', 'next', 'make', 'makes', 'made', 'get', 'gets',
]);

const HIGH_IMPACT_KEYWORDS = [
  { term: 'zero-day', weight: 10 },
  { term: 'zero day', weight: 10 },
  { term: 'critical vulnerability', weight: 10 },
  { term: 'data breach', weight: 9 },
  { term: 'ransomware', weight: 8 },
  { term: 'cve-', weight: 8 },
  { term: 'open-source release', weight: 7 },
  { term: 'launches', weight: 5 },
  { term: 'announces', weight: 5 },
  { term: 'introducing', weight: 5 },
  { term: 'acquires', weight: 8 },
  { term: 'acquisition', weight: 7 },
  { term: 'billion', weight: 6 },
  { term: 'breakthrough', weight: 7 },
  { term: 'outage', weight: 8 },
  { term: 'deprecated', weight: 5 },
  { term: 'gpt-5', weight: 9 },
  { term: 'claude 4', weight: 9 },
  { term: 'gemini', weight: 6 },
  { term: 'llama', weight: 6 },
  { term: 'linux kernel', weight: 6 },
  { term: 'react 19', weight: 6 },
  { term: 'node.js', weight: 5 },
  { term: 'ai agent', weight: 6 },
  { term: 'semiconductor', weight: 5 },
  { term: 'antitrust', weight: 7 },
];

const PRIORITY_CATEGORY_SLUGS = new Set([
  'artificial-intelligence',
  'large-language-models',
  'ai-agents',
  'cybersecurity',
  'semiconductors',
  'cloud-computing',
  'open-source',
]);

/**
 * Extracts significant normalized tokens from a headline for event clustering.
 */
export function extractHeadlineTokens(title) {
  if (!title) return [];
  return Array.from(
    new Set(
      title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, ' ')
        .split(/\s+/)
        .map((t) => t.replace(/^-+|-+$/g, ''))
        .filter((t) => t.length >= 3 && !STOP_WORDS.has(t))
    )
  );
}

/**
 * Computes Jaccard similarity between two token sets.
 */
export function computeTokenSimilarity(tokensA, tokensB) {
  if (!tokensA.length || !tokensB.length) return 0;
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) intersection += 1;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Groups articles covering the same news event across independent sources.
 * Mutates/returns articles with `clusterId` and `corroborationCount`.
 */
export function clusterSimilarArticles(articles, similarityThreshold = 0.42) {
  const prepared = articles.map((article) => ({
    ...article,
    _tokens: extractHeadlineTokens(article.title),
  }));

  const clusters = [];

  for (const item of prepared) {
    let matchedCluster = null;

    for (const cluster of clusters) {
      // Only group articles published within 48 hours of each other
      const timeDiffHours =
        Math.abs(new Date(item.publishedAt).getTime() - new Date(cluster.anchorTime).getTime()) /
        3600000;
      if (timeDiffHours > 48) continue;

      const sim = computeTokenSimilarity(item._tokens, cluster.tokens);
      // Require strong overlap AND at least 3 shared meaningful tokens
      const sharedCount = item._tokens.filter((t) => cluster.tokenSet.has(t)).length;
      if (sim >= similarityThreshold && sharedCount >= 3) {
        matchedCluster = cluster;
        break;
      }
    }

    if (matchedCluster) {
      matchedCluster.items.push(item);
      matchedCluster.sources.add(item.sourceId || item.sourceName || 'unknown');
    } else {
      const clusterHash = crypto
        .createHash('sha1')
        .update(item._tokens.slice(0, 6).sort().join('|') || item.normalizedUrl || item.title)
        .digest('hex')
        .slice(0, 12);

      clusters.push({
        id: `evt_${clusterHash}`,
        anchorTime: item.publishedAt,
        tokens: item._tokens,
        tokenSet: new Set(item._tokens),
        items: [item],
        sources: new Set([item.sourceId || item.sourceName || 'unknown']),
      });
    }
  }

  const result = [];
  for (const cluster of clusters) {
    const independentSourceCount = cluster.sources.size;
    const clusterId = cluster.items.length > 1 ? cluster.id : null;

    for (const item of cluster.items) {
      const { _tokens, ...rest } = item;
      result.push({
        ...rest,
        clusterId,
        corroborationCount: independentSourceCount,
        keywords: _tokens.slice(0, 8),
      });
    }
  }

  return result;
}

/**
 * Calculates an evidence-based importance score (0-100) and conservative label.
 * Never falsely labels stories as Breaking or Trending without sufficient evidence.
 */
export function evaluateArticleImportance({
  title = '',
  description = '',
  sourceReliability = 75,
  publishedAt = new Date(),
  categorySlugs = [],
  corroborationCount = 1,
  now = new Date(),
}) {
  // 1. Source reliability (0 - 25 pts)
  const reliabilityScore = Math.min(25, Math.max(0, (Number(sourceReliability) / 100) * 25));

  // 2. Recency decay (0 - 25 pts)
  const ageMs = Math.max(0, new Date(now).getTime() - new Date(publishedAt).getTime());
  const ageHours = ageMs / 3600000;
  let recencyScore = 0;
  if (ageHours <= 2) recencyScore = 25;
  else if (ageHours <= 6) recencyScore = 22;
  else if (ageHours <= 12) recencyScore = 18;
  else if (ageHours <= 24) recencyScore = 13;
  else if (ageHours <= 48) recencyScore = 8;
  else if (ageHours <= 120) recencyScore = 4;
  else recencyScore = 1;

  // 3. Keyword & category importance (0 - 25 pts)
  const text = `${title} ${description}`.toLowerCase();
  let keywordPts = 0;
  for (const { term, weight } of HIGH_IMPACT_KEYWORDS) {
    if (text.includes(term)) {
      keywordPts += weight;
    }
  }
  const hasPriorityCategory = categorySlugs.some((slug) => PRIORITY_CATEGORY_SLUGS.has(slug));
  const categoryPts = hasPriorityCategory ? 5 : 2;
  const relevanceScore = Math.min(25, keywordPts + categoryPts);

  // 4. Multi-source corroboration (0 - 25 pts)
  let corroborationScore = 0;
  if (corroborationCount >= 4) corroborationScore = 25;
  else if (corroborationCount === 3) corroborationScore = 20;
  else if (corroborationCount === 2) corroborationScore = 14;
  else corroborationScore = 0;

  const totalScore = Math.round(
    Math.min(100, Math.max(0, reliabilityScore + recencyScore + relevanceScore + corroborationScore)) * 100
  ) / 100;

  // Evidence-backed labeling
  let label = 'General';
  if (
    ageHours <= 4 &&
    ((corroborationCount >= 2 && totalScore >= 74) || (totalScore >= 80 && keywordPts >= 10))
  ) {
    label = 'Breaking';
  } else if (corroborationCount >= 2 && ageHours <= 24 && totalScore >= 62) {
    label = 'Trending';
  } else if (totalScore >= 60) {
    label = 'Important';
  }

  return {
    importanceScore: totalScore,
    importanceLabel: label,
    breakdown: {
      reliabilityScore: Math.round(reliabilityScore * 10) / 10,
      recencyScore,
      relevanceScore,
      corroborationScore,
      ageHours: Math.round(ageHours * 10) / 10,
    },
  };
}
