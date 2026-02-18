# Mental Health Sentiment Analysis Platform

A web-based NLP sentiment analysis platform designed for Nigerian university students to track their emotional wellbeing through text submissions in English and Nigerian Pidgin.

## 🎯 Project Overview

**Core Purpose:** Provide empathetic, non-diagnostic emotional reflection and support for university students, with optional counselor oversight for institutional mental health awareness.

**Target Users:**
- University students (primary users)
- Registered counselors (administrative/monitoring access)

### Key Features

**For Students:**
- Submit text entries about their day/feelings in English or Nigerian Pidgin
- Receive empathetic reflection (non-diagnostic)
- Get categorized into emotional states (positive, neutral, negative, at-risk)
- Receive Bible verse encouragement
- View personal emotional trends over time
- Optional counselor contact request
- Complete data deletion capability

**For Counselors:**
- View anonymized aggregate reports of student mental health trends
- Access rolling trend data (updates continuously)
- Gain institutional awareness without accessing individual student identities

## 🏗️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development
- **TailwindCSS** for styling
- **React Query** for API state management
- **Recharts** for data visualization
- **React Hook Form + Zod** for form validation

### Backend
- **Node.js** with TypeScript
- **Vercel Serverless Functions** for API endpoints
- **Supabase** for PostgreSQL database, authentication, and real-time features

### ML/NLP
- **HuggingFace Inference API**
  - **AfriBERTa** (`Davlan/naija-twitter-sentiment-afriberta-large`) - Nigerian Pidgin sentiment
  - **MentalBERT** (`mental/mental-bert-base-uncased`) - Mental health risk assessment

### Deployment
- **Vercel** for frontend and serverless functions
- **Supabase Cloud** for database hosting

## 📁 Project Structure

```
mental-health-platform/
├── api/                           # Serverless functions (backend)
│   ├── auth/
│   │   ├── signup.ts             # Student registration
│   │   └── login.ts              # Authentication
│   ├── submissions/
│   │   ├── create.ts             # Core ML analysis endpoint
│   │   └── history.ts            # Get student's history
│   ├── trends/
│   │   └── aggregate.ts          # Counselor dashboard data
│   └── user/
│       └── delete-account.ts     # Complete account deletion
├── database/
│   └── schema.sql                # PostgreSQL schema with RLS policies
├── frontend/                      # React application
│   ├── src/
│   │   ├── components/           # React components
│   │   ├── pages/                # Page components
│   │   └── lib/                  # Utility functions
│   └── package.json
├── scripts/
│   └── seed-bible-verses.ts      # Seed Bible verse database
├── types/
│   └── shared.ts                 # Shared TypeScript types
├── .env.example                   # Environment variables template
├── package.json                   # Root package.json
├── tsconfig.json                  # TypeScript configuration
├── vite.config.ts                 # Vite bundler configuration
├── tailwind.config.js             # Tailwind CSS configuration
└── vercel.json                    # Vercel deployment configuration
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 20.0.0
- **npm** >= 10.0.0
- **Supabase account** (free tier)
- **Vercel account** (free tier)
- **HuggingFace account** (free tier)

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd mental-health-platform
```

### 2. Install Dependencies

```bash
npm run install:all
```

This will install dependencies for the root, frontend, and API workspaces.

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

1. Go to **SQL Editor** in Supabase dashboard
2. Open `database/schema.sql` from this project
3. Copy and paste the entire contents into the SQL Editor
4. Click **Run** to execute the schema

This will create all tables, RLS policies, functions, and seed initial Bible verses.

#### Set Up Supabase Auth Email Templates

1. Go to **Authentication** → **Email Templates** in Supabase
2. Customize the **Confirm Signup** template:

```html
<h2>Welcome to Mental Health Support Platform</h2>
<p>Click the link below to verify your school email:</p>
<a href="{{ .ConfirmationURL }}">Verify Email</a>
<p>This link expires in 24 hours.</p>
```

### 4. Set Up HuggingFace

