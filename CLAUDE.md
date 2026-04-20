# CLAUDE.md — ChronicPal

> AI-Powered Chronic Treatment Companion

@import docs/PRD.md
@import docs/ADRs.md
@import docs/domain-glossary.md

## Project Overview

ChronicPal helps patients undergoing recurring therapies (e.g., gout infusion treatments) track treatments, lab results, symptoms, and diet between clinic visits. It generates pre-visit summaries, flags dietary risks via AI, and gives caregivers read-only visibility into patient progress.

**Team**: @Shuhan Dong, @Lang Min (GitHub: LangMinNEU)
**Course**: CS 7180 — AI-Assisted Coding (Spring 2026)

---

## Tech Stack

| Layer     | Choice                                                                                          |
| --------- | ----------------------------------------------------------------------------------------------- |
| Framework | Next.js 15 (App Router), React 19, TypeScript 5 — Vercel                                        |
| Styling   | Tailwind CSS 4, PostCSS                                                                         |
| Auth      | NextAuth v5 (Credentials provider, JWT session), bcryptjs, Zod validation                       |
| Database  | PostgreSQL (Supabase), Prisma ORM 6                                                             |
| AI        | Anthropic Claude API (`claude-sonnet-4-5`) — server-side only (Route Handlers / Server Actions) |
| Logging   | Winston 3 (structured, PHI-safe allowlist)                                                      |
| Testing   | Vitest 3 + React Testing Library + Playwright; coverage ≥ 70%                                   |
| Tooling   | ESLint, Prettier (2-space, single quotes, trailing commas), npm                                 |

**Monorepo layout** (`/chronicpal` is the primary app; `/ChronicPal-backend` and `/ChronicPal-frontend` are legacy and kept for reference only).

---

## Naming Conventions

- **Service interfaces**: prefix with `I` (e.g., `IAiService`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `MAX_PAIN_SCORE = 10`)
- **DB columns**: snake_case → Prisma maps to camelCase in TS
- **Test files**: `*.test.ts` (unit), `*.integration.test.ts` (integration), `*.spec.ts` (E2E)

---

## Common Commands

All commands run from the `/chronicpal` directory.

```bash
npm run dev               # Next.js dev server (localhost:3000)
npm run build             # production build (tsc + next build)
npm run test              # Vitest unit/integration
npm run test:e2e          # Playwright E2E
npm run lint              # ESLint
npm run typecheck         # tsc --noEmit

npx prisma migrate dev    # apply migrations (dev)
npx prisma generate       # regenerate client after schema change
npx prisma studio         # GUI for DB inspection
```

---

## Architecture Patterns (Next.js App Router)

- **Route Handlers** live in `chronicpal/app/api/**` — keep them thin, delegate to `services/`
- **Server Actions** for form mutations; Route Handlers for REST endpoints consumed by client components
- Validate all input with Zod schemas in `chronicpal/validators/`
- Response shape: `{ success: boolean, data?: T, error?: string }`
- Keep AI prompts in `chronicpal/services/prompts/`
- Auth guard via `chronicpal/lib/routeAuth.ts` — wrap every protected Route Handler
- Prisma client singleton in `chronicpal/lib/prisma.ts` — never instantiate elsewhere
- Run `npx prisma generate` after every schema change

---

## Critical Rules (ChronicPal-specific)

### PHI Safety (ADR-6)

- **NEVER** log health data (lab values, symptoms, medications) in errors, `console.log`, or third-party services
- Use winston structured logger with explicit field allowlists only

### AI (ADR-4)

- **NEVER** call Claude API from frontend — all AI calls go through backend

### Database (ADR-5)

- **NEVER** use Supabase client SDK — all DB access goes through Prisma

### Auth (ADR-3)

- **NEVER** store session tokens in localStorage — NextAuth manages httpOnly cookies
- Use `auth()` from `chronicpal/auth.ts` for session checks in Server Components / Route Handlers

### Other

- **NEVER** commit `.env` — only `.env.example` with placeholders
- **NEVER** hardcode medical constants — put in config
- **NEVER** skip Zod validation, even on "simple" endpoints
- Use Prisma transactions for multi-table writes
- Use `ResponsiveContainer` for all Recharts components
- Add JSDoc on all service-layer public functions

---

## OWASP Top 10 (2021) — ChronicPal Mitigations

| #   | Category                                 | Mitigation in this project                                                                                             |
| --- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| A01 | Broken Access Control                    | `withAuth()` wraps every protected Route Handler; `auth()` in Server Components; caregiver role is read-only by schema |
| A02 | Cryptographic Failures                   | Passwords hashed with bcryptjs; HTTPS enforced by Vercel; PHI never logged (ADR-6); `AUTH_SECRET` ≥ 32 chars           |
| A03 | Injection                                | Prisma ORM uses parameterized queries; all inputs validated with Zod before reaching the DB                            |
| A04 | Insecure Design                          | Security-first ADRs (3/4/5/6); AI review on every PR; medical constants in config, not hardcoded                       |
| A05 | Security Misconfiguration                | `.env` never committed; explicit Winston allowlist; no Supabase client SDK exposed to client                           |
| A06 | Vulnerable & Outdated Components         | `npm audit --audit-level=high` blocks CI pipeline on high/critical CVEs                                                |
| A07 | Identification & Authentication Failures | NextAuth v5 JWT in httpOnly cookies; no localStorage tokens; bcrypt password hashing                                   |
| A08 | Software & Data Integrity Failures       | Gitleaks scans every CI run for leaked secrets; `package-lock.json` pinned and committed                               |
| A09 | Security Logging & Monitoring Failures   | Winston structured logger with PHI-safe field allowlist; no health data in error messages                              |
| A10 | Server-Side Request Forgery              | All Claude API calls server-side only (Route Handlers); no user-controlled URLs fetched server-side                    |

---

## Definition of Done — Security Acceptance Criteria

A feature is **Done** only when all of the following pass:

### Automated gates (CI must be green)

- [ ] `npm audit --audit-level=high` — zero high/critical CVEs
- [ ] Gitleaks scan — zero secrets detected in diff
- [ ] Semgrep SAST — zero errors on `p/typescript`, `p/nodejs`, `p/owasp-top-ten` rulesets
- [ ] ESLint + TypeScript typecheck pass

### Code review checklist (PR author self-certifies)

- [ ] No PHI (lab values, symptoms, medications) in logs, errors, or console output
- [ ] All new Route Handlers wrapped with `withAuth()` if protected
- [ ] All POST/PUT/PATCH inputs validated with Zod; no raw `req.body` usage
- [ ] No new `localStorage` usage for auth tokens or session data
- [ ] No direct Supabase client SDK calls — Prisma only
- [ ] No Claude API calls in Client Components or `use client` files
- [ ] No hardcoded medical constants — values in `lib/constants.ts`
- [ ] No `.env` or secret values committed; only `.env.example` placeholders

### Local pre-commit (run before pushing)

```bash
# Install once: brew install gitleaks
gitleaks protect --staged   # scan staged files for secrets
npm run lint                 # ESLint
npm run typecheck            # tsc --noEmit
```

---

## Context Management

- `/clear` between feature switches or before prompt engineering work
- `/compact` after long debug sessions to shed noise but keep the solution
- `--continue` to resume an interrupted session on the same feature branch

---

## PR Convention

`[CP-<issue>] <type>: <description>` — e.g., `[CP-12] feat: add treatment logging endpoint`

Always PR into `dev`; require 1 approval; squash merge.
