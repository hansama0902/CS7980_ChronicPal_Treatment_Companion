---
name: add-feature
description: Scaffold a new ChronicPal backend feature end-to-end — Express route, service layer, Zod validator, and Vitest tests — following all project conventions. Use when adding a new API endpoint to ChronicPal-backend.
---

You are adding a new backend feature to ChronicPal. Follow these steps in order:

## Step 1 — Understand the feature
Ask the user (or infer from context):
- What is the resource name? (e.g., `diet`, `labs`, `symptoms`)
- What HTTP methods are needed? (GET / POST / PATCH / DELETE)
- What fields does the request body contain?

## Step 2 — Create the Zod validator
Create `src/middleware/validators/<resource>.validator.ts`:
- Define a Zod schema for each request body
- Export named schemas (e.g., `createDietEntrySchema`)
- Export inferred TypeScript types alongside each schema

## Step 3 — Create the service
Create `src/services/<resource>Service.ts`:
- All business logic goes here — keep routes thin
- Use Prisma for all DB access (never raw SQL for simple CRUD)
- Use Prisma transactions if writing to multiple tables
- Add JSDoc comment on every exported function
- Never log PHI fields (lab values, symptoms, medications)

## Step 4 — Create the route handler
Create `src/routes/<resource>.ts`:
- Import `asyncHandler` from `../middleware/asyncHandler`
- Wrap every async handler: `router.post('/', asyncHandler(async (req, res) => { ... }))`
- Validate request body with Zod before calling the service
- Return `{ success: true, data: result }` on success
- Return `{ success: false, error: 'message' }` with appropriate HTTP status on failure

## Step 5 — Register the route
In `src/app.ts` (or `src/index.ts`), add:
```ts
import <resource>Router from './routes/<resource>';
app.use('/api/<resource>', authenticate, <resource>Router);
```

## Step 6 — Write tests
Create `src/__tests__/<resource>.test.ts`:
- Test each route with supertest
- Mock Prisma using `vi.mock`
- Test: valid input → 200/201, invalid input → 400, unauthenticated → 401

## Step 7 — Final checklist
Before finishing, confirm:
- [ ] Zod validation present on all POST/PATCH routes
- [ ] `asyncHandler` wrapping all async routes
- [ ] No `console.log` — use logger
- [ ] No PHI in error messages
- [ ] JSDoc on all service functions
- [ ] Tests written

## Limitations
- Does not modify `prisma/schema.prisma` — if a new model is needed, tell the user to update the schema and run `npx prisma generate` manually
- Does not create frontend code
- Does not handle file uploads
