# ChronicPal — Product Requirements Document

## Product Overview

ChronicPal is a production-grade chronic disease treatment companion designed for patients undergoing recurring therapies (e.g., gout infusion treatments). It bridges the information gap between clinic visits by helping patients log treatments, track lab results, monitor symptoms, manage diet, and prepare for doctor visits.

## Target Users

### 1. The Active Patient

A person undergoing periodic treatment (e.g., gout infusion therapy) who struggles to track uric acid trends, remember dietary restrictions, and communicate treatment progress clearly to their doctor during short appointments.

### 2. The Concerned Caregiver

A family member who wants to help monitor the patient's diet compliance and treatment schedule but lacks a centralized view of the patient's health status.

### 3. The Healthcare Advisor

A clinician or pharmacist who wants a concise, data-driven patient summary before each visit to make better treatment decisions without relying solely on patient recall.

## Core User Stories

### Treatment Logging & Trend Tracking

**US-1**: As an active patient, I want to log each infusion session, medication, uric acid level, and pain score so that I can see my treatment trends over time and understand whether my condition is improving.

**Acceptance Criteria:**

- User can create a treatment entry with: date, type (infusion/medication/lab), uric acid level (mg/dL), pain score (0-10), and optional notes
- Dashboard displays a chronological timeline of all entries
- Trend charts show uric acid levels and pain scores over configurable time windows (1mo, 3mo, 6mo, 1yr)
- Data persists across sessions

### Diet Risk Assessment

**US-2**: As an active patient, I want to photograph or input my meals and receive instant purine-risk feedback so that I can make informed dietary choices that support my treatment.

**Acceptance Criteria:**

- User can input meals via text description or image upload
- System returns a purine risk score (low / moderate / high / very high) with explanation
- AI-powered analysis identifies specific high-purine ingredients
- Diet log is maintained with daily/weekly purine exposure summaries

### Pre-Visit Summary Generation

**US-3**: As an active patient, I want a pre-visit summary auto-generated before each appointment — covering recent lab trends, symptom changes, and dietary patterns — so that I can communicate effectively with my doctor without forgetting key details.

**Acceptance Criteria:**

- User can trigger summary generation for a date range
- Summary includes: lab trend analysis, symptom trajectory, diet compliance score, medication adherence, flagged concerns
- Output is formatted for printing or sharing (PDF export)
- AI generates natural-language narrative alongside data visualizations

### Caregiver Dashboard

**US-4**: As a concerned caregiver, I want a shared dashboard showing the patient's treatment adherence and dietary compliance so that I can provide timely reminders and support.

**Acceptance Criteria:**

- Patient can generate a share code/link for read-only caregiver access
- Caregiver dashboard shows: upcoming treatments, recent lab values, diet compliance %, missed medications
- No caregiver login required (link-based access with expiration)

## Non-Functional Requirements

- **Performance**: Page load < 2s, API response < 500ms for CRUD, < 5s for AI-powered features
- **Accessibility**: WCAG 2.1 AA compliant
- **Security**: All health data encrypted at rest and in transit; no PHI in logs
- **Privacy**: Users own their data; data export available; no third-party data sharing
- **Reliability**: 99.5% uptime target for API

## Architecture

| Concern    | Decision                                                               |
| ---------- | ---------------------------------------------------------------------- |
| Framework  | Next.js 15 — App Router (single monorepo, no separate backend service) |
| Auth       | NextAuth v5 (Credentials provider, JWT session)                        |
| Database   | PostgreSQL via Supabase, accessed exclusively through Prisma ORM       |
| Deployment | Vercel — preview deploys on PR, production deploy on merge to main     |

## API Design Summary

All endpoints are Next.js Route Handlers under `app/api/`.

### REST Endpoints

| Method | Path                    | Description                            |
| ------ | ----------------------- | -------------------------------------- |
| POST   | /api/auth/register      | User registration                      |
| POST   | /api/auth/[...nextauth] | NextAuth sign-in / sign-out / session  |
| GET    | /api/treatments         | List treatment entries (auth required) |
| POST   | /api/treatments         | Create treatment entry                 |
| PUT    | /api/treatments/[id]    | Update treatment entry                 |
| DELETE | /api/treatments/[id]    | Delete treatment entry                 |
| GET    | /api/labs               | List lab results                       |
| POST   | /api/labs               | Log lab result                         |
| GET    | /api/symptoms           | List symptom entries                   |
| POST   | /api/symptoms           | Log symptom entry                      |
| DELETE | /api/symptoms/[id]      | Delete symptom entry                   |
| GET    | /api/diet               | List diet entries                      |
| POST   | /api/diet               | Log meal with AI analysis              |
| POST   | /api/diet/analyze-image | Analyze meal image (Claude vision)     |
| GET    | /api/summary            | Generate pre-visit summary             |
| POST   | /api/share              | Generate caregiver share link          |
| GET    | /api/share/[token]      | Access shared dashboard (no auth)      |

### AI Integration Points

All Claude API calls are server-side only (Route Handlers / Server Actions):

- `POST /api/diet` — purine risk scoring
- `POST /api/diet/analyze-image` — meal image analysis via Claude vision
- `GET /api/summary` — narrative pre-visit summary generation
