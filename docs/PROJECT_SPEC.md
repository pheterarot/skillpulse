# SkillPulse — Project Specification
**Version:** 1.4
**Status:** Planning complete, build not started

> This file gives full project context. For exact types, API shapes, DB schema, and design tokens that every account must match exactly, see `CONTEXT.md` — that file is the locked source of truth and takes priority if anything here seems to conflict with it.

---

## 1. Overview

**Problem:** Job seekers (especially fresh grads) often train in skills that don't match what employers actually post for, with no easy way to see which skills are trending in demand or how their resume stacks up against the market.

**What this app does:** A dashboard that surfaces trending in-demand skills from a real job-postings dataset, lets users explore how skill demand breaks down by seniority level and industry, and lets users upload a resume to see which in-demand skills they already have vs. which ones they're missing.

**Who it's for:** Job seekers and students deciding what to learn next; secondary audience is anyone curious about market trends.

---

## 2. Scope

**In scope (v1):**
- Static dataset import (one-time), not live data
- Trending skills dashboard
- Skill demand breakdown by seniority level and industry
- Skill explorer (searchable/filterable)
- Resume upload → skill gap analysis
- Fully responsive, no login required

**Explicitly out of scope (v1):**
- Live web scraping of job boards (unreliable, anti-bot measures, not the skill being demonstrated)
- User accounts / auth (no feature currently needs it — see Section 10)
- Real-time data updates

---

## 3. Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React + TypeScript + Tailwind CSS |
| Charts | Recharts |
| Icons | Lucide React |
| Routing | React Router |
| Backend | Node.js + Express |
| ORM / DB | Prisma + PostgreSQL |
| File parsing | `pdf-parse` (PDF), `mammoth` (DOCX) |
| Security middleware | `express-rate-limit`, `cors`, `helmet` |
| Frontend hosting | Vercel |
| Backend hosting | Render (or Railway) |
| DB hosting | Neon (or Supabase) |

---

## 4. Data Source

- **Dataset:** LinkedIn Tech Jobs dataset (originally `joebeachcapital/linkedin-jobs` on Kaggle) — 811 job postings, pre-encoded as a binary skill matrix (one column per skill: `PYTHON, JAVA, PHP, SQL, MYSQL, CSS, MONGODB, JAVASCRIPT, DJANGO, REACT, REACTJS, NODEJS, HTML, LINUX, C++,` etc.)
- Also includes per-posting `Company_Name`, `Designation`, `Location`, `Level` (seniority), `Industry`, `Employee_count`, `Total_applicants`
- **Known limitations (disclose on About page):**
  - Only 11 unique companies represented — a narrow snapshot, not a broad market sample
  - `AI` and `UI` columns are excluded from import — flagged true on 87%/83% of rows, almost certainly false-positive text matches, not real signal
  - No posting date field — this dataset cannot support a true time-series view, which is why "demand over time" was replaced with "demand by seniority level / industry" (Section 2, 8)
- Imported **once** via a seed script into PostgreSQL — not fetched live
- Methodology disclosure required on About page: explain this is a static snapshot, name the dataset, and explain the above limitations honestly rather than hiding them

---

## 5. File Structure

```
skillpulse/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/         (Navbar.tsx, Footer.tsx)
│   │   │   ├── dashboard/      (SkillChart.tsx, DemandBreakdownChart.tsx, StatsStrip.tsx)
│   │   │   ├── skill-explorer/ (SkillTable.tsx, SkillFilters.tsx)
│   │   │   ├── resume-check/   (ResumeUpload.tsx, GapResults.tsx)
│   │   │   └── ui/             (Button.tsx, Card.tsx, EmptyState.tsx, ErrorState.tsx)
│   │   ├── pages/               (Home.tsx, Dashboard.tsx, SkillExplorer.tsx, ResumeCheck.tsx, About.tsx)
│   │   ├── hooks/                (useFetchSkillTrends.ts, useResumeUpload.ts)
│   │   ├── services/             (api.ts)
│   │   ├── types/                (index.ts)
│   │   ├── App.tsx, main.tsx
│   ├── public/                   (favicon.ico)
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── routes/               (dashboard.routes.js, skills.routes.js, resume.routes.js)
│   │   ├── controllers/          (dashboard.controller.js, skills.controller.js, resume.controller.js)
│   │   ├── services/             (skillMatching.service.js, resumeParser.service.js, analytics.service.js, skills.service.js)
│   │   ├── middleware/           (rateLimiter.js, fileValidation.js, errorHandler.js)
│   │   ├── prisma/               (schema.prisma, seed.js, client.js)
│   │   ├── data/                 (raw-dataset.csv)
│   │   ├── utils/                (textExtraction.js)
│   │   └── server.js
│   ├── .env.example
│   └── package.json
├── docs/
│   ├── PROJECT_SPEC.md           (this file)
│   ├── CONTEXT.md                (locked shared contract — types, API, schema, design tokens)
│   └── CHANGELOG.md
├── .gitignore
└── README.md
```

---

## 6. Database Schema (summary — full Prisma schema is in CONTEXT.md)

- `job_postings` — one row per job posting (company_name, designation, location, level, industry, employee_count, total_applicants)
- `skills` — unique skill names (name)
- `job_skills` — junction table linking postings to skills (many-to-many)

---

