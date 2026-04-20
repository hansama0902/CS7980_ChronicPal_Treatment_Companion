## C.L.E.A.R. PR Summary

### Context

<!-- What problem does this PR solve? What's the background a reviewer needs? -->

### Level

<!-- Complexity / risk: Low | Medium | High — and why -->

### Expectations

<!-- What should reviewers focus on? Any trade-offs or decisions they should weigh in on? -->

### Actions

<!-- Bullet list of what changed and why -->

-

### Resources

<!-- Related issues, ADRs, docs, or prior PRs -->

- Closes #

---

## AI Disclosure

| Field                | Value                                                   |
| -------------------- | ------------------------------------------------------- |
| % AI-generated       | <!-- e.g. 80% -->                                       |
| Tool used            | <!-- e.g. Claude Code (claude-sonnet-4-6) -->           |
| Human review applied | <!-- Yes / No — describe what you manually verified --> |
| AI agents invoked    | <!-- e.g. security-reviewer, test-writer, or none -->   |

---

## Definition of Done Checklist

### Automated (CI must be green)

- [ ] `npm audit` — zero high/critical CVEs
- [ ] Gitleaks — zero secrets in diff
- [ ] Semgrep SAST — zero errors
- [ ] Lint + typecheck pass
- [ ] Unit & integration tests pass
- [ ] E2E tests pass

### Code review (self-certified)

- [ ] No PHI in logs, errors, or console output
- [ ] All new protected Route Handlers use `withAuth()`
- [ ] All POST/PUT/PATCH inputs validated with Zod
- [ ] No `localStorage` for auth tokens
- [ ] No Supabase client SDK — Prisma only
- [ ] No Claude API calls in client components
- [ ] No hardcoded medical constants
- [ ] No `.env` or secrets committed
