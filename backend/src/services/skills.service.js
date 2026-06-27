'use strict';

/**
 * skills.service.js
 *
 * Data-access layer for Phase 3 endpoints.
 * All Prisma queries live here; the controller stays clean of DB logic.
 * Mirrors the pattern from analytics.service.js (Phase 2).
 *
 * Uses the shared PrismaClient from ../prisma/client.js — same instance
 * analytics.service.js uses, so the whole backend shares one connection pool.
 */

const { prisma } = require('../prisma/client');

// ─── GET /api/skills ─────────────────────────────────────────────────────────

/**
 * Returns a paginated, optionally-filtered list of skills.
 * Empty `search` string → no WHERE clause (returns all skills).
 *
 * @param {{ search: string, page: number, limit: number }} opts
 * @returns {Promise<{ skills: { id: string, name: string }[], total: number }>}
 */
async function getSkillsList({ search, page, limit }) {
  // Only add a WHERE clause when the caller actually supplied a search term
  const where = search
    ? { name: { contains: search, mode: 'insensitive' } }
    : {};

  const skip = (page - 1) * limit;

  // Single round-trip: fetch the page and count in one transaction
  const [skills, total] = await prisma.$transaction([
    prisma.skill.findMany({
      where,
      select:  { id: true, name: true },
      orderBy: { name: 'asc' },
      skip,
      take: limit,
    }),
    prisma.skill.count({ where }),
  ]);

  return { skills, total };
}

// ─── GET /api/job-postings ───────────────────────────────────────────────────

/**
 * Returns a paginated, optionally-filtered list of job postings.
 * Includes each posting's skills as an array of NAME strings (not IDs),
 * matching the CONTEXT.md §5 response shape exactly.
 *
 * `level` and `industry` filters are exact-match (the dataset uses fixed
 * category strings like "Entry level" / "IT Services and IT Consulting").
 * Empty string → filter not applied.
 *
 * @param {{ level: string, industry: string, page: number, limit: number }} opts
 * @returns {Promise<{ jobs: object[], total: number }>}
 */
async function getJobPostingsList({ level, industry, page, limit }) {
  // Build WHERE clause only for filters that were actually provided
  const where = {};
  if (level)    where.level    = level;
  if (industry) where.industry = industry;

  const skip = (page - 1) * limit;

  const [postings, total] = await prisma.$transaction([
    prisma.jobPosting.findMany({
      where,
      skip,
      take:    limit,
      orderBy: { companyName: 'asc' },
      include: {
        skills: {
          include: {
            // Only need the skill name, not the full skill row
            skill: { select: { name: true } },
          },
        },
      },
    }),
    prisma.jobPosting.count({ where }),
  ]);

  // Flatten the nested job_skills → skill → name into a plain string array
  // so the response matches CONTEXT.md §5: { skills: ["React", "Tailwind"] }
  const jobs = postings.map(posting => ({
    id:              posting.id,
    companyName:     posting.companyName,
    designation:     posting.designation,
    location:        posting.location        ?? null,
    level:           posting.level           ?? null,
    industry:        posting.industry        ?? null,
    employeeCount:   posting.employeeCount   ?? null,
    totalApplicants: posting.totalApplicants ?? null,
    skills:          posting.skills.map(js => js.skill.name),
  }));

  return { jobs, total };
}

module.exports = { getSkillsList, getJobPostingsList };
