
-- Drop existing restrictive policies on promo_codes
DROP POLICY IF EXISTS "Only admins can manage promo codes" ON public.promo_codes;
DROP POLICY IF EXISTS "Only admins can read promo codes" ON public.promo_codes;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Admins can manage promo codes"
ON public.promo_codes
FOR ALL
USING (is_super_admin(auth.uid()) OR is_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()) OR is_admin(auth.uid()));
