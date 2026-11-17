
import { env } from '../../config/env.js';

const SIGNAL_WORDS = new Set([
  'announced', 'launches', 'released', 'introduces', 'vulnerability',
  'critical', 'acquisition', 'funding', 'billion', 'million',
  'open-source', 'benchmark', 'breakthrough', 'update', 'security',
  'model', 'framework', 'performance', 'research', 'partnership',
  'technology', 'developer', 'artificial', 'intelligence',
]);

/**
 * Better extractive fallback when Ollama is unavailable.
 * Selects up to 4 useful sentences instead of clipping everything
 * to a one-line excerpt.
 */
export function createExtractiveExcerpt(title, rawText, maxLength = 950) {
  const text = (rawText || '').replace(/\s+/g, ' ').trim();

  if (!text) {
    return {
      excerpt: '',
      summarySource: 'rss_excerpt',
      disclaimer: 'No usable article text was available in the RSS feed.',
    };
  }

  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 25);

  if (!sentences.length) {
    return {
      excerpt: text.slice(0, maxLength).trim(),
      summarySource: 'rss_excerpt',
      disclaimer: 'Automated excerpt from RSS feed, not AI-generated.',
    };
  }

  const titleWords = new Set(
    (title || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((word) => word.length > 3),
  );

  const scored = sentences.map((sentence, index) => {
    const words = sentence
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .split(/\s+/);

    let score = index === 0 ? 3 : index === 1 ? 1.5 : 0;

    for (const word of words) {
      if (titleWords.has(word)) score += 1.2;
      if (SIGNAL_WORDS.has(word)) score += 1.5;
    }

    // Slightly prefer informative sentences over very short ones.
    if (words.length >= 12) score += 1;

    return { sentence, index, score };
  });

  const selected = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .sort((a, b) => a.index - b.index)
    .map((item) => item.sentence);

  let excerpt = selected.join(' ');

  if (excerpt.length > maxLength) {
    excerpt = `${excerpt.slice(0, maxLength - 1).trim()}…`;
  }

  return {
    excerpt,
    summarySource: 'extractive',
    disclaimer: 'Automated selection of RSS sentences, not AI-generated analysis.',
  };
}

/**
 * Optional local or hosted Ollama summarizer.
 */
export async function summarizeWithOllama(title, text) {
  if (!env.ollamaBaseUrl) {
    return createExtractiveExcerpt(title, text);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const baseUrl = env.ollamaBaseUrl.replace(/\/+$/, '');

    const response = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: env.ollamaModel,
        stream: false,
        prompt: `You are a factual technology news editor.

Write a useful news brief based ONLY on the supplied title and article text.

Requirements:
- Aim for 80 to 120 words when the source contains enough information.
- Use 4 to 5 clear, informative sentences.
- Explain what happened, who is involved, what the technology or product does, and important details mentioned in the source.
- Explain practical implications only when supported by the source.
- Preserve names, numbers, dates, and technical details accurately.
- Do not invent facts, quotes, features, reasons, or future predictions.
- Do not repeat the headline as the opening sentence.
- If the supplied source is too short, write a shorter summary rather than adding filler.
- Return only the summary, without a heading.

Title: ${title}

Article text:
${text.slice(0, 6000)}`,
        options: {
          temperature: 0.2,
          num_predict: 220,
        },
      }),
    });

    if (!response.ok) {
      return createExtractiveExcerpt(title, text);
    }

    const data = await response.json();
    const summary = (data.response || '').trim();

    if (!summary) {
      return createExtractiveExcerpt(title, text);
    }

    return {
      excerpt: summary.slice(0, 1100),
      summarySource: 'ollama',
      disclaimer: `Local/hosted Ollama (${env.ollamaModel}) automated summary. Verify against the original article.`,
    };
  } catch (error) {
    console.error('Ollama summarization failed:', error.message);
    return createExtractiveExcerpt(title, text);
  } finally {
    clearTimeout(timeout);
  }
}

export async function generateArticleSummary({
  title,
  text,
  useOllama = false,
}) {
  if (useOllama && env.ollamaBaseUrl) {
    return summarizeWithOllama(title, text);
  }

  return createExtractiveExcerpt(title, text);
}
