-- Create enum for team member roles
CREATE TYPE public.team_role AS ENUM ('scout', 'senior_scout', 'team_admin');

-- Add team_role column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN team_role public.team_role DEFAULT 'scout';

-- Create function to check if user is team admin
CREATE OR REPLACE FUNCTION public.is_team_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id
    AND team_role = 'team_admin'
  )
$$;

-- Create function for team owners to update team member roles
CREATE OR REPLACE FUNCTION public.can_manage_team_role(_owner_id uuid, _member_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teams t
    JOIN public.profiles p ON p.team_id = t.id
    WHERE t.owner_id = _owner_id
    AND p.id = _member_id
  )
$$;

-- Allow team owners to update team_role of their team members
CREATE POLICY "Team owners can update member roles"
ON public.profiles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.teams t
    WHERE t.owner_id = auth.uid()
    AND profiles.team_id = t.id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.teams t
    WHERE t.owner_id = auth.uid()
    AND profiles.team_id = t.id
  )
);