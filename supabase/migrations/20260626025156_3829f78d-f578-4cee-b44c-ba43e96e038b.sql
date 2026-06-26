
-- 1) dairy_companies: restrict SELECT to authenticated users only
DROP POLICY IF EXISTS "Anyone can view dairy companies" ON public.dairy_companies;
CREATE POLICY "Authenticated users can view dairy companies"
ON public.dairy_companies FOR SELECT
TO authenticated
USING (true);
REVOKE SELECT ON public.dairy_companies FROM anon;

-- 2) appointments: prevent vets/farmers from changing farmer_id or vet_id
CREATE OR REPLACE FUNCTION public.guard_appointment_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RETURN NEW;
  END IF;
  IF NEW.farmer_id IS DISTINCT FROM OLD.farmer_id
     OR NEW.vet_id IS DISTINCT FROM OLD.vet_id THEN
    RAISE EXCEPTION 'Not allowed to change farmer_id or vet_id';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_appointment_updates ON public.appointments;
CREATE TRIGGER trg_guard_appointment_updates
BEFORE UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.guard_appointment_updates();

-- 3) order_items: block direct PostgREST inserts; only edge function (service_role) or admin
DROP POLICY IF EXISTS "Users can insert order items" ON public.order_items;
CREATE POLICY "Only admins can insert order items"
ON public.order_items FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
