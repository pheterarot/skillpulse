'use strict';

/**
 * server.js — the entry point. This is what actually starts the backend.
 *
 * Run with: node src/server.js   (or set up an npm script later: npm run dev)
 */

require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');

const { generalLimiter } = require('./middleware/rateLimiter');
const { errorHandler }   = require('./middleware/errorHandler');
const dashboardRoutes    = require('./routes/dashboard.routes');
const { skillsRouter, jobPostingsRouter } = require('./routes/skills.routes');

const app  = express();
const PORT = process.env.PORT || 3001;

// CORS — only allow requests from the frontend's actual URL (CONTEXT.md §6).
// Set FRONTEND_URL in .env once the frontend is deployed; defaults to the
// local Vite dev server address for now.
const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(cors({ origin: allowedOrigin }));

app.use(helmet());           // sane default security headers
app.use(express.json());     // parse JSON request bodies
app.use(generalLimiter);     // 100 req / 15 min / IP on everything below

// ─── Routes ─────────────────────────────────────────────────────────────────
// Phase 2: dashboard/analytics endpoints (GET /api/skills/trending, etc.)
app.use('/api/skills', dashboardRoutes);

// Phase 3: skill list + job postings endpoints
app.use('/api/skills',       skillsRouter);       // GET /api/skills
app.use('/api/job-postings', jobPostingsRouter);  // GET /api/job-postings

// Fallback error handler — must be the LAST app.use() call.
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`SkillPulse backend running on http://localhost:${PORT}`);
});