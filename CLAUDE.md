# CLAUDE.md — ChronicPal

> AI-Powered Chronic Treatment Companion

@import docs/PRD.md

## Project Overview

ChronicPal helps patients undergoing recurring therapies (e.g., gout infusion treatments) track treatments, lab results, symptoms, and diet between clinic visits. It generates pre-visit summaries, flags dietary risks via AI, and gives caregivers read-only visibility into patient progress.

**Team**: @Shuhan Dong, @Lang Min (GitHub: LangMinNEU)
**Course**: CS 7180 — AI-Assisted Coding (Spring 2026)

---

## Tech Stack

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Charts**: Recharts (treatment trend visualizations)
- **Routing**: React Router v6
- **State Management**: React Context + useReducer for global auth state; local state otherwise
- **Deployment**: Vercel

### Backend
- **Runtime**: Node.js 20 LTS
- **Framework**: Express.js + TypeScript
- **ORM**: Prisma (PostgreSQL)
- **Database**: PostgreSQL via Supabase
- **Auth**: JWT (access + refresh tokens), bcrypt for password hashing
- **AI**: Anthropic Claude API (meal analysis, summary generation)
- **Deployment**: Railway

### Testing & CI/CD
- **Unit/Integration Tests**: Vitest + axios-mock-adapter (backend), Vitest + React Testing Library (frontend)
- **E2E**: Playwright (critical user flows)
- **CI**: GitHub Actions — lint → type-check → test → build (4 parallel jobs)
- **Coverage Target**: ≥ 80% line coverage

### Dev Tools
- **Monorepo**: Two repos — `ChronicPal-frontend` and `ChronicPal-backend`
- **Linting**: ESLint (strict TypeScript config)
- **Formatting**: Prettier (2-space indent, single quotes, trailing commas)
- **Git Hooks**: Husky + lint-staged (pre-commit)
- **Package Manager**: npm

---

## Architecture Decisions

### ADR-1: Separate frontend/backend repos
We use two separate repositories (not a monorepo) for independent deploy cycles on Vercel (frontend) and Railway (backend). This mirrors our PreLeave project structure and avoids Railway Root Directory issues.

### ADR-2: Prisma over raw SQL
Prisma provides type-safe database access, auto-generated migrations, and a clear schema file. We avoid raw SQL except for complex aggregation queries in the trends/summary endpoints.

### ADR-3: JWT auth (not session-based)
Stateless JWT auth simplifies Railway deployment (no sticky sessions). Access tokens expire in 15min; refresh tokens in 7 days. Stored in httpOnly cookies, never localStorage.

### ADR-4: Claude API for AI features
We use the Anthropic Claude API (claude-sonnet-4-20250514) for: purine risk analysis from meal descriptions/images, pre-visit narrative summary generation, and future flare-up prediction. All AI calls go through our backend — the frontend never calls Claude directly.

### ADR-5: Supabase as managed Postgres
Supabase provides managed PostgreSQL with connection pooling and a dashboard. We use Prisma as the ORM layer and do NOT use Supabase client SDK — all DB access goes through Prisma on the backend.

### ADR-6: No PHI in logs or error tracking
Health data (lab values, symptoms, medications) must NEVER appear in console.log, error messages sent to clients, or third-party logging services. Use structured logging with explicit field allowlists.

---

## Project Structure

```
ChronicPal-frontend/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── ui/           # Primitives (Button, Input, Card, Modal)
│   │   ├── charts/       # Recharts wrappers (TrendChart, PainScoreChart)
│   │   └── layout/       # Header, Sidebar, Footer
│   ├── pages/            # Route-level page components
│   │   ├── Dashboard.tsx
│   │   ├── TreatmentLog.tsx
│   │   ├── DietTracker.tsx
│   │   ├── PreVisitSummary.tsx
│   │   └── CaregiverView.tsx
│   ├── hooks/            # Custom React hooks
│   ├── context/          # React Context providers (AuthContext)
│   ├── services/         # API client functions (axios instances)
│   ├── types/            # Shared TypeScript interfaces
│   ├── utils/            # Helpers (date formatting, unit conversions)
│   └── __tests__/        # Co-located or mirrored test files
├── public/
├── index.html
├── vite.config.ts
├── tailwind.config.ts
└── tsconfig.json

ChronicPal-backend/
├── src/
│   ├── routes/           # Express route handlers
│   │   ├── auth.ts
│   │   ├── treatments.ts
│   │   ├── labs.ts
│   │   ├── diet.ts
│   │   ├── summary.ts
│   │   └── share.ts
│   ├── middleware/        # Auth, validation, error handling
│   ├── services/         # Business logic (AI service, trend calculations)
│   │   ├── aiService.ts      # Claude API wrapper
│   │   ├── purineAnalyzer.ts # Meal analysis logic
│   │   └── summaryGenerator.ts
│   ├── prisma/
│   │   └── schema.prisma
│   ├── utils/            # Helpers, constants, logger
│   ├── types/            # Shared TypeScript interfaces
│   └── __tests__/        # Test files mirroring src/ structure
├── prisma/
│   └── migrations/
├── .env.example
└── tsconfig.json
```

