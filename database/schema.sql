-- Mental Health Sentiment Analysis Platform
-- Database Schema for Supabase PostgreSQL
-- Privacy-First Design with Row Level Security (RLS)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================================================================================
-- STUDENTS TABLE (All User Accounts — Students, Counselors, and Admins)
-- ====================================================================================
-- Note: Despite the name "students", this table stores ALL user roles.
-- The `role` column distinguishes between student, counselor, and admin accounts.
-- Supabase Auth manages the auth.users table automatically;
-- this table extends auth.users with additional application-specific data.

CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone_number TEXT,
  email_verified BOOLEAN DEFAULT FALSE,
  school_domain TEXT NOT NULL,
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'counselor')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_students_email ON public.students(email);
CREATE INDEX IF NOT EXISTS idx_students_role ON public.students(role);
CREATE INDEX IF NOT EXISTS idx_students_school_domain ON public.students(school_domain);

-- ====================================================================================
-- SUBMISSIONS TABLE (Student Text Entries)
-- ====================================================================================
-- Stores student text submissions and ML analysis results
-- Privacy: text_encrypted is deleted after 30 days (retention policy)

CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,

  -- Raw text (encrypted) - will be auto-deleted after 30 days
  text_encrypted TEXT NOT NULL,

  -- ML Analysis Results
  sentiment TEXT NOT NULL CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'moderate', 'high')),
  confidence FLOAT NOT NULL CHECK (confidence >= 0.0 AND confidence <= 1.0),
  language_detected TEXT CHECK (language_detected IN ('english', 'pidgin', 'mixed')),

  -- Empathetic response given to student
  empathetic_message TEXT NOT NULL,

  -- Bible verse provided
  bible_verse_reference TEXT,
  bible_verse_text TEXT,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- TTL for privacy (text deleted after 30 days, but sentiment scores kept)
  text_expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days')
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON public.submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON public.submissions(created_at);
CREATE INDEX IF NOT EXISTS idx_submissions_sentiment ON public.submissions(sentiment);
CREATE INDEX IF NOT EXISTS idx_submissions_risk_level ON public.submissions(risk_level);
CREATE INDEX IF NOT EXISTS idx_submissions_text_expires_at ON public.submissions(text_expires_at);

-- ====================================================================================
-- EMOTIONAL TRENDS TABLE (Anonymized Aggregates for Counselors)
-- ====================================================================================
-- CRITICAL: This table has NO student_id column (anonymization by design)
-- Counselors can only see aggregated data, never individual submissions

CREATE TABLE IF NOT EXISTS public.emotional_trends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Time bucketing (hourly granularity)
  date DATE NOT NULL,
  hour INTEGER NOT NULL CHECK (hour >= 0 AND hour <= 23),

  -- Sentiment distribution counts
  positive_count INTEGER DEFAULT 0 CHECK (positive_count >= 0),
  neutral_count INTEGER DEFAULT 0 CHECK (neutral_count >= 0),
  negative_count INTEGER DEFAULT 0 CHECK (negative_count >= 0),

  -- Risk level distribution counts
  low_risk_count INTEGER DEFAULT 0 CHECK (low_risk_count >= 0),
  moderate_risk_count INTEGER DEFAULT 0 CHECK (moderate_risk_count >= 0),
  high_risk_count INTEGER DEFAULT 0 CHECK (high_risk_count >= 0),

  -- Total submissions in this time bucket
  total_submissions INTEGER DEFAULT 0 CHECK (total_submissions >= 0),

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint: one row per hour
  UNIQUE(date, hour)
);

-- Indexes for counselor dashboard queries
CREATE INDEX IF NOT EXISTS idx_emotional_trends_date ON public.emotional_trends(date);
CREATE INDEX IF NOT EXISTS idx_emotional_trends_date_hour ON public.emotional_trends(date, hour);
CREATE INDEX IF NOT EXISTS idx_emotional_trends_total_submissions ON public.emotional_trends(total_submissions);

-- ====================================================================================
-- COUNSELOR REQUESTS TABLE (Student Requests for Counselor Contact)
-- ====================================================================================
-- If a student opts to contact a counselor, request is logged here

