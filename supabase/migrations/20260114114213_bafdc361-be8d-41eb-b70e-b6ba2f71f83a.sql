
-- Drop the problematic SELECT policies
DROP POLICY IF EXISTS "Team owners can view their team members" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Recreate admin policy using a direct query instead of has_role function to avoid recursion
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Recreate team owners policy without recursion
-- This checks if the current user owns a team that the profile belongs to
CREATE POLICY "Team owners can view their team members" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  team_id IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.teams
    WHERE teams.id = profiles.team_id
    AND teams.owner_id = auth.uid()
  )
);
