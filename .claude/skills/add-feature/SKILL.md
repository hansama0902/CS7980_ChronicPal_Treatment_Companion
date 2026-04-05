---
name: add-feature
description: Scaffold a new ChronicPal backend feature end-to-end — Express route, service layer, Zod validator, and Vitest tests — following all project conventions. Use when adding a new API endpoint to ChronicPal-backend.
version: 2
---

You are adding a new backend feature to ChronicPal. Follow these steps in order:

## Step 0 — Prisma schema check (NEW in v2)
Before writing any code, check whether `prisma/schema.prisma` already contains a model for this resource.

**If the model does NOT exist**, output the full model block the user must add before proceeding:

```prisma
model <Resource> {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  date      DateTime
  // add resource-specific fields here
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId, date])
}
```

Then remind the user to also add the relation field to the `User` model, and to run:
```bash
npx prisma migrate dev --name add-<resource>
npx prisma generate
```

**Do not proceed to Step 1 until the user confirms the schema is updated.**

If the model already exists, confirm it and continue.

## Step 1 — Understand the feature
Infer from context or ask:
- Resource name (e.g., `diet`, `labs`, `symptoms`)
- HTTP methods needed (GET / POST / PUT / DELETE)
- Request body fields and their types/constraints

## Step 2 — Create the Zod validator
Create `src/middleware/validators/<resource>Validator.ts`:
- Import shared helpers from `./shared` (`isoDatetimeField`, `notesField`, `dateRangeQuerySchema`)
- Import any relevant constants from `../../utils/constants`
- Export named schemas (e.g., `CreateSymptomSchema`, `UpdateSymptomSchema`)
- Export inferred TypeScript types alongside each schema

## Step 3 — Create the service
Create `src/services/<resource>Service.ts`:
- All business logic goes here — keep routes thin
- Use Prisma for all DB access (never raw SQL for simple CRUD)
- Use Prisma transactions if writing to multiple tables
- Add JSDoc comment on every exported function
- Never log PHI fields (lab values, symptoms, medications, pain scores)
- Include a private `to<Resource>` mapper function

## Step 4 — Create the route handler
Create `src/routes/<resource>.ts`:
- Import `asyncHandler` from `../middleware/asyncHandler`
- Import `authMiddleware` and apply via `router.use(authMiddleware)`
- Wrap every async handler with `asyncHandler`
- Validate request body with Zod via `validate()` middleware before the handler
- Return `{ success: true, data: result }` on success
- Return `{ success: false, error: 'message' }` with appropriate HTTP status on failure

## Step 5 — Register the route
In `src/index.ts`, add:
```ts
import <resource>Router from './routes/<resource>';
app.use('/api/<resource>', <resource>Router);
```
Note: `authMiddleware` is applied inside the router (Step 4), not here.

## Step 6 — Write tests
Create `src/__tests__/routes/<resource>.integration.test.ts`:
- Mirror the pattern in `treatments.integration.test.ts`
- Mock Prisma with `vi.mock('../../prisma/client', ...)`
- Mock JWT with the standard `vi.mock('jsonwebtoken', ...)` block
- Test: valid input → 200/201, missing required fields → 400, out-of-range values → 400, unauthenticated → 401, not found → 404

## Step 7 — Final checklist
Confirm before finishing:
- [ ] Prisma schema updated and `prisma generate` run
- [ ] Zod validation on all POST/PUT routes
- [ ] `asyncHandler` wrapping all async routes
- [ ] No `console.log` — use logger
- [ ] No PHI in error messages
- [ ] JSDoc on all service functions
- [ ] Tests cover happy path + all error paths

## Limitations
- Does not create frontend code
- Does not handle file uploads
- Does not generate Prisma migrations automatically — user must run `npx prisma migrate dev`
