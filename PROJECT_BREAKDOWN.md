# MindSpace - Mental Health Sentiment Analysis Platform

## Project Breakdown & Presentation Guide

**Team Document** | Last Updated: February 18, 2026

---

## 1. What Is MindSpace?

MindSpace is a web-based NLP-powered mental health support platform designed specifically for Nigerian university students. Students submit text entries about how they're feeling — in **English or Nigerian Pidgin** — and receive:

- An **empathetic reflection** of their emotional state (e.g., "You sound worried")
- A **categorized sentiment** (Positive / Neutral / Negative)
- A **dominant emotion** (e.g., Anxious, Sad, Hopeful, Joyful)
- A **risk assessment** (Low / Moderate / High)
- A **Bible verse** matched to their emotional state for encouragement
- An optional **counselor contact** suggestion (for moderate/high risk)
- A **visual timeline** of their emotional trends over time

Registered counselors get a separate dashboard showing **anonymized, aggregated** trends across the student body — no individual identities are ever exposed.

---

## 2. Problem Statement

Mental health awareness among Nigerian university students is growing, but access to support remains limited. Students often lack safe, private, culturally-sensitive outlets to express their feelings. Many students communicate daily emotions in **Nigerian Pidgin**, which mainstream tools don't understand.

MindSpace addresses this by:
- Providing a **private, judgement-free** space for emotional expression
- Supporting **Nigerian Pidgin** as a first-class language
- Using **NLP/AI** to provide immediate empathetic feedback (no waiting for appointments)
- Giving counselors **institutional awareness** of student wellbeing trends without compromising individual privacy
- Incorporating **faith-based encouragement** (Bible verses) that resonates culturally

---

## 3. System Architecture

```
                         +------------------+
                         |    Student /     |
                         |    Counselor     |
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
                    |  | ML Service           |  |
                    |  | - Pidgin Translation  |  |
                    |  | - Sentiment Analysis  |  |
                    |  | - Emotion Detection   |  |
                    |  | - Risk Assessment     |  |
                    |  +----------+-----------+  |
                    |             |               |
                    +-------------+-------------+-+
                          |                     |
                          v                     v
                 +--------+--------+   +--------+--------+
                 |   HuggingFace   |   |    Supabase     |
                 |  Inference API  |   |   (PostgreSQL   |
                 |                 |   |    + Auth)      |
                 | - Cardiff       |   |                 |
                 |   RoBERTa       |   | - Students      |
                 | - GoEmotions    |   | - Submissions   |
                 |                 |   | - Trends        |
                 +-----------------+   | - Bible Verses  |
                                       +-----------------+
```

### Architecture Decisions

| Decision | Choice | Reasoning |
|----------|--------|-----------|
| Monolith vs Microservices | **Monorepo monolith** | Simpler deployment, shared types, faster iteration for a student project |
| Frontend framework | **React 18 + TypeScript** | Industry standard, strong ecosystem, type safety |
| Backend runtime | **Vercel Serverless (Node.js)** | Free tier, zero-config deployment, scales automatically |
| Database | **Supabase (PostgreSQL)** | Free tier, built-in auth, Row-Level Security, real-time capabilities |
| ML inference | **HuggingFace Inference API** | Free tier, no GPU needed, pre-trained models available |
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
| Zod | 3.22.4 | Request validation |
| Helmet | 7.1.0 | Security headers |
| CORS | 2.8.5 | Cross-origin resource sharing |

### ML/NLP
| Model | ID | Purpose |
|-------|-----|---------|
| Cardiff RoBERTa | `cardiffnlp/twitter-roberta-base-sentiment-latest` | Sentiment classification (positive/neutral/negative) |
| GoEmotions | `SamLowe/roberta-base-go_emotions` | 28-category emotion detection + risk assessment |
| Custom Pidgin Layer | Built in-house | Nigerian Pidgin → English translation (100+ phrase mappings) |

### Infrastructure
| Service | Tier | Purpose |
|---------|------|---------|
| Vercel | Free (Hobby) | Frontend hosting + serverless API |
| Supabase | Free | PostgreSQL database + authentication |
| HuggingFace | Free | ML model inference API |

**Total hosting cost: $0/month** (all free tiers)

---

## 5. Core Features (What We Built)

### 5.1 Authentication & Authorization

- **School email validation** — only `@student.babcock.edu.ng`, `@babcock.edu.ng`, and other Nigerian university domains are accepted
- **JWT-based authentication** via Supabase Auth
- **Role-based access control** with three roles:
  - `student` — default for student emails
  - `pending_counselor` — auto-assigned for staff domain emails, awaits approval
  - `counselor` — approved by existing counselors
