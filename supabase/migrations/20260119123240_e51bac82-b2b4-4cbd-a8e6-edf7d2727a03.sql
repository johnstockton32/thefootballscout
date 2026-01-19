-- Add is_private column to scouting_reports
ALTER TABLE public.scouting_reports
ADD COLUMN is_private boolean NOT NULL DEFAULT false;

-- Drop the existing team members view policy
DROP POLICY IF EXISTS "Team members can view team scouting reports" ON public.scouting_reports;

-- Create new policy: Team members can view team reports ONLY if not private
-- This requires the viewer to be on the team tier AND the report is not marked private
CREATE POLICY "Team members can view team reports if not private"
  ON public.scouting_reports FOR SELECT
  USING (
    -- Report owner can always see their own reports
    auth.uid() = scout_id
    OR
    -- Team members can see non-private reports from teammates IF viewer is on team tier
    (
      is_private = false
      AND EXISTS (
        SELECT 1
        FROM profiles scout_profile
        JOIN profiles viewer_profile ON viewer_profile.team_id = scout_profile.team_id
        WHERE scout_profile.id = scouting_reports.scout_id
          AND viewer_profile.id = auth.uid()
          AND scout_profile.team_id IS NOT NULL
          AND viewer_profile.subscription_tier = 'team'
      )
    )
  );

-- Drop the old "Scouts can view their own reports" policy since we now have combined logic
DROP POLICY IF EXISTS "Scouts can view their own reports" ON public.scouting_reports;

-- Add comment for documentation
COMMENT ON COLUMN public.scouting_reports.is_private IS 'When true, report is only visible to the owner even within a team';