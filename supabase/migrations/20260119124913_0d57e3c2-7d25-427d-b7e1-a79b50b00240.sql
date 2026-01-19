-- Fix the "Base auth required" policies that are causing data leakage
-- These policies allow ALL authenticated users to see ALL data which is wrong

-- Drop the problematic policies for players
DROP POLICY IF EXISTS "Base auth required for players" ON public.players;

-- Drop the problematic policies for scouting_reports  
DROP POLICY IF EXISTS "Base auth required for scouting_reports" ON public.scouting_reports;