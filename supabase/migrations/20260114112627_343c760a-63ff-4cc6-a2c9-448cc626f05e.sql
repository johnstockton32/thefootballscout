-- Fix profiles table security: Ensure all SELECT policies require authentication
-- Drop and recreate SELECT policies with TO authenticated clause

-- Drop existing SELECT policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Team owners can view their team members" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Recreate SELECT policies with TO authenticated
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