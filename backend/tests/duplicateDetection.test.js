import { describe, it, expect } from 'vitest';
import { normalizeArticleUrl } from '../src/services/news/urlNormalizer.js';
import { clusterSimilarArticles } from '../src/services/news/intelligence.js';

describe('URL Normalization & Duplicate Event Detection', () => {
  it('normalizes URLs by stripping tracking params, www, fragments, and trailing slashes', () => {
    const a = normalizeArticleUrl('http://www.TechCrunch.com/2026/11/17/new-chip/?utm_source=twitter&ref=hn#comments');
    const b = normalizeArticleUrl('https://techcrunch.com/2026/11/17/new-chip');
    expect(a.valid).toBe(true);
    expect(b.valid).toBe(true);
    expect(a.normalizedUrl).toBe(b.normalizedUrl);
    expect(a.normalizedUrl).toBe('https://techcrunch.com/2026/11/17/new-chip');
  });

  it('rejects malformed or non-http(s) URLs', () => {
    expect(normalizeArticleUrl('javascript:void(0)').valid).toBe(false);
    expect(normalizeArticleUrl('not-a-url').valid).toBe(false);
    expect(normalizeArticleUrl('').valid).toBe(false);
  });

  it('clusters independent sources reporting the same event and counts corroboration accurately', () => {
    const now = new Date('2026-11-17T10:00:00Z').toISOString();
    const articles = [
      {
        title: 'Cloudflare mitigates record breaking massive DDoS attack targeting global DNS',
        normalizedUrl: 'https://blog.cloudflare.com/ddos-2026',
        sourceId: 'src-cloudflare',
        publishedAt: now,
      },
      {
        title: 'Record breaking massive DDoS attack targeting global DNS mitigated by Cloudflare',
        normalizedUrl: 'https://arstechnica.com/security/cloudflare-ddos',
        sourceId: 'src-ars',
        publishedAt: now,
      },
      {
        title: 'SpaceX Starship completes orbital refueling test successfully',
        normalizedUrl: 'https://space.com/starship-refuel',
        sourceId: 'src-space',
        publishedAt: now,
      },
    ];

    const clustered = clusterSimilarArticles(articles);
    const ddosStories = clustered.filter((a) => a.title.includes('Cloudflare'));
    const spaceStory = clustered.find((a) => a.title.includes('SpaceX'));

    expect(ddosStories).toHaveLength(2);
    expect(ddosStories[0].clusterId).toBeTruthy();
    expect(ddosStories[0].clusterId).toBe(ddosStories[1].clusterId);
    expect(ddosStories[0].corroborationCount).toBe(2);

    expect(spaceStory.clusterId).toBeNull();
    expect(spaceStory.corroborationCount).toBe(1);
  });
});
