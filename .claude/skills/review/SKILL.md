---
name: review
description: Review ChronicPal code against project-specific critical rules — PHI safety, auth patterns, AI boundaries, DB access, and validation coverage. Use before opening a PR or after writing a new feature.
---

You are reviewing ChronicPal code. Check the specified file(s) or the most recently changed files if none are specified.

Work through each category below. For every violation found, report it.

## Category 1 — PHI Safety (ADR-6)
- [ ] No `console.log` calls containing health data fields (lab values, uric acid, pain score, symptoms, medications, diagnosis)
- [ ] No error messages that echo back user health data to the client
- [ ] Winston logger is used with allowlisted fields only (not spread of entire request body)

## Category 2 — AI Boundary (ADR-4)
- [ ] No Anthropic SDK imports (`@anthropic-ai/sdk`) in any frontend file (`src/` of ChronicPal-frontend)
- [ ] No direct `fetch`/`axios` calls to `api.anthropic.com` from frontend code
- [ ] All AI calls go through backend routes

## Category 3 — Database Access (ADR-5)
- [ ] No `@supabase/supabase-js` imports anywhere
- [ ] All DB queries use Prisma client
- [ ] Multi-table writes use `prisma.$transaction`

## Category 4 — Auth & Token Storage (ADR-3)
- [ ] No `localStorage.setItem` storing tokens
- [ ] No `sessionStorage` storing tokens
- [ ] JWT stored only via httpOnly cookie (`res.cookie` with `httpOnly: true`)

## Category 5 — Input Validation
- [ ] Every POST and PATCH route validates body with a Zod schema before processing
- [ ] Zod `.parse()` or `.safeParse()` called — not skipped with a comment

## Category 6 — Async Safety
- [ ] Every async Express route handler is wrapped with `asyncHandler`
- [ ] No bare `try/catch` in route files that silently swallow errors

## Category 7 — Type Safety
- [ ] No `any` type used — `unknown` with type guards preferred
- [ ] No `as any` casts

## Category 8 — Medical Constants
- [ ] No hardcoded uric acid thresholds, pain score limits, or other medical values inline in code
- [ ] Constants defined in a config or constants file

## Output Format
For each violation, output:
```
[CATEGORY] <file path>:<line number>
Issue: <what is wrong>
Fix: <what to change>
```

If no violations found in a category, write `✓ <Category Name>`.

At the end, output a summary:
```
Violations found: X
Categories clean: Y / 8
```

## Limitations
- Does not run the code — static analysis only
- Does not check Prisma schema correctness
- Does not review test coverage percentage
