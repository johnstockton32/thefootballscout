-- Fix RLS policies for profiles table - add explicit deny for anon and better protection
-- Drop existing policies that might be problematic
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Team owners can view team member profiles" ON public.profiles;
DROP POLICY IF EXISTS "Team admins can view their team members" ON public.profiles;
DROP POLICY IF EXISTS "Team admins can update their team members" ON public.profiles;
DROP POLICY IF EXISTS "Team owners can update team member profiles" ON public.profiles;

-- Recreate secure policies for profiles
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "Super admins can view all profiles" 
ON public.profiles FOR SELECT 
TO authenticated
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update all profiles" 
ON public.profiles FOR UPDATE 
TO authenticated
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Team owners can view team members" 
ON public.profiles FOR SELECT 
TO authenticated
USING (public.is_team_owner_of_profile(auth.uid(), team_id));

CREATE POLICY "Team admins can view team members" 
ON public.profiles FOR SELECT 
TO authenticated
USING (public.is_team_admin_of_profile(auth.uid(), team_id));

-- Fix push_subscriptions table - remove overly permissive service role policy
DROP POLICY IF EXISTS "Service role can read all subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can manage own subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can read own subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can delete own subscriptions" ON public.push_subscriptions;

-- Create secure push_subscriptions policies
CREATE POLICY "Users can read own push subscriptions" 
ON public.push_subscriptions FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own push subscriptions" 
ON public.push_subscriptions FOR INSERT 
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own push subscriptions" 
ON public.push_subscriptions FOR UPDATE 
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own push subscriptions" 
ON public.push_subscriptions FOR DELETE 
TO authenticated
USING (user_id = auth.uid());

-- Fix promo_codes table - restrict what authenticated users can see
DROP POLICY IF EXISTS "Authenticated users can validate specific promo codes" ON public.promo_codes;
DROP POLICY IF EXISTS "Admins can manage promo codes" ON public.promo_codes;

-- Create more restrictive promo code policies
CREATE POLICY "Only admins can read promo codes" 
ON public.promo_codes FOR SELECT 
TO authenticated
USING (public.is_super_admin(auth.uid()) OR public.is_admin(auth.uid()));

CREATE POLICY "Only admins can manage promo codes" 
ON public.promo_codes FOR ALL 
TO authenticated
USING (public.is_super_admin(auth.uid()) OR public.is_admin(auth.uid()));

-- Add shared scouting reports policy for team collaboration
DROP POLICY IF EXISTS "Team members can view team scouting reports" ON public.scouting_reports;

CREATE POLICY "Team members can view team scouting reports" 
ON public.scouting_reports FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles scout_profile
    JOIN public.profiles viewer_profile ON viewer_profile.team_id = scout_profile.team_id
    WHERE scout_profile.id = scout_id
    AND viewer_profile.id = auth.uid()
    AND scout_profile.team_id IS NOT NULL
  )
);

-- Add shared players policy for team collaboration  
DROP POLICY IF EXISTS "Team members can view team players" ON public.players;

CREATE POLICY "Team members can view team players" 
ON public.players FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles scout_profile
    JOIN public.profiles viewer_profile ON viewer_profile.team_id = scout_profile.team_id
    WHERE scout_profile.id = scout_id
    AND viewer_profile.id = auth.uid()
    AND scout_profile.team_id IS NOT NULL
  )
);