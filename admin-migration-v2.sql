-- Admin Dashboard v2 Migration

-- 1. Create api_usage_logs table
CREATE TABLE IF NOT EXISTS api_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    provider TEXT NOT NULL, -- 'gemini' or 'groq'
    model TEXT,
    duration_ms INTEGER,
    success BOOLEAN DEFAULT false,
    error_message TEXT,
    tokens_used INTEGER
);

-- Turn on RLS but allow insert for anon/authenticated and select for admins
ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable insert for all API calls" ON api_usage_logs;
CREATE POLICY "Enable insert for all API calls"
ON api_usage_logs FOR INSERT
WITH CHECK (true);

-- Allow admins to see all logs
DROP POLICY IF EXISTS "Enable read access for admins" ON api_usage_logs;
CREATE POLICY "Enable read access for admins"
ON api_usage_logs FOR SELECT
USING (
  (auth.jwt() ->> 'email' = 'ay6033756@gmail.com') OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- 2. Modify stacks user_id to cascade on delete (if not already)
-- Usually Supabase handles au.uid cascading if set up properly,
-- but we ensure profiles cascaded deletion applies to stacks
-- Note: Recreating fk for stacks -> profiles
ALTER TABLE stacks 
  DROP CONSTRAINT IF EXISTS stacks_user_id_fkey,
  ADD CONSTRAINT stacks_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES profiles(id) 
  ON DELETE CASCADE;

-- Same for bookmarks
ALTER TABLE bookmarks 
  DROP CONSTRAINT IF EXISTS bookmarks_user_id_fkey,
  ADD CONSTRAINT bookmarks_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES profiles(id) 
  ON DELETE CASCADE;


