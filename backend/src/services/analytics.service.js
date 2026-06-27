'use strict';

/**
 * analytics.service.js
 *
 * Pure DB logic for the dashboard/analytics routes.
 * Controllers call these functions; no HTTP objects enter here.
 *
 * All return values are shaped to match the API contract in CONTEXT.md §5
 * so controllers can forward them directly with res.json().
 */

const { prisma } = require('../prisma/client');

// ─── getTrendingSkills ───────────────────────────────────────────────────────

/**
 * Return the top N skills ranked by how many job postings require them.
 *
 * @param {number} limit – max results to return (caller should cap this)
 * @returns {Promise<Array<{ skillId: string, skillName: string, count: number }>>}
 */
async function getTrendingSkills(limit = 10) {
  // Order skills by the count of their job_skills rows (i.e. posting appearances).
  const skills = await prisma.skill.findMany({
    take: limit,
    orderBy: { jobs: { _count: 'desc' } },
    select: {
      id:     true,
      name:   true,
      _count: { select: { jobs: true } },
    },
  });

  return skills.map(s => ({
    skillId:   s.id,
    skillName: s.name,
    count:     s._count.jobs,
  }));
}

// ─── getSkillDemandBreakdown ─────────────────────────────────────────────────

/**
 * Return demand for a specific skill broken down by seniority level or industry.
 *
 * @param {string} skillName  – skill name (matched case-insensitively)
 * @param {'level'|'industry'} dimension – grouping axis
 * @returns {Promise<{ skill: string, dimension: string, breakdown: Array<{ label: string, count: number }> } | null>}
 *   null  → skill does not exist in DB
 */
async function getSkillDemandBreakdown(skillName, dimension) {
  // 1. Resolve the skill (case-insensitive — names are stored lowercase).
  const skill = await prisma.skill.findUnique({
    where: { name: skillName.toLowerCase() },
  });

  if (!skill) return null;

  // 2. Collect all job_posting IDs that require this skill.
  //    Doing this in a separate query avoids any edge-cases with relation
  //    filters inside groupBy, which have known limitations in some Prisma versions.
  const links = await prisma.jobSkill.findMany({
    where:  { skillId: skill.id },
    select: { jobPostingId: true },
  });

  const postingIds = links.map(l => l.jobPostingId);

  if (!postingIds.length) {
    return { skill: skill.name, dimension, breakdown: [] };
  }

  // 3. Group those postings by the requested dimension, filtering out nulls/blanks.
  const groups = await prisma.jobPosting.groupBy({
    by: [dimension],
    where: {
      id:        { in: postingIds },
      [dimension]: { not: null },  // exclude nulls from results
    },
    _count: { _all: true },
    orderBy: { _count: { _all: 'desc' } },
  });

  return {
    skill:     skill.name,
    dimension,
    breakdown: groups
      // Also filter out empty-string values that slipped through as non-null
      .filter(g => g[dimension]?.trim())
      .map(g => ({
        label: g[dimension],
        count: g._count._all,
      })),
  };
}

module.exports = { getTrendingSkills, getSkillDemandBreakdown };