-- Fix profiles table SELECT policies to be PERMISSIVE (default) which properly requires authentication
-- Drop existing RESTRICTIVE SELECT policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Team owners can view their team members" ON public.profiles;

-- Recreate as PERMISSIVE policies (default behavior when AS PERMISSIVE is not specified)
-- These policies use auth.uid() which returns NULL for anonymous users, denying access

CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Team owners can view their team members" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM teams
  WHERE teams.owner_id = auth.uid() 
  AND teams.id = profiles.team_id
));