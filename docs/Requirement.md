# Project Requirement

## Objective

Build a production-grade, deployed application as a pair, demonstrating mastery of Claude Code's extensibility features, professional AI-assisted workflows, and production engineering practices.

## Requirements

### Functional Requirements

Production-ready application solving a real problem
2+ user roles or distinct feature areas
Real-world use case (new idea)
Portfolio/interview-worthy quality
Deployed and accessible via public URL

### Technical Requirements

#### Architecture

1. Next.js full-stack application (App Router or Pages Router)
2. Database (PostgreSQL recommended, or equivalent)
3. Authentication (Auth.js/NextAuth, Clerk, or equivalent)
4. Deployed on Vercel (or equivalent platform with preview deploys)

#### Claude Code Mastery (core of this project)

Each of the following Claude Code concepts must be demonstrated with evidence in your repository:

- CLAUDE.md & Memory:
  - Comprehensive CLAUDE.md with @imports for modular organization
  - Auto-memory usage for persistent project context
  - Evidence of CLAUDE.md evolution across the project (visible in git history)
  - Project conventions, architecture decisions, and testing strategy documented

- Custom Skills — minimum 2:
  - At least 2 skills in .claude/skills/ (e.g., /fix-issue, /add-feature, /deploy, /create-pr)
  - Evidence of team usage (session logs or screenshots)
  - At least one skill iterated from v1 to v2 based on real usage

- Hooks — minimum 2:
  - At least 2 hooks configured in .claude/settings.json
  - At least one PreToolUse or PostToolUse hook (e.g., auto-format, block protected files, lint-on-edit)
  - At least one quality-enforcement hook (e.g., Stop hook that runs tests)

- MCP Servers — minimum 1:
  - At least 1 MCP server integrated (database, Playwright, GitHub, or other)
  - Configuration shared via .mcp.json in repository
  - Evidence of use in development workflow (session logs or screenshots)

- Agents — minimum 1 (choose any):
  - Custom sub-agents in .claude/agents/ (e.g., security-reviewer, test-writer), OR
  - Agent teams with CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1, OR
  - Agent SDK feature built into the application (applying W13 patterns)
  - Evidence of use (session log, PR, or screenshots showing agent output)

- Parallel Development:
  - Evidence of worktree usage for parallel feature development
  - At least 2 features developed in parallel (visible in git branch history)

- Writer/Reviewer Pattern + C.L.E.A.R.:
  - At least 2 PRs using the writer/reviewer pattern (one agent writes, another reviews)
  - C.L.E.A.R. framework applied in PR reviews (visible in PR comments)
  - AI disclosure metadata in PRs (% AI-generated, tool used, human review applied)

- Test-Driven Development
  - TDD workflow (red-green-refactor) for at least 3 features
  - Git history showing failing tests committed before implementation
  - Unit + integration tests (Vitest or Jest)
  - At least 1 E2E test (Playwright)
  - 70%+ test coverage

- CI/CD Pipeline — GitHub Actions
  - Lint (ESLint + Prettier)
  - Type checking (tsc --noEmit)
  - Unit and integration tests
  - E2E tests (Playwright)
  - Security scan (npm audit)
  - AI PR review (claude-code-action or claude -p)
  - Preview deploy (Vercel)
  - Production deploy on merge to main

- Security — minimum 4 gates from the 8-gate pipeline
  - Pre-commit secrets detection (Gitleaks or equivalent)
  - Dependency scanning (npm audit in CI)
  - At least one SAST tool or security-focused sub-agent
  - Security acceptance criteria in Definition of Done
  - OWASP top 10 awareness documented in CLAUDE.md

- Team Process
  - 2 sprints documented (sprint planning + retrospective each)
  - GitHub Issues with acceptance criteria as testable specifications
  - Branch-per-issue workflow with PR reviews
  - Async standups (minimum 3 per sprint per partner)
  - C.L.E.A.R. framework applied in PR reviews
  - Peer evaluations

## Deliverables

1. GitHub repository with full .claude/ configuration (skills, hooks, agents, MCP)
2. Deployed application (Vercel production URL)
3. CI/CD pipeline (GitHub Actions, all stages passing)
4. Technical blog post (published on Medium, dev.to, or similar)
5. Video demonstration (5-10 min, showcasing app + Claude Code workflow)
6. Individual reflections (one per partner, 500 words)
7. Showcase submission via Google FormLinks to an external site. (project name, URLs, thumbnail, video, blog)

## Rubric

| Criteria             | Rating                                                                                                                                                                                                                                                                                                    |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Application Quality  | Excellent - Production-ready, deployed on Vercel, polished UI, 2+ user roles, real problem solved, portfolio-worthy                                                                                                                                                                                       |
| Claude Code Mastery  | Excellent - Rich CLAUDE.md with @imports and git evolution; 2+ iterated skills with usage evidence; 2+ hooks enforcing quality; MCP server integrated via .mcp.json; agents (sub-agents/teams/SDK) with evidence; parallel worktree development; 2+ PRs with writer/reviewer + C.L.E.A.R. + AI disclosure |
| Testing & TDD        | Excellent - TDD red-green-refactor for 3+ features visible in git; 70%+ coverage; unit + integration + E2E (Playwright); tests verify behavior and edge cases                                                                                                                                             |
| CI/CD & Production   | Excellent - All 8 pipeline stages green (lint, typecheck, tests, E2E, security, AI review, preview, prod deploy); 4+ security gates; OWASP in CLAUDE.md                                                                                                                                                   |
| Team Process         | Excellent - 2 sprints with planning + retrospectives; branch-per-issue with PR reviews; 3+ async standups/sprint/partner; C.L.E.A.R. in reviews; AI disclosure; thoughtful peer evaluation                                                                                                                |
| Documentation & Demo | Excellent - Clear README with Mermaid architecture diagram; published blog post with AI workflow insights; polished 5-10 min video demo showcasing app + Claude Code workflow; 500-word reflections with specific Claude Code insights                                                                    |
