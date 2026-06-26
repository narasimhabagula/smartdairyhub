
-- 1) Lock down SECURITY DEFINER functions from anon/public
REVOKE ALL ON FUNCTION public.guard_appointment_updates() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_top_help_searches(integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_top_help_faqs(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_top_help_searches(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_top_help_faqs(integer) TO authenticated;

-- 2) Restrict per-role column updates on appointments
CREATE OR REPLACE FUNCTION public.guard_appointment_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  is_admin boolean := public.has_role(auth.uid(), 'admin'::public.app_role);
  is_vet boolean := (auth.uid() = OLD.vet_id);
  is_farmer boolean := (auth.uid() = OLD.farmer_id);
BEGIN
  IF is_admin THEN
    RETURN NEW;
  END IF;

  -- Identity fields never change
  IF NEW.farmer_id IS DISTINCT FROM OLD.farmer_id
     OR NEW.vet_id IS DISTINCT FROM OLD.vet_id THEN
    RAISE EXCEPTION 'Not allowed to change farmer_id or vet_id';
  END IF;

  IF is_vet AND NOT is_farmer THEN
    -- Vet may update status, prescription, notes, scheduled_at only
    NEW.contact_phone := OLD.contact_phone;
    NEW.location := OLD.location;
    NEW.symptoms := OLD.symptoms;
    NEW.animal_type := OLD.animal_type;
    NEW.mode := OLD.mode;
  ELSIF is_farmer AND NOT is_vet THEN
    -- Farmer may update contact_phone, location, scheduled_at, symptoms, animal_type, mode only
    -- Cannot touch vet-owned fields or status
    NEW.status := OLD.status;
    IF to_jsonb(NEW) ? 'prescription' THEN
      NEW.prescription := OLD.prescription;
    END IF;
    IF to_jsonb(NEW) ? 'notes' THEN
      NEW.notes := OLD.notes;
    END IF;
  ELSE
    RAISE EXCEPTION 'Not allowed to update this appointment';
  END IF;

  RETURN NEW;
END;
$function$;

-- Make sure trigger exists
DROP TRIGGER IF EXISTS guard_appointment_updates_trg ON public.appointments;
CREATE TRIGGER guard_appointment_updates_trg
BEFORE UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.guard_appointment_updates();
