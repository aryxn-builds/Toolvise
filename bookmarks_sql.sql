-- ── Bookmarks table ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookmarks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stack_id uuid REFERENCES stacks(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, stack_id)
);

ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own bookmarks"
ON bookmarks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users insert own bookmarks"
ON bookmarks FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own bookmarks"
ON bookmarks FOR DELETE
USING (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';
