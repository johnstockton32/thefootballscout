-- Revoke anon access to the profiles_public view
REVOKE ALL ON public.profiles_public FROM anon;

-- Only authenticated users should access profile data
GRANT SELECT ON public.profiles_public TO authenticated;