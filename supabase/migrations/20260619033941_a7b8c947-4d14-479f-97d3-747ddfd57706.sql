ALTER TABLE public.cattle_listings
  ADD COLUMN IF NOT EXISTS district TEXT,
  ADD COLUMN IF NOT EXISTS village TEXT;

ALTER TABLE public.cattle_listings
  DROP CONSTRAINT IF EXISTS cattle_listings_contact_phone_format;

ALTER TABLE public.cattle_listings
  ADD CONSTRAINT cattle_listings_contact_phone_format
  CHECK (contact_phone IS NULL OR contact_phone ~ '^\+91[6-9][0-9]{9}$')
  NOT VALID;