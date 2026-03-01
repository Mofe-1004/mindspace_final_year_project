-- Migration: 007_add_phone_number.sql
-- Purpose: Add phone_number column to students table for contact purposes
-- Run this in Supabase SQL Editor

ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Allow students to be looked up by phone (optional, for counselor contact)
CREATE INDEX IF NOT EXISTS idx_students_phone ON public.students(phone_number);

COMMENT ON COLUMN public.students.phone_number IS 'Phone number provided during signup. Used for counselor contact and emergency communication.';
