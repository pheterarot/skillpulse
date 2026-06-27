'use strict';

/**
 * skills.controller.js
 *
 * HTTP layer for GET /api/skills and GET /api/job-postings.
 * Parses/validates query params, delegates DB work to skills.service,
 * and returns JSON.
 *
 * Error shape follows ApiError from CONTEXT.md §4:
 *   { error: string, message: string }
 *
 * Pagination note: invalid values for `page` or `limit` (non-numeric,
 * zero, negative) silently fall back to their defaults rather than erroring,
 * per the task brief. MAX_LIMIT acts as a safety ceiling to prevent
 * accidental full-table dumps (same pattern as dashboard.controller.js).
 */

const { getSkillsList, getJobPostingsList } = require('../services/skills.service');

const DEFAULT_PAGE  = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT     = 100; // safety ceiling; dashboard uses 50 — this is higher
                            // because list endpoints typically need more rows

/**
 * Parses a raw query-string value as a positive integer.
 * Returns `fallback` when the value is absent, non-numeric, or <= 0.
 *
 * @param {unknown} value
 * @param {number}  fallback
 * @returns {number}
 */
function parsePositiveInt(value, fallback) {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

// ─── GET /api/skills ─────────────────────────────────────────────────────────

/**
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
async function handleGetSkills(req, res) {
  try {
    // `search` is optional; strip whitespace before passing to the service
    const search = typeof req.query.search === 'string'
      ? req.query.search.trim()
      : '';

    const page  = parsePositiveInt(req.query.page,  DEFAULT_PAGE);
    const limit = Math.min(
      parsePositiveInt(req.query.limit, DEFAULT_LIMIT),
      MAX_LIMIT,
    );

    const result = await getSkillsList({ search, page, limit });

    // result shape: { skills: [{ id, name }], total: number }
    return res.json(result);
  } catch (err) {
    console.error('[skills] handleGetSkills error:', err);
    return res.status(500).json({
      error:   'internal_server_error',
      message: 'Failed to fetch skills.',
    });
  }
}

// ─── GET /api/job-postings ───────────────────────────────────────────────────

/**
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
async function handleGetJobPostings(req, res) {
  try {
    // `level` and `industry` are optional exact-match filters; empty string
    // means "no filter applied" — the service handles that distinction
    const level    = typeof req.query.level    === 'string' ? req.query.level.trim()    : '';
    const industry = typeof req.query.industry === 'string' ? req.query.industry.trim() : '';

    const page  = parsePositiveInt(req.query.page,  DEFAULT_PAGE);
    const limit = Math.min(
      parsePositiveInt(req.query.limit, DEFAULT_LIMIT),
      MAX_LIMIT,
    );

    const result = await getJobPostingsList({ level, industry, page, limit });

    // result shape: { jobs: [...], total: number }
    return res.json(result);
  } catch (err) {
    console.error('[skills] handleGetJobPostings error:', err);
    return res.status(500).json({
      error:   'internal_server_error',
      message: 'Failed to fetch job postings.',
    });
  }
}

module.exports = { handleGetSkills, handleGetJobPostings };
