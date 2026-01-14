-- Create a function to check if user is a team admin in the same team
CREATE OR REPLACE FUNCTION public.is_team_admin_of_profile(_admin_id uuid, _profile_team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _admin_id
      AND team_id = _profile_team_id
      AND team_role = 'team_admin'
  )
$$;

-- Add policy for team admins to view team members
CREATE POLICY "Team admins can view their team members"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  (team_id IS NOT NULL) AND is_team_admin_of_profile(auth.uid(), team_id)
);

-- Add policy for team admins to update team member roles
CREATE POLICY "Team admins can update team member roles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  (team_id IS NOT NULL) AND is_team_admin_of_profile(auth.uid(), team_id)
)
WITH CHECK (
  (team_id IS NOT NULL) AND is_team_admin_of_profile(auth.uid(), team_id)
);