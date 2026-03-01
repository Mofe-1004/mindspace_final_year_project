-- Migration: 005_counselor_student_assignments.sql
-- Purpose: Create counselor-student assignment table for targeted oversight
-- Run this in Supabase SQL Editor

-- ====================================================================================
-- STEP 1: Create counselor_student_assignments table
-- ====================================================================================

CREATE TABLE IF NOT EXISTS public.counselor_student_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  counselor_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES public.students(id) ON DELETE SET NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(counselor_id, student_id)
);

-- ====================================================================================
-- STEP 2: Create indexes for performance
-- ====================================================================================

CREATE INDEX IF NOT EXISTS idx_assignments_counselor ON public.counselor_student_assignments(counselor_id);
CREATE INDEX IF NOT EXISTS idx_assignments_student ON public.counselor_student_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON public.counselor_student_assignments(status);

-- ====================================================================================
-- STEP 3: Enable RLS and create policies
-- ====================================================================================

ALTER TABLE public.counselor_student_assignments ENABLE ROW LEVEL SECURITY;

-- Counselors can view their own assignments
CREATE POLICY "Counselors can view own assignments"
ON public.counselor_student_assignments
FOR SELECT
USING (auth.uid() = counselor_id);

-- Admins can manage all assignments
CREATE POLICY "Admins can manage all assignments"
ON public.counselor_student_assignments
FOR ALL
USING (public.is_admin());

-- ====================================================================================
-- STEP 4: Add trigger for updated_at
-- ====================================================================================

CREATE TRIGGER update_assignments_timestamp
BEFORE UPDATE ON public.counselor_student_assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_timestamp();

-- ====================================================================================
-- STEP 5: Add documentation
-- ====================================================================================

COMMENT ON TABLE public.counselor_student_assignments IS 'Maps counselors to students they oversee. Admins create assignments; counselors see only their assigned students aggregate data.';
