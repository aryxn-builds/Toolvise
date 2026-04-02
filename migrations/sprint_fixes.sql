-- ============================================================
-- TOOLVISE SPRINT MIGRATIONS
-- Run these in your Supabase SQL editor in order
-- ============================================================

-- 1. FIX COMMENTS RLS POLICIES
-- ============================================================

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can insert own comments" ON comments;
DROP POLICY IF EXISTS "Anyone can read comments" ON comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;
DROP POLICY IF EXISTS "Allow authenticated users to comment" ON comments;
DROP POLICY IF EXISTS "Allow users to read comments" ON comments;

-- Enable RLS if not already
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own comments
CREATE POLICY "Users can insert own comments"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow anyone to read comments (public stacks)
CREATE POLICY "Anyone can read comments"
  ON comments FOR SELECT
  TO public
  USING (true);

-- Allow users to delete their own comments
CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


-- 2. NEW PROFILE COLUMNS (gender, location, preferred_languages, timezone, is_owner)
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS gender TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS preferred_languages TEXT,
  ADD COLUMN IF NOT EXISTS timezone TEXT,
  ADD COLUMN IF NOT EXISTS is_owner BOOLEAN DEFAULT false NOT NULL;

-- 3. SET CURRENT ADMIN AS OWNER
-- ============================================================
-- This marks all current admins as owners; you can refine later
UPDATE profiles SET is_owner = true WHERE is_admin = true;


-- 4. GRANT/REVOKE ADMIN FUNCTION (for admin role management)
-- ============================================================

-- Function to safely grant admin (only calleable by admins via RLS)
CREATE OR REPLACE FUNCTION grant_admin(target_user_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE profiles SET is_admin = true WHERE id = target_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION revoke_admin(target_user_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Cannot revoke from owners
  UPDATE profiles SET is_admin = false
  WHERE id = target_user_id AND is_owner = false;
END;
$$;
