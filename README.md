# MindSpace - Mental Health Sentiment Analysis Platform

A web-based NLP sentiment analysis platform designed for Nigerian university students to track their emotional wellbeing through text submissions in English and Nigerian Pidgin.

## Project Overview

**Core Purpose:** Provide empathetic, non-diagnostic emotional reflection and support for university students, with counselor oversight and admin management for institutional mental health awareness.

**Target Users:**
- University students (primary users)
- Registered counselors (monitoring + student support)
- Administrators (system management + user oversight)

### Key Features

**For Students:**
- Submit text entries about their day/feelings in English or Nigerian Pidgin
- Receive empathetic reflection (non-diagnostic) with dominant emotion label
- Get categorized into emotional states (positive, neutral, negative, at-risk)
- Receive AI-matched Bible verse encouragement (powered by Claude Haiku)
- View personal emotional trends over time (line charts)
- Optional counselor contact suggestion (for moderate/high risk)
- Complete data deletion capability

**For Counselors:**
- View anonymized aggregate reports of assigned students' mental health trends
- Receive automatic high-risk alerts (in-app + email notifications)
- Acknowledge and resolve at-risk student alerts
- Access rolling trend data (updates continuously)
- Approve pending counselor registrations

**For Administrators:**
- System-wide statistics dashboard (total students, submissions, risk counts)
- User management (search, filter, change roles)
- Assign counselors to student groups
- Monitor all system alerts

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development
- **TailwindCSS + shadcn/ui** for styling
- **TanStack React Query** for API state management
- **Recharts** for data visualization
- **React Hook Form + Zod** for form validation
- **Lucide React** for icons

### Backend
- **Node.js** with TypeScript
- **Vercel Serverless Functions** for API endpoints (production)
- **Express + tsx** for local dev server
- **Supabase** for PostgreSQL database, authentication, and RLS

### ML/NLP
- **HuggingFace Inference API** (free tier)
  - **Cardiff RoBERTa** (`cardiffnlp/twitter-roberta-base-sentiment-latest`) - Sentiment classification
  - **GoEmotions** (`SamLowe/roberta-base-go_emotions`) - 28-category emotion detection + risk assessment
  - **Custom Pidgin Translation Layer** - 100+ phrase mappings for Nigerian Pidgin
- **Anthropic Claude Haiku** (`claude-haiku-4-5-20251001`) - AI-powered Bible verse matching

### Infrastructure
- **Vercel** for frontend and serverless functions
- **Supabase Cloud** for database + auth
- **Resend** for email notifications (alert emails to counselors)

**Total hosting cost: $0/month** (all free tiers)

## Project Structure