1. Go to [huggingface.co](https://huggingface.co) and create an account
2. Go to **Settings** → **Access Tokens**
3. Create a new token with **read** access
4. Copy the token (it starts with `hf_...`)

### 5. Configure Environment Variables

Create a `.env` file in the root directory:

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

# Application Configuration
NODE_ENV=development
APP_URL=http://localhost:3000
```

### 6. Run the Development Server

```bash
npm run dev
```

This will start:
- **Frontend**: http://localhost:3000
- **API**: http://localhost:3000/api/*

The Vite dev server will proxy API requests to your serverless functions.

### 7. Test the Setup

1. Open http://localhost:3000
2. Try signing up with a test school email (e.g., `test@unilag.edu.ng`)
3. Check your email for the verification link
4. After verifying, log in and submit a test text

## 📋 Development Workflow

### Running Scripts

```bash
# Start development server (frontend + API)
npm run dev

# Build for production
npm run build

# Type checking
npm run type-check

# Lint code
npm run lint

# Clean all node_modules
npm run clean
```

### Database Changes

When you modify the database schema:

1. Update `database/schema.sql`
2. Run the updated SQL in Supabase SQL Editor
3. Update TypeScript types in `types/shared.ts` if needed

### Adding New API Endpoints

1. Create a new file in `api/` directory (e.g., `api/example/endpoint.ts`)
2. Export a default function that handles the request:

```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Handle request
  res.status(200).json({ success: true, data: {} });
}
```

3. The endpoint will automatically be available at `/api/example/endpoint`

### Testing HuggingFace Models

Test the AfriBERTa model with Nigerian Pidgin:

```bash
curl https://api-inference.huggingface.co/models/Davlan/naija-twitter-sentiment-afriberta-large \
  -H "Authorization: Bearer YOUR_HF_TOKEN" \
  -d '{"inputs": "I dey feel somehow today, body no dey sweet me"}'
```

Expected response:
```json
[
  {"label": "negative", "score": 0.87}
]
```

## 🚢 Deployment

### Deploy to Vercel

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Link your project:
```bash
vercel link
```

3. Add environment variables in Vercel dashboard:
   - Go to **Settings** → **Environment Variables**
   - Add all variables from `.env` (except `VITE_*` ones)

4. Deploy:
```bash
npm run vercel-deploy
```

Or connect your GitHub repository to Vercel for automatic deployments.

### Set Up Supabase Cron Jobs

After deployment, set up background jobs in Supabase:

1. Go to **Database** → **Extensions** in Supabase
2. Enable **pg_cron** extension
3. Go to **SQL Editor** and run:

```sql
-- Update emotional trends every 5 minutes
SELECT cron.schedule(
  'update-emotional-trends',
  '*/5 * * * *',
  'SELECT public.update_emotional_trends();'
);

-- Delete expired text daily at midnight
SELECT cron.schedule(
  'delete-expired-text',
  '0 0 * * *',
  'SELECT public.delete_expired_text();'
);
```

## 🧪 Testing

### Manual Testing Checklist

#### Student Flow
- [ ] Sign up with school email
- [ ] Receive verification email
- [ ] Verify email and log in
- [ ] Submit text in English
- [ ] Submit text in Nigerian Pidgin
- [ ] Receive empathetic response + Bible verse
- [ ] View emotional trend chart
- [ ] Request counselor contact
- [ ] Delete account

#### Counselor Flow
- [ ] Log in as counselor
- [ ] View aggregated trends
- [ ] Verify no individual student names visible
- [ ] Check real-time updates work

### Performance Testing

Measure response time for text submission:

```bash
curl -X POST http://localhost:3000/api/submissions/create \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text": "I feel stressed about exams"}' \
  -w "\nTotal time: %{time_total}s\n"