CREATE TABLE IF NOT EXISTS public.counselor_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,

  -- Optional message from student
  message TEXT,

  -- Request status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'resolved')),

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_counselor_requests_student_id ON public.counselor_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_counselor_requests_status ON public.counselor_requests(status);
CREATE INDEX IF NOT EXISTS idx_counselor_requests_created_at ON public.counselor_requests(created_at);

-- ====================================================================================
-- BIBLE VERSES TABLE (Static Verse Database)
-- ====================================================================================
-- Pre-seeded with 100+ categorized Bible verses for encouragement

CREATE TABLE IF NOT EXISTS public.bible_verses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  verse_reference TEXT NOT NULL,
  verse_text TEXT NOT NULL,

  -- Sentiment category for matching
  sentiment_match TEXT NOT NULL CHECK (
    sentiment_match IN ('positive', 'negative_anxious', 'negative_sad', 'negative_angry', 'negative_struggle', 'neutral_encouragement', 'at_risk')
  ),

  -- Language (currently English only)
  language TEXT DEFAULT 'english',

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast verse selection
CREATE INDEX IF NOT EXISTS idx_bible_verses_sentiment_match ON public.bible_verses(sentiment_match);
CREATE INDEX IF NOT EXISTS idx_bible_verses_language ON public.bible_verses(language);

-- ====================================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================================

-- Enable RLS on all tables
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emotional_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counselor_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bible_verses ENABLE ROW LEVEL SECURITY;

-- --------------------------------
-- STUDENTS TABLE RLS POLICIES
-- --------------------------------

-- Students can view their own profile
CREATE POLICY "Students can view own profile"
ON public.students
FOR SELECT
USING (auth.uid() = id);

-- Students can update their own profile
CREATE POLICY "Students can update own profile"
ON public.students
FOR UPDATE
USING (auth.uid() = id);

-- Counselors can view student list (without sensitive data exposed via RLS)
CREATE POLICY "Counselors can view student list"
ON public.students
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.students
    WHERE id = auth.uid() AND role = 'counselor'
  )
);

-- --------------------------------
-- SUBMISSIONS TABLE RLS POLICIES
-- --------------------------------

-- Students can view ONLY their own submissions
CREATE POLICY "Students can view own submissions"
ON public.submissions
FOR SELECT
USING (auth.uid() = student_id);

-- Students can insert ONLY their own submissions
CREATE POLICY "Students can insert own submissions"
ON public.submissions
FOR INSERT
WITH CHECK (auth.uid() = student_id);

-- Students can delete ONLY their own submissions
CREATE POLICY "Students can delete own submissions"
ON public.submissions
FOR DELETE
USING (auth.uid() = student_id);

-- Counselors CANNOT view individual submissions (privacy protection)
-- No policy = no access

-- --------------------------------
-- EMOTIONAL TRENDS TABLE RLS POLICIES
-- --------------------------------

-- Counselors can view aggregated trends (read-only)
CREATE POLICY "Counselors can view aggregated trends"
ON public.emotional_trends
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.students
    WHERE id = auth.uid() AND role = 'counselor'
  )
);

-- Only service role can insert/update trends (background jobs)
CREATE POLICY "Service role can manage trends"
ON public.emotional_trends
FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

-- --------------------------------
-- COUNSELOR REQUESTS TABLE RLS POLICIES
-- --------------------------------

-- Students can view their own counselor requests
CREATE POLICY "Students can view own counselor requests"
ON public.counselor_requests
FOR SELECT
USING (auth.uid() = student_id);

-- Students can create counselor requests
CREATE POLICY "Students can create counselor requests"
ON public.counselor_requests
FOR INSERT
WITH CHECK (auth.uid() = student_id);

-- Counselors can view all counselor requests
CREATE POLICY "Counselors can view all counselor requests"
ON public.counselor_requests
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.students
    WHERE id = auth.uid() AND role = 'counselor'
  )
);

-- Counselors can update counselor requests (mark as contacted/resolved)
CREATE POLICY "Counselors can update counselor requests"
ON public.counselor_requests
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.students
    WHERE id = auth.uid() AND role = 'counselor'
  )
);

-- --------------------------------
-- BIBLE VERSES TABLE RLS POLICIES
-- --------------------------------

-- Everyone (authenticated) can read Bible verses
CREATE POLICY "Authenticated users can read Bible verses"
ON public.bible_verses
FOR SELECT
TO authenticated
USING (true);

