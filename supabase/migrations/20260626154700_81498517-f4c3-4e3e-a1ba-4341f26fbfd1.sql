
-- 1) cattle_listings: revoke direct phone column access for non-owners
REVOKE SELECT (contact_phone, whatsapp_phone) ON public.cattle_listings FROM authenticated, anon;
GRANT SELECT (contact_phone, whatsapp_phone) ON public.cattle_listings TO service_role;

-- 2) vet_doctors: revoke direct phone/email column access
REVOKE SELECT (phone, email) ON public.vet_doctors FROM authenticated, anon;
GRANT SELECT (phone, email) ON public.vet_doctors TO service_role;

-- 3) dairy_companies: defense-in-depth column revoke on sensitive fields
REVOKE SELECT (email, gst_number, registration_number, business_doc_url) ON public.dairy_companies FROM authenticated, anon;
GRANT SELECT (email, gst_number, registration_number, business_doc_url) ON public.dairy_companies TO service_role;

-- 4) appointments: tighten vet UPDATE policy with explicit WITH CHECK (trigger guard_appointment_updates enforces field-level restrictions)
DROP POLICY IF EXISTS "Vet updates assigned appointment" ON public.appointments;
CREATE POLICY "Vet updates assigned appointment"
  ON public.appointments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = vet_id)
  WITH CHECK (
    auth.uid() = vet_id
    AND status IN ('pending','accepted','rejected','completed','cancelled')
  );

-- Remove duplicate appointment guard trigger if present (keep one)
DROP TRIGGER IF EXISTS guard_appointment_updates_trg ON public.appointments;

-- 5) SECURITY DEFINER functions: revoke anon EXECUTE on help analytics RPCs
REVOKE EXECUTE ON FUNCTION public.get_top_help_searches(integer) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_top_help_faqs(integer) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_top_help_searches(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_top_help_faqs(integer) TO authenticated;

-- 6) images bucket: drop broad public SELECT (LIST) policy. Public file URLs still work via CDN without storage.objects SELECT.
DROP POLICY IF EXISTS "Public read images bucket" ON storage.objects;
