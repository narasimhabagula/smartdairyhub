
-- Lock down PII columns at the column level so broad SELECT policies cannot leak them.
-- Apps must use RPCs (get_appointment_contact_phone, get_cattle_contact, get_vet_contact)
-- or the *_public views for browsing.

-- 1) appointments.contact_phone — vets must use get_appointment_contact_phone RPC
REVOKE SELECT (contact_phone) ON public.appointments FROM PUBLIC, anon, authenticated;
GRANT  SELECT (contact_phone) ON public.appointments TO service_role;

-- 2) cattle_listings phone columns (defense-in-depth re-revoke)
REVOKE SELECT (contact_phone, whatsapp_phone) ON public.cattle_listings FROM PUBLIC, anon, authenticated;
GRANT  SELECT (contact_phone, whatsapp_phone) ON public.cattle_listings TO service_role;

-- 3) vet_doctors phone/email (defense-in-depth re-revoke)
REVOKE SELECT (phone, email) ON public.vet_doctors FROM PUBLIC, anon, authenticated;
GRANT  SELECT (phone, email) ON public.vet_doctors TO service_role;

-- 4) dairy_companies sensitive fields — keep owner UI working by allowing owner reads
-- only through the dairy_companies_public view; revoke direct column access from anon.
REVOKE SELECT (email, phone, gst_number, registration_number, business_doc_url, rejection_reason)
  ON public.dairy_companies FROM PUBLIC, anon;
GRANT  SELECT (email, phone, gst_number, registration_number, business_doc_url, rejection_reason)
  ON public.dairy_companies TO service_role;
