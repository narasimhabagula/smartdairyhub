
-- Restrict dairy_companies SELECT to owners and admins only
DROP POLICY IF EXISTS "Authenticated users can view dairy companies" ON public.dairy_companies;

CREATE POLICY "Owners and admins can view dairy companies"
  ON public.dairy_companies
  FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role));

REVOKE SELECT ON public.dairy_companies FROM anon;

-- Public-facing view exposing only safe business directory fields
-- (excludes gst_number, registration_number, business_doc_url, rejection_reason,
--  email, verification flags, reviewer fields, owner_id)
DROP VIEW IF EXISTS public.dairy_companies_public;
CREATE VIEW public.dairy_companies_public
WITH (security_invoker = on) AS
SELECT
  id,
  name,
  logo_url,
  description,
  address,
  village,
  district,
  state,
  pin_code,
  latitude,
  longitude,
  phone,
  working_hours,
  verified,
  created_at
FROM public.dairy_companies
WHERE verified = true OR verification_status = 'verified';

GRANT SELECT ON public.dairy_companies_public TO anon, authenticated;
