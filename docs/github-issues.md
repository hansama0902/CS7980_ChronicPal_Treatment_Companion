# ChronicPal — GitHub Issues (Updated: ADVISOR role removed)

> Only 2 user roles: **PATIENT** and **CAREGIVER**
> CP-12 (Healthcare Advisor View) has been removed entirely.
> All references to ADVISOR role removed from other issues.

---

## Sprint 1 Issues (CP-1 ~ CP-8)

---

### [CP-1] chore: Project Initialization — Next.js + Prisma + Supabase

**Labels**: `setup`, `P0`, `sprint-1`
**Assignee**: Shuhan
**Milestone**: Sprint 1

#### Description
Bootstrap the ChronicPal Next.js application with all foundational tooling.

#### Acceptance Criteria
- [ ] `npx create-next-app@latest` with App Router, TypeScript, Tailwind, ESLint
- [ ] Prisma initialized with PostgreSQL provider pointing to Supabase
- [ ] Project structure: `src/app/`, `src/lib/`, `src/services/`, `src/validators/`
- [ ] Environment variables configured in `.env` (added to `.gitignore`)
- [ ] `.env.example` with placeholder values committed
- [ ] `README.md` with setup instructions
- [ ] All teammates can `npm run dev` successfully

---

### [CP-2] docs: CLAUDE.md + Project Configuration

**Labels**: `docs`, `P0`, `sprint-1`
**Assignee**: Shuhan
**Milestone**: Sprint 1

#### Description
Comprehensive CLAUDE.md and Claude Code configuration for the project.

#### Acceptance Criteria
- [ ] `CLAUDE.md` with tech stack, architecture, conventions, do's/don'ts
- [ ] At least one `@import` reference (e.g., `docs/PRD.md`)
- [ ] `.claude/settings.json` with permission allowlists and deny rules
- [ ] CLAUDE.md evolution visible in git history (at least 2 iterations)
- [ ] Project conventions documented: file naming, API response shape, error handling

---

### [CP-3] ci: CI/CD Pipeline — GitHub Actions + Vercel

**Labels**: `ci/cd`, `P0`, `sprint-1`
**Assignee**: Shuhan
**Milestone**: Sprint 1

#### Description
Set up the full CI/CD pipeline with all required quality gates.

#### Acceptance Criteria
- [ ] `.github/workflows/ci.yml` with the following gates:
  1. Lint (ESLint + Prettier check)
  2. Type check (`tsc --noEmit`)
  3. Unit tests + integration tests (Vitest)
  4. E2E tests (Playwright)
  5. Security scan (`npm audit --audit-level=high`)
  6. AI PR review (claude-code-action or `claude -p`)
  7. Preview deployment (Vercel)
  8. Production deploy on merge to main
- [ ] Gitleaks pre-commit hook configured
- [ ] Pipeline passes on a test PR
- [ ] Branch protection rules on `main`: require PR + CI pass

---

### [CP-4] feat: Auth System — NextAuth with Role-Based Access

**Labels**: `auth`, `P0`, `sprint-1`
**Assignee**: Lang Min
**Milestone**: Sprint 1

#### Description
Implement authentication with NextAuth.js supporting two user roles: Patient and Caregiver.

#### Acceptance Criteria
- [ ] NextAuth configured with Credentials provider (email + password)
- [ ] Prisma `User` model with `role` enum: `PATIENT`, `CAREGIVER`
- [ ] Registration page (`/register`) with role selection (Patient or Caregiver)
- [ ] Login page (`/login`) with email/password
- [ ] Session includes user role, accessible in server and client components
- [ ] Middleware redirects unauthenticated users to `/login`
- [ ] Role-based route protection (e.g., `/caregiver/*` only for CAREGIVER role)
- [ ] Passwords hashed with bcrypt (min 10 rounds)
- [ ] **TDD**: Unit tests for auth validation logic pass BEFORE implementation

#### Security Acceptance Criteria
- [ ] No passwords in logs or error messages
- [ ] Rate limiting on login attempts

---

### [CP-5] db: Database Schema — Prisma Models

