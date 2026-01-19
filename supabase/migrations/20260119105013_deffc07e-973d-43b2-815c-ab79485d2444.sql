-- Add base authentication policies to all tables to block anonymous access
-- These PERMISSIVE policies ensure auth.uid() IS NOT NULL before RESTRICTIVE policies are evaluated

-- Profiles table - error level
CREATE POLICY "Require authentication for profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- User roles table - error level  
CREATE POLICY "Require authentication for user_roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (true);

-- Promo codes table - error level
CREATE POLICY "Require authentication for promo_codes"
  ON public.promo_codes FOR SELECT
  TO authenticated
  USING (true);

-- Super admins table - error level
CREATE POLICY "Require authentication for super_admins"
  ON public.super_admins FOR SELECT
  TO authenticated
  USING (true);

-- Promo code redemptions table - warn level
CREATE POLICY "Require authentication for promo_code_redemptions"
  ON public.promo_code_redemptions FOR SELECT
  TO authenticated
  USING (true);

-- Players table - warn level
CREATE POLICY "Require authentication for players"
  ON public.players FOR SELECT
  TO authenticated
  USING (true);

-- Scouting reports table - warn level
CREATE POLICY "Require authentication for scouting_reports"
  ON public.scouting_reports FOR SELECT
  TO authenticated
  USING (true);

-- Teams table - warn level
CREATE POLICY "Require authentication for teams"
  ON public.teams FOR SELECT
  TO authenticated
  USING (true);

-- Team activity table - warn level
CREATE POLICY "Require authentication for team_activity"
  ON public.team_activity FOR SELECT
  TO authenticated
  USING (true);

-- Watchlists table - warn level
CREATE POLICY "Require authentication for watchlists"
  ON public.watchlists FOR SELECT
  TO authenticated
  USING (true);

-- Watchlist players table - warn level
CREATE POLICY "Require authentication for watchlist_players"
  ON public.watchlist_players FOR SELECT
  TO authenticated
  USING (true);

-- Video clips table - warn level
CREATE POLICY "Require authentication for video_clips"
  ON public.video_clips FOR SELECT
  TO authenticated
  USING (true);

-- AI insights table - warn level
CREATE POLICY "Require authentication for ai_insights"
  ON public.ai_insights FOR SELECT
  TO authenticated
  USING (true);

-- Report templates table - info level
CREATE POLICY "Require authentication for report_templates"
  ON public.report_templates FOR SELECT
  TO authenticated
  USING (true);

-- Custom attribute weights table - info level
CREATE POLICY "Require authentication for custom_attribute_weights"
  ON public.custom_attribute_weights FOR SELECT
  TO authenticated
  USING (true);

-- Branding settings table - info level
CREATE POLICY "Require authentication for branding_settings"
  ON public.branding_settings FOR SELECT
  TO authenticated
  USING (true);

-- Saved searches table - info level
CREATE POLICY "Require authentication for saved_searches"
  ON public.saved_searches FOR SELECT
  TO authenticated
  USING (true);

-- Push subscriptions table - info level
CREATE POLICY "Require authentication for push_subscriptions"
  ON public.push_subscriptions FOR SELECT
  TO authenticated
  USING (true);