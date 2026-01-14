-- Fix SECURITY DEFINER functions to require auth.uid() authorization
-- This prevents any authenticated user from modifying another user's subscription

CREATE OR REPLACE FUNCTION public.start_pro_trial(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow users to modify their own subscription
  IF auth.uid() IS NULL OR auth.uid() != _user_id THEN
    RAISE EXCEPTION 'Unauthorized: You can only start your own trial';
  END IF;
  
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

CREATE OR REPLACE FUNCTION public.upgrade_subscription(_user_id uuid, _tier subscription_tier)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow users to modify their own subscription
  IF auth.uid() IS NULL OR auth.uid() != _user_id THEN
    RAISE EXCEPTION 'Unauthorized: You can only upgrade your own subscription';
  END IF;
  
  UPDATE public.profiles 
  SET 
    subscription_tier = _tier,
    trial_ends_at = NULL,
    subscription_started_at = COALESCE(subscription_started_at, now())
  WHERE id = _user_id;
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_subscription(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow users to modify their own subscription
  IF auth.uid() IS NULL OR auth.uid() != _user_id THEN
    RAISE EXCEPTION 'Unauthorized: You can only cancel your own subscription';
  END IF;
  
  UPDATE public.profiles 
  SET 
    subscription_tier = 'free',
    trial_ends_at = NULL,
    subscription_started_at = NULL
  WHERE id = _user_id;
  RETURN true;
END;
$$;