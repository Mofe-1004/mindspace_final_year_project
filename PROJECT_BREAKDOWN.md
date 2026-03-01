# MindSpace - Mental Health Sentiment Analysis Platform

## Project Breakdown & Presentation Guide

**Team Document** | Last Updated: March 1, 2026

---

## 1. What Is MindSpace?

MindSpace is a web-based NLP-powered mental health support platform designed specifically for Nigerian university students. Students submit text entries about how they're feeling — in **English or Nigerian Pidgin** — and receive:

- An **empathetic reflection** of their emotional state (e.g., "You sound worried")
- A **categorized sentiment** (Positive / Neutral / Negative)
- A **dominant emotion** (e.g., Anxious, Sad, Hopeful, Joyful, Angry)
- A **risk assessment** (Low / Moderate / High)
- An **AI-matched Bible verse** for encouragement (powered by Claude Haiku)
- An optional **counselor contact** suggestion (for moderate/high risk)
- A **visual timeline** of their emotional trends over time

The platform has three user roles:
- **Students** — primary users who submit text and track emotional wellbeing
- **Counselors** — view assigned students' anonymized aggregate trends, receive high-risk alerts
- **Administrators** — manage users, assign counselors to students, monitor system-wide alerts

---

## 2. Problem Statement

Mental health awareness among Nigerian university students is growing, but access to support remains limited. Students often lack safe, private, culturally-sensitive outlets to express their feelings. Many students communicate daily emotions in **Nigerian Pidgin**, which mainstream tools don't understand.

MindSpace addresses this by:
- Providing a **private, judgement-free** space for emotional expression
- Supporting **Nigerian Pidgin** as a first-class language
- Using **NLP/AI** to provide immediate empathetic feedback (no waiting for appointments)
- Giving counselors **institutional awareness** of student wellbeing trends without compromising individual privacy
- Incorporating **faith-based encouragement** (AI-matched Bible verses) that resonates culturally
- **Automatically alerting counselors** when students are flagged as high-risk

---

## 3. System Architecture

```
                         +------------------+
                         |    Student /     |
                         |   Counselor /    |
                         |     Admin        |
                         |    (Browser)     |
                         +--------+---------+
                                  |
                                  | HTTPS
                                  v
                    +-------------+-------------+
                    |        Vercel CDN          |
                    |  (Frontend: React SPA)     |
                    +-------------+-------------+
                                  |
                         /api/* requests
                                  v
                    +-------------+-------------+
                    |   Vercel Serverless        |
                    |   Functions (Node.js)      |
                    |                            |
                    |  +----------------------+  |
                    |  | Input Validation      |  |
                    |  | (Gibberish Detection) |  |
                    |  +----------+-----------+  |
                    |             |               |
                    |  +----------+-----------+  |
                    |  | ML Service           |  |
                    |  | - Pidgin Translation  |  |
                    |  | - Sentiment Analysis  |  |
                    |  | - Emotion Detection   |  |
                    |  | - Risk Assessment     |  |
                    |  +----------+-----------+  |
                    |             |               |
                    |  +----------+-----------+  |
                    |  | Response Generation   |  |
                    |  | - Empathetic Message   |  |
                    |  | - AI Verse Matching    |  |
                    |  | - Alert Creation       |  |
                    |  +----------+-----------+  |
                    |                            |
                    +---+------+------+--------+-+
                        |      |      |        |
                        v      v      v        v
                +-------+--+ +-+-------+ +----+----+ +-----+-----+
                |HuggingFace| | Supabase| |Anthropic| |  Resend   |
                |Inference  | |(Postgres| |Claude   | |  Email    |
                |API        | | + Auth) | |Haiku    | |  Service  |
                |           | |         | |         | |           |
                |- Cardiff  | |- Users  | |(Verse   | |(Alert     |
                |  RoBERTa  | |- Subs   | | Match)  | | Emails)  |
                |- GoEmotions| |- Trends | |         | |           |
                |           | |- Alerts | |         | |           |
                +-----------+ +---------+ +---------+ +-----------+
```

### Architecture Decisions

