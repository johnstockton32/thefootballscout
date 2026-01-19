-- Drop all overly permissive "Require authentication for X" policies that allow any authenticated user to read all data

-- Drop profiles overly permissive policy
DROP POLICY IF EXISTS "Require authentication for profiles" ON public.profiles;

-- Drop push_subscriptions overly permissive policy
DROP POLICY IF EXISTS "Require authentication for push_subscriptions" ON public.push_subscriptions;

-- Drop promo_codes overly permissive policy  
DROP POLICY IF EXISTS "Require authentication for promo_codes" ON public.promo_codes;

-- Drop user_roles overly permissive policy
DROP POLICY IF EXISTS "Require authentication for user_roles" ON public.user_roles;

-- Drop players overly permissive policy
DROP POLICY IF EXISTS "Require authentication for players" ON public.players;

-- Drop scouting_reports overly permissive policy
DROP POLICY IF EXISTS "Require authentication for scouting_reports" ON public.scouting_reports;

-- Drop watchlists overly permissive policy
DROP POLICY IF EXISTS "Require authentication for watchlists" ON public.watchlists;

-- Drop video_clips overly permissive policy
DROP POLICY IF EXISTS "Require authentication for video_clips" ON public.video_clips;

-- Drop ai_insights overly permissive policy
DROP POLICY IF EXISTS "Require authentication for ai_insights" ON public.ai_insights;

-- Drop team_activity overly permissive policy
DROP POLICY IF EXISTS "Require authentication for team_activity" ON public.team_activity;

-- Drop teams overly permissive policy
DROP POLICY IF EXISTS "Require authentication for teams" ON public.teams;

-- Drop report_templates overly permissive policy
DROP POLICY IF EXISTS "Require authentication for report_templates" ON public.report_templates;

-- Drop custom_attribute_weights overly permissive policy
DROP POLICY IF EXISTS "Require authentication for custom_attribute_weights" ON public.custom_attribute_weights;

-- Drop branding_settings overly permissive policy
DROP POLICY IF EXISTS "Require authentication for branding_settings" ON public.branding_settings;

-- Drop watchlist_players overly permissive policy
DROP POLICY IF EXISTS "Require authentication for watchlist_players" ON public.watchlist_players;

-- Drop promo_code_redemptions overly permissive policy
DROP POLICY IF EXISTS "Require authentication for promo_code_redemptions" ON public.promo_code_redemptions;

-- Drop saved_searches overly permissive policy
DROP POLICY IF EXISTS "Require authentication for saved_searches" ON public.saved_searches;

-- Drop super_admins overly permissive policy
DROP POLICY IF EXISTS "Require authentication for super_admins" ON public.super_admins;