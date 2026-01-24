-- Security hardening: Remove overly permissive "Base auth required" policies
-- These policies allow any authenticated user to read data they shouldn't access

-- Drop the overly permissive base policies
DROP POLICY IF EXISTS "Base auth required for profiles" ON public.profiles;
DROP POLICY IF EXISTS "Base auth required for push_subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Base auth required for promo_codes" ON public.promo_codes;
DROP POLICY IF EXISTS "Base auth required for user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Base auth required for super_admins" ON public.super_admins;
DROP POLICY IF EXISTS "Base auth required for team_activity" ON public.team_activity;
DROP POLICY IF EXISTS "Base auth required for promo_code_redemptions" ON public.promo_code_redemptions;
DROP POLICY IF EXISTS "Base auth required for branding_settings" ON public.branding_settings;
DROP POLICY IF EXISTS "Base auth required for custom_attribute_weights" ON public.custom_attribute_weights;
DROP POLICY IF EXISTS "Base auth required for ai_insights" ON public.ai_insights;
DROP POLICY IF EXISTS "Base auth required for report_templates" ON public.report_templates;
DROP POLICY IF EXISTS "Base auth required for saved_searches" ON public.saved_searches;
DROP POLICY IF EXISTS "Base auth required for video_clips" ON public.video_clips;
DROP POLICY IF EXISTS "Base auth required for watchlists" ON public.watchlists;
DROP POLICY IF EXISTS "Base auth required for watchlist_players" ON public.watchlist_players;
DROP POLICY IF EXISTS "Base auth required for teams" ON public.teams;