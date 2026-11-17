import * as cheerio from 'cheerio';

/**
 * Strips HTML markup safely using Cheerio and returns clean plain text.
 */
export function stripHtml(html) {
  if (!html || typeof html !== 'string') return '';
  try {
    const $ = cheerio.load(html);
    $('script, style, noscript, iframe').remove();
    return $.root()
      .text()
      .replace(/\s+/g, ' ')
      .trim();
  } catch {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }
}

/**
 * Extracts a safe preview image URL from RSS item fields or embedded HTML.
 */
export function extractImageUrl(item) {
  if (!item) return null;

  // 1. Standard RSS enclosure
  if (item.enclosure?.url && isValidImageUrl(item.enclosure.url)) {
    return item.enclosure.url;
  }

  // 2. media:content / media:thumbnail
  const mediaContent = item['media:content'];
  if (Array.isArray(mediaContent) && mediaContent[0]?.$?.url && isValidImageUrl(mediaContent[0].$.url)) {
    return mediaContent[0].$.url;
  }
  if (mediaContent?.$?.url && isValidImageUrl(mediaContent.$.url)) {
    return mediaContent.$.url;
  }

  const mediaThumb = item['media:thumbnail'];
  if (Array.isArray(mediaThumb) && mediaThumb[0]?.$?.url && isValidImageUrl(mediaThumb[0].$.url)) {
    return mediaThumb[0].$.url;
  }
  if (mediaThumb?.$?.url && isValidImageUrl(mediaThumb.$.url)) {
    return mediaThumb.$.url;
  }

  // 3. First <img> in RSS HTML content
  const html = item['content:encoded'] || item.content || item.summary || '';
  if (html && typeof html === 'string' && html.includes('<img')) {
    try {
      const $ = cheerio.load(html);
      const src = $('img').first().attr('src');
      if (src && isValidImageUrl(src)) {
        return src;
      }
    } catch {
      return null;
    }
  }

  return null;
}

function isValidImageUrl(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url.trim());
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
    // Skip common 1x1 tracking pixels
    if (/feedburner|doubleclick|pixel|spacer|1x1/i.test(parsed.toString())) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * Builds a clean, bounded excerpt from RSS description / content.
 */
// export function buildExcerpt(item, maxLength = 340) {
//   const raw =
//     item.contentSnippet ||
//     stripHtml(item.summary || item.description || item['content:encoded'] || item.content || '');

//   const cleaned = raw.replace(/\s+/g, ' ').trim();
//   if (!cleaned) return '';
//   if (cleaned.length <= maxLength) return cleaned;

//   const truncated = cleaned.slice(0, maxLength);
//   const lastSpace = truncated.lastIndexOf(' ');
//   return `${truncated.slice(0, lastSpace > 120 ? lastSpace : maxLength).trim()}…`;
// }


export function buildExcerpt(item, maxLength = 6000) {
  // Prefer fuller RSS content over the often-short contentSnippet.
  const candidates = [
    item['content:encoded'],
    item.content,
    item.summary,
    item.description,
    item.contentSnippet,
  ];

  let raw = '';

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      raw = stripHtml(candidate);
      if (raw.length > 0) break;
    }
  }

  const cleaned = raw.replace(/\s+/g, ' ').trim();

  if (!cleaned) return '';
  if (cleaned.length <= maxLength) return cleaned;

  const truncated = cleaned.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  return `${truncated.slice(0, lastSpace > 100 ? lastSpace : maxLength).trim()}…`;
}

