import { describe, it, expect } from 'vitest';
import { evaluateArticleImportance } from '../src/services/news/intelligence.js';

describe('Rule-Based News Intelligence Engine', () => {
  const now = new Date('2026-11-17T12:00:00Z');

  it('labels a recent, multi-source, high-impact story as Breaking', () => {
    const result = evaluateArticleImportance({
      title: 'Critical zero-day vulnerability discovered in major cloud runtime',
      description: 'Security teams issue urgent patch for CVE-2026-1234.',
      sourceReliability: 94,
      publishedAt: new Date(now.getTime() - 45 * 60000), // 45 mins ago
      categorySlugs: ['cybersecurity', 'cloud-computing'],
      corroborationCount: 3,
      now,
    });

    expect(result.importanceScore).toBeGreaterThanOrEqual(80);
    expect(result.importanceLabel).toBe('Breaking');
  });

  it('labels a multi-source story within 24h (older than 4h) as Trending', () => {
    const result = evaluateArticleImportance({
      title: 'NVIDIA announces next generation Blackwell workstation GPU lineup',
      description: 'Major semiconductor update for local AI inference.',
      sourceReliability: 90,
      publishedAt: new Date(now.getTime() - 10 * 3600000), // 10 hours ago
      categorySlugs: ['semiconductors', 'hardware'],
      corroborationCount: 2,
      now,
    });

    expect(result.importanceLabel).toBe('Trending');
  });

  it('does NOT falsely label a single-source old low-signal post as Breaking or Trending', () => {
    const result = evaluateArticleImportance({
      title: 'Weekend thoughts on desk cable management',
      description: 'Some personal tips for organizing your desk.',
      sourceReliability: 70,
      publishedAt: new Date(now.getTime() - 72 * 3600000), // 3 days ago
      categorySlugs: ['gadgets'],
      corroborationCount: 1,
      now,
    });

    expect(result.importanceLabel).toBe('General');
    expect(result.importanceScore).toBeLessThan(50);
  });
});
