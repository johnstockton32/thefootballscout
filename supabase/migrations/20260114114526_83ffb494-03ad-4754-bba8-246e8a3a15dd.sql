
-- Drop ALL problematic policies on profiles that could cause recursion
DROP POLICY IF EXISTS "Team owners can view their team members" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Team owners can update member roles" ON public.profiles;

-- Create security definer function to check if user owns a team that contains a profile
-- This avoids recursion by using SECURITY DEFINER which bypasses RLS
CREATE OR REPLACE FUNCTION public.is_team_owner_of_profile(_owner_id uuid, _profile_team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teams
    WHERE teams.id = _profile_team_id
    AND teams.owner_id = _owner_id
  )
$$;

-- Create security definer function to check admin role without recursion
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = _user_id
    AND user_roles.role = 'admin'
  )
$$;

-- Recreate policies using security definer functions
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Team owners can view their team members" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  team_id IS NOT NULL AND
  public.is_team_owner_of_profile(auth.uid(), team_id)
);

CREATE POLICY "Team owners can update member roles" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (public.is_team_owner_of_profile(auth.uid(), team_id))
WITH CHECK (public.is_team_owner_of_profile(auth.uid(), team_id));

-- Also fix the teams table policy that queries profiles (causes cross-recursion)
DROP POLICY IF EXISTS "Team members can view their team" ON public.teams;

-- Create security definer function to check if user is member of a team
CREATE OR REPLACE FUNCTION public.is_team_member(_user_id uuid, _team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = _user_id
    AND profiles.team_id = _team_id
  )
$$;

-- Recreate team members policy using security definer function
CREATE POLICY "Team members can view their team" 
ON public.teams 
FOR SELECT 
TO authenticated
USING (public.is_team_member(auth.uid(), id));

-- Fix team_activity policy that queries profiles
DROP POLICY IF EXISTS "Team members can view activity" ON public.team_activity;

CREATE POLICY "Team members can view activity" 
ON public.team_activity 
FOR SELECT 
TO authenticated
USING (public.is_team_member(auth.uid(), team_id));
