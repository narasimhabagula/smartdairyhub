
-- 1) Allow 'vet' as a chosen role from signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  chosen text;
  chosen_role public.app_role;
BEGIN
  INSERT INTO public.profiles (user_id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  );

  chosen := COALESCE(NEW.raw_user_meta_data->>'role', 'farmer');
  IF chosen NOT IN ('farmer','mediator','industry','vet') THEN
    chosen := 'farmer';
  END IF;
  chosen_role := chosen::public.app_role;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, chosen_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$function$;

-- 2) Vet profiles linking auth users to a vet_doctors directory entry
CREATE TABLE IF NOT EXISTS public.vet_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  vet_doctor_id uuid REFERENCES public.vet_doctors(id) ON DELETE SET NULL,
  qualification text,
  specialization text,
  experience_years int,
  license_number text,
  verification_status text NOT NULL DEFAULT 'pending', -- pending | verified | rejected
  bio text,
  consultation_fee numeric,
  available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.vet_profiles TO authenticated;
GRANT ALL ON public.vet_profiles TO service_role;
ALTER TABLE public.vet_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vet owners read own profile" ON public.vet_profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Vet owners insert own profile" ON public.vet_profiles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Vet owners update own profile" ON public.vet_profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER trg_vet_profiles_updated_at
  BEFORE UPDATE ON public.vet_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Appointments (farmer ↔ vet)
CREATE TABLE IF NOT EXISTS public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vet_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  animal_type text,
  symptoms text NOT NULL,
  scheduled_at timestamptz,
  mode text NOT NULL DEFAULT 'in_person', -- in_person | online | emergency
  status text NOT NULL DEFAULT 'pending', -- pending | accepted | declined | completed | cancelled
  notes text,
  prescription text,
  contact_phone text,
  location text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Appointments visible to parties" ON public.appointments
  FOR SELECT TO authenticated
  USING (
    farmer_id = auth.uid()
    OR vet_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  );

CREATE POLICY "Farmers can create appointments" ON public.appointments
  FOR INSERT TO authenticated
  WITH CHECK (farmer_id = auth.uid());

CREATE POLICY "Parties update own appointments" ON public.appointments
  FOR UPDATE TO authenticated
  USING (farmer_id = auth.uid() OR vet_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (farmer_id = auth.uid() OR vet_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Farmers delete own pending appointments" ON public.appointments
  FOR DELETE TO authenticated
  USING (farmer_id = auth.uid() AND status = 'pending');

CREATE TRIGGER trg_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_appointments_vet ON public.appointments(vet_id, status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_appointments_farmer ON public.appointments(farmer_id, created_at DESC);

-- 4) Realtime so vets see new requests instantly
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;

-- 5) Notify vet when a new appointment is created
CREATE OR REPLACE FUNCTION public.notify_vet_of_appointment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  farmer_name text;
BEGIN
  SELECT full_name INTO farmer_name FROM public.profiles WHERE user_id = NEW.farmer_id;
  INSERT INTO public.notifications (user_id, title, body, link)
  VALUES (
    NEW.vet_id,
    CASE WHEN NEW.mode = 'emergency' THEN 'Emergency consultation request' ELSE 'New appointment request' END,
    COALESCE(farmer_name, 'A farmer') || ' • ' || COALESCE(NEW.animal_type,'animal') || ' • ' || left(NEW.symptoms, 80),
    '/vet-dashboard'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_appointments_notify_vet
  AFTER INSERT ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.notify_vet_of_appointment();

-- 6) Notify farmer when status changes
CREATE OR REPLACE FUNCTION public.notify_farmer_of_appointment_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.notifications (user_id, title, body, link)
    VALUES (
      NEW.farmer_id,
      'Appointment ' || NEW.status,
      'Your consultation request was ' || NEW.status || '.',
      '/dashboard'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_appointments_notify_farmer
  AFTER UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.notify_farmer_of_appointment_update();
