# fix-issue (v1)

Guide Claude Code through diagnosing and fixing a bug in ChronicPal.

## Steps

### 1. Reproduce the problem

- Read the issue description carefully; note the exact error message or unexpected behavior.
- Identify the affected route, service, or component.
- Run the failing scenario locally:
  ```bash
  npm run dev          # or
  npm run test -- --run --reporter=verbose
  ```
- Confirm you can reproduce the failure consistently before touching any code.

### 2. Write a failing test that captures the bug (RED)

- Choose the lowest level where the bug lives: validator → service → route → UI.
- Write the minimal test that exposes the incorrect behavior.
- Run `npm run test -- --run` — the new test must **fail**.
- Commit: `test(<scope>): reproduce bug — <short description>`

### 3. Locate the root cause

- Trace the execution path from the entry point (Route Handler) down to the data layer.
- Check:
  - Zod schema: does it allow the bad input through?
  - Service: wrong Prisma query, missing ownership check, incorrect business logic?
  - Route Handler: missing `withAuth()`, wrong HTTP method guard, unhandled promise?
  - UI: client-side state not reset, wrong API call?
- Use `grep -r "<symbol>"` or the Grep tool to find all references before editing.

### 4. Fix the code (GREEN)

- Make the smallest change that fixes the root cause — do not refactor unrelated code.
- If the fix requires a Prisma schema change: `npx prisma migrate dev && npx prisma generate`.
- PHI rule: if the bug involves logging, ensure no health data is added to log output.
- Run the test suite:
  ```bash
  npm run test -- --run
  ```
  The previously failing test must now pass; no other tests may newly fail.

### 5. Check for similar bugs

- Search for the same pattern elsewhere in the codebase (e.g., same missing `withAuth()`, same off-by-one in validation).
- Fix all instances in the same PR or file separate issues for each.

### 6. Run full test suite

```bash
npm run test -- --run          # Vitest unit + integration
npm run typecheck              # tsc --noEmit
npm run lint                   # ESLint
```

All gates must pass before pushing.

### 7. Commit and PR

- Commit message: `fix(<scope>): <what was wrong and what was changed>`
- PR title: `[CP-<issue>] fix: <description>`
- In the PR body, include: root cause, affected files, and a test that proves the fix.
- Target branch: `dev`.
