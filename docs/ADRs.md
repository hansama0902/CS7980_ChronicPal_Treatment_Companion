# Architecture Decision Records

## ADR-1: Separate frontend/backend repos

Two separate repositories (not a monorepo) for independent deploy cycles on Vercel (frontend) and Railway (backend). Avoids Railway Root Directory issues and mirrors our PreLeave project structure.

## ADR-2: Prisma over raw SQL

Prisma provides type-safe database access, auto-generated migrations, and a clear schema file. Raw SQL is only used for complex aggregation queries in the trends/summary endpoints.

## ADR-3: JWT auth (not session-based)

Stateless JWT simplifies Railway deployment (no sticky sessions). Access tokens expire in 15min; refresh tokens in 7 days. Stored in httpOnly cookies, never localStorage.

## ADR-4: Claude API for AI features

Anthropic Claude API (`claude-sonnet-4-20250514`) handles: purine risk analysis from meal descriptions/images, pre-visit narrative summary generation, and future flare-up prediction. All AI calls go through the backend — the frontend never calls Claude directly.

## ADR-5: Supabase as managed Postgres

Supabase provides managed PostgreSQL with connection pooling and a dashboard. We use Prisma as the ORM layer and do **not** use the Supabase client SDK — all DB access goes through Prisma on the backend.

## ADR-6: No PHI in logs or error tracking

Health data (lab values, symptoms, medications) must never appear in `console.log`, error messages sent to clients, or third-party logging services. Use structured logging (winston) with explicit field allowlists.