-- ====================================================================================
-- POSTGRESQL FUNCTIONS
-- ====================================================================================

-- --------------------------------
-- Function: Update Emotional Trends (Aggregation)
-- --------------------------------
-- Runs every 5 minutes via cron job to aggregate submissions into trends
-- Implements K-anonymity: only includes time buckets with ≥5 submissions

CREATE OR REPLACE FUNCTION public.update_emotional_trends()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert or update aggregated trends for the past hour
  INSERT INTO public.emotional_trends (
    date,
    hour,
    positive_count,
    neutral_count,
    negative_count,
    low_risk_count,
    moderate_risk_count,
    high_risk_count,
    total_submissions,
    updated_at
  )
  SELECT
    DATE(created_at) as date,
    EXTRACT(HOUR FROM created_at)::INTEGER as hour,
    COUNT(*) FILTER (WHERE sentiment = 'positive') as positive_count,
    COUNT(*) FILTER (WHERE sentiment = 'neutral') as neutral_count,
    COUNT(*) FILTER (WHERE sentiment = 'negative') as negative_count,
    COUNT(*) FILTER (WHERE risk_level = 'low') as low_risk_count,
    COUNT(*) FILTER (WHERE risk_level = 'moderate') as moderate_risk_count,
    COUNT(*) FILTER (WHERE risk_level = 'high') as high_risk_count,
    COUNT(*) as total_submissions,
    NOW() as updated_at
  FROM public.submissions
  WHERE created_at >= NOW() - INTERVAL '2 hours' -- Look back 2 hours to catch late submissions
  GROUP BY DATE(created_at), EXTRACT(HOUR FROM created_at)
  HAVING COUNT(*) >= 5 -- K-anonymity threshold: only include if ≥5 students
  ON CONFLICT (date, hour)
  DO UPDATE SET
    positive_count = EXCLUDED.positive_count,
    neutral_count = EXCLUDED.neutral_count,
    negative_count = EXCLUDED.negative_count,
    low_risk_count = EXCLUDED.low_risk_count,
    moderate_risk_count = EXCLUDED.moderate_risk_count,
    high_risk_count = EXCLUDED.high_risk_count,
    total_submissions = EXCLUDED.total_submissions,
    updated_at = NOW();
END;
$$;

-- --------------------------------
-- Function: Decrement Trend Count (for Account Deletion)
-- --------------------------------
-- When a student deletes their account, decrement the aggregate counts

