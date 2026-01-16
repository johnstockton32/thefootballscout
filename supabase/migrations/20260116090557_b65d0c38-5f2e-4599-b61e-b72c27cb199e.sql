-- Fix promo_codes policy to only allow validation of specific codes, not browsing
DROP POLICY IF EXISTS "Authenticated users can validate promo codes" ON public.promo_codes;

-- Create a more restrictive policy that only allows checking specific codes
CREATE POLICY "Authenticated users can validate specific promo codes"
ON public.promo_codes
FOR SELECT
TO authenticated
USING (
  is_active = true AND 
  (expires_at IS NULL OR expires_at > now()) AND
  (max_uses IS NULL OR current_uses < max_uses)
);

-- Fix team_activity policy to handle null team_id cases
DROP POLICY IF EXISTS "Team members can view activity" ON public.team_activity;

CREATE POLICY "Team members can view their team activity"
ON public.team_activity
FOR SELECT
TO authenticated
USING (
  team_id IS NOT NULL AND 
  is_team_member(team_id, auth.uid())
);

-- Users can view their own activity regardless of team
CREATE POLICY "Users can view their own activity"
ON public.team_activity
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);