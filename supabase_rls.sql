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

-- 4. Update Policy: Allows users to update only their own stacks (e.g., toggling is_public)
CREATE POLICY "Users can update their own stacks" ON public.stacks
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. Delete Policy: Allows users to delete their own stacks
CREATE POLICY "Users can delete their own stacks" ON public.stacks
  FOR DELETE
  USING (auth.uid() = user_id);
