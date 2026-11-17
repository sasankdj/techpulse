const TRACKING_PARAMS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'utm_id',
  'ref',
  'ref_src',
  'fbclid',
  'gclid',
  'yclid',
  'mc_cid',
  'mc_eid',
  'igshid',
  'si',
  'spm',
  'mkt_tok',
]);

/**
 * Validates and normalizes an article URL for deduplication.
 * Returns { valid: true, url, normalizedUrl } or { valid: false, reason }.
 */
export function normalizeArticleUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { valid: false, reason: 'Missing URL' };
  }

  const trimmed = rawUrl.trim();
  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { valid: false, reason: 'Malformed URL' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { valid: false, reason: `Unsupported protocol: ${parsed.protocol}` };
  }

  if (!parsed.hostname || !parsed.hostname.includes('.')) {
    return { valid: false, reason: 'Invalid hostname' };
  }

  // Canonical form for deduplication
  const canonical = new URL(parsed.toString());
  canonical.protocol = 'https:';
  canonical.hostname = canonical.hostname.toLowerCase().replace(/^www\./, '');
  canonical.hash = '';

  // Remove tracking parameters and sort remaining query params
  const keptParams = [];
  for (const [key, value] of canonical.searchParams.entries()) {
    const lowerKey = key.toLowerCase();
    if (!TRACKING_PARAMS.has(lowerKey) && !lowerKey.startsWith('utm_')) {
      keptParams.push([key, value]);
    }
  }
  keptParams.sort(([a], [b]) => a.localeCompare(b));
  canonical.search = '';
  for (const [k, v] of keptParams) {
    canonical.searchParams.append(k, v);
  }

  // Strip trailing slash except root
  if (canonical.pathname.length > 1 && canonical.pathname.endsWith('/')) {
    canonical.pathname = canonical.pathname.replace(/\/+$/, '');
  }

  return {
    valid: true,
    url: parsed.toString(),
    normalizedUrl: canonical.toString(),
  };
}