| Decision | Choice | Reasoning |
|----------|--------|-----------|
| Monolith vs Microservices | **Monorepo monolith** | Simpler deployment, shared types, faster iteration for a student project |
| Frontend framework | **React 18 + TypeScript** | Industry standard, strong ecosystem, type safety |
| Backend runtime | **Vercel Serverless (Node.js)** | Free tier, zero-config deployment, scales automatically |
| Database | **Supabase (PostgreSQL)** | Free tier, built-in auth, Row-Level Security, real-time capabilities |
| ML inference | **HuggingFace Inference API** | Free tier, no GPU needed, pre-trained models available |
| Bible verse AI | **Claude Haiku** | Fast, cheap, context-aware verse selection (falls back to random without API key) |
| Email notifications | **Resend** | Free tier (100 emails/day), simple API, privacy-safe |
| Input validation | **Rule-based heuristics** | Safer for Pidgin than ML-based gibberish detection |
| Styling | **Tailwind CSS + shadcn/ui** | Rapid UI development, consistent design system |

---

## 4. Tech Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 18.2.0 | UI framework |
| TypeScript | 5.3.3 | Type safety |
| Vite | 5.0.8 | Build tool & dev server |
| Tailwind CSS | 3.3.6 | Utility-first styling |
| shadcn/ui | - | Pre-built accessible UI components |
| TanStack React Query | 5.14.0 | Server state management & caching |
| React Router | 6.21.0 | Client-side routing |
| React Hook Form | 7.49.0 | Form handling & validation |
| Recharts | 2.10.0 | Data visualizations (charts) |
| Zod | 3.22.4 | Schema validation |
| Lucide React | 0.563.0 | Icon library |

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Node.js | 20+ | Server runtime |
| Express.js | 4.18.2 | Local dev server |
| TypeScript | 5.3.3 | Type safety |
| @vercel/node | 3.0.12 | Serverless function runtime |
| @supabase/supabase-js | 2.38.0 | Database client |
| @anthropic-ai/sdk | latest | Claude Haiku API for verse matching |
| resend | latest | Email notification service |
| Zod | 3.22.4 | Request validation |
| Helmet | 7.1.0 | Security headers |
| CORS | 2.8.5 | Cross-origin resource sharing |

### ML/NLP
| Model | ID | Purpose |
|-------|-----|---------|
| Cardiff RoBERTa | `cardiffnlp/twitter-roberta-base-sentiment-latest` | Sentiment classification (positive/neutral/negative) |
| GoEmotions | `SamLowe/roberta-base-go_emotions` | 28-category emotion detection + risk assessment |
| Custom Pidgin Layer | Built in-house | Nigerian Pidgin → English translation (100+ phrase mappings) |
| Claude Haiku | `claude-haiku-4-5-20251001` | AI-powered Bible verse matching based on emotion context |

### Infrastructure
| Service | Tier | Purpose |
|---------|------|---------|
| Vercel | Free (Hobby) | Frontend hosting + serverless API |
| Supabase | Free | PostgreSQL database + authentication |
| HuggingFace | Free | ML model inference API |
| Anthropic | Pay-per-use | Claude Haiku for verse selection (optional) |
| Resend | Free (100/day) | Email alert notifications (optional) |

**Total hosting cost: $0/month** (all free tiers)

---

## 5. Core Features (What We Built)

### 5.1 Authentication & Authorization

- **School email validation** — only `@student.babcock.edu.ng`, `@babcock.edu.ng`, and other Nigerian university domains are accepted
- **JWT-based authentication** via Supabase Auth
- **Role-based access control** with four roles:
  - `student` — default for student emails
  - `pending_counselor` — auto-assigned for staff domain emails, awaits approval
  - `counselor` — approved by existing counselors or admin
  - `admin` — promoted by SQL or another admin
- **Counselor approval workflow** — first counselor bootstrapped via SQL, subsequent counselors approved through dashboard
- **Role-based routing** — each role redirected to their appropriate dashboard

### 5.2 Input Validation (Gibberish Detection)

Before expensive ML analysis runs, submissions go through rule-based quality checks:

