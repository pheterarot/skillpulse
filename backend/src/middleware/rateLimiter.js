'use strict';

/**
 * rateLimiter.js
 *
 * Shared rate limiter, per CONTEXT.md §6: 100 requests / 15 min / IP
 * on general routes. The resume-upload endpoint (Phase 4) needs its OWN
 * stricter limiter (10 req / 15 min) — that one should live in this same
 * file as a second export when Phase 4 is built, not be recreated elsewhere.
 */

const rateLimit = require('express-rate-limit');

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'rate_limited',
    message: 'Too many requests. Please try again later.',
  },
});

module.exports = { generalLimiter };