'use strict';

/**
 * Seed script — one-time import of the LinkedIn Tech Jobs dataset.
 *
 * Prerequisites:
 *   npm install csv-parse   (if not already in package.json)
 *   DATABASE_URL set in .env
 *   npx prisma migrate dev  (schema must already exist)
 *
 * Usage:
 *   node src/prisma/seed.js
 */

const { PrismaClient } = require('@prisma/client');
const { randomUUID }   = require('crypto');
const fs               = require('fs');
const path             = require('path');
const { parse }        = require('csv-parse/sync');

const prisma = new PrismaClient();

// Columns excluded per CONTEXT.md — confirmed false-positive text matches, not real signal.
const EXCLUDED_SKILL_COLS = new Set(['AI', 'UI']);

// ─── helpers ────────────────────────────────────────────────────────────────

/**
 * Parse the first integer found in a string value, or return null.
 * Handles clean integers ("500") and range-like strings ("1001-5000") alike.
 */
function toIntOrNull(value) {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  if (s === '') return null;
  const match = s.match(/\d+/);
  if (!match) return null;
  const n = parseInt(match[0], 10);
  return Number.isFinite(n) ? n : null;
}

// ─── main ───────────────────────────────────────────────────────────────────

async function main() {
  const csvPath = path.resolve(__dirname, '../data/raw-dataset.csv');

  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV not found at: ${csvPath}`);
  }

  const raw = fs.readFileSync(csvPath, 'utf-8');

  const records = parse(raw, {
    columns: true,          // use first row as header keys
    skip_empty_lines: true,
    trim: true,             // strip whitespace from values
    relax_column_count: true,
  });

  if (!records.length) throw new Error('CSV parsed to zero records — check the file');

  // Detect skill columns: every header after "Industry", minus excluded ones.
  const headers = Object.keys(records[0]);
  const industryIdx = headers.indexOf('Industry');
  if (industryIdx === -1) {
    throw new Error('"Industry" column not found in CSV header row');
  }

  const skillCols = headers
    .slice(industryIdx + 1)
    .filter(col => !EXCLUDED_SKILL_COLS.has(col));

  console.log(`\nDetected ${skillCols.length} skill columns:`);
  console.log(' ', skillCols.join(', '));

  // ── 1. Clear existing data (FK-safe order) ──────────────────────────────
  console.log('\nClearing existing data…');
  await prisma.jobSkill.deleteMany();
  await prisma.jobPosting.deleteMany();
  await prisma.skill.deleteMany();
  console.log('  Tables cleared.');

  // ── 2. Seed skills (stored lowercase, de-duped) ─────────────────────────
  console.log('\nSeeding skills…');

  // Deduplicate in case any two columns lowercases collide (shouldn't happen
  // with this dataset, but defensive is better than a constraint violation).
  const uniqueSkillNames = [...new Set(skillCols.map(c => c.toLowerCase()))];

  const skillRows = uniqueSkillNames.map(name => ({ id: randomUUID(), name }));

  await prisma.skill.createMany({ data: skillRows, skipDuplicates: true });
  console.log(`  ${skillRows.length} skills inserted.`);

  // Build name → id lookup for the junction inserts below.
  const dbSkills  = await prisma.skill.findMany();
  const skillMap  = new Map(dbSkills.map(s => [s.name, s.id]));

  // ── 3. Seed job_postings ─────────────────────────────────────────────────
  console.log(`\nSeeding ${records.length} job postings…`);

  // Pre-generate IDs so we can reference them when building job_skills without
  // a second round-trip after createMany (which doesn't return created records).
  const postingRows = records.map(row => ({
    id:               randomUUID(),
    companyName:      (row.Company_Name  ?? '').trim(),
    designation:      (row.Designation   ?? '').trim(),
    location:         row.Location?.trim()  || null,
    level:            row.Level?.trim()     || null,
    industry:         row.Industry?.trim()  || null,
    employeeCount:    toIntOrNull(row.Employee_count),
    totalApplicants:  toIntOrNull(row.Total_applicants),
  }));

  await prisma.jobPosting.createMany({ data: postingRows });
  console.log(`  ${postingRows.length} postings inserted.`);

  // ── 4. Seed job_skills junction ──────────────────────────────────────────
  console.log('\nLinking skills to postings…');

  const jobSkillRows = [];

  for (let i = 0; i < records.length; i++) {
    const row       = records[i];
    const postingId = postingRows[i].id;

    for (const col of skillCols) {
      // CSV values are strings after parsing; flag is set when value is "1"
      if (row[col] === '1') {
        const skillId = skillMap.get(col.toLowerCase());
        if (skillId) {
          jobSkillRows.push({ jobPostingId: postingId, skillId });
        } else {
          // Shouldn't happen — defensive warning
          console.warn(`  Warning: no skill record found for column "${col}"`);
        }
      }
    }
  }

  await prisma.jobSkill.createMany({ data: jobSkillRows, skipDuplicates: true });
  console.log(`  ${jobSkillRows.length} skill links inserted.`);

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log('\n✓ Seed complete.');
  console.log(`  Skills:       ${skillRows.length}`);
  console.log(`  Job postings: ${postingRows.length}`);
  console.log(`  Skill links:  ${jobSkillRows.length}`);
}

main()
  .catch(err => {
    console.error('\nSeed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
