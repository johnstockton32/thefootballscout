-- Revoke all privileges from anon role on profiles table
REVOKE ALL ON public.profiles FROM anon;

-- Revoke all privileges from anon role on related tables
REVOKE ALL ON public.user_roles FROM anon;

-- Grant only necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;

-- Create a public-safe view for profile display (excludes sensitive data)
CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = on) AS
SELECT 
  id,
  full_name,
  organization,
  photo_url,
  created_at
FROM public.profiles;

-- Grant anon and authenticated access to the safe view only
GRANT SELECT ON public.profiles_public TO anon, authenticated;

-- Add RLS policy for the view (inherits from base table due to security_invoker)
-- The view will respect the base table's RLS policies