## 7. API Routes (summary — exact request/response shapes are in CONTEXT.md)

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/skills/trending` | Top in-demand skills |
| GET | `/api/skills/demand-breakdown` | Demand for one skill, broken down by seniority level or industry |
| GET | `/api/skills` | Search/filter all tracked skills |
| GET | `/api/job-postings` | Filterable job postings list |
| POST | `/api/resume/analyze` | Upload resume, return skill gap analysis |

---

## 8. Core Pages & Features

- **Home** — hero with live mini chart of top trending skills, 3 feature blocks, stats strip, CTA to Resume Check
- **Dashboard** — trending skills bar chart, skill demand breakdown by seniority level/industry, top categories
- **Skill Explorer** — searchable/filterable table of all tracked skills
- **Resume Check** — upload PDF/DOCX → matched skills vs. missing in-demand skills, simple "learn next" suggestions
- **About** — methodology disclosure, dataset source + date range, tech stack, link to GitHub, attribution

---

## 9. Design System

Full token system (colors, fonts, spacing, icon rules, animation rules) is defined in `CONTEXT.md` — every account must use those exact values, not improvise new ones.

---

## 10. Auth

**None in v1.** No feature currently requires login (resume upload is a one-time, no-account action). Reconsider in v2 only if a feature genuinely needs persistence (e.g. "save past resume analyses").

---

## 11. Security Requirements

- Rate limits: **100 requests / 15 min / IP** on general routes, **10 requests / 15 min / IP** on `/api/resume/analyze`
- File upload validation: PDF/DOCX only, max 5MB, validate actual file type — not just the extension
- CORS: restrict to the deployed frontend domain only, never `*`
- `.env` must never be committed — enforced via `.gitignore` from the first commit
- `helmet` middleware for sane default HTTP security headers

---

## 12. Responsive Requirements

- Mobile-first with Tailwind breakpoints (`sm`, `md`, `lg`)
- Dashboard cards/charts stack vertically below `md`
- Data tables convert to stacked card-per-row layout on small screens
- Nav collapses to a hamburger menu below `md`
- Charts use Recharts' `ResponsiveContainer` so they resize fluidly

---

## 13. Build Phases & Account Assignment

| # | Phase | Builds |
|---|---|---|
| 1 | Foundation | DB schema, TS types, API contract, design tokens, folder scaffold, `.gitignore`, `.env.example` |
| 2 | Backend | Dashboard/analytics routes + dataset import script |
| 3 | Backend | Skills routes (`GET /api/skills` **and** `GET /api/job-postings` — both live here, no separate phase for job-postings) |
| 4 | Backend | Resume upload, parsing, skill-matching logic |
| 5 | Frontend | Navbar, Footer, shared UI components, routing |
| 6 | Frontend | Dashboard page + charts |
| 7 | Frontend | Skill Explorer page |
| 8 | Frontend | Resume Check page |
| 9 | Integration | Home, About, wiring, deploy configs |
| 10 | Debugging | Fixes only, no new features |
| 11 | Security | Audit pass against Section 11 checklist |
| 12 | Design polish | Spacing/animation/responsive consistency pass |

**Order matters:** Phase 1 must be 100% complete and locked before Phase 2/3 start. Phases 2, 3, and 4 can run in parallel once Phase 1 is locked. Phase 9 (Integration onward) only starts once all backend + frontend pieces exist.

**⚠️ Standing rule, every phase from here on:** `PROJECT_SPEC.md`/`CONTEXT.md` define *what* to build, but a fresh account has never seen the actual committed code from earlier phases — it will guess implementation details (how the Prisma client is instantiated, how middleware is wired into `server.js`, error-handling style) if not shown the real files. Every future phase prompt must also attach the actual current contents of: `server.js`, files in `middleware/`, the Prisma client setup, and at least one prior controller/route pair as a style reference. Spec files alone are not enough to prevent drift.

---

## 14. Naming Conventions

- React components: PascalCase filenames (`SkillChart.tsx`)
- Functions/variables: camelCase (`getSkillTrends`)
- Non-component files (hooks, utils): camelCase (`useFetchSkills.ts`)
- DB tables/columns: snake_case (`job_postings`, `skill_id`)
- API routes: kebab-case, plural nouns (`/api/job-postings`)
- Commit messages: imperative present tense ("add resume parser", not "added")

---

## 15. Setup & Run (reference — full walkthrough happens live when you get here)

```bash
# Backend
cd backend
npm install
cp .env.example .env   # fill in DATABASE_URL
npx prisma migrate dev
node src/prisma/seed.js
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

---

## 16. Stretch Goals (v2+, not part of v1)

- Auth (only if a feature needs persistence)
- True time-series "demand over time" view, if a dated dataset is added/merged later (current dataset has no date field)
- 3D/force-directed skill relationship graph (start 2D with d3-force first)
- Salary insights, location-based filtering
- Export resume gap report as PDF
- Optional subtle "buy me a coffee" link in footer (not a featured CTA)

---

## 17. Changelog

- **v1.0** — Initial spec finalized.
- **v1.1** — Locked dataset (LinkedIn Tech Jobs, 811 postings). Dropped noisy `AI`/`UI` columns. Replaced "demand over time" with "demand breakdown by seniority/industry" since dataset has no date field.
- **v1.2** — Clarified Phase 3 explicitly includes `GET /api/job-postings` (previously ambiguous). Added standing rule: every phase prompt from here on must attach real prior-phase code files (server.js, middleware, Prisma setup), not just spec docs.
- **v1.3** — File structure (Section 5) updated to include `client.js` (shared Prisma connection) and `skills.service.js`, both legitimately added during Phase 3 but missing from the original plan.
- **v1.4** — Fixed a leftover typo in Section 13's ordering note that said "Phase 4 (integration onward)" — should be Phase 9, since Phase 4 is Resume upload/parsing, not Integration.
