'use strict';

/**
 * skillMatching.service.js
 *
 * Compares plain resume text against every skill tracked in the database and
 * computes the gap-analysis result required by CONTEXT.md §5.
 *
 * Uses the shared PrismaClient from ../prisma/client.js — never
 * `new PrismaClient()` directly (CONTEXT.md §2 hard rule).
 *
 * ─── Design decisions (flagged per task brief) ───────────────────────────────
 *
 * missingSkills definition:
 *   All tracked skills NOT found in the resume.  This gives the most complete
 *   gap picture for the "what to learn next" feature (PROJECT_SPEC.md §8).
 *   If the intended meaning is "only missing skills among trending/top-N",
 *   a query param or a separate business rule is needed — CONTEXT.md §5 does
 *   not specify, so the conservative choice (full list) was made here.
 *
 * matchPercentage formula:
 *   Math.round(matchedSkills.length / totalTrackedSkills * 100)
 *   Equivalent to matched / (matched + missing) * 100 when missingSkills =
 *   all tracked skills minus matched.
 *
 * Matching strategy:
 *   The resume text is lowercased once.  Each skill name is also lowercased
 *   and used to build a regex with lookbehind/lookahead guards so that
 *   short names don't false-match inside longer ones (e.g. "java" must not
 *   hit inside "javascript").  \b (word boundary) is avoided because it
 *   breaks on skill names containing non-word characters like "c++" or
 *   "node.js".
 */

const { prisma } = require('../prisma/client');

/**
 * Fetches every tracked skill from the DB, checks each one against the
 * resume text, and returns the full analysis result.
 *
 * @param {string} resumeText  Plain text extracted from the uploaded file.
 * @returns {Promise<{
 *   matchedSkills:   string[],
 *   missingSkills:   string[],
 *   matchPercentage: number,
 * }>}
 */
async function matchSkillsFromText(resumeText) {
  // Mirrors the pattern in skills.service.js — single query, no pagination
  // needed here because we want ALL skills for a complete comparison.
  const allSkills = await prisma.skill.findMany({
    select:  { name: true },
    orderBy: { name: 'asc' },
  });

  // Lowercase the resume text once so every per-skill regex runs against a
  // uniform string (avoids re-lowercasing on each iteration).
  const lowerText = resumeText.toLowerCase();

  const matchedSkills = [];
  const missingSkills = [];

  for (const { name } of allSkills) {
    // Normalise the skill name from the DB before building the pattern.
    // The dataset stores names lowercase, but we normalise defensively.
    const lowerName   = name.toLowerCase();

    // Escape regex meta-characters so skill names like "c++" and "node.js"
    // are treated as literals, not regex operators.
    const escaped     = lowerName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Lookbehind (?<![a-z0-9]) and lookahead (?![a-z0-9]) act as
    // boundary guards without relying on \b, which breaks on "c++" etc.
    // Example: pattern for "java" will NOT match inside "javascript" because
    // the 'j' that follows fails the lookahead.
    const pattern     = new RegExp(`(?<![a-z0-9])${escaped}(?![a-z0-9])`);

    if (pattern.test(lowerText)) {
      matchedSkills.push(name); // keep original casing from DB in the output
    } else {
      missingSkills.push(name);
    }
  }

  const total          = allSkills.length;
  const matchPercentage = total === 0
    ? 0
    : Math.round((matchedSkills.length / total) * 100);

  return { matchedSkills, missingSkills, matchPercentage };
}

module.exports = { matchSkillsFromText };