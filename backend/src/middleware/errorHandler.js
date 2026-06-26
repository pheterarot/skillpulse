'use strict';

/**
 * errorHandler.js
 *
 * Centralized fallback error handler. Controllers already catch and format
 * their own errors (see dashboard.controller.js), so this only fires for
 * truly unexpected errors that slip past those try/catch blocks.
 *
 * Must be registered LAST in server.js, after all routes.
 */

function errorHandler(err, req, res, next) {
  console.error('[errorHandler] Unhandled error:', err);

  res.status(500).json({
    error: 'internal_server_error',
    message: 'Something went wrong on our end.',
  });
}

module.exports = { errorHandler };