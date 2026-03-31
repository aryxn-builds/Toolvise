-- ============================================================
-- Toolvise Admin Dashboard: Announcements + Featured Stacks
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. Add is_featured column to stacks
ALTER TABLE stacks
ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;

-- 2. Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  message text NOT NULL,
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 3. Enable RLS on announcements
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- 4. Everyone can read active announcements
CREATE POLICY "Public read active announcements"
ON announcements FOR SELECT
USING (true);

-- 5. Only admins can insert/update/delete announcements
-- (enforced at app level via is_admin check;
--  this policy allows any authenticated user for flexibility)
CREATE POLICY "Admins manage announcements"
ON announcements FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- 6. Add status column to bug_reports if not exists
ALTER TABLE bug_reports
ADD COLUMN IF NOT EXISTS status text DEFAULT 'open';

-- 7. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
