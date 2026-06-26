
REVOKE SELECT (contact_phone, whatsapp_phone) ON public.cattle_listings FROM anon, authenticated;

CREATE OR REPLACE VIEW public.cattle_listings_public
WITH (security_invoker = true) AS
SELECT
  id, seller_id, name, breed, type, age, milk_yield, price, location,
  description, image_url, status, listing_type, created_at, updated_at,
  district, village, photos, video_url, state, vaccination_status,
  health_status, attrs, negotiable, gps_lat, gps_lng, quantity, weight
FROM public.cattle_listings;

GRANT SELECT ON public.cattle_listings_public TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_own_cattle_listing(_listing_id uuid)
RETURNS SETOF public.cattle_listings
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT * FROM public.cattle_listings
  WHERE id = _listing_id AND seller_id = auth.uid()
$$;
REVOKE EXECUTE ON FUNCTION public.get_own_cattle_listing(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_own_cattle_listing(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_cattle_contact(_listing_id uuid)
RETURNS TABLE(contact_phone text, whatsapp_phone text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT cl.contact_phone, cl.whatsapp_phone
  FROM public.cattle_listings cl
  WHERE cl.id = _listing_id
    AND auth.uid() IS NOT NULL
    AND (cl.status = 'active' OR cl.seller_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role))
$$;
REVOKE EXECUTE ON FUNCTION public.get_cattle_contact(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_cattle_contact(uuid) TO authenticated;

REVOKE SELECT (phone, email) ON public.vet_doctors FROM anon, authenticated;

CREATE OR REPLACE VIEW public.vet_doctors_public
WITH (security_invoker = true) AS
SELECT
  id, name, qualification, specialization, location, hospital_name,
  address, district, village, google_maps_url, latitude, longitude,
  rating, total_ratings, available, status, suggested_by,
  created_at, updated_at
FROM public.vet_doctors;

GRANT SELECT ON public.vet_doctors_public TO anon, authenticated;

DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
CREATE POLICY "Admins can create orders" ON public.orders
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects' AND policyname='Public read images bucket'
  ) THEN
    CREATE POLICY "Public read images bucket" ON storage.objects FOR SELECT USING (bucket_id = 'images');
  END IF;
END $$;
