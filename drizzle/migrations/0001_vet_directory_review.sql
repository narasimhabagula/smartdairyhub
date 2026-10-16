ALTER TABLE public.vet_doctors
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid;

CREATE OR REPLACE FUNCTION public.stamp_vet_review()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) AND auth.uid() IS NOT NULL THEN
      RAISE EXCEPTION 'Only admins can change listing approval';
    END IF;
    NEW.reviewed_at := now();
    NEW.reviewed_by := auth.uid();
    IF NEW.status = 'approved' THEN NEW.rejection_reason := NULL; END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS stamp_vet_review ON public.vet_doctors;
CREATE TRIGGER stamp_vet_review BEFORE UPDATE ON public.vet_doctors
  FOR EACH ROW EXECUTE FUNCTION public.stamp_vet_review();

CREATE OR REPLACE FUNCTION public.guard_directory_booking_confirm()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE ok boolean;
BEGIN
  IF NEW.directory_vet_id IS NOT NULL
     AND NEW.status IN ('confirmed','accepted','completed')
     AND NEW.status IS DISTINCT FROM OLD.status THEN
    SELECT status = 'approved' INTO ok FROM public.vet_doctors WHERE id = NEW.directory_vet_id;
    IF ok IS DISTINCT FROM true THEN
      RAISE EXCEPTION 'This vet listing must be approved before bookings can be confirmed';
    END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS guard_directory_booking_confirm ON public.appointments;
CREATE TRIGGER guard_directory_booking_confirm BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.guard_directory_booking_confirm();

REVOKE EXECUTE ON FUNCTION public.stamp_vet_review() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_directory_booking_confirm() FROM PUBLIC, anon, authenticated;