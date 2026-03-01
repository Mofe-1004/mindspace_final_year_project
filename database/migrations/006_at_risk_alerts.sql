-- Migration: 006_at_risk_alerts.sql
-- Purpose: Create at-risk alert system for high-risk submissions
-- Run this in Supabase SQL Editor

-- ====================================================================================
-- STEP 1: Create at_risk_alerts table
-- ====================================================================================

CREATE TABLE IF NOT EXISTS public.at_risk_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  counselor_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  submission_id UUID REFERENCES public.submissions(id) ON DELETE SET NULL,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('moderate', 'high')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'resolved')),
  triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  acknowledged_by UUID REFERENCES public.students(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================================================================
-- STEP 2: Create indexes
-- ====================================================================================

CREATE INDEX IF NOT EXISTS idx_alerts_counselor ON public.at_risk_alerts(counselor_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON public.at_risk_alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_triggered ON public.at_risk_alerts(triggered_at);
CREATE INDEX IF NOT EXISTS idx_alerts_student ON public.at_risk_alerts(student_id);

-- ====================================================================================
-- STEP 3: Enable RLS and create policies
-- ====================================================================================

ALTER TABLE public.at_risk_alerts ENABLE ROW LEVEL SECURITY;

-- Counselors can view their own alerts
CREATE POLICY "Counselors can view own alerts"
ON public.at_risk_alerts
FOR SELECT
USING (auth.uid() = counselor_id);

-- Counselors can update their own alerts (acknowledge/resolve)
CREATE POLICY "Counselors can update own alerts"
ON public.at_risk_alerts
FOR UPDATE
USING (auth.uid() = counselor_id);

-- Admins can manage all alerts
CREATE POLICY "Admins can manage all alerts"
ON public.at_risk_alerts
FOR ALL
USING (public.is_admin());

-- Service role can insert (for API alert creation)
CREATE POLICY "Service role can insert alerts"
ON public.at_risk_alerts
FOR INSERT
WITH CHECK (true);

-- ====================================================================================
-- STEP 4: Add trigger for updated_at
-- ====================================================================================

CREATE TRIGGER update_alerts_timestamp
BEFORE UPDATE ON public.at_risk_alerts
FOR EACH ROW
EXECUTE FUNCTION public.update_timestamp();

-- ====================================================================================
-- STEP 5: Add documentation
-- ====================================================================================

COMMENT ON TABLE public.at_risk_alerts IS 'Tracks high-risk submission alerts for counselors. Created automatically when a submission is flagged as high risk.';