---

## Coding Conventions

### TypeScript
- **Strict mode** enabled (`strict: true` in tsconfig)
- Prefer `interface` over `type` for object shapes
- Use `enum` only for fixed sets (e.g., `PurineRiskLevel`); otherwise use union types
- All function parameters and return types must be explicitly typed
- No `any` — use `unknown` and narrow with type guards

### Naming
- **Files**: PascalCase for components (`TreatmentLog.tsx`), camelCase for utilities (`formatDate.ts`)
- **Variables/Functions**: camelCase
- **Types/Interfaces**: PascalCase, prefixed with `I` only for service interfaces (e.g., `IAiService`)
- **Constants**: UPPER_SNAKE_CASE for true constants (`MAX_PAIN_SCORE = 10`)
- **Database columns**: snake_case (Prisma maps to camelCase in TS)

### React Patterns
- Functional components only (no class components)
- Custom hooks for any reusable logic (prefix with `use`)
- Props interfaces defined above the component in the same file
- Avoid prop drilling beyond 2 levels — use Context or composition
- Co-locate component-specific styles as Tailwind classes; extract to `@apply` only if repeated 3+ times

### Backend Patterns
- Express route handlers are thin — delegate to service layer
- All async route handlers wrapped with `asyncHandler` middleware
- Validation via Zod schemas defined in `src/middleware/validators/`
- Return consistent JSON shape: `{ success: boolean, data?: T, error?: string }`
- HTTP status codes: 200 (OK), 201 (Created), 400 (Bad Request), 401 (Unauthorized), 404 (Not Found), 500 (Internal Error)

### Git Workflow
- **Branching**: `main` → `dev` → `feature/<issue-number>-<short-description>`
- **Commits**: Conventional commits (`feat:`, `fix:`, `docs:`, `test:`, `chore:`)
- **PRs**: Always PR into `dev`; require 1 approval; squash merge
- **Issues**: GitHub Issues with labels (`feature`, `bug`, `chore`, `ai-feature`)

---

## Testing Strategy

### Unit Tests (Vitest)
- Test all service-layer functions in isolation
- Mock external dependencies (Prisma, Claude API, axios)
- Test Zod validators with valid and invalid inputs
- Frontend: test hooks and utility functions

### Integration Tests (Vitest)
- Test Express route handlers with supertest
- Use axios-mock-adapter for external API mocking
- Test auth middleware (valid/invalid/expired tokens)
- Test AI service with mocked Claude responses

### E2E Tests (Playwright)
- Critical flows only: login → log treatment → view dashboard → generate summary
- Run in CI on every PR to `dev`

### Coverage Requirements
- Line coverage ≥ 80% (enforced in CI)
- All AI-powered features must have tests with mocked responses
- All error paths must be tested (network failure, invalid input, expired token)

### Test File Naming
- `*.test.ts` for unit tests
- `*.integration.test.ts` for integration tests
- `*.spec.ts` for E2E (Playwright)

---

## Do's

- ✅ Always run `npx prisma generate` after schema changes
- ✅ Use environment variables for all secrets (DB URL, JWT secret, Claude API key)
- ✅ Validate ALL user input with Zod before processing
- ✅ Use Prisma transactions for multi-table writes (e.g., treatment + lab entry)
- ✅ Return structured error responses with meaningful messages
- ✅ Use `asyncHandler` wrapper on every async Express route
- ✅ Add JSDoc comments on all service-layer public functions
- ✅ Write tests before or alongside new features (aim for TDD on services)
- ✅ Use Recharts `ResponsiveContainer` for all chart components
- ✅ Log with structured logger (winston) using allowlisted fields only
- ✅ Keep AI prompts in separate template files under `src/services/prompts/`
- ✅ Use `.env.example` to document all required env vars

