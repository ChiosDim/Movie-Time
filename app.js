import fs from 'fs';
fs.writeFileSync('./debug.log', 'APP.JS IS BEING LOADED\n');

import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import config from './src/config/index.js';
import routes from './src/routes/index.js';
import {
  errorHandler,
  notFoundHandler,
} from './src/middleware/errorHandler.js';
import logger from './src/utils/logger.js';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import csrf from 'csurf';

// CSRF protection setup
const csrfProtection = csrf({ cookie: true });

// CSRF error handling
const csrfErrorHandler = (err, req, res, next) => {
  if (err.code !== 'EBADCSRFTOKEN') return next(err);

  // Handle CSRF token errors
  res.status(403);
  res.render('error', {
    error: 'Invalid CSRF token. Please try again.',
    statusCode: 403,
  });
};

// Make CSRF token available to views
const csrfTokenMiddleware = (req, res, next) => {
  let token = '';
  if (req.csrfToken && typeof req.csrfToken === 'function') {
    try {
      token = req.csrfToken() || '';
    } catch (e) {
      // If calling it throws, just use empty string
      token = '';
    }
  }
  res.locals.csrfToken = token;
  next();
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Write to debug log when app is created
fs.appendFileSync('./debug.log', 'APP CREATED\n');

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", 'https://kit.fontawesome.com'],
        styleSrc: ["'self'", 'https://fonts.googleapis.com', "'unsafe-inline'"],
        fontSrc: [
          "'self'",
          'https://fonts.gstatic.com',
          'https://kit.fontawesome.com',
          'https://ka-f.fontawesome.com',
        ],
        imgSrc: ["'self'", 'data:', 'https:', 'http:'],
        connectSrc: [
          "'self'",
          'https://kit.fontawesome.com',
          'https://ka-f.fontawesome.com',
        ],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
  })
);

// Set other security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains'
  );
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=()'
  );
  next();
});

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(limiter);

// CSRF protection (applied globally - safe methods like GET are automatically exempted)
app.use(csrfProtection);

// Apply CSRF token to all views (needed for forms)
app.use(csrfTokenMiddleware);

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Request logging (development only)
if (config.nodeEnv === 'development') {
  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`);
    next();
  });
}

// Routes
app.use('/', routes);

// CSRF error handling must come after routes that use CSRF protection
app.use(csrfErrorHandler);

// 404 handler
app.use(notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(config.port, () => {
  logger.info(
    `Server running on port ${config.port} in ${config.nodeEnv} mode`
  );
  fs.appendFileSync('./debug.log', `SERVER STARTED ON PORT ${config.port}\n`);
});

export default app;
