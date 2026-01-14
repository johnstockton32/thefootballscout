-- Create promo_codes table
CREATE TABLE public.promo_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_percent INTEGER DEFAULT 0,
  tier_upgrade subscription_tier DEFAULT NULL,
  max_uses INTEGER DEFAULT NULL,
  current_uses INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create promo_code_redemptions table to track who used what codes
CREATE TABLE public.promo_code_redemptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  promo_code_id UUID NOT NULL REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  redeemed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(promo_code_id, user_id)
);

-- Enable RLS
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_code_redemptions ENABLE ROW LEVEL SECURITY;

-- RLS: Anyone can read active promo codes (for validation)
CREATE POLICY "Anyone can read active promo codes"
ON public.promo_codes
FOR SELECT
USING (is_active = true);

-- RLS: Only admins can manage promo codes
CREATE POLICY "Admins can manage promo codes"
ON public.promo_codes
FOR ALL
USING (public.is_admin(auth.uid()));

-- RLS: Users can see their own redemptions
CREATE POLICY "Users can view their own redemptions"
ON public.promo_code_redemptions
FOR SELECT
USING (auth.uid() = user_id);

-- RLS: System can insert redemptions (via service role)
CREATE POLICY "System can insert redemptions"
ON public.promo_code_redemptions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Function to validate and redeem a promo code
CREATE OR REPLACE FUNCTION public.validate_promo_code(_code TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  promo_record RECORD;
  result JSON;
BEGIN
  -- Find the promo code (case insensitive)
  SELECT * INTO promo_record
  FROM public.promo_codes
  WHERE UPPER(code) = UPPER(_code)
  AND is_active = true;

  -- Check if code exists
  IF promo_record IS NULL THEN
    RETURN json_build_object('valid', false, 'error', 'Invalid promo code');
  END IF;

  -- Check if expired
  IF promo_record.expires_at IS NOT NULL AND promo_record.expires_at < now() THEN
    RETURN json_build_object('valid', false, 'error', 'Promo code has expired');
  END IF;

  -- Check if max uses reached
  IF promo_record.max_uses IS NOT NULL AND promo_record.current_uses >= promo_record.max_uses THEN
    RETURN json_build_object('valid', false, 'error', 'Promo code usage limit reached');
  END IF;

  -- Return valid response with benefits
  RETURN json_build_object(
    'valid', true,
    'code', promo_record.code,
    'description', promo_record.description,
    'discount_percent', promo_record.discount_percent,
    'tier_upgrade', promo_record.tier_upgrade
  );
END;
$function$;

-- Function to redeem a promo code after signup
CREATE OR REPLACE FUNCTION public.redeem_promo_code(_user_id UUID, _code TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  promo_record RECORD;
  already_redeemed BOOLEAN;
BEGIN
  -- Find the promo code
  SELECT * INTO promo_record
  FROM public.promo_codes
  WHERE UPPER(code) = UPPER(_code)
  AND is_active = true;

  IF promo_record IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid promo code');
  END IF;

  -- Check if expired
  IF promo_record.expires_at IS NOT NULL AND promo_record.expires_at < now() THEN
    RETURN json_build_object('success', false, 'error', 'Promo code has expired');
  END IF;

  -- Check if max uses reached
  IF promo_record.max_uses IS NOT NULL AND promo_record.current_uses >= promo_record.max_uses THEN
    RETURN json_build_object('success', false, 'error', 'Promo code usage limit reached');
  END IF;

  -- Check if user already redeemed this code
  SELECT EXISTS(
    SELECT 1 FROM public.promo_code_redemptions
    WHERE promo_code_id = promo_record.id AND user_id = _user_id
  ) INTO already_redeemed;

  IF already_redeemed THEN
    RETURN json_build_object('success', false, 'error', 'You have already used this promo code');
  END IF;

  -- Record the redemption
  INSERT INTO public.promo_code_redemptions (promo_code_id, user_id)
  VALUES (promo_record.id, _user_id);

  -- Increment usage count
  UPDATE public.promo_codes
  SET current_uses = current_uses + 1, updated_at = now()
  WHERE id = promo_record.id;

  -- Apply tier upgrade if specified
  IF promo_record.tier_upgrade IS NOT NULL THEN
    UPDATE public.profiles
    SET subscription_tier = promo_record.tier_upgrade,
        subscription_started_at = COALESCE(subscription_started_at, now())
    WHERE id = _user_id;
  END IF;

  RETURN json_build_object(
    'success', true,
    'tier_upgrade', promo_record.tier_upgrade,
    'discount_percent', promo_record.discount_percent
  );
END;
$function$;

-- Add trigger for updated_at
CREATE TRIGGER update_promo_codes_updated_at
BEFORE UPDATE ON public.promo_codes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample promo codes for testing
INSERT INTO public.promo_codes (code, description, tier_upgrade, max_uses) VALUES
('WELCOME2025', 'Welcome offer - Free Pro upgrade', 'pro', 100),
('SCOUT50', '50% off first month', NULL, 50),
('TEAMTRIAL', 'Free Team tier trial', 'team', 25);