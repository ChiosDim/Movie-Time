import logger from '../utils/logger.js';
import fs from 'fs';

export function errorHandler(err, req, res, next) {
  console.error('[ERROR HANDLER] Error caught:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    statusCode: err.statusCode,
    name: err.name,
  });

  logger.info('ERROR HANDLER INVOKED', { err: err.message });
  logger.error('Unhandled error', err.message);

  // Log to error.log file
  const errorLog = `[${new Date().toISOString()}] PATH: ${req.path} | METHOD: ${req.method}\n${err.message}\n${err.stack}\n---\n`;
  fs.appendFile('./error.log', errorLog, (err) => {
    if (err) {
      console.error('Failed to write to error.log', err);
    }
  });

  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production'
      ? 'An error occurred. Please try again.'
      : err.message;

  const csrfToken = (typeof req.csrfToken === 'function') ? req.csrfToken() || '' : '';
  res.status(statusCode).render('error', {
    error: message,
    statusCode,
    csrfToken
  });
}

export function notFoundHandler(req, res) {
  const csrfToken = (typeof req.csrfToken === 'function') ? req.csrfToken() || '' : '';
  res.status(404).render('error', {
    error: 'Page not found',
    statusCode: 404,
    csrfToken
  });
}

export default {
  errorHandler,
  notFoundHandler,
};
