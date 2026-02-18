import logger from '../utils/logger.js';

export function errorHandler(err, req, res, next) {
  logger.error('Unhandled error', err.message);

  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production'
      ? 'An error occurred. Please try again.'
      : err.message;

  res.status(statusCode).render('error', {
    error: message,
    statusCode,
  });
}

export function notFoundHandler(req, res) {
  res.status(404).render('error', {
    error: 'Page not found',
    statusCode: 404,
  });
}

export default {
  errorHandler,
  notFoundHandler,
};
