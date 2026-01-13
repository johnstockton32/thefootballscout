-- Add policy for team owners to view their team members
CREATE POLICY "Team owners can view their team members"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.teams
    WHERE teams.owner_id = auth.uid()
    AND teams.id = profiles.team_id
  )
);