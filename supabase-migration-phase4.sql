-- Add new profile columns
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS gender text,
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS preferred_languages text,
ADD COLUMN IF NOT EXISTS timezone text,
ADD COLUMN IF NOT EXISTS is_owner boolean DEFAULT false;

-- To make an existing user an owner, you'll need to run an UPDATE manually.
-- UPDATE public.profiles SET is_owner = true WHERE email = 'your_email@example.com';