```
final_year_project/
├── api/                              # Backend (Vercel serverless functions)
│   ├── submissions/
│   │   ├── create.ts                 # POST - Submit text, ML analysis, alert creation
│   │   ├── history.ts                # GET  - Fetch submission history
│   │   └── delete.ts                 # DELETE - Delete a submission
│   ├── trends/
│   │   └── aggregate.ts              # GET  - Counselor aggregate data
│   ├── counselors/
│   │   ├── pending.ts                # GET  - List pending counselor approvals
│   │   └── approve.ts                # POST - Approve/reject counselor
│   ├── counselor/
│   │   ├── my-students.ts            # GET  - Assigned students aggregate trends
│   │   └── alerts.ts                 # GET/PUT - View and manage at-risk alerts
│   ├── admin/
│   │   ├── users.ts                  # GET  - List all users
│   │   ├── role.ts                   # PUT  - Change user role
│   │   ├── stats.ts                  # GET  - System-wide statistics
│   │   ├── assignments.ts            # GET/POST/DELETE - Counselor-student assignments
│   │   └── alerts.ts                 # GET  - View all system alerts
│   ├── auth/
│   │   ├── signup.ts                 # POST - Student/counselor registration
│   │   └── login.ts                  # POST - Authentication
│   ├── lib/
│   │   ├── ml-service.ts             # HuggingFace integration + sentiment/emotion analysis
│   │   ├── language-detector.ts      # English/Pidgin language detection
│   │   ├── response-generator.ts     # Empathetic message templates
│   │   ├── verse-selector.ts         # AI-powered Bible verse matching (Claude Haiku)
│   │   ├── gibberish-detector.ts     # Rule-based input quality validation
│   │   ├── alert-service.ts          # At-risk alert creation (fire-and-forget)
│   │   └── email-service.ts          # Resend email notifications
│   ├── dev-server.ts                 # Express server for local development
│   └── package.json                  # Backend dependencies (@anthropic-ai/sdk, resend)
│
├── frontend/                          # React application
│   └── src/
│       ├── pages/
│       │   ├── Dashboard.tsx          # Student dashboard (3-tab layout)
│       │   ├── CounselorDashboard.tsx # Counselor analytics + alerts + my students
│       │   ├── AdminDashboard.tsx     # Admin dashboard (Overview/Users/Assignments/Alerts)
│       │   ├── Login.tsx
│       │   ├── Signup.tsx
│       │   └── AwaitingApproval.tsx   # Pending counselor approval page
│       ├── components/
│       │   ├── SubmissionForm.tsx     # Journal entry input
│       │   ├── SubmissionResult.tsx   # Analysis result display
│       │   ├── ProtectedRoute.tsx     # Auth guard
│       │   ├── RoleBasedRoute.tsx     # Role-based routing (student/counselor/admin)
│       │   └── charts/               # Recharts visualizations
│       ├── hooks/                     # React Query data fetching hooks
│       │   ├── useSubmissionHistory.ts
│       │   ├── useAggregateTrends.ts
│       │   ├── usePendingApprovals.ts
│       │   ├── useAdminData.ts        # Admin users/stats/role hooks
│       │   ├── useAssignments.ts      # Assignment CRUD hook
│       │   ├── useMyStudentsTrends.ts # Counselor's assigned students
│       │   ├── useAlerts.ts           # Alert polling hooks (30s interval)
│       │   └── useMyCounselor.ts
│       └── lib/
│           ├── AuthContext.tsx         # Auth state management
│           ├── supabase.ts            # Supabase client
│           └── utils.ts
│
├── database/
│   ├── schema.sql                     # Full PostgreSQL schema with RLS policies
│   └── migrations/
│       ├── 003_counselor_approval.sql
│       ├── 004_admin_role.sql         # Admin role + is_admin() + RLS policies
│       ├── 005_counselor_student_assignments.sql  # Assignments table
│       ├── 006_at_risk_alerts.sql     # At-risk alerts table
│       ├── 007_add_phone_number.sql
│       └── 008_add_full_name.sql
│
├── types/
│   └── shared.ts                      # Shared TypeScript types (frontend + backend)
│
├── scripts/
│   └── seed-bible-verses-expanded.sql # 100+ Bible verses across 7 categories
│
├── .env.example                       # Environment variables template
├── package.json                       # Root package.json
├── tsconfig.json                      # TypeScript configuration
├── vite.config.ts                     # Vite bundler configuration
├── tailwind.config.js                 # Tailwind CSS configuration
└── vercel.json                        # Vercel deployment configuration
```

## Getting Started

### Prerequisites

- **Node.js** >= 20.0.0
- **npm** >= 10.0.0
- **Supabase account** (free tier)
- **Vercel account** (free tier)
- **HuggingFace account** (free tier)
- **Anthropic account** (optional, for AI verse matching)
- **Resend account** (optional, for email alerts)

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd final_year_project
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

#### Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be provisioned (~2 minutes)
3. Get your project credentials:
   - Go to **Settings** → **API**
   - Copy **Project URL** (SUPABASE_URL)
   - Copy **anon public** key (SUPABASE_ANON_KEY)
   - Copy **service_role** key (SUPABASE_SERVICE_ROLE_KEY) - **Keep this secret!**

#### Run Database Migrations

Run these SQL files in order in the **Supabase SQL Editor**:

1. `database/schema.sql` — Core tables, RLS policies, functions
2. `database/migrations/003_counselor_approval.sql` — Counselor approval workflow
3. `database/migrations/004_admin_role.sql` — Admin role + `is_admin()` function
4. `database/migrations/005_counselor_student_assignments.sql` — Counselor-student assignments
5. `database/migrations/006_at_risk_alerts.sql` — At-risk alerts table
6. `database/migrations/007_add_phone_number.sql` — Phone number field
7. `database/migrations/008_add_full_name.sql` — Full name field
8. `scripts/seed-bible-verses-expanded.sql` — 100+ Bible verses across 7 categories

#### Bootstrap Admin Account

After a user signs up, promote them to admin:

```sql
UPDATE public.students SET role = 'admin' WHERE email = 'admin@babcock.edu.ng';
```

### 4. Set Up HuggingFace

