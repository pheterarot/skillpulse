'use strict';

/**
 * dashboard.routes.js
 *
 * Routes for the two dashboard analytics endpoints.
 * Mount this router in server.js at /api/skills:
 *
 *   const dashboardRoutes = require('./routes/dashboard.routes');
 *   app.use('/api/skills', dashboardRoutes);
 *
 * Resulting paths:
 *   GET /api/skills/trending
 *   GET /api/skills/demand-breakdown
 */

const { Router }                                    = require('express');
const { handleTrending, handleDemandBreakdown } = require('../controllers/dashboard.controller');

const router = Router();

/**
 * GET /api/skills/trending?limit=10
 *
 * Returns the top N in-demand skills by job-posting count.
 * Response shape (CONTEXT.md §5):
 *   { skills: [{ skillId, skillName, count }] }
 */
router.get('/trending', handleTrending);

/**
 * GET /api/skills/demand-breakdown?skill=react&dimension=level
 *
 * Returns how many postings require `skill`, grouped by `dimension`.
 * `dimension` must be "level" or "industry".
 * Response shape (CONTEXT.md §5):
 *   { skill, dimension, breakdown: [{ label, count }] }
 */
router.get('/demand-breakdown', handleDemandBreakdown);

module.exports = router;
