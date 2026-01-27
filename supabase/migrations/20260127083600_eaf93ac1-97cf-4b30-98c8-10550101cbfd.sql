-- Create table to track processed license purchases (prevents double redemption)
CREATE TABLE public.license_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  stripe_session_id text UNIQUE NOT NULL,
  licenses_added integer NOT NULL,
  processed_at timestamp with time zone DEFAULT now() NOT NULL,
  processed_by uuid NOT NULL
);

-- Indexes for efficient lookups
CREATE INDEX idx_license_purchases_session ON public.license_purchases(stripe_session_id);
CREATE INDEX idx_license_purchases_team ON public.license_purchases(team_id);

-- Enable RLS
ALTER TABLE public.license_purchases ENABLE ROW LEVEL SECURITY;

-- RLS policies: Only team owners can view their purchase history
CREATE POLICY "Team owners can view their license purchases"
ON public.license_purchases
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.teams
    WHERE teams.id = license_purchases.team_id
    AND teams.owner_id = auth.uid()
  )
);

-- Atomic function to add licenses with idempotency check
CREATE OR REPLACE FUNCTION public.add_team_licenses(
  p_team_id uuid,
  p_licenses_to_add integer,
  p_stripe_session_id text,
  p_processed_by uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_count integer;
  v_new_count integer;
BEGIN
  -- Validate input
  IF p_licenses_to_add <= 0 THEN
    RAISE EXCEPTION 'licenses_to_add must be positive';
  END IF;
  
  -- Check if session already processed (with lock to prevent race conditions)
  IF EXISTS (
    SELECT 1 FROM license_purchases 
    WHERE stripe_session_id = p_stripe_session_id
    FOR UPDATE SKIP LOCKED
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'This purchase has already been processed'
    );
  END IF;
  
  -- Get current license count with lock
  SELECT license_count INTO v_current_count
  FROM teams
  WHERE id = p_team_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Team not found'
    );
  END IF;
  
  v_new_count := v_current_count + p_licenses_to_add;
  
  -- Update team license count
  UPDATE teams
  SET license_count = v_new_count, updated_at = now()
  WHERE id = p_team_id;
  
  -- Record the purchase (this will fail if session already exists due to UNIQUE constraint)
  INSERT INTO license_purchases (
    team_id,
    stripe_session_id,
    licenses_added,
    processed_by
  ) VALUES (
    p_team_id,
    p_stripe_session_id,
    p_licenses_to_add,
    p_processed_by
  );
  
  RETURN json_build_object(
    'success', true,
    'previous_count', v_current_count,
    'new_count', v_new_count,
    'added', p_licenses_to_add
  );
EXCEPTION
  WHEN unique_violation THEN
    -- Race condition: another request already processed this session
    RETURN json_build_object(
      'success', false,
      'error', 'This purchase has already been processed'
    );
END;
$$;