- **Counselor approval workflow** — first counselor bootstrapped via SQL, subsequent counselors approved through dashboard

### 5.2 Text Submission & Analysis Pipeline

When a student submits text, this happens in under 5 seconds:

```
Student types: "I no wan disappoint myself. That one dey fear me pass anything"
        |
        v
1. LANGUAGE DETECTION
   → Detected: Nigerian Pidgin (pattern matching: "no wan", "dey", "pass")
        |
        v
2. PIDGIN TRANSLATION
   → "I don't want disappoint myself. That one scares me more than anything"
   (100+ phrase substitutions, longest-match-first sorting)
        |
        v
3. PARALLEL ML ANALYSIS
   ├─ Cardiff RoBERTa → sentiment: NEGATIVE (confidence: 0.72)
   └─ GoEmotions → emotions: fear(0.79), nervousness(0.25), sadness(0.12)
        |
        v
4. SENTIMENT OVERRIDE LOGIC
   If Cardiff is uncertain (< 0.5) but GoEmotions detects
   strong negative emotion (>= 0.6), override to NEGATIVE
        |
        v
5. RISK ASSESSMENT
   → fear(0.79) + negative sentiment → MODERATE risk
   (High: grief/remorse >= 0.3 | Moderate: stress emotions >= 0.4 | Low: otherwise)
        |
        v
6. RESPONSE GENERATION
   → Empathetic message: "It sounds like you're carrying a heavy weight..."
   → Bible verse: Philippians 4:6-7 (matched to "negative_anxious")
   → Dominant emotion: "Worried" (human-friendly label for "fear")
   → Show counselor option: true (moderate risk)
        |
        v
7. DATABASE SAVE
   → Encrypted text stored (auto-deleted after 30 days)
   → Sentiment scores kept permanently for trend analysis
        |
        v
8. RETURN RESULT TO STUDENT
```

### 5.3 Student Dashboard (3 Tabs)

| Tab | Contents |
|-----|----------|
| **Dashboard** | Stats cards (total entries, current mood, days active) + welcome card with how-it-works guide |
| **My Journal** | Text submission form → analysis result card (gradient purple card with empathetic message, Bible verse, emotion label, optional counselor contact) |
| **My Trends** | Line chart showing sentiment trajectory over time (Recharts) |

### 5.4 Counselor Dashboard

- **4 overview stats** — total submissions (7 days), most common mood, avg risk level, pending approvals
- **Sentiment pie chart** — positive/neutral/negative distribution
- **Risk distribution chart** — low/moderate/high breakdown
- **Approval management** — approve or reject pending counselor requests
- **Privacy notice** — explains K-anonymity and data anonymization

### 5.5 Privacy & Security

| Feature | Implementation |
|---------|---------------|
| **Row-Level Security** | Students can only access their own data; counselors cannot see individual submissions |
| **K-Anonymity** | Aggregate data only shown when >= 5 students contribute to a time bucket |
| **Data Retention** | Raw text auto-deleted after 30 days; sentiment scores kept for trends |
| **Data Deletion** | Students can delete all their records (CASCADE deletes across tables) |
| **Anonymized Trends** | Counselor dashboard has NO student_id column — anonymization by design |
| **Service Role Separation** | Server uses service role key (bypasses RLS); frontend uses anon key (RLS enforced) |
| **Input Validation** | Zod schemas on both frontend and backend; text length limits (10-2000 chars) |

### 5.6 Nigerian Pidgin Support

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

### 5.7 Bible Verse Matching

Verses are categorized by emotional state and selected to match the student's sentiment:

| Sentiment Match | Example Verse |
|----------------|---------------|
| `positive` | "Rejoice in the Lord always" — Philippians 4:4 |
| `negative_anxious` | "Do not be anxious about anything..." — Philippians 4:6-7 |
| `negative_sad` | "The Lord is close to the brokenhearted..." — Psalm 34:18 |
| `neutral_encouragement` | "Trust in the Lord with all your heart..." — Proverbs 3:5-6 |
| `at_risk` | "Do not fear, for I am with you..." — Isaiah 41:10 |

---

## 6. Database Design

### Entity-Relationship Overview

```
auth.users (Supabase managed)
    |
    | 1:1
    v
students ──────────────────── counselor_approvals
    |                              (approval workflow)
    | 1:many
    v
submissions                   emotional_trends
    (individual entries)          (anonymized aggregates,
                                   NO student_id)

bible_verses
    (static reference table)

counselor_requests
    (student → counselor contact requests)
```

