-- Fix profiles table security: Ensure only authenticated users can access profiles
-- Drop existing SELECT policies and recreate with explicit 'TO authenticated'

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Team admins can view their team members" ON public.profiles;
DROP POLICY IF EXISTS "Team owners can view their team members" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Team admins can update team member roles" ON public.profiles;
DROP POLICY IF EXISTS "Team owners can update member roles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete any profile" ON public.profiles;

-- Recreate all policies with explicit 'TO authenticated' to prevent anonymous access

-- SELECT policies
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Team admins can view their team members"
ON public.profiles FOR SELECT TO authenticated
USING ((team_id IS NOT NULL) AND is_team_admin_of_profile(auth.uid(), team_id));

CREATE POLICY "Team owners can view their team members"
ON public.profiles FOR SELECT TO authenticated
USING ((team_id IS NOT NULL) AND is_team_owner_of_profile(auth.uid(), team_id));

-- INSERT policy
CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

-- UPDATE policies
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Team admins can update team member roles"
ON public.profiles FOR UPDATE TO authenticated
USING ((team_id IS NOT NULL) AND is_team_admin_of_profile(auth.uid(), team_id))
WITH CHECK ((team_id IS NOT NULL) AND is_team_admin_of_profile(auth.uid(), team_id));

CREATE POLICY "Team owners can update member roles"
ON public.profiles FOR UPDATE TO authenticated
USING (is_team_owner_of_profile(auth.uid(), team_id))
WITH CHECK (is_team_owner_of_profile(auth.uid(), team_id));

-- DELETE policy
CREATE POLICY "Admins can delete any profile"
ON public.profiles FOR DELETE TO authenticated
USING (is_admin(auth.uid()));