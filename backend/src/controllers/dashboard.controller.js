'use strict';

/**
 * dashboard.controller.js
 *
 * HTTP layer for the two dashboard analytics endpoints.
 * Validates query params, delegates to analytics.service, returns JSON.
 *
 * Error shape follows ApiError from CONTEXT.md §4:
 *   { error: string, message: string }
 */

const { getTrendingSkills, getSkillDemandBreakdown } = require('../services/analytics.service');

// Valid values for the `dimension` query parameter
const VALID_DIMENSIONS = new Set(['level', 'industry']);

// Hard ceiling on the `limit` param to prevent accidental full-table dumps
const MAX_LIMIT = 50;

// ─── GET /api/skills/trending ────────────────────────────────────────────────

/**
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
async function handleTrending(req, res) {
  try {
    // Parse and clamp limit; default 10, max MAX_LIMIT
    const rawLimit = parseInt(req.query.limit, 10);
    const limit    = Number.isFinite(rawLimit) && rawLimit > 0
      ? Math.min(rawLimit, MAX_LIMIT)
      : 10;

    const skills = await getTrendingSkills(limit);

    return res.json({ skills });
  } catch (err) {
    console.error('[dashboard] handleTrending error:', err);
    return res.status(500).json({
      error:   'internal_server_error',
      message: 'Failed to fetch trending skills.',
    });
  }
}

// ─── GET /api/skills/demand-breakdown ───────────────────────────────────────

/**
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
async function handleDemandBreakdown(req, res) {
  try {
    const { skill, dimension } = req.query;

    // Validate `skill` param
    if (!skill || typeof skill !== 'string' || !skill.trim()) {
      return res.status(400).json({
        error:   'bad_request',
        message: '`skill` query parameter is required.',
      });
    }

    // Validate `dimension` param
    if (!dimension || !VALID_DIMENSIONS.has(dimension)) {
      return res.status(400).json({
        error:   'bad_request',
        message: '`dimension` must be "level" or "industry".',
      });
    }

    const result = await getSkillDemandBreakdown(skill.trim(), dimension);

    // Service returns null when the skill name isn't in the DB
    if (!result) {
      return res.status(404).json({
        error:   'not_found',
        message: `Skill "${skill.trim()}" not found.`,
      });
    }

    return res.json(result);
  } catch (err) {
    console.error('[dashboard] handleDemandBreakdown error:', err);
    return res.status(500).json({
      error:   'internal_server_error',
      message: 'Failed to fetch demand breakdown.',
    });
  }
}

module.exports = { handleTrending, handleDemandBreakdown };
