
ALTER TABLE public.vet_doctors
  ADD COLUMN IF NOT EXISTS hospital_name text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS district text,
  ADD COLUMN IF NOT EXISTS village text,
  ADD COLUMN IF NOT EXISTS google_maps_url text,
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision,
  ADD COLUMN IF NOT EXISTS suggested_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'approved';

ALTER TABLE public.vet_doctors
  DROP CONSTRAINT IF EXISTS vet_doctors_status_check;
ALTER TABLE public.vet_doctors
  ADD CONSTRAINT vet_doctors_status_check
  CHECK (status IN ('pending','approved','rejected'));

ALTER TABLE public.vet_doctors
  DROP CONSTRAINT IF EXISTS vet_doctors_phone_format;
ALTER TABLE public.vet_doctors
  ADD CONSTRAINT vet_doctors_phone_format
  CHECK (phone ~ '^\+91[6-9][0-9]{9}$');

CREATE INDEX IF NOT EXISTS vet_doctors_status_idx ON public.vet_doctors(status);
CREATE INDEX IF NOT EXISTS vet_doctors_district_idx ON public.vet_doctors(district);

DROP POLICY IF EXISTS "Anyone can view available vets" ON public.vet_doctors;
DROP POLICY IF EXISTS "Public can view approved vets" ON public.vet_doctors;
DROP POLICY IF EXISTS "Users can view own suggestions" ON public.vet_doctors;
DROP POLICY IF EXISTS "Authenticated can suggest vets" ON public.vet_doctors;
DROP POLICY IF EXISTS "Admins can manage vets" ON public.vet_doctors;

CREATE POLICY "Public can view approved vets"
  ON public.vet_doctors FOR SELECT
  USING (status = 'approved' AND available = true);

CREATE POLICY "Users can view own suggestions"
  ON public.vet_doctors FOR SELECT
  TO authenticated
  USING (auth.uid() = suggested_by);

CREATE POLICY "Authenticated can suggest vets"
  ON public.vet_doctors FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = suggested_by AND status = 'pending');

CREATE POLICY "Admins can manage vets"
  ON public.vet_doctors FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT SELECT ON public.vet_doctors TO anon;
GRANT SELECT, INSERT ON public.vet_doctors TO authenticated;
GRANT ALL ON public.vet_doctors TO service_role;
