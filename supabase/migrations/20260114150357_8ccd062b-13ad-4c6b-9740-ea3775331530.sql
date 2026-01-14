-- Drop the policy that exposes promo codes to public
DROP POLICY IF EXISTS "Anyone can read active promo codes" ON public.promo_codes;

-- Add policy allowing only authenticated users to validate codes
-- (Note: The actual validation and redemption happens through SECURITY DEFINER functions
-- validate_promo_code and redeem_promo_code, which bypass RLS)
CREATE POLICY "Authenticated users can validate promo codes"
ON public.promo_codes
FOR SELECT
TO authenticated
USING (is_active = true);