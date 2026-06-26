# SkillPulse — Shared Context & Contracts
**Version:** 1.1 (locked after Phase 1 — do not change without updating this file and re-distributing)

> **Upload this file to every Claude account, every time.** This is the single source of truth for types, schema, API shapes, and design tokens. If any account proposes a change, the change must be approved and merged here first — never let an individual account silently diverge.

---

## 1. Design Tokens

**Colors:**
| Token | Hex | Use |
|---|---|---|
| `bg` | `#14151A` | Page background |
| `surface` | `#1C1E26` | Cards/panels |
| `accent-primary` | `#F2A93B` | CTAs, key numbers, "trending" highlights |
| `accent-secondary` | `#4FD1C5` | Second chart series, secondary highlights |
| `text-primary` | `#EDEDED` | Body/headings |
| `text-secondary` | `#9CA3AF` | Captions, muted text |

**Typography:**
| Role | Font |
|---|---|
| Display / headings | Space Grotesk |
| Body | Inter |
| Numeric data (stat counters, chart values) | JetBrains Mono |

**Spacing scale:** 4 / 8 / 16 / 24 / 32 / 48 (px) — no arbitrary values outside this scale.

**Icons:** Lucide React only. No emoji. Tint with token colors above (e.g. `text-amber-400` equivalent), not default gray.

**Animation rules:** Count-up on stat numbers, charts draw in on load, subtle scale on skill-pill hover. Nothing beyond this list without a reason tied to the brief.

---

## 2. Naming Conventions

- Components: PascalCase (`SkillChart.tsx`)
- Functions/variables: camelCase (`getSkillTrends`)
- Hooks/utils: camelCase (`useFetchSkills.ts`)
- DB tables/columns: snake_case (`job_postings`, `skill_id`)
- API routes: kebab-case, plural nouns (`/api/job-postings`)

---

## 3. Database Schema (Prisma)

```prisma
model JobPosting {
  id               String     @id @default(uuid())
  companyName      String     @map("company_name")
  designation      String
  location         String?
  level            String?    // e.g. "Entry level", "Mid-Senior level"
  industry         String?
  employeeCount    Int?       @map("employee_count")
  totalApplicants  Int?       @map("total_applicants")
  skills           JobSkill[]

  @@map("job_postings")
}

model Skill {
  id       String     @id @default(uuid())
  name     String     @unique
  jobs     JobSkill[]

  @@map("skills")
}

model JobSkill {
  jobPostingId String     @map("job_posting_id")
  skillId      String     @map("skill_id")
  jobPosting   JobPosting @relation(fields: [jobPostingId], references: [id])
  skill        Skill      @relation(fields: [skillId], references: [id])

  @@id([jobPostingId, skillId])
  @@map("job_skills")
}
```

---

## 4. Shared TypeScript Types

```typescript
export interface Skill {
  id: string;
  name: string;
}

export interface SkillTrend {
  skillId: string;
  skillName: string;
  count: number;
}

export interface DemandBreakdownPoint {
  label: string; // e.g. "Entry level" or "IT Services and IT Consulting"
  count: number;
}

export interface JobPosting {
  id: string;
  companyName: string;
  designation: string;
  location?: string;
  level?: string;
  industry?: string;
  employeeCount?: number;
  totalApplicants?: number;
  skills: string[];
}

export interface ResumeAnalysisResult {
  matchedSkills: string[];
  missingSkills: string[];
  matchPercentage: number;
}

export interface ApiError {
  error: string;
  message: string;
}
```

---

## 5. API Contract

### `GET /api/skills/trending?limit=10`
**Response 200:**
```json
{ "skills": [ { "skillId": "uuid", "skillName": "React", "count": 412 } ] }
```

### `GET /api/skills/demand-breakdown?skill=React&dimension=level`
`dimension` accepts `level` or `industry`.
**Response 200:**
```json
{ "skill": "React", "dimension": "level", "breakdown": [ { "label": "Entry level", "count": 14 }, { "label": "Mid-Senior level", "count": 22 } ] }
```

### `GET /api/skills?search=&page=1&limit=20`
**Response 200:**
```json
{ "skills": [ { "id": "uuid", "name": "React" } ], "total": 31 }
```

### `GET /api/job-postings?level=&industry=&page=1&limit=20`
**Response 200:**
```json
{ "jobs": [ { "id": "uuid", "companyName": "Acme", "designation": "Frontend Developer", "location": "Remote", "level": "Entry level", "industry": "IT Services and IT Consulting", "employeeCount": 500, "totalApplicants": 47, "skills": ["React", "Tailwind"] } ], "total": 811 }
```

### `POST /api/resume/analyze`
**Request:** `multipart/form-data`, field name `resume` (PDF or DOCX, max 5MB)
**Response 200:**
```json
{ "matchedSkills": ["React", "Tailwind"], "missingSkills": ["TypeScript", "Docker"], "matchPercentage": 62 }
```
**Error responses** (use `ApiError` shape above):
- `400` — invalid file type
- `413` — file exceeds 5MB
- `429` — rate limit exceeded (10 requests / 15 min / IP)

---

## 6. Security Constants (must match exactly across backend accounts)

- General routes: **100 requests / 15 min / IP**
- `/api/resume/analyze`: **10 requests / 15 min / IP**
- Allowed file types: `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- Max file size: **5MB**
- CORS: restrict to deployed frontend origin only

---

## 7. Changelog

- **v1.0** — Locked after Phase 1. All downstream accounts build against this version.
- **v1.1** — Updated schema/types/API to match the real locked dataset (LinkedIn Tech Jobs, 811 postings): `job_postings` fields now reflect actual columns (`companyName`, `designation`, `level`, `industry`, etc.), and `demand-trend` was replaced with `demand-breakdown` since the dataset has no date field.
