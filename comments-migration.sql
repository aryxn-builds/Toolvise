-- ============================================================
-- Toolvise: Comments System - FULL SETUP (Safe to re-run)
-- Run this in Supabase SQL Editor: Dashboard → SQL Editor
-- ============================================================

-- 1. CREATE COMMENTS TABLE
-- Using auth.users as the FK target instead of profiles,
-- since auth.uid() references auth.users, not profiles.
-- This avoids FK violations when profiles row doesn't exist yet.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.comments (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  content     text        NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 500),
  stack_id    uuid        NOT NULL REFERENCES public.stacks(id) ON DELETE CASCADE,
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now()
);

-- Index for fast stack comment lookups
CREATE INDEX IF NOT EXISTS comments_stack_id_idx ON public.comments(stack_id);
CREATE INDEX IF NOT EXISTS comments_user_id_idx  ON public.comments(user_id);

-- 2. ENABLE ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- 3. RLS POLICIES (drop + recreate to ensure latest version)
-- ============================================================

DROP POLICY IF EXISTS "Anyone can read comments"            ON public.comments;
DROP POLICY IF EXISTS "Users can insert own comments"       ON public.comments;
DROP POLICY IF EXISTS "Authenticated users can post comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete own comments"       ON public.comments;
DROP POLICY IF EXISTS "Allow authenticated users to comment" ON public.comments;
DROP POLICY IF EXISTS "Allow users to read comments"        ON public.comments;

-- Public READ (anon + logged in)
CREATE POLICY "Anyone can read comments"
  ON public.comments FOR SELECT
  TO public
  USING (true);

-- Authenticated INSERT (must own the row: user_id = auth.uid())
CREATE POLICY "Users can insert own comments"
  ON public.comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Authenticated DELETE (only your own comments)
CREATE POLICY "Users can delete own comments"
  ON public.comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 4. GRANT PUBLIC ACCESS
-- ============================================================
GRANT SELECT ON public.comments TO anon, authenticated;
GRANT INSERT, DELETE ON public.comments TO authenticated;

-- 5. RELOAD POSTGREST SCHEMA CACHE
-- ============================================================
NOTIFY pgrst, 'reload schema';
