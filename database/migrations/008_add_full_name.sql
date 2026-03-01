-- Migration 008: Replace full_name with first_name and last_name columns
-- Stores the user's name as separate fields for flexible display

-- If full_name already exists from an earlier run, drop it
ALTER TABLE public.students DROP COLUMN IF EXISTS full_name;

-- Add the new columns
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS last_name TEXT;
