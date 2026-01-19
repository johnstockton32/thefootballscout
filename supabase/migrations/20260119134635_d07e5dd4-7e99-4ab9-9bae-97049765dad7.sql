-- Add license tracking to teams table
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS license_count integer NOT NULL DEFAULT 10;

-- Add a comment explaining the column
COMMENT ON COLUMN public.teams.license_count IS 'Number of team member licenses available. Default 10, can purchase more.';

-- Create index for performance when querying teams by license count
CREATE INDEX IF NOT EXISTS idx_teams_license_count ON public.teams(license_count);