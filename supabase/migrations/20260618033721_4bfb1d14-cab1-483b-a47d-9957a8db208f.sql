
-- 1. Cattle listings: require authentication to view (protects contact_phone)
DROP POLICY IF EXISTS "Anyone can view active cattle" ON public.cattle_listings;
CREATE POLICY "Authenticated users can view active cattle"
  ON public.cattle_listings
  FOR SELECT
  TO authenticated
  USING (
    status = 'active'
    OR auth.uid() = seller_id
    OR public.has_role(auth.uid(), 'admin')
  );

-- 2. user_roles: prevent privilege escalation. Replace ALL policy with explicit ones.
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

CREATE POLICY "Admins can insert roles"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
  ON public.user_roles
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 3. order_items: deny update/delete explicitly (orders immutable after placement)
CREATE POLICY "Order items cannot be updated"
  ON public.order_items
  FOR UPDATE
  TO authenticated
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Order items cannot be deleted"
  ON public.order_items
  FOR DELETE
  TO authenticated
  USING (false);

-- 4. Storage: remove broad listing policy on the images bucket
DROP POLICY IF EXISTS "Anyone can view images" ON storage.objects;

-- 5. Lock down SECURITY DEFINER helper/trigger functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
-- has_role is still needed inside RLS for authenticated users
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