**Labels**: `database`, `P0`, `sprint-1`
**Assignee**: Shuhan
**Milestone**: Sprint 1

#### Description
Design and implement the full Prisma schema for ChronicPal.

#### Acceptance Criteria
- [ ] `prisma/schema.prisma` includes models:
  - `User` (id, email, passwordHash, name, role, createdAt, updatedAt)
  - `Treatment` (id, userId, type, date, medication, dosage, painScore, notes, createdAt)
  - `LabResult` (id, userId, testType, value, unit, date, notes, createdAt)
  - `Symptom` (id, userId, painScore 0-10, description, date, createdAt)
  - `DietEntry` (id, userId, meal, mealType, purineLevel, riskScore, aiAnalysis, date, createdAt)
  - `CaregiverLink` (id, caregiverId, patientId, status, createdAt)
- [ ] Migration applied successfully to Supabase
- [ ] Seed script (`prisma/seed.ts`) creates demo data for each role
- [ ] `npx prisma generate` runs without errors
- [ ] All models have proper relations and cascade delete rules

#### Security Acceptance Criteria
- [ ] No PHI in seed data console output
- [ ] Soft delete implemented (not hard delete)

---

### [CP-6] feat: Treatment Logging — API + UI (CRUD)

**Labels**: `feature`, `tdd`, `P1`, `sprint-1`
**Assignee**: Shuhan
**Milestone**: Sprint 1

#### Description
Patients can log, view, edit, and delete treatment sessions (e.g., gout infusion).

#### User Story
As a patient, I want to log each infusion session so I can track my treatment history over time.

#### Acceptance Criteria
- [ ] `POST /api/treatments` — create a treatment record
- [ ] `GET /api/treatments` — list treatments for authenticated user (paginated)
- [ ] `PUT /api/treatments/[id]` — update a treatment record (owner only)
- [ ] `DELETE /api/treatments/[id]` — soft delete (owner only)
- [ ] UI page at `/dashboard/treatments` with form + list view
- [ ] Zod validation on all inputs (date, type, dosage, painScore 0-10)
- [ ] **TDD**: Failing unit tests committed BEFORE implementation (visible in git history)
- [ ] Integration tests for Prisma CRUD operations

#### Security Acceptance Criteria
- [ ] Authorization check: owner only
- [ ] No PHI in logs or error messages
- [ ] Input validated with Zod

---

### [CP-7] feat: Lab Results Tracking — API + UI (CRUD)

**Labels**: `feature`, `tdd`, `P1`, `sprint-1`
**Assignee**: Lang Min
**Milestone**: Sprint 1

#### Description
Patients can log and view lab results (e.g., uric acid levels).

#### User Story
As a patient, I want to log my uric acid levels so I can see trends over time.

#### Acceptance Criteria
- [ ] `POST /api/labs` — create a lab result
- [ ] `GET /api/labs` — list lab results for authenticated user (paginated)
- [ ] `PUT /api/labs/[id]` — update a lab result (owner only)
- [ ] `DELETE /api/labs/[id]` — soft delete (owner only)
- [ ] UI page at `/dashboard/labs` with form + table/chart view
- [ ] Zod validation (testType, value as positive number, unit, date)
- [ ] Recharts line chart showing uric acid trend over time
- [ ] **TDD**: Failing unit tests committed BEFORE implementation
- [ ] Integration tests for Prisma CRUD operations

#### Security Acceptance Criteria
- [ ] Authorization check: owner only
- [ ] No PHI in logs or error messages

---

### [CP-8] feat: Symptom / Pain Score Logging — API + UI

**Labels**: `feature`, `tdd`, `P1`, `sprint-1`
**Assignee**: Shuhan
**Milestone**: Sprint 1

#### Description
Patients can log daily symptoms with a pain score (0-10 scale).

#### User Story
As a patient, I want to record my daily pain levels so I can identify patterns and share them with my doctor.

#### Acceptance Criteria
- [ ] `POST /api/symptoms` — create a symptom entry
- [ ] `GET /api/symptoms` — list symptoms for authenticated user
- [ ] UI at `/dashboard/symptoms` with pain score slider (0-10) + description textarea
- [ ] Zod validation: painScore integer 0-10, description max 500 chars
- [ ] **TDD**: Failing unit tests for pain score validation (boundary: -1, 0, 10, 11) committed BEFORE implementation
- [ ] Visual pain score indicator (color-coded: green/yellow/red)

