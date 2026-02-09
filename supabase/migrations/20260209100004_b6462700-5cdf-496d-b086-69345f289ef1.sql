-- Fix: Remove overly permissive promo_codes SELECT policy
-- Only admins should be able to read promo codes directly
-- The validate_promo_code RPC function uses SECURITY DEFINER so it doesn't need client SELECT access
DROP POLICY IF EXISTS "Anyone can read active promo codes" ON public.promo_codes;

-- Fix: Restrict super_admins table access to super admins only (not regular admins)
DROP POLICY IF EXISTS "Admins can read super admins" ON public.super_admins;

CREATE POLICY "Only super admins can read super_admins table"
ON public.super_admins
FOR SELECT
TO authenticated
USING (public.is_super_admin(auth.uid()));
