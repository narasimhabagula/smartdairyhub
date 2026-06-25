
-- 1) Storage: scope image uploads to caller's folder
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'images'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- 2) Orders: restrict buyer UPDATE
DROP POLICY IF EXISTS "Users can update own orders" ON public.orders;
CREATE POLICY "Users can update own orders"
ON public.orders FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (auth.uid() = buyer_id AND status = 'pending')
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR (auth.uid() = buyer_id AND status = 'pending')
);

CREATE OR REPLACE FUNCTION public.guard_order_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RETURN NEW;
  END IF;
  IF NEW.buyer_id IS DISTINCT FROM OLD.buyer_id
     OR NEW.total IS DISTINCT FROM OLD.total
     OR NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'Not allowed to modify buyer_id, total, or status';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.guard_order_updates() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS guard_order_updates_trg ON public.orders;
CREATE TRIGGER guard_order_updates_trg
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.guard_order_updates();

-- 3) Vet doctors: hide email/phone from regular authenticated readers via column privileges
REVOKE SELECT ON public.vet_doctors FROM authenticated;
GRANT SELECT (
  id, name, qualification, specialization, location, rating, total_ratings,
  image_url, available, created_at, updated_at, hospital_name, address,
  district, village, google_maps_url, latitude, longitude, suggested_by, status
) ON public.vet_doctors TO authenticated;

CREATE OR REPLACE FUNCTION public.get_vet_contact(_vet_id uuid)
RETURNS TABLE(email text, phone text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT v.email, v.phone
  FROM public.vet_doctors v
  WHERE v.id = _vet_id
    AND (
      public.has_role(auth.uid(), 'admin'::public.app_role)
      OR v.suggested_by = auth.uid()
    )
$$;
REVOKE EXECUTE ON FUNCTION public.get_vet_contact(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_vet_contact(uuid) TO authenticated;

-- 4) Lock down get_display_names from anonymous callers
REVOKE EXECUTE ON FUNCTION public.get_display_names(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_display_names(uuid[]) TO authenticated;
