
REVOKE SELECT ON public.vet_doctors FROM authenticated, anon;
GRANT SELECT (
  id, name, qualification, specialization, hospital_name, address, village,
  district, location, latitude, longitude, google_maps_url, image_url, available,
  rating, total_ratings, status, suggested_by, created_at, updated_at
) ON public.vet_doctors TO authenticated;
GRANT ALL ON public.vet_doctors TO service_role;

DROP POLICY IF EXISTS "Anyone can view ratings" ON public.vet_ratings;
CREATE POLICY "Authenticated users can view ratings"
  ON public.vet_ratings FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can insert order items" ON public.order_items;
CREATE POLICY "Users can insert order items"
  ON public.order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND o.buyer_id = auth.uid()
        AND o.status = 'pending'
    )
  );
