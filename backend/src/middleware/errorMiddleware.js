/**
 * Centralized error handling middlewares
 */

function notFound(req, res, next) {
  res.status(404).json({
    error: `Not Found - ${req.originalUrl}`
  });
}

function errorHandler(err, req, res, next) {
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err.message);

  res.status(statusCode).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

module.exports = {
  notFound,
  errorHandler
};
