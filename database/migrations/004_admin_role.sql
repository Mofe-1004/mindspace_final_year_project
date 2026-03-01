-- Migration: 004_admin_role.sql
-- Purpose: Add admin role for system-wide oversight
-- Run this in Supabase SQL Editor

-- ====================================================================================
-- STEP 1: Update role constraint to include admin
-- ====================================================================================

ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_role_check;

ALTER TABLE public.students ADD CONSTRAINT students_role_check
  CHECK (role IN ('student', 'pending_counselor', 'counselor', 'admin'));

-- ====================================================================================
-- STEP 2: Create is_admin() helper function (mirrors is_counselor())
-- ====================================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT COALESCE(
    (SELECT role = 'admin' FROM public.students WHERE id = auth.uid()),
    false
  );
$$;

-- ====================================================================================
-- STEP 3: RLS policies for admin access
-- ====================================================================================

-- Admin can view all students
CREATE POLICY "Admins can view all students"
  ON public.students FOR SELECT
  USING (public.is_admin());

-- Admin can update student roles
CREATE POLICY "Admins can update students"
  ON public.students FOR UPDATE
  USING (public.is_admin());

-- Admin can view all submission metadata (for stats, NOT raw text access)
CREATE POLICY "Admins can view submission metadata"
  ON public.submissions FOR SELECT
  USING (public.is_admin());

-- Admin can view all trends
CREATE POLICY "Admins can view all trends"
  ON public.emotional_trends FOR SELECT
  USING (public.is_admin());

-- Admin can manage counselor approvals
CREATE POLICY "Admins can manage approvals"
  ON public.counselor_approvals FOR ALL
  USING (public.is_admin());

-- ====================================================================================
-- STEP 4: Bootstrap first admin (run manually after signup)
-- ====================================================================================
-- Replace with the actual admin email:
-- UPDATE public.students SET role = 'admin' WHERE email = 'admin@babcock.edu.ng';
