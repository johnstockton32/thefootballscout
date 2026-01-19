-- Add PERMISSIVE base authentication policies to all tables
-- These ensure no unauthenticated access is possible

-- profiles table
CREATE POLICY "Base auth required for profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);

-- user_roles table  
CREATE POLICY "Base auth required for user_roles" ON public.user_roles
  FOR SELECT TO authenticated USING (true);

-- players table
CREATE POLICY "Base auth required for players" ON public.players
  FOR SELECT TO authenticated USING (true);

-- scouting_reports table
CREATE POLICY "Base auth required for scouting_reports" ON public.scouting_reports
  FOR SELECT TO authenticated USING (true);

-- watchlists table
CREATE POLICY "Base auth required for watchlists" ON public.watchlists
  FOR SELECT TO authenticated USING (true);

-- watchlist_players table
CREATE POLICY "Base auth required for watchlist_players" ON public.watchlist_players
  FOR SELECT TO authenticated USING (true);

-- video_clips table
CREATE POLICY "Base auth required for video_clips" ON public.video_clips
  FOR SELECT TO authenticated USING (true);

-- ai_insights table
CREATE POLICY "Base auth required for ai_insights" ON public.ai_insights
  FOR SELECT TO authenticated USING (true);

-- team_activity table
CREATE POLICY "Base auth required for team_activity" ON public.team_activity
  FOR SELECT TO authenticated USING (true);

-- teams table
CREATE POLICY "Base auth required for teams" ON public.teams
  FOR SELECT TO authenticated USING (true);

-- report_templates table
CREATE POLICY "Base auth required for report_templates" ON public.report_templates
  FOR SELECT TO authenticated USING (true);

-- custom_attribute_weights table
CREATE POLICY "Base auth required for custom_attribute_weights" ON public.custom_attribute_weights
  FOR SELECT TO authenticated USING (true);

-- branding_settings table
CREATE POLICY "Base auth required for branding_settings" ON public.branding_settings
  FOR SELECT TO authenticated USING (true);

-- promo_codes table
CREATE POLICY "Base auth required for promo_codes" ON public.promo_codes
  FOR SELECT TO authenticated USING (true);

-- promo_code_redemptions table
CREATE POLICY "Base auth required for promo_code_redemptions" ON public.promo_code_redemptions
  FOR SELECT TO authenticated USING (true);

-- saved_searches table
CREATE POLICY "Base auth required for saved_searches" ON public.saved_searches
  FOR SELECT TO authenticated USING (true);

-- super_admins table
CREATE POLICY "Base auth required for super_admins" ON public.super_admins
  FOR SELECT TO authenticated USING (true);

-- push_subscriptions table
CREATE POLICY "Base auth required for push_subscriptions" ON public.push_subscriptions
  FOR SELECT TO authenticated USING (true);