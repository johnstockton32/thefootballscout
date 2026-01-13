-- Add trial tracking fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN trial_ends_at timestamp with time zone NULL;

ALTER TABLE public.profiles 
ADD COLUMN subscription_started_at timestamp with time zone NULL;

-- Function to check if user is in trial period
CREATE OR REPLACE FUNCTION public.is_in_trial(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = _user_id 
    AND subscription_tier = 'pro'
    AND trial_ends_at IS NOT NULL 
    AND trial_ends_at > now()
  )
$$;

-- Function to start a Pro trial (14 days)
CREATE OR REPLACE FUNCTION public.start_pro_trial(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow trial if user is on free plan and hasn't had a trial before
  IF EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = _user_id 
    AND subscription_tier = 'free'
    AND trial_ends_at IS NULL
  ) THEN
    UPDATE public.profiles 
    SET 
      subscription_tier = 'pro',
      trial_ends_at = now() + interval '14 days',
      subscription_started_at = now()
    WHERE id = _user_id;
    RETURN true;
  END IF;
  RETURN false;
END;
$$;

-- Function to upgrade subscription immediately
CREATE OR REPLACE FUNCTION public.upgrade_subscription(_user_id uuid, _tier subscription_tier)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles 
  SET 
    subscription_tier = _tier,
    trial_ends_at = NULL, -- Clear trial when upgrading
    subscription_started_at = COALESCE(subscription_started_at, now())
  WHERE id = _user_id;
  RETURN true;
END;
$$;

-- Function to cancel subscription (downgrade to free)
CREATE OR REPLACE FUNCTION public.cancel_subscription(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles 
  SET 
    subscription_tier = 'free',
    trial_ends_at = NULL,
    subscription_started_at = NULL
  WHERE id = _user_id;
  RETURN true;
END;
$$;