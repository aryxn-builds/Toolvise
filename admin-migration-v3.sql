-- ============================================================
-- Toolvise Admin Dashboard v3: Comprehensive Admin Permissions
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- This fixes the issue where admins cannot grant admin rights 
-- to others, delete users, or manage stacks from the dashboard.
-- ============================================================

-- 1. Create a secure, RLS-bypassing function to check admin status.
-- This prevents the "infinite recursion" error in Postgres.
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
DECLARE
  admin_status BOOLEAN;
BEGIN
  -- Check hardcoded owner
  IF auth.jwt() ->> 'email' = 'ay6033756@gmail.com' THEN
    RETURN TRUE;
  END IF;
  
  -- Check profiles table bypassing RLS to prevent recursion
  SELECT is_admin INTO admin_status FROM public.profiles WHERE id = auth.uid() LIMIT 1;
  RETURN COALESCE(admin_status, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. PROFILES overrides for Admins
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
CREATE POLICY "Admins can update profiles"
ON profiles FOR UPDATE
USING ( is_admin_user() );

DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
CREATE POLICY "Admins can delete profiles"
ON profiles FOR DELETE
USING ( is_admin_user() );


-- 3. STACKS overrides for Admins
DROP POLICY IF EXISTS "Admins can update stacks" ON stacks;
CREATE POLICY "Admins can update stacks"
ON stacks FOR UPDATE
USING ( is_admin_user() );

DROP POLICY IF EXISTS "Admins can delete stacks" ON stacks;
CREATE POLICY "Admins can delete stacks"
ON stacks FOR DELETE
USING ( is_admin_user() );


-- 4. BOOKMARKS overrides for Admins (Delete cascaded from users)
DROP POLICY IF EXISTS "Admins can delete bookmarks" ON bookmarks;
CREATE POLICY "Admins can delete bookmarks"
ON bookmarks FOR DELETE
USING ( is_admin_user() );


-- 5. BUG REPORTS overrides for Admins
-- Ensure RLS is on 
ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can insert bug reports" ON bug_reports;
CREATE POLICY "Public can insert bug reports"
ON bug_reports FOR INSERT
WITH CHECK (true);

-- Ensure public can also select or just admins 
-- Depending on requirements, typically admins read all bugs.
DROP POLICY IF EXISTS "Admins can read bug reports" ON bug_reports;
CREATE POLICY "Admins can read bug reports"
ON bug_reports FOR SELECT
USING ( is_admin_user() );

DROP POLICY IF EXISTS "Admins can update bug reports" ON bug_reports;
CREATE POLICY "Admins can update bug reports"
ON bug_reports FOR UPDATE
USING ( is_admin_user() );


-- 6. API USAGE overrides for Admins (Update the old policy)
DROP POLICY IF EXISTS "Enable read access for admins" ON api_usage_logs;
CREATE POLICY "Enable read access for admins"
ON api_usage_logs FOR SELECT
USING ( is_admin_user() );


-- 7. ANNOUNCEMENTS overrides for Admins
DROP POLICY IF EXISTS "Admins manage announcements" ON announcements;
CREATE POLICY "Admins manage announcements"
ON announcements FOR ALL
USING ( is_admin_user() )
WITH CHECK ( is_admin_user() );

NOTIFY pgrst, 'reload schema';
