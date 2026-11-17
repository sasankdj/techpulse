import { getSupabaseAdmin } from '../config/supabase.js';

/**
 * Verifies a Supabase JWT Bearer token and attaches req.user.
 */
export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'UNAUTHORIZED',
        message: 'Missing or malformed Authorization Bearer token.',
      });
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'UNAUTHORIZED',
        message: 'Empty Bearer token.',
      });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return res.status(503).json({
        error: 'Backend database not configured',
        code: 'SUPABASE_NOT_CONFIGURED',
        message: 'Configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env to enable authentication.',
      });
    }

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN',
        message: error?.message || 'Unable to verify session token.',
      });
    }

    req.user = data.user;
    req.accessToken = token;
    return next();
  } catch (err) {
    return next(err);
  }
}

/**
 * Optional auth middleware for shared endpoints (e.g., /api/news) that enrich
 * results with per-user read/bookmark states when a valid token is present.
 */
export async function optionalAuth(req, _res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.slice(7).trim();
    const supabase = getSupabaseAdmin();
    if (!token || !supabase) {
      req.user = null;
      return next();
    }

    const { data, error } = await supabase.auth.getUser(token);
    req.user = !error && data?.user ? data.user : null;
    return next();
  } catch {
    req.user = null;
    return next();
  }
}
