CREATE POLICY "Anyone can view approved vets"
  ON public.vet_doctors FOR SELECT
  TO anon, authenticated
  USING (status = 'approved');

GRANT SELECT (
  id, name, qualification, specialization, location, hospital_name, address,
  district, village, google_maps_url, latitude, longitude, rating,
  total_ratings, available, status, suggested_by, created_at, updated_at
) ON public.vet_doctors TO anon, authenticated;

GRANT SELECT ON public.vet_doctors_public TO anon, authenticated;