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

| Layer | Choice |
|-------|--------|
| Frontend | React 18 + TypeScript, Vite, Tailwind CSS, Recharts, React Router v6 — Vercel |
| Backend | Node.js 20, Express.js + TypeScript, Prisma ORM, PostgreSQL via Supabase — Railway |
| Auth | JWT (access 15min / refresh 7d), bcrypt, httpOnly cookies |
| AI | Anthropic Claude API (`claude-sonnet-4-20250514`) — backend only |
| Testing | Vitest + React Testing Library + Playwright; coverage ≥ 80% |
| Tooling | ESLint, Prettier (2-space, single quotes, trailing commas), Husky + lint-staged, npm |

Two separate repos: `ChronicPal-frontend` and `ChronicPal-backend`.

---

## Naming Conventions

- **Service interfaces**: prefix with `I` (e.g., `IAiService`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `MAX_PAIN_SCORE = 10`)
- **DB columns**: snake_case → Prisma maps to camelCase in TS
- **Test files**: `*.test.ts` (unit), `*.integration.test.ts` (integration), `*.spec.ts` (E2E)

---

## Common Commands

```bash
# Frontend
npm run dev          # start Vite dev server
npm run build        # production build
npm run test         # Vitest
npm run lint         # ESLint

# Backend
npm run dev          # ts-node-dev watch
npm run build        # tsc
npm run test         # Vitest
npx prisma migrate dev    # apply migrations (dev)
npx prisma generate       # regenerate client after schema change
npx prisma studio         # GUI for DB inspection
```

---

## Backend Patterns

- Route handlers are thin — delegate to service layer
- All async routes wrapped with `asyncHandler`
- Validate all input with Zod in `src/middleware/validators/`
- Response shape: `{ success: boolean, data?: T, error?: string }`
- Keep AI prompts in `src/services/prompts/`
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
- **NEVER** store JWT tokens in localStorage — httpOnly cookies only

### Other
- **NEVER** commit `.env` — only `.env.example` with placeholders
- **NEVER** hardcode medical constants — put in config
- **NEVER** skip Zod validation, even on "simple" endpoints
- Use Prisma transactions for multi-table writes
- Use `ResponsiveContainer` for all Recharts components
- Add JSDoc on all service-layer public functions

---

## Context Management

- `/clear` between feature switches or before prompt engineering work
- `/compact` after long debug sessions to shed noise but keep the solution
- `--continue` to resume an interrupted session on the same feature branch

---

## PR Convention

`[CP-<issue>] <type>: <description>` — e.g., `[CP-12] feat: add treatment logging endpoint`

Always PR into `dev`; require 1 approval; squash merge.
