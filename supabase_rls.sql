-- Enable RLS on the stacks table
ALTER TABLE public.stacks ENABLE ROW LEVEL SECURITY;

-- 1. Public Read Policy: Allows anyone to read stacks where is_public is true
CREATE POLICY "Public stacks are viewable by everyone" ON public.stacks
  FOR SELECT
  USING (is_public = true);

-- 2. Authenticated Read Policy: Allows users to read their own private stacks
CREATE POLICY "Users can view their own private stacks" ON public.stacks
  FOR SELECT
  USING (auth.uid() = user_id AND is_public = false);

-- 3. Insert Policy: Allows authenticated users to insert a stack, setting themselves as the owner
CREATE POLICY "Users can insert their own stacks" ON public.stacks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 4. Update Policy: Allows users to update only their own stacks, OR to claim unclaimed stacks
DROP POLICY IF EXISTS "Users can update their own stacks" ON public.stacks;
DROP POLICY IF EXISTS "Users update own stacks" ON public.stacks;

CREATE POLICY "Users can claim stacks" ON public.stacks
  FOR UPDATE
  USING (user_id IS NULL)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own stacks" ON public.stacks
  FOR UPDATE
  USING (
    auth.uid() = user_id 
    OR user_id IS NULL
  );

-- Increment stacks_count function
CREATE OR REPLACE FUNCTION increment_stacks_count(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET stacks_count = stacks_count + 1
  WHERE id = user_id;
END;
$$;

-- 5. Delete Policy: Allows users to delete their own stacks
CREATE POLICY "Users can delete their own stacks" ON public.stacks
  FOR DELETE
  USING (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';