## Don'ts

- ❌ Never log or expose PHI (lab values, symptoms, medications) in error messages or console output
- ❌ Never call the Claude API from frontend code — all AI goes through backend
- ❌ Never use `any` type — use `unknown` and type-narrow
- ❌ Never store JWT tokens in localStorage — use httpOnly cookies
- ❌ Never commit `.env` files — only `.env.example` with placeholder values
- ❌ Never use Supabase client SDK — all DB access goes through Prisma
- ❌ Never use `console.log` in production code — use the structured logger
- ❌ Never skip Zod validation on incoming requests, even for "simple" endpoints
- ❌ Never hardcode medical constants (e.g., uric acid thresholds) — put them in config
- ❌ Never force-push to `main` or `dev`
- ❌ Never merge your own PR without at least one review

---

## Environment Variables

```bash
# Backend (.env)
DATABASE_URL=              # Supabase PostgreSQL connection string
JWT_SECRET=                # Random 256-bit secret for JWT signing
JWT_REFRESH_SECRET=        # Separate secret for refresh tokens
ANTHROPIC_API_KEY=         # Claude API key for AI features
PORT=3001                  # Backend server port
CORS_ORIGIN=               # Frontend URL for CORS (e.g., https://chronicpal.vercel.app)
NODE_ENV=                  # development | production

# Frontend (.env)
VITE_API_URL=              # Backend API base URL
VITE_APP_NAME=ChronicPal
```

---

## Key Domain Concepts

| Term | Definition |
|------|-----------|
| **Treatment Entry** | A single logged event: infusion session, medication dose, or clinic visit |
| **Lab Result** | A recorded lab value (primarily uric acid in mg/dL) with date |
| **Pain Score** | Patient-reported pain on a 0-10 numeric scale |
| **Purine Risk** | AI-assessed dietary risk level: LOW / MODERATE / HIGH / VERY_HIGH |
| **Pre-Visit Summary** | AI-generated narrative report covering lab trends, symptoms, diet, and flagged concerns |
| **Share Token** | Time-limited token granting read-only caregiver access to a patient dashboard |
| **Flare-Up** | An acute episode of symptom worsening (e.g., gout attack) |

---

## Context Management Strategy

### When to use `/clear`
- After completing a major feature branch and switching to a different one
- When context gets polluted with unrelated debugging output
- Before starting AI prompt engineering work (clean slate for prompt iteration)

### When to use `/compact`
- During long implementation sessions when context is filling up
- After extended debugging — compact to keep the solution but shed the noise
- Before asking Claude Code to review or refactor a large file

### When to use `--continue`
- When a previous Claude Code session was interrupted mid-task
- When returning to an implementation after a break (same branch, same feature)
- Chain: finish backend endpoint → `--continue` → write tests for it

### When to use `--resume`
- When you need to pick a specific previous session to continue from
- When `--continue` picks up the wrong session context

---

## Permissions Configuration

Claude Code is configured with an allowlist approach for this project:

```json
{
  "permissions": {
    "allow": [
      "Read project files",
      "Write to src/ directories",
      "Run npm scripts (test, lint, build, dev)",
      "Run prisma CLI commands",
      "Run git commands (status, diff, add, commit, log, branch, checkout)",
      "Execute vitest",
      "Execute playwright"
    ],
    "deny": [
      "Direct database access (use Prisma only)",
      "Network requests outside localhost and allowed APIs",
      "Modify CI/CD workflow files without explicit approval",
      "Access or modify .env files (use .env.example only)",
      "Force push to any branch",
      "Delete migration files"
    ]
  }
}
```

---

## Sprint Workflow

We follow 1-week sprints with:
- **Monday**: Sprint planning (GitHub Projects board)
- **Daily**: Async standups via Slack or GitHub Discussion
- **Friday**: Sprint review + retrospective
- **Issues**: Each issue has story points (1/2/3/5), priority label, and assignee
- **PR Convention**: `[CP-<issue>] <type>: <description>` (e.g., `[CP-12] feat: add treatment logging endpoint`)
