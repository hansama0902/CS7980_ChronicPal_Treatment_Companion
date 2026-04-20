# add-feature (v1)

Guide Claude Code through adding a new ChronicPal feature using TDD red-green-refactor.

## Naming conventions

- React components: `PascalCase` (e.g., `TreatmentForm`)
- Services, utilities, validators: `camelCase` (e.g., `treatmentService`)
- Test files: `*.test.ts` (unit/integration), `*.spec.ts` (E2E)
- Route Handlers: `app/api/<resource>/route.ts`
- Service interfaces: prefix with `I` (e.g., `ITreatmentService`)

## Steps

### 1. Analyze the requirement

- Identify the resource name, HTTP methods needed, and user roles that can access it.
- Check `prisma/schema.prisma` — does a model exist? If not, add it and run `npx prisma migrate dev && npx prisma generate`.
- Check `lib/constants.ts` for any domain constants (pain score ranges, rate limits, etc.) — add there, never hardcode.

### 2. Create the Zod validator

- File: `validators/<resource>Validator.ts`
- Export `Create<Resource>Schema`, `Update<Resource>Schema`, `<Resource>QuerySchema`.
- Use `.strict()` to reject unknown fields.
- Commit this file before writing any tests.

### 3. Write failing tests (RED)

- File: `__tests__/<resource>/<resource>.test.ts`
- Test the validator boundary conditions first (missing fields, out-of-range values, wrong types).
- Test the service functions with a mocked Prisma client.
- Run `npm run test -- --run` — all new tests must **fail** at this point.
- Commit with message: `test(<resource>): add failing tests for <feature>`

### 4. Implement the service layer

- File: `services/<resource>Service.ts`
- Add JSDoc on every public function.
- Use `prisma` singleton from `lib/prisma.ts` — never import PrismaClient directly.
- Use Prisma transactions for multi-table writes.
- **Never** log PHI (lab values, symptoms, medications) — use Winston logger with allowlisted fields only.

### 5. Implement the API Route Handler

- File: `app/api/<resource>/route.ts` (and `app/api/<resource>/[id]/route.ts` for item-level ops).
- Wrap every protected handler with `withAuth()` from `lib/routeAuth.ts`.
- Parse and validate request body/query with the Zod schema before calling the service.
- Return `{ success: boolean, data?: T, error?: string }`.
- Handle errors with `AppError` from `lib/errors.ts`.

### 6. Create the UI page

- File: `app/(dashboard)/<resource>/page.tsx` (Server Component by default).
- Use `'use client'` only where interactivity is required.
- Forms call Server Actions or POST to the Route Handler.
- Charts must use `ResponsiveContainer` from `recharts`.
- **Never** call Claude API from any client component or `'use client'` file.

### 7. PHI safety check

Before committing, verify:

- [ ] No `console.log` / `console.error` with health data.
- [ ] Winston logger calls only log allowlisted fields (userId, timestamp, action).
- [ ] Error messages returned to the client contain no raw PHI.

### 8. Confirm tests pass (GREEN → REFACTOR)

```bash
npm run test -- --run          # all unit + integration tests
npm run typecheck              # tsc --noEmit
npm run lint                   # ESLint
```

- Fix any failures before opening a PR.
- Refactor for clarity only after tests are green; re-run after each change.

### 9. Open PR

Title format: `[CP-<issue>] feat: <description>`  
Target branch: `dev`  
Self-certify the security checklist in CLAUDE.md before requesting review.