```

**Target:** < 5 seconds (ideally < 2 seconds)

## 📊 Database Schema Overview

### Key Tables

- **students**: User accounts (extends Supabase auth.users)
- **submissions**: Student text entries with ML analysis results
- **emotional_trends**: Anonymized aggregates (NO student_id column)
- **counselor_requests**: Student requests for counselor contact
- **bible_verses**: Static verse database

### Privacy Features

1. **Row Level Security (RLS)**: Students can only access their own data
2. **K-Anonymity**: Counselor trends only show when ≥5 students contributed
3. **Cascade Deletion**: Deleting a student account removes all submissions
4. **Text Expiration**: Encrypted text auto-deleted after 30 days

## 🔒 Security Best Practices

- ✅ Never commit `.env` file to Git
- ✅ Use RLS policies for all database access
- ✅ Validate school email domains on signup
- ✅ Sanitize all user inputs
- ✅ Use HTTPS only in production
- ✅ Rotate service role keys periodically
- ✅ Set up rate limiting on API endpoints

## 📖 API Documentation

### Authentication

#### POST /api/auth/signup
Sign up a new student with school email.

**Request:**
```json
{
  "email": "student@unilag.edu.ng",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Verification email sent. Please check your inbox.",
    "user_id": "uuid"
  }
}
```

#### POST /api/auth/login
Log in with email and password.

**Request:**
```json
{
  "email": "student@unilag.edu.ng",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token",
    "user": {
      "id": "uuid",
      "email": "student@unilag.edu.ng",
      "role": "student"
    }
  }
}
```

### Submissions

#### POST /api/submissions/create
Submit text for sentiment analysis.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request:**
```json
{
  "text": "I dey feel somehow today, body no dey sweet me"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "sentiment": "negative",
    "risk_level": "moderate",
    "confidence": 0.87,
    "empathetic_message": "It sounds like you're having a tough day...",
    "bible_verse": {
      "reference": "Psalm 34:18",
      "text": "The Lord is close to the brokenhearted..."
    },
    "show_counselor_option": true,
    "created_at": "2026-02-09T10:30:00Z"
  }
}
```

#### GET /api/submissions/history
Get student's submission history.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `limit` (optional, default: 20)
- `offset` (optional, default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "submissions": [
      {
        "id": "uuid",
        "sentiment": "negative",
        "risk_level": "moderate",
        "confidence": 0.87,
        "created_at": "2026-02-09T10:30:00Z"
      }
    ],
    "total_count": 5,
    "has_more": false
  }
}
```

### Trends (Counselor Only)

#### GET /api/trends/aggregate
Get anonymized aggregate trends.

**Headers:**
```
Authorization: Bearer <counselor_jwt_token>
```

**Query Parameters:**
- `start_date` (optional, YYYY-MM-DD)
- `end_date` (optional, YYYY-MM-DD)

**Response:**
```json
{
  "success": true,
  "data": {
    "daily_summary": [
      {
        "date": "2026-02-09",
        "positive_percentage": 45,
        "neutral_percentage": 30,
        "negative_percentage": 25,
        "total_submissions": 120
      }
    ],
    "overall_stats": {
      "total_students_contributing": 50,
      "most_common_sentiment": "positive",
      "average_risk_level": 1.3
    }
  }
}
```

## 🛠️ Troubleshooting

### Common Issues

**Issue: "Invalid email domain" error on signup**
- **Solution**: Ensure the email domain is in `ALLOWED_SCHOOL_DOMAINS` in `types/shared.ts`

**Issue: ML service timeout**
- **Solution**: Check HuggingFace API token is valid and not rate-limited

**Issue: Supabase RLS policy blocking access**
- **Solution**: Verify JWT token is valid and user is authenticated

**Issue: Vercel deployment fails**
- **Solution**: Check environment variables are set in Vercel dashboard

## 📚 Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [HuggingFace Inference API](https://huggingface.co/docs/api-inference)
- [AfriBERTa Model Card](https://huggingface.co/Davlan/naija-twitter-sentiment-afriberta-large)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 🤝 Contributing

This is an academic project. For major changes, please discuss with the team first.

## 📄 License

MIT

## 👥 Team

- Developer 1 (Primary): Full-stack + ML integration
- Developer 2: Frontend design + data visualization
- Developer 3: Testing + documentation + Bible verse database

## 📞 Support

For issues or questions, please create an issue in the GitHub repository.

---

**Built with ❤️ for Nigerian university students' mental wellbeing**