#### Security Acceptance Criteria
- [ ] Input validated with Zod
- [ ] No PHI in logs

---

## Sprint 2 Issues (CP-9 ~ CP-15)

---

### [CP-9] feat: AI Diet Analysis — Meal Input → Purine Risk Feedback

**Labels**: `feature`, `ai`, `tdd`, `P0`, `sprint-2`
**Assignee**: Shuhan
**Milestone**: Sprint 2

#### Description
Patient inputs a meal description; backend calls AI API to analyze purine content and return risk assessment.

#### User Story
As a patient, I want to input my meals and receive instant purine-risk feedback so I can make informed dietary choices.

#### Acceptance Criteria
- [ ] `POST /api/diet/analyze` — accepts meal description, returns purine risk analysis
- [ ] AI API called from backend ONLY (never from client)
- [ ] Response includes: risk level (LOW/MEDIUM/HIGH), purine estimate, specific food flags, dietary suggestion
- [ ] AI prompt stored in `src/services/prompts/diet-analysis.ts`
- [ ] Result saved as `DietEntry` in database
- [ ] UI at `/dashboard/diet` with input form + risk display card
- [ ] Rate limiting: max 10 analyses per user per day
- [ ] **TDD**: Unit tests for risk scoring logic + integration tests for AI service
- [ ] Error handling: graceful fallback if AI API is unavailable

#### Security Acceptance Criteria
- [ ] Input sanitized before sending to AI API
- [ ] No PHI in logs
- [ ] Rate limited

---

### [CP-10] feat: AI Pre-Visit Summary — Auto-Generated Doctor Report

**Labels**: `feature`, `ai`, `tdd`, `P0`, `sprint-2`
**Assignee**: Lang Min
**Milestone**: Sprint 2

#### Description
Before a doctor visit, the system auto-generates a concise summary covering recent treatments, lab trends, symptoms, and dietary patterns.

#### User Story
As a patient, I want a pre-visit summary auto-generated before each appointment so I can communicate effectively with my doctor.

#### Acceptance Criteria
- [ ] `POST /api/summaries/generate` — generates summary for a date range
- [ ] Summary aggregates: last N treatments, lab result trends, avg pain score, diet compliance
- [ ] AI API generates natural language summary from aggregated data
- [ ] AI prompt stored in `src/services/prompts/visit-summary.ts`
- [ ] UI at `/dashboard/summary` with date range picker + generated report display
- [ ] PDF export option (or printable view)
- [ ] **TDD**: Unit tests for data aggregation functions + integration tests for summary service
- [ ] Summary clearly labeled as 'AI-generated, not medical advice'

#### Security Acceptance Criteria
- [ ] No raw PHI sent to AI API — only aggregated/anonymized data
- [ ] Rate limited

---

### [CP-11] feat: Caregiver Dashboard — Shared Read-Only Patient View

**Labels**: `feature`, `P1`, `sprint-2`
**Assignee**: Lang Min
**Milestone**: Sprint 2

#### Description
Caregivers can view linked patients' treatment adherence and dietary compliance in a read-only dashboard.

#### User Story
As a caregiver, I want a shared dashboard showing the patient's treatment adherence and dietary compliance so I can provide timely reminders.

#### Acceptance Criteria
- [ ] Patient can send caregiver invite via email
- [ ] Caregiver accepts invite, creating a `CaregiverLink` record
- [ ] `/caregiver/dashboard` shows linked patients list
- [ ] Clicking a patient shows: recent treatments, latest labs, pain trend, diet compliance %
- [ ] All data is READ-ONLY for caregivers
- [ ] Caregiver cannot see data of unlinked patients (authorization check)
- [ ] Patient can revoke caregiver access

#### Security Acceptance Criteria
- [ ] Strict authorization: only linked caregivers can view patient data
- [ ] Invite tokens expire after 48h

---

