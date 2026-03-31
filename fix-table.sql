-- 1. Ensure table exists
CREATE TABLE IF NOT EXISTS api_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    provider TEXT NOT NULL,
    model TEXT,
    duration_ms INTEGER,
    success BOOLEAN DEFAULT false,
    error_message TEXT,
    tokens_used INTEGER
);

-- 2. Grant permissions explicitly to roles (THIS WAS MISSING!)
GRANT ALL ON TABLE api_usage_logs TO anon, authenticated, service_role;

-- 3. Turn on RLS
ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;

-- 4. Enable insert for anyone calling the API
DROP POLICY IF EXISTS "Enable insert for all API calls" ON api_usage_logs;
CREATE POLICY "Enable insert for all API calls"
ON api_usage_logs FOR INSERT
WITH CHECK (true);

-- 5. Enable read access for admins
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

-- 6. Reload schema cache again
NOTIFY pgrst, 'reload schema';
