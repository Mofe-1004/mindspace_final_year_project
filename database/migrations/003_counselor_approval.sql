-- Migration: 003_counselor_approval.sql
-- Purpose: Add counselor approval workflow with pending_counselor role
-- Run this in Supabase SQL Editor

-- ====================================================================================
-- STEP 1: Update role constraint to include pending_counselor
-- ====================================================================================

ALTER TABLE public.students
DROP CONSTRAINT IF EXISTS students_role_check;

ALTER TABLE public.students
ADD CONSTRAINT students_role_check
CHECK (role IN ('student', 'pending_counselor', 'counselor'));

-- ====================================================================================
-- STEP 2: Create counselor_approvals table
-- ====================================================================================

CREATE TABLE IF NOT EXISTS public.counselor_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  approved_by UUID REFERENCES public.students(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_counselor_approvals_status ON public.counselor_approvals(status);
CREATE INDEX IF NOT EXISTS idx_counselor_approvals_user_id ON public.counselor_approvals(user_id);

-- ====================================================================================
-- STEP 3: Enable RLS and create policies
-- ====================================================================================

ALTER TABLE public.counselor_approvals ENABLE ROW LEVEL SECURITY;

-- Users can view their own approval status
CREATE POLICY "Users can view own approval"
ON public.counselor_approvals
FOR SELECT
USING (auth.uid() = user_id);

-- Counselors can view all pending approvals
CREATE POLICY "Counselors can view all approvals"
ON public.counselor_approvals
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.students
    WHERE id = auth.uid() AND role = 'counselor'
  )
);

-- Counselors can update approval status
CREATE POLICY "Counselors can update approvals"
ON public.counselor_approvals
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.students
    WHERE id = auth.uid() AND role = 'counselor'
  )
);

-- Service role can insert (for signup flow via API)
CREATE POLICY "Service role can insert approvals"
ON public.counselor_approvals
FOR INSERT
WITH CHECK (true);

-- ====================================================================================
-- STEP 4: Add trigger for updated_at
-- ====================================================================================

CREATE TRIGGER update_counselor_approvals_timestamp
BEFORE UPDATE ON public.counselor_approvals
FOR EACH ROW
EXECUTE FUNCTION public.update_timestamp();

-- ====================================================================================
-- STEP 5: Add comment for documentation
-- ====================================================================================

COMMENT ON TABLE public.counselor_approvals IS 'Tracks approval workflow for staff members requesting counselor access. Pending counselors must be approved by existing counselors.';

-- ====================================================================================
-- BOOTSTRAP FIRST COUNSELOR (Run manually after first staff signup)
-- ====================================================================================
-- Replace 'first.counselor@babcock.edu.ng' with the actual email
--
-- UPDATE public.students SET role = 'counselor' WHERE email = 'first.counselor@babcock.edu.ng';
-- UPDATE public.counselor_approvals SET status = 'approved', reviewed_at = NOW()
-- WHERE user_id = (SELECT id FROM public.students WHERE email = 'first.counselor@babcock.edu.ng');