### Key Tables

| Table | Records | Purpose |
|-------|---------|---------|
| `students` | Per user | User profiles (extends Supabase auth) |
| `submissions` | Per entry | Individual text entries + ML analysis results |
| `emotional_trends` | Hourly buckets | Anonymized aggregates for counselor dashboard |
| `bible_verses` | ~100 | Categorized encouragement verses |
| `counselor_approvals` | Per request | Staff → counselor promotion workflow |
| `counselor_requests` | Per request | Student requests for counselor contact |

### PostgreSQL Functions

| Function | Schedule | Purpose |
|----------|----------|---------|
| `update_emotional_trends()` | Every 5 min (cron) | Aggregates submissions into anonymized hourly buckets |
| `delete_expired_text()` | Daily midnight (cron) | Replaces raw text after 30-day retention period |
| `decrement_trend_count()` | On account deletion | Adjusts aggregate counts when student deletes data |
| `update_timestamp()` | Trigger (before UPDATE) | Auto-manages `updated_at` columns |

---

## 7. API Endpoints

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `POST` | `/api/submissions/create` | Student JWT | Submit text, run ML analysis, return result |
| `GET` | `/api/submissions/history` | Student JWT | Fetch student's own submission history |
| `GET` | `/api/trends/aggregate` | Counselor JWT | Fetch anonymized aggregate trends |
| `GET` | `/api/counselors/pending` | Counselor JWT | List pending counselor approval requests |
| `POST` | `/api/counselors/approve` | Counselor JWT | Approve or reject a counselor request |
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
│   │   ├── create.ts           # POST - Submit & analyze text
│   │   └── history.ts          # GET  - Fetch submission history
│   ├── trends/
│   │   └── aggregate.ts        # GET  - Counselor aggregate data
│   ├── counselors/
│   │   ├── approve.ts          # POST - Approve/reject counselor
│   │   └── pending.ts          # GET  - List pending approvals
│   ├── lib/
│   │   ├── ml-service.ts       # HuggingFace integration + Pidgin translation
│   │   ├── language-detector.ts # English/Pidgin detection
│   │   ├── response-generator.ts # Empathetic message templates
│   │   └── verse-selector.ts   # Bible verse selection logic
│   └── dev-server.ts           # Express server for local development
│
├── frontend/                   # React application
│   └── src/
│       ├── pages/
│       │   ├── Dashboard.tsx       # Student dashboard (3-tab layout)
│       │   ├── CounselorDashboard.tsx # Counselor analytics view
│       │   ├── Login.tsx / Signup.tsx
│       │   └── AwaitingApproval.tsx
│       ├── components/
│       │   ├── SubmissionForm.tsx   # Journal entry input
│       │   ├── SubmissionResult.tsx # Analysis result display
│       │   ├── charts/             # Recharts visualizations
│       │   └── ui/                 # shadcn/ui components
│       ├── hooks/                  # React Query data fetching
│       └── lib/                    # Auth context, Supabase client
│
├── database/
│   ├── schema.sql              # Full PostgreSQL schema
│   └── migrations/             # Schema changes
│
├── types/
│   └── shared.ts               # Shared TypeScript types (frontend + backend)
│
└── scripts/
    └── seed-bible-verses.sql   # Bible verse seeding
```

---

## 9. Development Timeline

| Phase | Status | What Was Built |
|-------|--------|----------------|
| **Phase 1: Auth** | Complete | Login, signup, school email validation, role-based routing, counselor approval workflow |
| **Phase 2: Core Flow** | Complete | Submission form → ML analysis → empathetic response → Bible verse → DB storage |
| **Phase 3: Dashboards** | Complete | Student trend charts, counselor aggregate dashboard with pie/bar charts |
| **Phase 4: Polish** | In Progress | Bug fixes (RLS recursion, auth loading, confidence overflow, Pidgin accuracy), UI redesign (MindSpace branding, gradient cards, tab navigation) |

### Bugs Found & Fixed
1. **RLS Infinite Recursion** — counselor policy on `students` table queried itself
2. **Auth Stuck on Loading** — stale localStorage caused `getSession()` to hang
3. **navigate() Race Condition** — called during React render instead of useEffect
4. **Confidence > 1.0** — accumulated emotion scores exceeded DB constraint
5. **"Challenging" Label** — hardcoded label instead of dynamic dominant emotion
6. **HuggingFace Timeouts** — 10s timeout too short for cold starts (increased to 30s + retry)
7. **Pidgin Translation Gaps** — missing patterns for transitive verbs and comparatives

---

## 10. How to Run Locally

### Prerequisites
- Node.js 20+
- npm 10+
- Supabase project (free tier)
- HuggingFace account + API token (free)

### Setup
```bash
# 1. Install dependencies
npm install

