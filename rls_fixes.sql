-- ============================================================
-- Toolvise: RLS Fixes for Stacks and Comments
-- ============================================================

-- 1. STACKS TABLE FIXES
-- ============================================================

-- Drop restrictive insert policy
DROP POLICY IF EXISTS "Users can insert their own stacks" ON public.stacks;

-- New Insert Policy: Allow anyone to insert (sets user_id to auth.uid() if logged in, or null if anon)
CREATE POLICY "Allow anyone to insert stacks" ON public.stacks
  FOR INSERT
  WITH CHECK (
    (auth.uid() IS NULL AND user_id IS NULL)
    OR
    (auth.uid() = user_id)
  );

-- Ensure public can read all public stacks (already exists, but let's be sure)
DROP POLICY IF EXISTS "Public stacks are viewable by everyone" ON public.stacks;
CREATE POLICY "Anyone can view public stacks" ON public.stacks
  FOR SELECT
  USING (is_public = true);

-- 2. COMMENTS TABLE FIXES
-- ============================================================

-- Re-enable RLS just in case
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Drop existing insert policies to avoid conflicts
DROP POLICY IF EXISTS "Users can insert own comments" ON public.comments;
DROP POLICY IF EXISTS "Authenticated users can post comments" ON public.comments;
DROP POLICY IF EXISTS "Allow authenticated users to comment" ON public.comments;
DROP POLICY IF EXISTS "Users insert own comment" ON public.comments;

-- Clean Insert Policy for authenticated users
CREATE POLICY "Authenticated users can post comments" ON public.comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Clean Select Policy
DROP POLICY IF EXISTS "Anyone can read comments" ON public.comments;
DROP POLICY IF EXISTS "Allow users to read comments" ON public.comments;
DROP POLICY IF EXISTS "Public read comments" ON public.comments;

CREATE POLICY "Anyone can view comments" ON public.comments
  FOR SELECT
  USING (true);

-- 3. PROFILES TABLE FIXES
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- 4. RELOAD POSTGREST
-- ============================================================
NOTIFY pgrst, 'reload schema';
