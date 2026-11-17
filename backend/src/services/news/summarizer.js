import { env } from '../../config/env.js';

/**
 * Modular AI-ready Summarizer Interface.
 *
 * Default implementation: Free extractive excerpt generator (requires NO API key).
 * Optional adapter: Local Ollama model when OLLAMA_BASE_URL is configured.
 *
 * All summaries return `summarySource` metadata so the UI transparently discloses
 * whether text is an automated excerpt vs a local Ollama model output.
 */

const SIGNAL_WORDS = new Set([
  'announced', 'launches', 'released', 'introduces', 'vulnerability', 'critical',
  'acquisition', 'funding', 'billion', 'million', 'open-source', 'benchmark',
  'breakthrough', 'update', 'security', 'model', 'framework', 'performance',
]);

export function createExtractiveExcerpt(title, rawText, maxLength = 320) {
  const text = (rawText || '').replace(/\s+/g, ' ').trim();
  if (!text) {
    return {
      excerpt: '',
      summarySource: 'rss_excerpt',
      disclaimer: 'Automated excerpt from RSS feed (not verified AI analysis).',
    };
  }

  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 25);

  if (sentences.length <= 2) {
    const clipped = text.length > maxLength ? `${text.slice(0, maxLength - 1).trim()}…` : text;
    return {
      excerpt: clipped,
      summarySource: 'rss_excerpt',
      disclaimer: 'Automated excerpt from RSS feed (not verified AI analysis).',
    };
  }

  const titleWords = new Set(
    (title || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 3)
  );

  // Score sentences by position, title overlap, and tech signal words
  const scored = sentences.map((sentence, idx) => {
    const words = sentence.toLowerCase().replace(/[^a-z0-9\s-]/g, '').split(/\s+/);
    let score = idx === 0 ? 3 : idx === 1 ? 1.5 : 0;
    for (const w of words) {
      if (titleWords.has(w)) score += 1.2;
      if (SIGNAL_WORDS.has(w)) score += 1.5;
    }
    return { sentence, idx, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const picked = scored
    .slice(0, 2)
    .sort((a, b) => a.idx - b.idx)
    .map((x) => x.sentence)
    .join(' ');

  const finalExcerpt =
    picked.length > maxLength ? `${picked.slice(0, maxLength - 1).trim()}…` : picked;

  return {
    excerpt: finalExcerpt,
    summarySource: 'extractive',
    disclaimer: 'Automated keyword-ranked excerpt (not verified AI analysis).',
  };
}

/**
 * Optional local Ollama adapter (only used when OLLAMA_BASE_URL is configured).
 */
export async function summarizeWithOllama(title, text) {
  if (!env.ollamaBaseUrl) {
    return createExtractiveExcerpt(title, text);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(`${env.ollamaBaseUrl.replace(/\/$/, '')}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: env.ollamaModel,
        stream: false,
        prompt: `Summarize this technology news item in 2 concise factual sentences without speculation.\nTitle: ${title}\nText: ${text.slice(0, 2000)}`,
      }),
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return createExtractiveExcerpt(title, text);
    }

    const data = await res.json();
    const summary = (data.response || '').trim();
    if (!summary) return createExtractiveExcerpt(title, text);

    return {
      excerpt: summary.slice(0, 420),
      summarySource: 'ollama',
      disclaimer: `Local Ollama (${env.ollamaModel}) automated summary — verify against original article.`,
    };
  } catch {
    return createExtractiveExcerpt(title, text);
  }
}

export async function generateArticleSummary({ title, text, useOllama = false }) {
  if (useOllama && env.ollamaBaseUrl) {
    return summarizeWithOllama(title, text);
  }
  return createExtractiveExcerpt(title, text);
}
