-- Add DELETE policies for admins on profiles table
CREATE POLICY "Admins can delete any profile"
ON public.profiles
FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));

-- Add full admin policies for teams
CREATE POLICY "Admins can view all teams"
ON public.teams
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update any team"
ON public.teams
FOR UPDATE
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can delete any team"
ON public.teams
FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));

-- Add DELETE policies for admins on players
CREATE POLICY "Admins can delete any player"
ON public.players
FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update any player"
ON public.players
FOR UPDATE
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Add DELETE policies for admins on scouting_reports
CREATE POLICY "Admins can delete any report"
ON public.scouting_reports
FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update any report"
ON public.scouting_reports
FOR UPDATE
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Add admin policies for watchlists
CREATE POLICY "Admins can view all watchlists"
ON public.watchlists
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete any watchlist"
ON public.watchlists
FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));

-- Add admin policies for video_clips
CREATE POLICY "Admins can view all video clips"
ON public.video_clips
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete any video clip"
ON public.video_clips
FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));

-- Add admin policies for ai_insights
CREATE POLICY "Admins can view all AI insights"
ON public.ai_insights
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete any AI insight"
ON public.ai_insights
FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));

-- Add admin policies for team_activity
CREATE POLICY "Admins can view all team activity"
ON public.team_activity
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

-- Add policies for promo code redemptions
CREATE POLICY "Admins can view all redemptions"
ON public.promo_code_redemptions
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete any redemption"
ON public.promo_code_redemptions
FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));