1. **Minimum word count** — at least 3 real words
2. **Character entropy** — rejects 80%+ same character (`aaaaaaa`)
3. **Repetition detection** — rejects if same word/phrase repeats >60% of text
4. **Word whitelist** — checks against common English words + Nigerian Pidgin markers. If <30% recognized → likely gibberish
5. **Keyboard smash detection** — rejects if >50% of words have no vowels
6. **All-caps/no-letters check** — rejects if no alphabetic characters

**Key design decision**: Pidgin markers (`dey`, `wahala`, `na`, etc.) count as valid words, preventing false positives on legitimate Pidgin text.

### 5.3 Text Submission & Analysis Pipeline

When a student submits text, this happens in under 5 seconds:

```
Student types: "I no wan disappoint myself. That one dey fear me pass anything"
        |
        v
1. GIBBERISH DETECTION
   → Input passes quality checks (Pidgin markers recognized)
        |
        v
2. LANGUAGE DETECTION
   → Detected: Nigerian Pidgin (pattern matching: "no wan", "dey", "pass")
        |
        v
3. PIDGIN TRANSLATION
   → "I don't want disappoint myself. That one scares me more than anything"
   (100+ phrase substitutions, longest-match-first sorting)
        |
        v
4. PARALLEL ML ANALYSIS
   ├─ Cardiff RoBERTa → sentiment: NEGATIVE (confidence: 0.72)
   └─ GoEmotions → emotions: fear(0.79), nervousness(0.25), sadness(0.12)
        |
        v
5. SENTIMENT OVERRIDE LOGIC
   If Cardiff is uncertain (< 0.5) but GoEmotions detects
   strong negative emotion (>= 0.6), override to NEGATIVE
        |
        v
6. RISK ASSESSMENT
   → fear(0.79) + negative sentiment → MODERATE risk
   (High: grief/remorse >= 0.3 | Moderate: stress emotions >= 0.4 | Low: otherwise)
        |
        v
7. BIBLE VERSE CATEGORY ROUTING
   → Checks in order: HIGH risk → concern language → angry emotions →
     negative sentiment → positive → fallback neutral
   → Category: "negative_anxious"
        |
        v
8. AI VERSE MATCHING (Claude Haiku)
   → Category-filtered verses (~20 candidates) sent to Claude Haiku
   → AI reads student text + emotion context → picks best match
   → Philippians 4:6-7 (category-specific guidance: "peace and reassurance")
   → Fallback: random selection if no API key
        |
        v
9. RESPONSE GENERATION
   → Empathetic message: "It sounds like you're carrying a heavy weight..."
   → Dominant emotion: "Worried" (human-friendly label)
   → Show counselor option: true (moderate risk)
        |
        v
10. DATABASE SAVE + ALERT
    → Submission saved (text auto-deleted after 30 days)
    → If HIGH risk → create at-risk alert for assigned counselor (fire-and-forget)
        |
        v
11. RETURN RESULT TO STUDENT
```

### 5.4 Student Dashboard (3 Tabs)

| Tab | Contents |
|-----|----------|
| **Dashboard** | Stats cards (total entries, current mood, days active) + welcome card with how-it-works guide + counselor contact card |
| **My Journal** | Text submission form → analysis result card (gradient purple card with empathetic message, AI-matched Bible verse, emotion label, optional counselor contact) |
| **My Trends** | Line chart showing sentiment trajectory over time (Recharts) |

### 5.5 Counselor Dashboard

- **4 overview stats** — total submissions (7 days), most common mood, avg risk level, pending approvals
- **Sentiment pie chart** — positive/neutral/negative distribution
- **Risk distribution chart** — low/moderate/high breakdown
- **My Students section** — aggregate trends for assigned students (on-the-fly computation, K-anonymity ≥ 3)
- **At-risk alerts** — real-time alerts with 30s polling, acknowledge/resolve workflow
- **Approval management** — approve or reject pending counselor requests
- **Privacy notice** — explains assignment-based access and aggregate-only data

### 5.6 Admin Dashboard (4 Tabs)

