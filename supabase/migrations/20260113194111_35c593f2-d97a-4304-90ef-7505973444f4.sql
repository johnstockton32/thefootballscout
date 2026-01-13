-- Drop the profiles_public view entirely
-- The application should query profiles directly with proper RLS
DROP VIEW IF EXISTS public.profiles_public;