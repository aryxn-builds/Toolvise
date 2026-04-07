-- ============================================================
-- Toolvise: Fix Stacks Table Schema
-- Run this in Supabase SQL Editor: Dashboard → SQL Editor
-- ============================================================

-- Add the missing "comparison_engine" and "architecture" columns
-- These are JSONB columns to store AI-generated analysis and structure.

ALTER TABLE public.stacks 
  ADD COLUMN IF NOT EXISTS comparison_engine jsonb,
  ADD COLUMN IF NOT EXISTS architecture jsonb;

-- (Optional) If you want to rename "summary" to "stack_summary" or vice-versa,
-- you can do it here, but the code currently handles both.

-- Ensure columns are readable by public
GRANT SELECT ON TABLE public.stacks TO anon, authenticated;9

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
