-- ============================================================
-- Toolvise Phase 2 — Full Migration
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ── 1. Add follower/following counts to profiles ──────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS followers_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS following_count integer DEFAULT 0;

-- ── 2. Add comparison_engine to stacks ────────────────────────
ALTER TABLE public.stacks
  ADD COLUMN IF NOT EXISTS comparison_engine jsonb DEFAULT '[]'::jsonb;

-- ── 3. Comments table ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.comments (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  stack_id    uuid REFERENCES public.stacks(id) ON DELETE CASCADE NOT NULL,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content     text NOT NULL CHECK (char_length(content) <= 500),
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read comments"       ON public.comments;
DROP POLICY IF EXISTS "Users insert own comment"   ON public.comments;
DROP POLICY IF EXISTS "Users delete own comment"   ON public.comments;

CREATE POLICY "Public read comments"
  ON public.comments FOR SELECT USING (true);

CREATE POLICY "Users insert own comment"
  ON public.comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own comment"
  ON public.comments FOR DELETE
  USING (auth.uid() = user_id);

-- ── 4. Follows table ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.follows (
  follower_id  uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  following_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at   timestamptz DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id <> following_id)
);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read follows"        ON public.follows;
DROP POLICY IF EXISTS "Users manage own follows"   ON public.follows;

CREATE POLICY "Public read follows"
  ON public.follows FOR SELECT USING (true);

CREATE POLICY "Users insert own follows"
  ON public.follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users delete own follows"
  ON public.follows FOR DELETE
  USING (auth.uid() = follower_id);

-- ── 5. stacks_count auto-sync trigger ─────────────────────────
CREATE OR REPLACE FUNCTION public.sync_stacks_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.user_id IS NOT NULL THEN
    UPDATE public.profiles
      SET stacks_count = stacks_count + 1
      WHERE id = NEW.user_id;

  ELSIF TG_OP = 'DELETE' AND OLD.user_id IS NOT NULL THEN
    UPDATE public.profiles
      SET stacks_count = GREATEST(0, stacks_count - 1)
      WHERE id = OLD.user_id;

  ELSIF TG_OP = 'UPDATE'
    AND OLD.user_id IS NULL
    AND NEW.user_id IS NOT NULL
  THEN
    -- Stack claimed by a user (anonymous → owned)
    UPDATE public.profiles
      SET stacks_count = stacks_count + 1
      WHERE id = NEW.user_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_stack_change ON public.stacks;
CREATE TRIGGER on_stack_change
  AFTER INSERT OR UPDATE OR DELETE ON public.stacks
  FOR EACH ROW EXECUTE FUNCTION public.sync_stacks_count();

-- ── 6. follows count auto-sync trigger ────────────────────────
CREATE OR REPLACE FUNCTION public.sync_follows_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
    UPDATE public.profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles SET followers_count = GREATEST(0, followers_count - 1) WHERE id = OLD.following_id;
    UPDATE public.profiles SET following_count = GREATEST(0, following_count - 1) WHERE id = OLD.follower_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_follow_change ON public.follows;
CREATE TRIGGER on_follow_change
  AFTER INSERT OR DELETE ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.sync_follows_count();

-- ── 7. Reload schema cache ────────────────────────────────────
NOTIFY pgrst, 'reload schema';
