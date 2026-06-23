
-- Restrict profile and vet directory contact data to authenticated users
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Public can view approved vets" ON public.vet_doctors;
CREATE POLICY "Authenticated users can view approved vets"
  ON public.vet_doctors
  FOR SELECT
  TO authenticated
  USING (status = 'approved' AND available = true);

REVOKE SELECT ON public.profiles FROM anon;
REVOKE SELECT ON public.vet_doctors FROM anon;
