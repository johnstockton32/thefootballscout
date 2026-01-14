-- Drop existing SELECT policies on profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Team owners can view their team members" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Recreate SELECT policies with explicit TO authenticated
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Team owners can view their team members" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING ((team_id IS NOT NULL) AND is_team_owner_of_profile(auth.uid(), team_id));

CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = id);

-- Also update INSERT and UPDATE policies for consistency
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Team owners can update member roles" ON public.profiles;

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Team owners can update member roles" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (is_team_owner_of_profile(auth.uid(), team_id))
WITH CHECK (is_team_owner_of_profile(auth.uid(), team_id));