| Tab | Contents |
|-----|----------|
| **Overview** | System stats cards (total students, counselors, submissions, high-risk count) + sentiment/risk charts |
| **Users** | Searchable/filterable table of all users with role change dropdown |
| **Assignments** | Assign counselors to student groups, view/delete existing assignments |
| **Alerts** | View all system alerts with status, counselor assignment, timestamps |

### 5.7 High-Risk Alert System

When a student's submission is classified as **HIGH risk**:

1. An `at_risk_alert` record is created (fire-and-forget — doesn't block student response)
2. The assigned counselor's dashboard shows the alert (30s polling)
3. An email notification is sent via Resend (NO student data in email — just a prompt to check the dashboard)
4. Counselor can **acknowledge** → **resolve** the alert with optional resolution notes
5. Admin can view all alerts system-wide

**Note**: Moderate risk submissions show a counselor contact suggestion to the student but do NOT create alerts for counselors.

### 5.8 AI-Powered Bible Verse Matching

Instead of random verse selection, Claude Haiku picks the most contextually appropriate verse:

1. **Category routing** determines the verse pool (~20 candidates) based on sentiment + emotion + risk
2. **Category-specific guidance** tells the AI what to optimize for:
   - `positive` → celebrates joy/gratitude
   - `negative_anxious` → peace and reassurance
   - `negative_sad` → comfort and hope
   - `negative_angry` → context-aware (personal conflict → forgiveness; situational frustration → patience)
   - `negative_struggle` → strength and freedom
   - `neutral_encouragement` → gentle uplift
   - `at_risk` → affirms worth and God's presence
3. **Student text is included** so the AI can distinguish context (e.g., angry at a person vs. angry at a situation)
4. **Universal rule**: Always comfort/encourage — never correct, lecture, or imply the student is sinning
5. **Graceful fallback**: If no API key or AI fails, falls back to random selection within the correct category

### 5.9 Privacy & Security

| Feature | Implementation |
|---------|---------------|
| **Row-Level Security** | Students can only access their own data; counselors see only assigned students' aggregates |
| **K-Anonymity** | Aggregate data only shown when ≥ 3 students contribute to a time bucket |
| **Data Retention** | Raw text auto-deleted after 30 days; sentiment scores kept for trends |
| **Data Deletion** | Students can delete all their records (CASCADE deletes across tables) |
| **Anonymized Trends** | `emotional_trends` table has NO student_id column — anonymization by design |
| **Assignment-Based Access** | Counselors only see data for students assigned to them by admin |
| **Privacy-Safe Emails** | Alert emails contain NO student names, submission text, or identifying details |
| **Service Role Separation** | Server uses service role key (bypasses RLS); frontend uses anon key (RLS enforced) |
| **Input Validation** | Zod schemas on both frontend and backend; gibberish detection before ML |
| **SECURITY DEFINER Functions** | `is_counselor()` and `is_admin()` prevent RLS recursion |

### 5.10 Nigerian Pidgin Support

Built a custom translation layer with 100+ phrase mappings:

| Pidgin | Translation |
|--------|-------------|
| "i dey tired" | "i am tired" |
| "wahala dey" | "there is a problem" |
| "i no fit" | "i can't" |
| "wetin dey happen" | "what is happening" |
| "dey fear me" | "scares me" |
| "no wan" | "don't want" |
| "pass anything" | "more than anything" |

The translation runs before ML analysis to improve model accuracy on Pidgin text.

---

## 6. Database Design

### Entity-Relationship Overview

```
auth.users (Supabase managed)
    |
    | 1:1
    v
students ──────────────────── counselor_approvals
    |        |                    (approval workflow)
    |        |
    |        └── counselor_student_assignments
    |              (admin assigns counselors to students)
    |
    | 1:many
    v
submissions ──────────────── at_risk_alerts
    (individual entries)        (HIGH risk → auto-created)

emotional_trends
    (anonymized aggregates, NO student_id)

bible_verses
    (100+ verses across 7 categories)
```

### Key Tables

| Table | Records | Purpose |
|-------|---------|---------|
| `students` | Per user | User profiles with role (student/pending_counselor/counselor/admin) |
| `submissions` | Per entry | Individual text entries + ML results (sentiment, emotion, risk, confidence) |
| `emotional_trends` | Hourly buckets | Anonymized aggregates for counselor dashboard |
| `bible_verses` | ~100+ | Categorized encouragement verses across 7 sentiment categories |
| `counselor_approvals` | Per request | Staff → counselor promotion workflow |
| `counselor_student_assignments` | Per pair | Admin-managed counselor-to-student group assignments |
| `at_risk_alerts` | Per HIGH risk | Automatic alerts with acknowledge/resolve workflow |

### PostgreSQL Functions

| Function | Schedule | Purpose |
|----------|----------|---------|
| `update_emotional_trends()` | Every 5 min (cron) | Aggregates submissions into anonymized hourly buckets |
| `delete_expired_text()` | Daily midnight (cron) | Replaces raw text after 30-day retention period |
| `decrement_trend_count()` | On account deletion | Adjusts aggregate counts when student deletes data |
| `update_timestamp()` | Trigger (before UPDATE) | Auto-manages `updated_at` columns |
| `is_counselor()` | On RLS check | SECURITY DEFINER function for counselor role verification |
| `is_admin()` | On RLS check | SECURITY DEFINER function for admin role verification |

---

## 7. API Endpoints

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `POST` | `/api/auth/signup` | None | Register with school email |
| `POST` | `/api/auth/login` | None | Login with email/password |
| `POST` | `/api/submissions/create` | Student JWT | Submit text, run ML analysis, return result |
| `GET` | `/api/submissions/history` | Student JWT | Fetch student's own submission history |
| `DELETE` | `/api/submissions/delete` | Student JWT | Delete a submission |
| `GET` | `/api/trends/aggregate` | Counselor JWT | Fetch anonymized aggregate trends |
| `GET` | `/api/counselors/pending` | Counselor JWT | List pending counselor approval requests |
| `POST` | `/api/counselors/approve` | Counselor JWT | Approve or reject a counselor request |
| `GET` | `/api/counselor/my-students` | Counselor JWT | Assigned students' aggregate trends |
| `GET` | `/api/counselor/alerts` | Counselor JWT | View pending/recent alerts |
| `PUT` | `/api/counselor/alerts/:id/acknowledge` | Counselor JWT | Acknowledge an alert |
| `PUT` | `/api/counselor/alerts/:id/resolve` | Counselor JWT | Resolve an alert with notes |
| `GET` | `/api/admin/users` | Admin JWT | List all users with roles and status |
| `PUT` | `/api/admin/users/role` | Admin JWT | Change a user's role |
| `GET` | `/api/admin/stats` | Admin JWT | System-wide statistics |
| `GET` | `/api/admin/assignments` | Admin JWT | List all counselor-student assignments |
| `POST` | `/api/admin/assignments` | Admin JWT | Create new assignment |
| `DELETE` | `/api/admin/assignments/:id` | Admin JWT | Remove an assignment |
| `GET` | `/api/admin/alerts` | Admin JWT | View all system alerts |
| `GET` | `/api/health` | None | Health check endpoint |

All responses follow a consistent envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
or
```json
{
  "success": false,
  "error": { "code": "ERROR_CODE", "message": "Human-readable message" }
}
```

---

## 8. Project Structure

```
final_year_project/
├── api/                        # Backend (Vercel serverless functions)
│   ├── submissions/
│   │   ├── create.ts           # POST - Submit & analyze text + alert creation
│   │   ├── history.ts          # GET  - Fetch submission history
│   │   └── delete.ts           # DELETE - Delete a submission
│   ├── trends/
│   │   └── aggregate.ts        # GET  - Counselor aggregate data
│   ├── counselors/
│   │   ├── approve.ts          # POST - Approve/reject counselor
│   │   └── pending.ts          # GET  - List pending approvals
│   ├── counselor/
│   │   ├── my-students.ts      # GET  - Assigned students aggregate trends
│   │   └── alerts.ts           # GET/PUT - Alert management
│   ├── admin/
│   │   ├── users.ts            # GET  - List all users
│   │   ├── role.ts             # PUT  - Change user role
│   │   ├── stats.ts            # GET  - System statistics
│   │   ├── assignments.ts      # GET/POST/DELETE - Assignment CRUD
│   │   └── alerts.ts           # GET  - All system alerts
│   ├── auth/
│   │   ├── signup.ts           # POST - Registration
│   │   └── login.ts            # POST - Authentication
│   ├── lib/
│   │   ├── ml-service.ts       # HuggingFace integration + analysis pipeline
│   │   ├── language-detector.ts # English/Pidgin detection
│   │   ├── response-generator.ts # Empathetic message templates
│   │   ├── verse-selector.ts   # AI-powered Bible verse matching (Claude Haiku)
│   │   ├── gibberish-detector.ts # Rule-based input quality validation
│   │   ├── alert-service.ts    # At-risk alert creation
│   │   └── email-service.ts    # Resend email notifications
│   └── dev-server.ts           # Express server for local development
│
├── frontend/                   # React application
│   └── src/
│       ├── pages/
│       │   ├── Dashboard.tsx       # Student dashboard (3-tab layout)
│       │   ├── CounselorDashboard.tsx # Counselor: trends + alerts + my students
│       │   ├── AdminDashboard.tsx  # Admin: overview + users + assignments + alerts
│       │   ├── Login.tsx / Signup.tsx
│       │   └── AwaitingApproval.tsx
│       ├── components/
│       │   ├── SubmissionForm.tsx   # Journal entry input
│       │   ├── SubmissionResult.tsx # Analysis result display
│       │   ├── ProtectedRoute.tsx   # Auth guard
│       │   ├── RoleBasedRoute.tsx   # Role-based routing
│       │   ├── charts/             # Recharts visualizations
│       │   └── ui/                 # shadcn/ui components
│       ├── hooks/                  # React Query data fetching
│       │   ├── useAdminData.ts     # Admin users/stats hooks
│       │   ├── useAssignments.ts   # Assignment CRUD
│       │   ├── useAlerts.ts        # Alert polling (30s)
│       │   ├── useMyStudentsTrends.ts # Counselor's assigned students
│       │   └── ...
│       └── lib/                    # Auth context, Supabase client
│
├── database/
│   ├── schema.sql              # Full PostgreSQL schema
│   └── migrations/             # Schema changes (run in order)
│       ├── 003_counselor_approval.sql
│       ├── 004_admin_role.sql
│       ├── 005_counselor_student_assignments.sql
│       ├── 006_at_risk_alerts.sql
│       ├── 007_add_phone_number.sql
│       └── 008_add_full_name.sql
│
├── types/
│   └── shared.ts               # Shared TypeScript types (frontend + backend)
│
├── scripts/
│   └── seed-bible-verses-expanded.sql  # 100+ Bible verses (7 categories)
│
└── .env.example                # Environment variables template
```

---

## 9. Development Timeline

| Phase | Status | What Was Built |
|-------|--------|----------------|
| **Phase 1: Auth** | Complete | Login, signup, school email validation, role-based routing, counselor approval workflow |
| **Phase 2: Core Flow** | Complete | Submission form → ML analysis → empathetic response → Bible verse → DB storage |
| **Phase 3: Dashboards** | Complete | Student trend charts, counselor aggregate dashboard with pie/bar charts |
| **Phase 4: Polish** | Complete | Bug fixes (RLS recursion, auth loading, confidence overflow, Pidgin accuracy), UI redesign (MindSpace branding, gradient cards, tab navigation) |
| **Phase 5: Supervisor Feedback** | Complete | Gibberish detection, admin role + dashboard, counselor-student assignments, high-risk alerts + email, AI-powered Bible verse matching |
| **Phase 6: Production Cleanup** | Complete | Removed debug logs, fixed TypeScript errors, improved verse selection prompts, context-aware category routing |

### Bugs Found & Fixed
1. **RLS Infinite Recursion** — counselor policy on `students` table queried itself (fixed with SECURITY DEFINER function)
2. **Auth Stuck on Loading** — stale localStorage caused `getSession()` to hang (fixed with timeout + try/catch)
3. **navigate() Race Condition** — called during React render instead of useEffect
4. **Confidence > 1.0** — accumulated emotion scores exceeded DB constraint (capped at 1.0)
5. **"Challenging" Label** — hardcoded label instead of dynamic dominant emotion
6. **HuggingFace Timeouts** — 10s timeout too short for cold starts (increased to 30s + retry)
7. **Pidgin Translation Gaps** — missing patterns for transitive verbs and comparatives
8. **Wrong Verse Category for Anger** — ML sentiment model classified anger as "neutral", routing to wrong verse pool (fixed by checking emotion before sentiment)
9. **Preachy Verses for Anger** — corrective verses like "In your anger do not sin" were inappropriate; replaced with comfort/forgiveness/patience verses

---

## 10. How to Run Locally

### Prerequisites
- Node.js 20+
- npm 10+
- Supabase project (free tier)
- HuggingFace account + API token (free)
- Anthropic API key (optional, for AI verse matching)
- Resend API key (optional, for email alerts)

### Setup
```bash
# 1. Install dependencies
npm install

# 2. Create .env in project root
cp .env.example .env
# Fill in: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY,
#          VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, HUGGINGFACE_API_TOKEN
# Optional: ANTHROPIC_API_KEY, RESEND_API_KEY

# 3. Run database migrations in Supabase SQL Editor (in order):
#    - database/schema.sql
#    - database/migrations/003_counselor_approval.sql
#    - database/migrations/004_admin_role.sql
#    - database/migrations/005_counselor_student_assignments.sql
#    - database/migrations/006_at_risk_alerts.sql
#    - database/migrations/007_add_phone_number.sql
#    - database/migrations/008_add_full_name.sql
#    - scripts/seed-bible-verses-expanded.sql

# 4. Bootstrap admin account
#    UPDATE public.students SET role = 'admin' WHERE email = 'admin@babcock.edu.ng';

# 5. Start both frontend and API dev servers
npm run dev
# Frontend: http://localhost:5173
# API:      http://localhost:3001

# IMPORTANT: Open in Incognito mode (Ctrl+Shift+N) to avoid extension interference
```

---

## 11. Presentation Guide for Supervisor

### Suggested Demo Flow (15-20 minutes)

**1. Introduction (2 min)**
- Problem: Nigerian university students lack private, culturally-sensitive mental health support
- Solution: MindSpace — AI-powered emotional reflection with Pidgin support and counselor oversight

**2. Live Demo — Student Flow (5 min)**
- Sign up with a school email
- Submit an English entry: "I've been feeling really stressed about my exams and I don't think I can handle it"
  - Show: sentiment (negative), emotion (worried/anxious), risk (moderate), empathetic message, AI-matched Bible verse, counselor option
- Submit a Pidgin entry: "I no wan disappoint myself. That one dey fear me pass anything"
  - Show: Pidgin is understood and analyzed correctly
- Submit gibberish: "asdfghjkl qwerty" → rejected with clear message
- Switch to "My Trends" tab — show the emotional timeline chart

**3. Live Demo — Counselor Flow (3 min)**
- Log in as counselor
- Show aggregate dashboard: pie chart, risk levels, stats
- Show "My Students" section — aggregate trends for assigned students
- Show at-risk alert notification → acknowledge → resolve workflow
- Emphasize: NO student names visible, data is anonymized

**4. Live Demo — Admin Flow (3 min)**
- Log in as admin
- Overview tab: system-wide statistics
- Users tab: search users, change roles
- Assignments tab: assign counselors to students
- Alerts tab: monitor all system alerts

**5. Technical Walkthrough (3 min)**
- Architecture diagram (Section 3 above)
- ML pipeline: Gibberish check → Pidgin translation → Cardiff RoBERTa + GoEmotions (parallel) → risk mapping → AI verse matching
- Privacy: RLS, K-anonymity, 30-day text retention, cascade deletion, assignment-based access
- All hosted on free tiers (Vercel + Supabase + HuggingFace)

**6. Challenges & Solutions (2 min)**
- Nigerian Pidgin understanding (custom translation layer — not "broken English")
- HuggingFace cold start timeouts (30s timeout + retry)
- Privacy vs utility trade-off (K-anonymity threshold, assignment-based access)
- RLS infinite recursion bug (SECURITY DEFINER function)
- Anger misclassification (ML says "neutral" sentiment for anger — fixed with emotion-first routing)
- Inappropriate Bible verses (corrective verses replaced with comforting ones; AI uses category-specific guidance)

### Key Points to Emphasize

- **Cultural relevance** — Nigerian Pidgin support sets this apart from generic mental health tools
- **Privacy by design** — anonymization is structural (no student_id column in trends), not just policy
- **Real NLP** — two production ML models running in parallel, not keyword matching
- **AI verse matching** — Claude Haiku picks contextually appropriate verses (not random)
- **Complete system** — auth, input validation, submission, analysis, response, visualization, alerts, admin dashboard
- **Three-role system** — students, counselors, and admins with appropriate access levels
- **High-risk safety net** — automatic alerts to counselors when students are flagged
- **Faith-based support** — Bible verses matched to emotional states, culturally appropriate for the audience
- **Zero cost** — entire stack runs on free tiers

### Potential Supervisor Questions & Answers

**Q: Why not use ChatGPT/OpenAI for analysis?**
A: We use specialized models (Cardiff RoBERTa for sentiment, GoEmotions for emotions) rather than general-purpose LLMs. They're faster, free, and purpose-built for sentiment classification. We use Claude Haiku only for verse selection (picking from a pre-filtered list), not for the core analysis.

**Q: How do you handle Nigerian Pidgin?**
A: A custom translation layer with 100+ phrase mappings converts Pidgin to English before passing to the ML models. This is combined with language detection that identifies Pidgin-specific markers. The gibberish detector also recognizes Pidgin markers as valid words, so Pidgin text is never rejected as gibberish.

**Q: What if a student is at high risk?**
A: HIGH risk submissions automatically create an alert for the student's assigned counselor. The counselor sees it on their dashboard (30s polling) and receives an email notification. The counselor can acknowledge and resolve the alert. Moderate risk shows a counselor contact suggestion to the student but doesn't alert counselors. The system does NOT make clinical diagnoses — it provides empathetic reflection only.

**Q: How is student privacy protected?**
A: Multiple layers: Row-Level Security (students only see own data), K-anonymity (aggregate data only when ≥ 3 students contribute), 30-day text retention (raw text auto-deleted), no student_id in trends table, assignment-based counselor access (counselors only see their assigned students' aggregates), privacy-safe alert emails (no student data), and full data deletion on request.

**Q: How does the Bible verse matching work?**
A: It's a two-step process. First, rule-based category routing narrows ~100 verses down to ~20 based on sentiment, emotion, and risk level. Then Claude Haiku reads the student's actual text and picks the most contextually appropriate verse from that filtered list. Each category has specific guidance (e.g., for anger: distinguish personal conflict vs. situational frustration). If no API key is configured, it falls back to random selection within the correct category.

**Q: Can this scale?**
A: The serverless architecture (Vercel) auto-scales. The database uses proper indexing, RLS policies, and aggregation functions. The main bottleneck would be HuggingFace API rate limits on the free tier, which could be solved by upgrading or self-hosting models.

**Q: How do you prevent spam/gibberish submissions?**
A: A rule-based gibberish detector runs before ML analysis. It checks for minimum word count (3), character entropy, repetition, keyboard smashing, and validates against a word whitelist that includes both English and Pidgin vocabulary. This prevents wasting compute on nonsensical input while preserving Pidgin text.

---

## 12. Future Work / Remaining Tasks

- [ ] Production deployment to Vercel
- [ ] Performance optimization — verify <5s response time (excl. cold start)
- [ ] Mobile-responsive testing and polish
- [ ] Load testing with concurrent users
- [ ] Accessibility audit (WCAG compliance)
- [ ] More comprehensive Pidgin dictionary
- [ ] Real-time updates via Supabase subscriptions (instead of 30s polling)
- [ ] Password reset UI