# 2. Create .env in project root (copy from .env.example)
cp .env.example .env
# Fill in: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY,
#          VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, HUGGINGFACE_API_TOKEN

# 3. Run database schema in Supabase SQL Editor
#    - database/schema.sql
#    - database/migrations/003_counselor_approval.sql
#    - scripts/seed-bible-verses.sql

# 4. Start both frontend and API dev servers
npm run dev
# Frontend: http://localhost:5173
# API:      http://localhost:3001
```

---

## 11. Presentation Guide for Supervisor

### Suggested Demo Flow (10-15 minutes)

**1. Introduction (2 min)**
- Problem: Nigerian university students lack private, culturally-sensitive mental health support
- Solution: MindSpace — AI-powered emotional reflection with Pidgin support

**2. Live Demo — Student Flow (5 min)**
- Sign up with a school email
- Submit an English entry: "I've been feeling really stressed about my exams and I don't think I can handle it"
  - Show: sentiment (negative), emotion (worried/anxious), risk (moderate), empathetic message, Bible verse, counselor option
- Submit a Pidgin entry: "I no wan disappoint myself. That one dey fear me pass anything"
  - Show: Pidgin is understood and analyzed correctly
- Switch to "My Trends" tab — show the emotional timeline chart

**3. Live Demo — Counselor Flow (2 min)**
- Log in as counselor
- Show aggregate dashboard: pie chart, risk levels, stats
- Emphasize: NO student names visible, data is anonymized

**4. Technical Walkthrough (3 min)**
- Architecture diagram (Section 3 above)
- ML pipeline: Pidgin translation → Cardiff RoBERTa + GoEmotions (parallel) → risk mapping
- Privacy: RLS, K-anonymity, 30-day text retention, cascade deletion
- All hosted on free tiers (Vercel + Supabase + HuggingFace)

**5. Challenges & Solutions (2 min)**
- Nigerian Pidgin understanding (custom translation layer)
- HuggingFace cold start timeouts (30s timeout + retry)
- Privacy vs utility trade-off (K-anonymity threshold)
- RLS infinite recursion bug (SECURITY DEFINER function)

### Key Points to Emphasize

- **Cultural relevance** — Nigerian Pidgin support sets this apart from generic mental health tools
- **Privacy by design** — anonymization is structural (no student_id column in trends), not just policy
- **Real NLP** — two production ML models running in parallel, not keyword matching
- **Complete system** — auth, submission, analysis, response, visualization, admin dashboard
- **Faith-based support** — Bible verses matched to emotional states, culturally appropriate for the audience
- **Zero cost** — entire stack runs on free tiers

### Potential Supervisor Questions & Answers

**Q: Why not use ChatGPT/OpenAI for analysis?**
A: We use specialized models (Cardiff RoBERTa for sentiment, GoEmotions for emotions) rather than general-purpose LLMs. They're faster, free, and purpose-built for sentiment classification. We don't need text generation — we need classification.

**Q: How do you handle Nigerian Pidgin?**
A: A custom translation layer with 100+ phrase mappings converts Pidgin to English before passing to the ML models. This is combined with language detection that identifies Pidgin-specific markers.

**Q: What if a student is at high risk?**
A: The system shows a counselor contact option for moderate/high risk submissions. Aggregate risk data appears on the counselor dashboard. The system does NOT make clinical diagnoses — it provides empathetic reflection only.

**Q: How is student privacy protected?**
A: Multiple layers: Row-Level Security (students only see own data), K-anonymity (counselor data only shown when >= 5 students contribute), 30-day text retention (raw text auto-deleted), no student_id in trends table (anonymization by design), full data deletion on request.

**Q: Can this scale?**
A: The serverless architecture (Vercel) auto-scales. The database uses proper indexing and aggregation functions. The main bottleneck would be HuggingFace API rate limits on the free tier, which could be solved by upgrading or self-hosting models.

---

## 12. Future Work / Remaining Tasks

- [ ] Account/data deletion flow (student self-service)
- [ ] Production deployment to Vercel (handle cold-start timeout differences)
- [ ] Error handling improvements
- [ ] More comprehensive Pidgin dictionary
- [ ] Push notification for at-risk alerts (counselor)
- [ ] Mobile-responsive testing and polish
- [ ] Load testing with concurrent users
- [ ] Accessibility audit (WCAG compliance)
