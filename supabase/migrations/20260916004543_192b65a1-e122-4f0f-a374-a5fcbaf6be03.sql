-- Real clinic opening hours for directory vets
ALTER TABLE public.vet_doctors
  ADD COLUMN IF NOT EXISTS opening_hours jsonb,
  ADD COLUMN IF NOT EXISTS consultation_fee numeric,
  ADD COLUMN IF NOT EXISTS experience_years integer,
  ADD COLUMN IF NOT EXISTS bio text;

-- Allow booking a directory clinic that is not an app user
ALTER TABLE public.appointments
  ALTER COLUMN vet_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS directory_vet_id uuid REFERENCES public.vet_doctors(id) ON DELETE SET NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.appointments'::regclass AND conname = 'appointments_target_present'
  ) THEN
    ALTER TABLE public.appointments
      ADD CONSTRAINT appointments_target_present
      CHECK (vet_id IS NOT NULL OR directory_vet_id IS NOT NULL);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS appointments_directory_vet_id_idx
  ON public.appointments (directory_vet_id);

-- Expose the new public-safe fields through the directory view
DROP VIEW IF EXISTS public.vet_doctors_public;
CREATE VIEW public.vet_doctors_public
WITH (security_invoker = true)
AS
SELECT id, name, qualification, specialization, location, hospital_name, address,
       district, village, google_maps_url, latitude, longitude, rating, total_ratings,
       available, status, suggested_by, opening_hours, consultation_fee,
       experience_years, bio, image_url, created_at, updated_at
FROM public.vet_doctors
WHERE status = 'approved';

GRANT SELECT ON public.vet_doctors_public TO anon, authenticated;
GRANT SELECT (id, name, qualification, specialization, location, hospital_name, address,
       district, village, google_maps_url, latitude, longitude, rating, total_ratings,
       available, status, suggested_by, opening_hours, consultation_fee,
       experience_years, bio, image_url, created_at, updated_at)
  ON public.vet_doctors TO anon, authenticated;