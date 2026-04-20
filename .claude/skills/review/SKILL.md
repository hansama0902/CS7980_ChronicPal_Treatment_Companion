---
name: review
description: Review ChronicPal code against project-specific critical rules — PHI safety, auth patterns, AI boundaries, DB access, validation coverage, and REST design. Use before opening a PR or after writing a new feature.
version: 2
---

You are reviewing ChronicPal code. Check the specified file(s), or the most recently changed files if none are specified.

Read each file fully before reporting. Work through all 9 categories below.

## Output format (NEW in v2)

For every category — whether clean or not — output the filename(s) checked:

```
✓ <Category Name> — <file>:<line range checked>
```

For violations:

```
[CATEGORY N] <file path>:<line number>
Issue : <what is wrong>
Fix   : <what to change>
```

## Category 1 — PHI Safety (ADR-6)

- No `console.log` calls containing health data fields (lab values, uric acid, pain score, symptoms, medications, diagnosis)
- No error messages that echo back user health data to the client
- Winston logger used with allowlisted fields only (not a spread of the entire request body)

## Category 2 — AI Boundary (ADR-4)

- No `@anthropic-ai/sdk` imports in any frontend file
- No direct `fetch`/`axios` calls to `api.anthropic.com` from frontend code
- All AI calls go through backend routes

## Category 3 — Database Access (ADR-5)

- No `@supabase/supabase-js` imports anywhere
- All DB queries use Prisma client
- Multi-table writes use `prisma.$transaction`

## Category 4 — Auth & Token Storage (ADR-3)

- No `localStorage.setItem` or `sessionStorage` storing tokens
- JWT stored only via `res.cookie` with `httpOnly: true`

## Category 5 — Input Validation

- Every POST and PUT/PATCH route validates body with a Zod schema before processing
- `validate()` middleware applied — not an inline comment saying "TODO: validate"

## Category 6 — Async Safety

- Every async Express route handler wrapped with `asyncHandler`
- No bare `try/catch` in route files that silently swallow errors

## Category 7 — Type Safety

- No `any` type — `unknown` with type guards preferred
- No `as any` casts

## Category 8 — Medical Constants

- No hardcoded numeric thresholds for uric acid, pain score, or other medical values inline in business logic
- Constants defined in `src/utils/constants.ts`

## Category 9 — REST Design (NEW in v2)

- PUT is used only for full resource replacement; PATCH for partial updates
- If PUT is used but only some fields are updated (i.e., `dto` fields are all optional), flag it as a likely PATCH candidate
- Route path follows `/api/<resource>` and `/:id` for single-resource operations
- No business logic in route handlers — confirm delegation to service layer

## End summary

```
Files reviewed   : <list>
Violations found : X
Categories clean : Y / 9
```

If violations were found, list them again as a numbered action list for the developer.

## Limitations

- Static analysis only — does not run the code
- Does not check Prisma schema correctness
- Does not measure test coverage percentage