### ~~[CP-12] feat: Healthcare Advisor View — Patient Summary Panel~~ **REMOVED**

> This issue has been removed. The ADVISOR role is no longer part of the project scope. ChronicPal now supports only PATIENT and CAREGIVER roles.

---

### [CP-13] feat: Daily Diet Logging + Purine Risk History

**Labels**: `feature`, `P1`, `sprint-2`
**Assignee**: Shuhan
**Milestone**: Sprint 2

#### Description
Patients can log daily meals and view their historical purine risk patterns.

#### Acceptance Criteria
- [ ] `POST /api/diet` — log a meal (description, mealType: breakfast/lunch/dinner/snack)
- [ ] `GET /api/diet` — list diet entries with risk scores
- [ ] UI shows weekly calendar view of meals with color-coded risk levels
- [ ] Recharts bar chart: daily purine risk scores over past 30 days
- [ ] Filter by date range and meal type

#### Security Acceptance Criteria
- [ ] Input validated with Zod
- [ ] Owner-only access

---

### [CP-14] feat: Patient Dashboard — Treatment Trends & Charts

**Labels**: `feature`, `P1`, `sprint-2`
**Assignee**: Lang Min
**Milestone**: Sprint 2

#### Description
Central dashboard for patients showing all health metrics in one view.

#### Acceptance Criteria
- [ ] `/dashboard` as the patient home page after login
- [ ] Cards: next treatment date, latest uric acid level, avg pain score (7-day), diet compliance %
- [ ] Recharts: uric acid trend line (last 6 months)
- [ ] Recharts: pain score trend (last 30 days)
- [ ] Quick-action buttons: Log Treatment, Log Lab Result, Log Symptoms, Analyze Meal, Generate Summary
- [ ] Responsive layout (mobile-friendly)
- [ ] All charts use `ResponsiveContainer`

#### Security Acceptance Criteria
- [ ] Only show authenticated user's own data
- [ ] No PHI in client-side logs

---

### [CP-15] test: E2E Tests — Playwright Critical User Flows

**Labels**: `testing`, `e2e`, `P0`, `sprint-2`
**Assignee**: Shuhan
**Milestone**: Sprint 2

#### Description
At least 1 Playwright E2E test covering a critical user flow end-to-end.

#### Acceptance Criteria
- [ ] Playwright configured (`playwright.config.ts`)
- [ ] E2E test: Patient registers → logs in → creates treatment → views dashboard → generates summary
- [ ] Tests run in CI pipeline (GitHub Actions)
- [ ] Test uses proper fixtures and page objects
- [ ] Screenshots on failure for debugging

---

### [CP-16] security: Security Hardening — OWASP Top 10 + Pipeline Gates

**Labels**: `security`, `P0`, `sprint-2`
**Assignee**: Lang Min
**Milestone**: Sprint 2

#### Description
Implement security measures meeting at least 4 of 8 required security gates.

#### Acceptance Criteria
- [ ] **Gate 1**: Gitleaks pre-commit secret detection configured and working
- [ ] **Gate 2**: `npm audit` running in CI, failing on high/critical vulnerabilities
- [ ] **Gate 3**: SAST tool OR security sub-agent reviewing PRs
- [ ] **Gate 4**: Security acceptance criteria added to all Sprint 2 issues
- [ ] **Gate 5**: OWASP Top 10 awareness section added to CLAUDE.md
- [ ] Rate limiting on all `/api/` routes
- [ ] Input sanitization on all user inputs (Zod + HTML escaping)
- [ ] CSRF protection verified via NextAuth
- [ ] HTTP security headers configured (CSP, X-Frame-Options, etc.)

---

## Summary of Changes (vs. Original)

| Change | Detail |
|--------|--------|
| **Removed** | CP-12 (Healthcare Advisor View) — entire issue deleted |
| **Modified** | CP-4: role enum changed from `PATIENT, CAREGIVER, ADVISOR` to `PATIENT, CAREGIVER` |
| **Modified** | CP-4: removed ADVISOR route protection requirement |
| **Modified** | CP-14: Quick Actions updated to include "Log Symptoms" (5 buttons total) |
| **Total Issues** | 15 (was 16) |
