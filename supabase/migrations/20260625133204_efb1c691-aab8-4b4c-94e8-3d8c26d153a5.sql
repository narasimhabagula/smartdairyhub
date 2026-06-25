-- 1) Tighten profiles SELECT
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 2) Safe public view for seller display names (no phone, no PII beyond name)
CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = true) AS
SELECT user_id, full_name
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO authenticated, anon;

-- Allow the view to read names regardless of profiles SELECT policy by
-- adding a permissive RLS policy that exposes only the columns selected
-- through the security_invoker view. Since the view selects only safe
-- columns, this policy effectively scopes exposure to name display.
CREATE POLICY "Anyone authenticated can read display names"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- The line above intentionally re-enables broad SELECT; revert it and
-- instead expose names via a SECURITY DEFINER function used by the view.
DROP POLICY IF EXISTS "Anyone authenticated can read display names" ON public.profiles;

CREATE OR REPLACE FUNCTION public.get_display_names(_ids uuid[])
RETURNS TABLE(user_id uuid, full_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.full_name
  FROM public.profiles p
  WHERE p.user_id = ANY(_ids)
$$;

REVOKE ALL ON FUNCTION public.get_display_names(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_display_names(uuid[]) TO authenticated;

-- Drop the unused view to avoid confusion
DROP VIEW IF EXISTS public.public_profiles;

-- 3) Storage RLS for the private cattle-media bucket
-- Path convention: <userId>/<file>
CREATE POLICY "Owners can read cattle-media"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'cattle-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Owners can upload cattle-media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'cattle-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Owners can update cattle-media"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'cattle-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'cattle-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Owners can delete cattle-media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'cattle-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 4) Atomic stock decrement helper used by place-order
CREATE OR REPLACE FUNCTION public.decrement_product_stock(_product_id uuid, _qty integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_stock integer;
BEGIN
  SELECT stock INTO current_stock
  FROM public.products
  WHERE id = _product_id
  FOR UPDATE;

  IF current_stock IS NULL OR current_stock < _qty THEN
    RETURN false;
  END IF;

  UPDATE public.products
  SET stock = current_stock - _qty
  WHERE id = _product_id;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.decrement_product_stock(uuid, integer) FROM PUBLIC, authenticated, anon;
GRANT EXECUTE ON FUNCTION public.decrement_product_stock(uuid, integer) TO service_role;