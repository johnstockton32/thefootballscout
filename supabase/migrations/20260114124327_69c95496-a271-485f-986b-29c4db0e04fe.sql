-- Fix AI insights cross-reference validation
-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Users can create AI insights" ON public.ai_insights;

-- Create new INSERT policy that validates player_id and report_id belong to the user
CREATE POLICY "Users can create AI insights" 
ON public.ai_insights 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (
    player_id IS NULL 
    OR EXISTS (
      SELECT 1 FROM public.players 
      WHERE players.id = player_id 
      AND players.scout_id = auth.uid()
    )
  )
  AND (
    report_id IS NULL 
    OR EXISTS (
      SELECT 1 FROM public.scouting_reports 
      WHERE scouting_reports.id = report_id 
      AND scouting_reports.scout_id = auth.uid()
    )
  )
);

-- Also update SELECT and DELETE policies to use TO authenticated
DROP POLICY IF EXISTS "Users can view their AI insights" ON public.ai_insights;
DROP POLICY IF EXISTS "Users can delete their AI insights" ON public.ai_insights;

CREATE POLICY "Users can view their AI insights" 
ON public.ai_insights 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their AI insights" 
ON public.ai_insights 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);