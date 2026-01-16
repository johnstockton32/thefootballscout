-- Fix promo code race condition by using atomic INSERT with exception handling
CREATE OR REPLACE FUNCTION public.redeem_promo_code(_code TEXT, _user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  promo_record RECORD;
  redemption_inserted BOOLEAN := false;
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

  -- Try to insert redemption atomically - handles race condition
  BEGIN
    INSERT INTO public.promo_code_redemptions (promo_code_id, user_id)
    VALUES (promo_record.id, _user_id);
    redemption_inserted := true;
  EXCEPTION
    WHEN unique_violation THEN
      -- User already redeemed this code - caught atomically
      RETURN json_build_object('success', false, 'error', 'You have already used this promo code');
  END;

  -- Only increment counter and apply benefits if insertion succeeded
  IF redemption_inserted THEN
    UPDATE public.promo_codes
    SET current_uses = current_uses + 1, updated_at = now()
    WHERE id = promo_record.id;

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
  END IF;

  RETURN json_build_object('success', false, 'error', 'Failed to redeem code');
END;
$function$;