
-- 1) Storage: remove public listing/select on images bucket. Bucket remains public for direct CDN reads via public URLs.
DROP POLICY IF EXISTS "Public read images bucket" ON storage.objects;

-- 2) cattle_listings: revoke direct SELECT on sensitive phone columns. Reads go through cattle_listings_public view or get_cattle_contact RPC; owners use get_own_cattle_listing RPC.
REVOKE SELECT (contact_phone, whatsapp_phone) ON public.cattle_listings FROM anon, authenticated;

-- 3) vet_doctors: revoke direct SELECT on phone/email. Reads go through vet_doctors_public view or get_vet_contact RPC.
REVOKE SELECT (phone, email) ON public.vet_doctors FROM anon, authenticated;

-- 4) orders: remove admin direct INSERT policy. All checkout must go through place-order edge function (service_role).
DROP POLICY IF EXISTS "Admins can create orders" ON public.orders;

-- 5) appointments: restrict contact_phone direct reads. Provide RPC for parties to fetch phone explicitly.
REVOKE SELECT (contact_phone) ON public.appointments FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_appointment_contact_phone(_appointment_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.contact_phone
  FROM public.appointments a
  WHERE a.id = _appointment_id
    AND auth.uid() IS NOT NULL
    AND (
      a.farmer_id = auth.uid()
      OR a.vet_id = auth.uid()
      OR public.has_role(auth.uid(), 'admin'::public.app_role)
    )
$$;

REVOKE EXECUTE ON FUNCTION public.get_appointment_contact_phone(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_appointment_contact_phone(uuid) TO authenticated;
