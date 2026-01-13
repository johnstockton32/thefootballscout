-- Create subscription tier enum
CREATE TYPE public.subscription_tier AS ENUM ('free', 'pro', 'team');

-- Add subscription_tier to profiles table
ALTER TABLE public.profiles 
ADD COLUMN subscription_tier public.subscription_tier NOT NULL DEFAULT 'free';

-- Add team_id for team plan users
ALTER TABLE public.profiles 
ADD COLUMN team_id uuid NULL;

-- Create teams table for Team plan subscribers
CREATE TABLE public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on teams
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Team policies
CREATE POLICY "Team owners can manage their team"
ON public.teams
FOR ALL
USING (auth.uid() = owner_id);

CREATE POLICY "Team members can view their team"
ON public.teams
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.team_id = teams.id 
    AND profiles.id = auth.uid()
  )
);

-- Add foreign key for team_id
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_team_id_fkey 
FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE SET NULL;

-- Function to get user's subscription tier
CREATE OR REPLACE FUNCTION public.get_subscription_tier(_user_id uuid)
RETURNS public.subscription_tier
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT subscription_tier 
  FROM public.profiles 
  WHERE id = _user_id
$$;

-- Function to get player count for a user
CREATE OR REPLACE FUNCTION public.get_player_count(_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM public.players
  WHERE scout_id = _user_id
$$;

-- Function to get monthly report count for a user
CREATE OR REPLACE FUNCTION public.get_monthly_report_count(_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM public.scouting_reports
  WHERE scout_id = _user_id
  AND created_at >= date_trunc('month', CURRENT_DATE)
$$;

-- Function to check if user can create a player (enforces limits)
CREATE OR REPLACE FUNCTION public.can_create_player(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN public.get_subscription_tier(_user_id) IN ('pro', 'team') THEN true
    WHEN public.get_player_count(_user_id) < 10 THEN true
    ELSE false
  END
$$;

-- Function to check if user can create a report (enforces limits)
CREATE OR REPLACE FUNCTION public.can_create_report(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN public.get_subscription_tier(_user_id) IN ('pro', 'team') THEN true
    WHEN public.get_monthly_report_count(_user_id) < 5 THEN true
    ELSE false
  END
$$;

-- Function to get max players allowed for comparison
CREATE OR REPLACE FUNCTION public.get_comparison_limit(_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE public.get_subscription_tier(_user_id)
    WHEN 'free' THEN 2
    WHEN 'pro' THEN 5
    WHEN 'team' THEN 5
    ELSE 2
  END
$$;

-- Update players insert policy to check limits
DROP POLICY IF EXISTS "Scouts can create players" ON public.players;

CREATE POLICY "Scouts can create players within limits"
ON public.players
FOR INSERT
WITH CHECK (
  auth.uid() = scout_id 
  AND public.can_create_player(auth.uid())
);

-- Update scouting_reports insert policy to check limits
DROP POLICY IF EXISTS "Scouts can create reports" ON public.scouting_reports;

CREATE POLICY "Scouts can create reports within limits"
ON public.scouting_reports
FOR INSERT
WITH CHECK (
  auth.uid() = scout_id 
  AND public.can_create_report(auth.uid())
);

-- Add trigger for teams updated_at
CREATE TRIGGER update_teams_updated_at
BEFORE UPDATE ON public.teams
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();