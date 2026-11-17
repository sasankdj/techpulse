import { describe, it, expect } from 'vitest';
import { parseFeedItems } from '../src/services/news/rssIngestor.js';
import { classifyArticle } from '../src/services/news/categorizer.js';
import { stripHtml } from '../src/services/news/extractor.js';

const SAMPLE_RSS_XML = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>Sample Tech Feed</title>
    <link>https://example.com</link>
    <item>
      <title>OpenAI launches new reasoning LLM with agentic tool use</title>
      <link>https://example.com/articles/openai-llm/?utm_source=rss&amp;utm_medium=feed</link>
      <pubDate>Tue, 17 Nov 2026 10:00:00 GMT</pubDate>
      <description><![CDATA[<p>OpenAI announced a new <strong>large language model</strong> focused on AI agents and coding benchmarks.</p><img src="https://cdn.example.com/llm.png" />]]></description>
    </item>
    <item>
      <title>Duplicate tracking URL article</title>
      <link>https://www.example.com/articles/openai-llm</link>
      <pubDate>Tue, 17 Nov 2026 10:05:00 GMT</pubDate>
      <description>Same article with different tracking query params.</description>
    </item>
    <item>
      <title>Invalid JS link item</title>
      <link>javascript:alert(1)</link>
      <description>Should be skipped for safety.</description>
    </item>
  </channel>
</rss>`;

const SAMPLE_ATOM_XML = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Linux Kernel Releases</title>
  <entry>
    <title>Linux Kernel 6.18 Released with Rust Driver Improvements</title>
    <link href="https://kernel.org/releases/6.18" />
    <updated>2026-11-17T08:00:00Z</updated>
    <summary>Open source kernel update adds improved Rust support and AMD GPU performance fixes.</summary>
  </entry>
</feed>`;

describe('RSS & Atom Parser Service', () => {
  const mockSource = {
    id: 'src-1',
    name: 'Example Tech',
    feed_url: 'https://example.com/feed.xml',
    category: 'Artificial Intelligence',
    reliability_score: 90,
  };

  it('parses RSS 2.0 XML, extracts images, strips HTML, skips unsafe URLs, and deduplicates normalized URLs', async () => {
    const items = await parseFeedItems(mockSource, { xmlString: SAMPLE_RSS_XML });
    expect(items).toHaveLength(1);
    expect(items[0].title).toContain('OpenAI launches new reasoning LLM');
    expect(items[0].normalizedUrl).toBe('https://example.com/articles/openai-llm');
    expect(items[0].imageUrl).toBe('https://cdn.example.com/llm.png');
    expect(items[0].description).not.toContain('<strong>');
    expect(items[0].categorySlugs).toContain('large-language-models');
    expect(items[0].categorySlugs).toContain('ai-agents');
  });

  it('parses Atom feeds cleanly', async () => {
    const items = await parseFeedItems(
      { ...mockSource, category: 'Open Source' },
      { xmlString: SAMPLE_ATOM_XML }
    );
    expect(items).toHaveLength(1);
    expect(items[0].title).toContain('Linux Kernel 6.18');
    expect(items[0].categorySlugs).toContain('open-source');
    expect(items[0].categorySlugs).toContain('programming');
  });

  it('strips script tags and HTML cleanly via Cheerio', () => {
    const text = stripHtml('<div>Hello <script>alert(1)</script><b>World</b></div>');
    expect(text).toBe('Hello World');
  });

  it('assigns multiple categories when an article spans domains', () => {
    const slugs = classifyArticle({
      title: 'React 19 and Node.js security patch fixes critical CVE-2026-9999 vulnerability',
      description: 'JavaScript web development teams should upgrade immediately.',
    });
    expect(slugs).toEqual(expect.arrayContaining(['react', 'nodejs', 'cybersecurity', 'javascript']));
  });
});