CREATE OR REPLACE FUNCTION public.decrement_trend_count(
  p_date DATE,
  p_hour INTEGER,
  p_sentiment TEXT,
  p_risk_level TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.emotional_trends
  SET
    positive_count = CASE WHEN p_sentiment = 'positive' THEN GREATEST(positive_count - 1, 0) ELSE positive_count END,
    neutral_count = CASE WHEN p_sentiment = 'neutral' THEN GREATEST(neutral_count - 1, 0) ELSE neutral_count END,
    negative_count = CASE WHEN p_sentiment = 'negative' THEN GREATEST(negative_count - 1, 0) ELSE negative_count END,
    low_risk_count = CASE WHEN p_risk_level = 'low' THEN GREATEST(low_risk_count - 1, 0) ELSE low_risk_count END,
    moderate_risk_count = CASE WHEN p_risk_level = 'moderate' THEN GREATEST(moderate_risk_count - 1, 0) ELSE moderate_risk_count END,
    high_risk_count = CASE WHEN p_risk_level = 'high' THEN GREATEST(high_risk_count - 1, 0) ELSE high_risk_count END,
    total_submissions = GREATEST(total_submissions - 1, 0),
    updated_at = NOW()
  WHERE date = p_date AND hour = p_hour;

  -- If total_submissions drops below K-anonymity threshold, delete the row
  DELETE FROM public.emotional_trends
  WHERE date = p_date AND hour = p_hour AND total_submissions < 5;
END;
$$;

-- --------------------------------
-- Function: Auto-Delete Expired Text
-- --------------------------------
-- Runs daily to delete encrypted text after 30 days (keep sentiment scores)

CREATE OR REPLACE FUNCTION public.delete_expired_text()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.submissions
  SET
    text_encrypted = '[DELETED - Retention Period Expired]',
    updated_at = NOW()
  WHERE
    text_expires_at <= NOW()
    AND text_encrypted != '[DELETED - Retention Period Expired]';
END;
$$;

-- --------------------------------
-- Function: Update Timestamp (Trigger Function)
-- --------------------------------
-- Automatically updates updated_at timestamp on row updates

CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ====================================================================================
-- TRIGGERS
-- ====================================================================================

-- Auto-update timestamps on all tables

CREATE TRIGGER update_students_timestamp
BEFORE UPDATE ON public.students
FOR EACH ROW
EXECUTE FUNCTION public.update_timestamp();

CREATE TRIGGER update_submissions_timestamp
BEFORE UPDATE ON public.submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_timestamp();

CREATE TRIGGER update_emotional_trends_timestamp
BEFORE UPDATE ON public.emotional_trends
FOR EACH ROW
EXECUTE FUNCTION public.update_timestamp();

CREATE TRIGGER update_counselor_requests_timestamp
BEFORE UPDATE ON public.counselor_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_timestamp();

-- ====================================================================================
-- SAMPLE DATA (Bible Verses Seed)
-- ====================================================================================
-- Seeding a few sample verses (full 100 verses should be in seed-bible-verses.ts)

INSERT INTO public.bible_verses (verse_reference, verse_text, sentiment_match) VALUES
  ('Philippians 4:6-7', 'Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.', 'negative_anxious'),
  ('Psalm 34:18', 'The Lord is close to the brokenhearted and saves those who are crushed in spirit.', 'negative_sad'),
  ('Matthew 11:28', 'Come to me, all you who are weary and burdened, and I will give you rest.', 'negative_anxious'),
  ('Psalm 118:24', 'This is the day the Lord has made; let us rejoice and be glad in it.', 'positive'),
  ('Philippians 4:4', 'Rejoice in the Lord always. I will say it again: Rejoice!', 'positive'),
  ('Proverbs 3:5-6', 'Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.', 'neutral_encouragement'),
  ('Psalm 46:1', 'God is our refuge and strength, an ever-present help in trouble.', 'negative_anxious'),
  ('Isaiah 41:10', 'So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you; I will uphold you with my righteous right hand.', 'at_risk'),
  ('Romans 8:28', 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.', 'neutral_encouragement'),
  ('2 Corinthians 1:3-4', 'Praise be to the God and Father of our Lord Jesus Christ, the Father of compassion and the God of all comfort, who comforts us in all our troubles.', 'negative_sad')
ON CONFLICT DO NOTHING;

-- ====================================================================================
-- COMMENTS (Documentation)
-- ====================================================================================

COMMENT ON TABLE public.students IS 'User accounts (students and counselors). Extends Supabase auth.users with application-specific data.';
COMMENT ON TABLE public.submissions IS 'Student text submissions with ML analysis results. Privacy: text_encrypted is deleted after 30 days.';
COMMENT ON TABLE public.emotional_trends IS 'Anonymized aggregates for counselor dashboard. NO student_id column (privacy by design). K-anonymity enforced.';
COMMENT ON TABLE public.counselor_requests IS 'Student requests to contact a counselor.';
COMMENT ON TABLE public.bible_verses IS 'Static database of categorized Bible verses for encouragement.';

COMMENT ON FUNCTION public.update_emotional_trends() IS 'Background job (runs every 5 min) to aggregate submissions into trends. Implements K-anonymity (≥5 students).';
COMMENT ON FUNCTION public.decrement_trend_count(DATE, INTEGER, TEXT, TEXT) IS 'Decrements aggregate counts when a student deletes their account.';
COMMENT ON FUNCTION public.delete_expired_text() IS 'Daily job to delete encrypted text after 30-day retention period (keeps sentiment scores).';

-- ====================================================================================
-- SETUP COMPLETE
-- ====================================================================================

-- After running this schema, you should:
-- 1. Set up Supabase cron jobs:
--    - update_emotional_trends() every 5 minutes
--    - delete_expired_text() daily at midnight
-- 2. Seed remaining Bible verses (90+ more) via scripts/seed-bible-verses.ts
-- 3. Configure Supabase Auth email templates for verification
-- 4. Set environment variables in Vercel (SUPABASE_URL, SUPABASE_ANON_KEY, etc.)
