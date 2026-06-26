
-- 1) cattle_listings: revoke direct column access to phone fields
REVOKE SELECT (contact_phone, whatsapp_phone) ON public.cattle_listings FROM PUBLIC, anon, authenticated;

-- 2) vet_doctors: revoke direct column access to phone/email
REVOKE SELECT (phone, email) ON public.vet_doctors FROM PUBLIC, anon, authenticated;

-- 3) Storage: explicit public read policy scoped to images bucket only
DROP POLICY IF EXISTS "Public read images bucket" ON storage.objects;
CREATE POLICY "Public read images bucket" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'images');

-- 4) orders: tighten UPDATE policy so buyers cannot change status or total
DROP POLICY IF EXISTS "Users can update own orders" ON public.orders;
CREATE POLICY "Admins manage order updates" ON public.orders
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Buyers update shipping on pending orders" ON public.orders
  FOR UPDATE TO authenticated
  USING (auth.uid() = buyer_id AND status = 'pending')
  WITH CHECK (auth.uid() = buyer_id AND status = 'pending');
-- guard_order_updates trigger additionally blocks any change to status/total/buyer_id by non-admins.

-- 5) appointments: split UPDATE policies by party; field-level enforcement remains in guard_appointment_updates trigger
DROP POLICY IF EXISTS "Parties update own appointments" ON public.appointments;
CREATE POLICY "Admins update appointments" ON public.appointments
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Farmer updates own appointment" ON public.appointments
  FOR UPDATE TO authenticated
  USING (auth.uid() = farmer_id)
  WITH CHECK (auth.uid() = farmer_id);
CREATE POLICY "Vet updates assigned appointment" ON public.appointments
  FOR UPDATE TO authenticated
  USING (auth.uid() = vet_id)
  WITH CHECK (auth.uid() = vet_id);
