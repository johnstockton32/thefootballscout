
-- 1) user_roles: replace admin-managed policies with super_admin-only
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

CREATE POLICY "Super admins can view all roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can insert roles"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update roles"
  ON public.user_roles FOR UPDATE TO authenticated
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can delete roles"
  ON public.user_roles FOR DELETE TO authenticated
  USING (public.is_super_admin(auth.uid()));

-- 2) contact_messages: restrict insert to authenticated role
DROP POLICY IF EXISTS "Authenticated users can submit messages" ON public.contact_messages;
CREATE POLICY "Authenticated users can submit messages"
  ON public.contact_messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 3) feature_feedback: restrict insert to authenticated role
DROP POLICY IF EXISTS "Users can submit feedback" ON public.feature_feedback;
CREATE POLICY "Users can submit feedback"
  ON public.feature_feedback FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 4) Avatars: remove public read policy (app uses signed URLs)
DROP POLICY IF EXISTS "Avatars are publicly accessible" ON storage.objects;

-- 5) promo_codes: scope admin policy to authenticated role explicitly
DROP POLICY IF EXISTS "Admins can manage promo codes" ON public.promo_codes;
CREATE POLICY "Admins can manage promo codes"
  ON public.promo_codes FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.is_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()) OR public.is_admin(auth.uid()));
