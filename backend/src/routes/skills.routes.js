'use strict';

/**
 * skills.routes.js
 *
 * Routes for the two Phase 3 endpoints. Two separate Router instances are
 * exported so server.js can mount each at its correct URL prefix:
 *
 *   app.use('/api/skills',       skillsRouter);      → GET /api/skills
 *   app.use('/api/job-postings', jobPostingsRouter);  → GET /api/job-postings
 *
 * The generalLimiter (100 req / 15 min / IP) is already applied globally in
 * server.js — no need to re-apply it here (CONTEXT.md §6).
 */

const { Router }                                    = require('express');
const { handleGetSkills, handleGetJobPostings }     = require('../controllers/skills.controller');

// ─── /api/skills ─────────────────────────────────────────────────────────────
const skillsRouter = Router();

/**
 * GET /api/skills?search=&page=1&limit=20
 *
 * Searchable, paginated list of all tracked skills.
 * Response shape (CONTEXT.md §5):
 *   { skills: [{ id, name }], total: number }
 */
skillsRouter.get('/', handleGetSkills);

// ─── /api/job-postings ───────────────────────────────────────────────────────
const jobPostingsRouter = Router();

/**
 * GET /api/job-postings?level=&industry=&page=1&limit=20
 *
 * Filterable, paginated list of job postings.
 * `level` and `industry` are optional, combinable exact-match filters.
 * `skills` on each posting is an array of skill NAME strings (not IDs).
 * Response shape (CONTEXT.md §5):
 *   { jobs: [{ id, companyName, ..., skills: string[] }], total: number }
 */
jobPostingsRouter.get('/', handleGetJobPostings);

module.exports = { skillsRouter, jobPostingsRouter };
