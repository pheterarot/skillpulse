'use strict';

/**
 * rateLimiter.js
 *
 * Shared rate limiters.
 * - generalLimiter: 100 requests / 15 min / IP, applied globally in server.js
 * - resumeLimiter: 10 requests / 15 min / IP, applied only to
 *   POST /api/resume/analyze (CONTEXT.md §6)
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

// ─── Resume-specific limiter ─────────────────────────────────────────────────
// Stricter limit for POST /api/resume/analyze, per CONTEXT.md §6:
// 10 requests / 15 min / IP (vs. the 100/15-min general limit).
const resumeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error:   'rate_limited',
    message: 'Too many resume uploads. Please wait 15 minutes and try again.',
  },
});

module.exports = { generalLimiter, resumeLimiter };