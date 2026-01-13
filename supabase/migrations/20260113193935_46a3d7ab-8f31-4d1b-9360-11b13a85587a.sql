-- Drop and recreate the profiles_public view with security_invoker enabled
-- This ensures the view uses the caller's RLS permissions from the profiles table
DROP VIEW IF EXISTS public.profiles_public;

CREATE VIEW public.profiles_public
WITH (security_invoker = on) AS
SELECT 
  id,
  full_name,
  organization,
  photo_url,
  created_at
FROM public.profiles;