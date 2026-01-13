-- Drop existing policies on teams table
DROP POLICY IF EXISTS "Team owners can manage their team" ON public.teams;
DROP POLICY IF EXISTS "Team members can view their team" ON public.teams;

-- Create explicit granular policies for teams table

-- SELECT: Team members can view their team
CREATE POLICY "Team members can view their team"
ON public.teams
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.team_id = teams.id
    AND profiles.id = auth.uid()
  )
);

-- SELECT: Team owners can view their team
CREATE POLICY "Team owners can view their team"
ON public.teams
FOR SELECT
TO authenticated
USING (auth.uid() = owner_id);

-- INSERT: Users can only create teams where they are the owner
CREATE POLICY "Users can create teams as owner"
ON public.teams
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);

-- UPDATE: Only team owners can update their team
CREATE POLICY "Team owners can update their team"
ON public.teams
FOR UPDATE
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- DELETE: Only team owners can delete their team
CREATE POLICY "Team owners can delete their team"
ON public.teams
FOR DELETE
TO authenticated
USING (auth.uid() = owner_id);