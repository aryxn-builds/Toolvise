-- ============================================================
-- Toolvise: Final Comment Section Fixes
-- Run this in Supabase SQL Editor: Dashboard → SQL Editor
-- ============================================================

-- 1. Table structure fix: Ensure user_id defaults to auth.uid()
-- This makes it safer when inserting from client.
ALTER TABLE public.comments 
  ALTER COLUMN user_id SET DEFAULT auth.uid();

-- 2. Ensure Row Level Security is ON
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- 3. DROP old policies to avoid overlap
DROP POLICY IF EXISTS "Anyone can view comments" ON public.comments;
DROP POLICY IF EXISTS "Anyone can read comments" ON public.comments;
DROP POLICY IF EXISTS "Authenticated users can post comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;
DROP POLICY IF EXISTS "Allow users to read comments" ON public.comments;
DROP POLICY IF EXISTS "Public read comments" ON public.comments;
DROP POLICY IF EXISTS "Authenticated insert comments" ON public.comments;
DROP POLICY IF EXISTS "Owners delete comments" ON public.comments;
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;

-- 4. Create CLEAN policies
-- SELECT: Everyone can read
CREATE POLICY "Public read comments"
  ON public.comments FOR SELECT
  TO public
  USING (true);

-- INSERT: Only logged-in users, and they must be the author
CREATE POLICY "Authenticated insert comments"
  ON public.comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Only the author can delete
CREATE POLICY "Owners delete comments"
  ON public.comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 5. Explicitly GRANT permissions (CRITICAL!)
GRANT SELECT ON TABLE public.comments TO anon, authenticated;
GRANT INSERT, DELETE ON TABLE public.comments TO authenticated;

-- 6. Ensure Profiles are readable (needed for comment display)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;

CREATE POLICY "Anyone can view profiles"
  ON public.profiles FOR SELECT
  TO public
  USING (true);

GRANT SELECT ON TABLE public.profiles TO anon, authenticated;

-- 7. Reload schema cache
NOTIFY pgrst, 'reload schema';
