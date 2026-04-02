-- ============================================================
-- Toolvise Admin Dashboard v4: RPC Functions for Admin Management
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- This adds the missing `grant_admin` and `revoke_admin` functions.
-- ============================================================

-- Function to grant admin rights (bypasses RLS but checks privileges)
CREATE OR REPLACE FUNCTION grant_admin(target_user_id UUID)
RETURNS void AS $$
BEGIN
  -- Security check: ensure the caller is an admin
  IF public.is_admin_user() = FALSE THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can bestow admin privileges';
  END IF;

  UPDATE public.profiles
  SET is_admin = TRUE
  WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to revoke admin rights (bypasses RLS but checks privileges)
CREATE OR REPLACE FUNCTION revoke_admin(target_user_id UUID)
RETURNS void AS $$
BEGIN
  -- Security check: ensure the caller is an admin
  IF public.is_admin_user() = FALSE THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can revoke admin privileges';
  END IF;

  -- Ensure we aren't removing the absolute owner or something if desired, 
  -- but skipping hardcoded checks here.

  UPDATE public.profiles
  SET is_admin = FALSE
  WHERE id = target_user_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-notify PostgREST to reload the schema and pick up new functions
NOTIFY pgrst, 'reload schema';