1. Go to [huggingface.co](https://huggingface.co) and create an account
2. Go to **Settings** → **Access Tokens**
3. Create a new token with **read** access
4. Copy the token (it starts with `hf_...`)

### 5. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and fill in your credentials:

```env
# Supabase Configuration (Frontend - public)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Supabase Configuration (Backend - serverless functions)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# HuggingFace API Configuration
HUGGINGFACE_API_TOKEN=hf_your_token_here

# Anthropic API (optional - for AI Bible verse matching)
ANTHROPIC_API_KEY=sk-ant-your-key-here

# Resend Email (optional - for counselor alert emails)
RESEND_API_KEY=re_your_key_here

# Application Configuration
NODE_ENV=development
```

### 6. Run the Development Server

```bash
npm run dev
```

This will start:
- **Frontend**: http://localhost:5173
- **API**: http://localhost:3001

### 7. Test the Setup

1. Open http://localhost:5173 (use **Incognito mode** to avoid browser extension interference)
2. Sign up with a school email (e.g., `test@student.babcock.edu.ng`)
3. Check your email for the verification link
4. After verifying, log in and submit a test text
5. Try submitting in Nigerian Pidgin: "I dey feel somehow today, body no dey sweet me"

## ML/NLP Pipeline

When a student submits text, this pipeline runs in under 5 seconds:

```
Student submits text
    │
    ├─ 1. INPUT VALIDATION (Gibberish Detection)
    │     Rule-based checks: min 3 words, character entropy,
    │     repetition detection, keyboard smash, word whitelist
    │     (Pidgin markers count as valid words)
    │
    ├─ 2. LANGUAGE DETECTION
    │     Pattern matching for Pidgin markers ("dey", "no wan", etc.)
    │
    ├─ 3. PIDGIN TRANSLATION (if detected)
    │     100+ phrase substitutions, longest-match-first sorting
    │
    ├─ 4. PARALLEL ML ANALYSIS
    │     ├─ Cardiff RoBERTa → sentiment: positive/neutral/negative
    │     └─ GoEmotions → 28 emotions + risk assessment
    │
    ├─ 5. SENTIMENT OVERRIDE LOGIC
    │     If Cardiff uncertain but GoEmotions detects strong
    │     negative emotion, override to NEGATIVE
    │
    ├─ 6. RISK ASSESSMENT
    │     High: grief/remorse ≥ 0.3 | Moderate: stress emotions ≥ 0.4 | Low: otherwise
    │
    ├─ 7. RESPONSE GENERATION
    │     Empathetic message + AI-matched Bible verse (Claude Haiku)
    │     + dominant emotion label + counselor suggestion (if needed)
    │
    ├─ 8. DATABASE SAVE + ALERT CREATION
    │     Save to DB. If HIGH risk → create at-risk alert
    │     for assigned counselor (fire-and-forget)
    │
    └─ 9. RETURN RESULT TO STUDENT
```

## Database Schema Overview

### Key Tables

| Table | Purpose |
|-------|---------|
| `students` | User profiles (extends Supabase auth.users) with roles: student, pending_counselor, counselor, admin |
| `submissions` | Individual text entries with ML analysis results (sentiment, emotion, risk, confidence) |
| `emotional_trends` | Anonymized hourly aggregates for counselor dashboard (NO student_id column) |
| `bible_verses` | 100+ categorized encouragement verses across 7 sentiment categories |
| `counselor_approvals` | Staff → counselor promotion workflow |
| `counselor_student_assignments` | Admin-managed counselor-to-student group assignments |
| `at_risk_alerts` | Automatic alerts for HIGH risk submissions (pending → acknowledged → resolved) |

### Privacy Features

1. **Row Level Security (RLS)**: Students can only access their own data
2. **K-Anonymity**: Aggregate data only shown when ≥ 3 students contribute
3. **Cascade Deletion**: Deleting a student account removes all submissions and alerts
4. **Text Expiration**: Raw text auto-deleted after 30 days
5. **Anonymized Trends**: `emotional_trends` table has NO student_id — anonymization by design
6. **Assignment-Based Access**: Counselors only see aggregates for their assigned students
7. **Privacy-Safe Emails**: Alert emails contain NO student names or submission content

## API Endpoints

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `POST` | `/api/auth/signup` | None | Register with school email |
| `POST` | `/api/auth/login` | None | Login with email/password |
| `POST` | `/api/submissions/create` | Student JWT | Submit text for ML analysis |
| `GET` | `/api/submissions/history` | Student JWT | Fetch submission history |
| `DELETE` | `/api/submissions/delete` | Student JWT | Delete a submission |
| `GET` | `/api/trends/aggregate` | Counselor JWT | Anonymized aggregate trends |
| `GET` | `/api/counselors/pending` | Counselor JWT | List pending approvals |
| `POST` | `/api/counselors/approve` | Counselor JWT | Approve/reject counselor |
| `GET` | `/api/counselor/my-students` | Counselor JWT | Assigned students aggregate trends |
| `GET` | `/api/counselor/alerts` | Counselor JWT | View pending/recent alerts |
| `PUT` | `/api/counselor/alerts/:id/acknowledge` | Counselor JWT | Acknowledge an alert |
| `PUT` | `/api/counselor/alerts/:id/resolve` | Counselor JWT | Resolve an alert |
| `GET` | `/api/admin/users` | Admin JWT | List all users |
| `PUT` | `/api/admin/users/role` | Admin JWT | Change a user's role |
| `GET` | `/api/admin/stats` | Admin JWT | System-wide statistics |
| `GET` | `/api/admin/assignments` | Admin JWT | List all assignments |
| `POST` | `/api/admin/assignments` | Admin JWT | Create assignment |
| `DELETE` | `/api/admin/assignments/:id` | Admin JWT | Remove assignment |
| `GET` | `/api/admin/alerts` | Admin JWT | View all system alerts |

## Security

- Never commit `.env` file to Git
- RLS policies enforce data access at the database level
- School email domain validation on signup
- Input validation with Zod schemas (frontend + backend)
- Gibberish detection rejects nonsensical input before ML analysis
- Service role key used only server-side; frontend uses anon key (RLS enforced)
- `SECURITY DEFINER` functions for role checks (`is_counselor()`, `is_admin()`)

## Deployment

### Deploy to Vercel

1. Install Vercel CLI: `npm install -g vercel`
2. Link project: `vercel link`
3. Add environment variables in Vercel dashboard (Settings → Environment Variables)
4. Deploy: `vercel --prod`

### Set Up Supabase Cron Jobs

After deployment, enable pg_cron in Supabase and run:

```sql
-- Update emotional trends every 5 minutes
SELECT cron.schedule('update-emotional-trends', '*/5 * * * *', 'SELECT public.update_emotional_trends();');

-- Delete expired text daily at midnight
SELECT cron.schedule('delete-expired-text', '0 0 * * *', 'SELECT public.delete_expired_text();');
```

## Testing Checklist

### Student Flow
- [ ] Sign up with school email
- [ ] Verify email and log in
- [ ] Submit gibberish text → rejected with clear message
- [ ] Submit text in English → sentiment + emotion + Bible verse
- [ ] Submit text in Nigerian Pidgin → Pidgin detected and analyzed correctly
- [ ] View emotional trend chart on "My Trends" tab
- [ ] See counselor contact suggestion for moderate/high risk results

### Counselor Flow
- [ ] Log in as counselor → counselor dashboard
- [ ] View aggregate trends (pie chart, risk distribution)
- [ ] View "My Students" aggregate trends (assigned students only)
- [ ] Receive high-risk alert → acknowledge → resolve
- [ ] Approve/reject pending counselor registrations

### Admin Flow
- [ ] Log in as admin → admin dashboard
- [ ] View system-wide statistics (Overview tab)
- [ ] Search and filter users (Users tab)
- [ ] Change a user's role
- [ ] Assign counselor to students (Assignments tab)
- [ ] View all system alerts (Alerts tab)

## Troubleshooting

**Issue: App stuck on loading**
- Use **Incognito mode** (Ctrl+Shift+N) — browser extensions can interfere with localhost requests

**Issue: HuggingFace slow on first request (~30-60s)**
- This is expected — free tier models go idle and need to "wake up". Subsequent requests are faster.

**Issue: "Invalid email domain" on signup**
- Ensure the email domain is in `ALLOWED_SCHOOL_DOMAINS` in `types/shared.ts`

**Issue: Bible verses not AI-matched (random selection)**
- Check that `ANTHROPIC_API_KEY` is set in `.env`. Without it, the system falls back to random selection within the correct category.

**Issue: No email alerts for counselors**
- Check that `RESEND_API_KEY` is set in `.env`. In-app alerts still work without it.

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [HuggingFace Inference API](https://huggingface.co/docs/api-inference)
- [Cardiff RoBERTa Model](https://huggingface.co/cardiffnlp/twitter-roberta-base-sentiment-latest)
- [GoEmotions Model](https://huggingface.co/SamLowe/roberta-base-go_emotions)
- [Anthropic API Documentation](https://docs.anthropic.com)
- [Resend Documentation](https://resend.com/docs)
- [TanStack React Query](https://tanstack.com/query/latest)
- [Tailwind CSS](https://tailwindcss.com/docs)

## License

MIT

---

**Built for Nigerian university students' mental wellbeing**
