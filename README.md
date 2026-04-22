# ChronicPal — AI-Powered Chronic Treatment Companion

> CS 7980 — AI-Assisted Coding (Spring 2026) · Northeastern University

**ChronicPal** helps patients undergoing recurring therapies (e.g., gout infusion treatments) track treatments, lab results, symptoms, and diet between clinic visits. It generates AI-powered pre-visit summaries, flags dietary risks in real time, and gives caregivers read-only visibility into patient progress.

**Live Demo**: [https://chronicpal.vercel.app](https://chronicpal.vercel.app)

**Team**: Shuhan Dong · Lang Min ([@LangMinNEU](https://github.com/LangMinNEU))

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
- [Claude Code Mastery](#claude-code-mastery)
- [Testing](#testing)
- [CI/CD Pipeline](#cicd-pipeline)
- [Security](#security)
- [Architecture Decisions](#architecture-decisions)
- [Individual Reflection — Shuhan Dong](#individual-reflection--shuhan-dong--个人反思--董书涵)

---

## Features

### Patient Dashboard
- **Treatment Logging** — Log infusion sessions, medications, uric acid levels (mg/dL), and pain scores (0–10) with trend charts over configurable time windows (1mo / 3mo / 6mo / 1yr)
- **Lab Tracking** — Record and visualize lab results with historical trend analysis
- **Symptom Monitoring** — Track daily symptom entries and spot flare-up patterns over time
- **AI Diet Analysis** — Input meals by text or image; receive instant purine-risk scores (low / moderate / high / very high) powered by Claude and Gemini
- **Pre-Visit Summary** — One-click AI-generated doctor report covering lab trends, symptom trajectory, diet compliance, and flagged concerns

### Caregiver Dashboard
- Link via share code for read-only access to a patient's treatment adherence and diet compliance
- No separate caregiver account required — link-based access with role enforcement at the DB level

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router), React 19, TypeScript 5 |
| Styling | Tailwind CSS 4, PostCSS |
| Auth | NextAuth v5 (Credentials provider, JWT in httpOnly cookies) |
| Database | PostgreSQL (Supabase), Prisma ORM 6 |
| AI | Anthropic Claude API (`claude-sonnet-4-5`) + Google Gemini 2.5 Flash — server-side only |
| Logging | Winston 3 (structured, PHI-safe field allowlist) |
| Testing | Vitest 3 + React Testing Library + Playwright; coverage ≥ 70% |
| Tooling | ESLint, Prettier (2-space, single quotes, trailing commas), Husky |
| Deployment | Vercel (preview on PR, production on merge to main) |

---

## Project Structure

```
CS7980_ChronicPal_Treatment_Companion/
├── chronicpal/                  # Main Next.js application
│   ├── app/                     # App Router — pages & Route Handlers
│   │   ├── api/                 # REST endpoints (treatments, labs, diet, auth…)
│   │   ├── dashboard/           # Patient dashboard pages
│   │   ├── caregiver/           # Caregiver dashboard
│   │   ├── login/               # Auth pages
│   │   └── register/
│   ├── services/                # Business logic & AI integration
│   │   └── prompts/             # Claude prompt templates
│   ├── validators/              # Zod schemas for all inputs
│   ├── lib/                     # Prisma singleton, auth guard, constants
│   ├── components/              # Shared React components
│   ├── __tests__/               # Vitest unit & integration tests (31 files)
│   ├── e2e/                     # Playwright E2E tests
│   ├── prisma/                  # Schema & migrations
│   └── .claude/                 # Claude Code project settings & hooks
├── .claude/                     # Claude Code skills & agents (repo-level)
│   ├── skills/                  # Custom slash commands
│   └── agents/                  # Sub-agent definitions
├── docs/                        # PRD, ADRs, domain glossary, issue specs
├── ScreenShot/                  # Claude Code usage evidence (MCP, skills, agents)
├── session-log.md               # Development session log
└── CLAUDE.md                    # Claude Code context with @imports
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database (or Supabase project)
- Anthropic API key
- Google Gemini API key

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/hansama0902/CS7980_ChronicPal_Treatment_Companion.git
cd CS7980_ChronicPal_Treatment_Companion/chronicpal

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Fill in: DATABASE_URL, AUTH_SECRET, ANTHROPIC_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY

# 4. Run database migrations & generate Prisma client
npx prisma migrate dev
npx prisma generate

# 5. Start the dev server
npm run dev
# → http://localhost:3000
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (Supabase) |
| `AUTH_SECRET` | NextAuth secret (≥ 32 chars) |
| `ANTHROPIC_API_KEY` | Anthropic Claude API key |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google Gemini API key |
| `NEXTAUTH_URL` | App base URL (e.g., `http://localhost:3000`) |

### Common Commands

```bash
npm run dev               # Dev server (localhost:3000)
npm run build             # Production build
npm run test              # Vitest unit/integration (watch)
npm run test:run          # Vitest single run
npm run test:e2e          # Playwright E2E
npm run lint              # ESLint
npm run typecheck         # tsc --noEmit
npm run format            # Prettier write

npx prisma migrate dev    # Apply migrations (dev)
npx prisma studio         # DB GUI
```

---

## API Reference

All endpoints are Next.js Route Handlers under `app/api/`. Every protected endpoint is wrapped with `withAuth()` from `lib/routeAuth.ts`. All inputs are validated with Zod before reaching the database.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | Public | User registration |
| POST | `/api/auth/[...nextauth]` | Public | NextAuth sign-in / sign-out |
| GET / POST | `/api/treatments` | Patient | List / create treatment entries |
| PUT / DELETE | `/api/treatments/[id]` | Patient | Update / delete treatment entry |
| GET / POST | `/api/labs` | Patient | List / log lab results |
| DELETE | `/api/labs/[id]` | Patient | Delete lab result |
| GET / POST | `/api/symptoms` | Patient | List / log symptom entries |
| DELETE | `/api/symptoms/[id]` | Patient | Delete symptom entry |
| GET / POST | `/api/diet` | Patient | List / log meal with AI analysis |
| POST | `/api/diet/analyze` | Patient | AI purine-risk analysis (Claude) |
| GET | `/api/summary` | Patient | Generate AI pre-visit summary |
| POST | `/api/caregiver/link` | Patient | Generate caregiver share code |
| GET | `/api/patient/links` | Patient | List active caregiver links |

---

## Claude Code Mastery

This project demonstrates all required Claude Code concepts from CS 7980.

### CLAUDE.md & Memory

`CLAUDE.md` at the repo root uses `@import` for modular organization:
- `@import docs/PRD.md` — Product requirements & user stories
- `@import docs/ADRs.md` — Architecture Decision Records
- `@import docs/domain-glossary.md` — Domain terminology

CLAUDE.md evolution is visible in git history — it was updated across 4+ commits as the project migrated from React/Vite + Express to Next.js full-stack and as new security/testing conventions were added.

### Custom Skills (6)

Located in `.claude/skills/`:

| Skill | Version | Description |
|-------|---------|-------------|
| `/add-feature` | v2 | Scaffold backend feature end-to-end: Prisma schema → Zod validator → service → Route Handler → Vitest tests. v2 added Step 0 to block features that reference missing Prisma models. |
| `/review` | v2 | ChronicPal-specific code review: PHI safety, auth patterns, AI boundaries, DB access. v2 added REST design checks (Category 9). |
| `/commit-to-branch` | v1 | Git workflow helper — stage, commit, and push to feature branch. |
| `/explain-code` | v1 | Code explanation with visual diagrams and analogies. |
| `/explain-skill` | v1 | Documents a skill's behavior and options. |
| `/update-repo` | v1 | Pull latest main and rebase current branch. |

### Hooks (2)

Configured in `chronicpal/.claude/settings.json`:

1. **PostToolUse Hook** — Triggers after every `Edit` or `Write` tool call; auto-runs `npx prettier --write` on TypeScript files to enforce consistent formatting.
2. **Stop Hook** — Triggers when Claude finishes a session; auto-runs `npm run test:run | tail -30` to display a test summary without requiring a manual command.

Additionally, a Husky **pre-commit hook** runs `gitleaks protect --staged` to block secrets from being committed.

### MCP Servers (1)

Configured in `.mcp.json`:

| Server | Purpose |
|--------|---------|
| `figma-remote-mcp` | Design collaboration — read Figma component specs directly inside Claude Code sessions |

Usage evidence: `ScreenShot/mcp 1.png` through `mcp 7.png` (April 17) showing MCP server startup and Figma integration in action.

### Agents (2)

Located in `.claude/agents/`:

| Agent | Invocation | Purpose |
|-------|------------|---------|
| `security-reviewer` | `security-reviewer: review <file or diff>` | Reviews code for P0/P1/P2 security violations — PHI leakage, auth patterns, injection risks, OWASP Top 10 |
| `test-writer` | `test-writer: write tests for <feature>` | Writes Vitest unit/integration tests and Playwright E2E tests following TDD red-green-refactor workflow |

### Parallel Development

Feature branches demonstrate parallel development across the team:

```
feature/CP-1                      feature/cp-8-ai-meal-analysis
feature/CP-9-diet-analysis         feature/cp-6-treatment-logging-ui
feature/cp-10-pre-visit-summary    feature/cp-4-cp-11-auth-caregiver
feature/CP-7-CP-14-labs-dashboard  feature/cp-symptoms-treatment-logging
```

### Writer / Reviewer Pattern

All PRs follow the writer/reviewer pattern:
- One developer writes the feature (or uses Claude Code to scaffold it via `/add-feature`)
- A second review pass uses `security-reviewer` agent and the CI `ai-review` job (Claude Code Action) with the C.L.E.A.R. framework
- PRs include AI disclosure metadata: % AI-generated, tool used (Claude Code), human review applied

---

## Testing

```bash
npm run test:run          # All unit & integration tests
npm run test:run -- --coverage   # With coverage report
npm run test:e2e          # Playwright E2E tests
```

### Coverage

- **31 test files** across `__tests__/` (unit + integration)
- **2 E2E spec files** in `e2e/` (`auth.spec.ts`, `critical-flow.spec.ts`)
- **Coverage threshold**: lines ≥ 70%, functions ≥ 70%, branches ≥ 70% (enforced in CI)

### TDD Workflow

Git history shows the red-green-refactor pattern:

```
2c5645d [CP-9] test: add failing tests for diet analysis   ← red phase
ca8a727 [CP-9] feat: implement AI diet analysis            ← green phase
30da8f6 Fix prettier                                        ← refactor
```

---

## CI/CD Pipeline

GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every PR and push to `main`:

```
lint → typecheck → unit-test ─┐
security ──────────────────────┤→ e2e → deploy-preview (PR)
                               │       deploy-production (main)
ai-review (parallel) ──────────┘
```

| Job | What it runs |
|-----|--------------|
| **lint** | ESLint + Prettier check |
| **typecheck** | `tsc --noEmit` |
| **unit-test** | Vitest + coverage threshold |
| **security** | `npm audit --audit-level=high` · Gitleaks · Semgrep (`p/typescript`, `p/nodejs`, `p/owasp-top-ten`) |
| **ai-review** | Claude Code Action — PHI safety, auth patterns, Zod validation, CLEAR framework |
| **e2e** | Playwright on Chromium with real Postgres service container |
| **deploy-preview** | Vercel preview deploy (PR only) |
| **deploy-production** | Vercel production deploy (merge to `main` only) |

---

## Security

This project implements a multi-layer security pipeline aligned with OWASP Top 10 (2021):

| Gate | Tool | When |
|------|------|------|
| Secrets detection | Gitleaks (`protect --staged`) | Pre-commit |
| Dependency audit | `npm audit --audit-level=high` | CI |
| SAST | Semgrep `p/owasp-top-ten` | CI |
| AI security review | Claude Code Action + `security-reviewer` agent | CI + PR |

**Key mitigations:**
- **PHI Safety** — Winston structured logger with explicit field allowlist; health data never appears in logs, error messages, or client responses
- **Auth** — NextAuth v5 JWT in httpOnly cookies; no localStorage tokens; bcryptjs password hashing
- **Injection** — Prisma ORM parameterized queries; all inputs validated with Zod before DB access
- **AI boundary** — All Claude/Gemini API calls are server-side only (Route Handlers); no AI calls from Client Components

---

## Architecture Decisions

| ADR | Decision | Rationale |
|-----|----------|-----------|
| ADR-2 | Prisma over raw SQL | Type-safe access, auto-generated migrations, clear schema file |
| ADR-3 | JWT auth (httpOnly cookies) | Stateless, no sticky sessions; tokens never in localStorage |
| ADR-4 | Claude API for AI features | Best-in-class for clinical narrative generation and dietary risk analysis |
| ADR-5 | Supabase as managed Postgres | Managed connection pooling; Prisma as the sole ORM layer (no Supabase SDK) |
| ADR-6 | No PHI in logs | Health data must never appear in `console.log`, error messages, or third-party services |

---

## Individual Reflection — Shuhan Dong / 个人反思 — 董书涵

### Project Deliverables / 项目交付物

| Deliverable | Link |
|-------------|------|
| Slide Deck / 课程幻灯片 | [Google Slides](https://docs.google.com/presentation/d/1bE2UHOsf4Y77ce3D_uPG-ac-M_0TN9Bu3LtzYe1b_kE/edit?usp=sharing) |
| Demo Video / 演示视频 | [YouTube](https://youtu.be/cQoulHRlD18) |
| Technical Blog Post / 技术博客 | [LinkedIn Article](https://www.linkedin.com/posts/shuhan-dong-aa2041233_how-claude-code-shipped-a-health-tech-app-ugcPost-7452546542517010432-BK7e?utm_source=share&utm_medium=member_desktop&rcm=ACoAADo0QNoBGrOlvQt-S7bs8ApRYL9oApcG-rk) |
| Live Production App / 线上产品 | [chronicpal.vercel.app](https://chronicpal.vercel.app) |

---

### English

Building ChronicPal has been one of the most technically and intellectually demanding experiences of my academic career. Coming into this course, I understood AI as a tool to accelerate routine coding tasks. What I did not anticipate was how deeply it would reshape the way I reason about software design, security, and the responsibilities that come with handling sensitive health data.

The project set out to solve a real problem: patients undergoing recurring therapies like gout infusion treatment often struggle to recall months of lab trends, dietary choices, and symptom changes during a brief clinical appointment. ChronicPal bridges that gap by combining structured treatment logging, AI-powered diet risk analysis, and auto-generated pre-visit summaries into a single application. What sounds like a clean product vision, however, revealed its complexity at every layer of implementation.

One of the most instructive challenges was architecting the AI layer responsibly. Early in the project, the temptation was to call the Claude API directly from the frontend for a faster development loop. Our ADR-4 decision — routing all AI calls exclusively through server-side Route Handlers — initially felt like unnecessary friction. It only made sense once we traced the full security surface: a client-side AI call would expose the API key in the browser, risk leaking PHI in request payloads, and bypass every server-side validation we had built. The discipline of writing that architectural decision record first, before writing a single line of AI integration code, forced us to think like engineers rather than just move fast. That habit — document the *why* before the *how* — is something I will carry into every future project.

Working with PHI-safe logging under ADR-6 was similarly humbling. I had never before written a logger with an explicit field allowlist to prevent health values from appearing in error traces. Winston's structured logging model made the mechanism straightforward, but the mindset shift was the real lesson: the default assumption when handling health data must be "log nothing" rather than "log what seems safe." A single carelessly logged uric acid value in a cloud logging service would constitute a HIPAA-equivalent violation in a production context.

On the AI-assisted coding side, I found Claude Code most valuable not for generating large code blocks, but for catching architectural drift early — flagging when a new component was about to make a direct database call or when a Zod validator was being skipped on a new endpoint. These are the kinds of reviews that a human reviewer might miss on a deadline. That said, I also learned that AI suggestions require the same scrutiny as any code review. In two instances, AI-suggested patterns conflicted with our established ADRs, and accepting them uncritically would have introduced security regressions.

The caregiver dashboard and pre-visit summary features — the two highest-complexity user stories — taught me the most about the gap between prototype quality and production quality. Generating a coherent, medically-grounded natural-language summary from months of lab and diet data required careful prompt engineering, output validation, and graceful degradation when Claude returned incomplete results. There is no shortcut to that work.

If I were to start over, I would allocate more time earlier to integration testing with a real database, rather than relying solely on unit tests with mocked Prisma calls. A mock that passes is not the same as a migration that survives production. That is perhaps the most durable lesson this project gave me.

---

### 中文

构建 ChronicPal 是我学术生涯中技术难度与思维挑战并存的一段经历。进入这门课程之前，我将 AI 理解为加速日常编码任务的工具。我没有预料到的是，它会如此深刻地重塑我对软件设计、安全以及处理敏感健康数据所承担责任的思考方式。

这个项目旨在解决一个真实问题：接受定期输液治疗（如痛风治疗）的患者，往往难以在短暂的门诊时间内清晰回忆数月来的化验趋势、饮食选择和症状变化。ChronicPal 通过整合结构化治疗记录、AI 饮食风险分析和自动生成的就诊前摘要，弥合了这一信息缺口。然而，看似简洁的产品愿景，在实现的每一层都暴露出真实的复杂性。

最具启发意义的挑战之一是如何负责任地设计 AI 层。项目早期，我曾有冲动直接从前端调用 Claude API 以加快开发迭代。我们在 ADR-4 中做出的决定——将所有 AI 调用严格路由至服务端的 Route Handler——最初让人觉得是不必要的阻碍。直到我们追溯完整的安全攻击面，才真正理解其意义：客户端的 AI 调用会在浏览器中暴露 API 密钥，增加请求负载中泄露 PHI 的风险，并绕过所有已构建的服务端验证。在写下任何 AI 集成代码之前，先记录架构决策的规范——先写"为什么"，再写"怎么做"——是我将带入未来所有项目的习惯。

在 ADR-6 要求下实现 PHI 安全日志，同样让我深有感触。我此前从未为日志系统设计过显式字段白名单以防止健康数值出现在错误追踪中。Winston 的结构化日志模型让实现机制相对直观，但真正的收获是思维方式的转变：处理健康数据时，默认假设应该是"什么都不记录"，而不是"记录看起来安全的内容"。在生产环境中，一条不经意记录的尿酸值，就可能构成等同于 HIPAA 违规的事件。

在 AI 辅助编码方面，我发现 Claude Code 最大的价值并不在于生成大段代码，而在于尽早识别架构偏移——当某个新组件即将直接访问数据库，或某个新接口在跳过 Zod 校验时，及时发出警示。这类问题在截止日期压力下很容易被人工审查者遗漏。但我也认识到，AI 的建议与其他代码审查意见一样需要严格审视。有两次，AI 给出的模式与我们已有的 ADR 存在冲突，若不加甄别地采纳，将引入安全漏洞。

护理者看板和就诊前摘要——两个复杂度最高的用户故事——让我最深刻地体会到原型质量与生产质量之间的鸿沟。从数月的化验和饮食数据中生成连贯、有医学依据的自然语言摘要，需要精心的提示词工程、输出验证，以及在 Claude 返回不完整结果时的优雅降级处理。这些工作没有捷径可走。

如果重来一次，我会在更早阶段投入更多精力进行基于真实数据库的集成测试，而不是单纯依赖 Prisma mock 的单元测试。一个通过了 mock 测试的用例，并不等同于一次在生产环境中存活下来的数据库迁移。这或许是这个项目留给我最深刻的教训。

---

## License

MIT — see [LICENSE](LICENSE).
