export function notFoundHandler(req, res) {
  res.status(404).json({
    error: 'Not found',
    code: 'NOT_FOUND',
    message: `Route ${req.method} ${req.originalUrl} does not exist.`,
  });
}

export function errorHandler(err, _req, res, _next) {
  const status = err.statusCode || err.status || 500;
  const code = err.code || (status >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR');

  if (status >= 500) {
    console.error('[TechPulse API Error]', err);
  }

  res.status(status).json({
    error: err.message || 'Internal server error',
    code,
    ...(err.details ? { details: err.details } : {}),
  });
}
