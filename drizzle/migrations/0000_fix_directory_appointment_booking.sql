CREATE OR REPLACE FUNCTION public.validate_appointment_insert()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  digits text;
  normalized text;
  vet_ok boolean;
BEGIN
  -- farmer cannot be the vet
  IF NEW.vet_id IS NOT NULL AND NEW.farmer_id = NEW.vet_id THEN
    RAISE EXCEPTION 'farmer_id and vet_id must be different';
  END IF;

  -- symptoms length + script-tag guard
  IF NEW.symptoms IS NULL OR length(btrim(NEW.symptoms)) < 10 THEN
    RAISE EXCEPTION 'symptoms must be at least 10 characters';
  END IF;
  IF length(NEW.symptoms) > 1000 THEN
    RAISE EXCEPTION 'symptoms must be at most 1000 characters';
  END IF;
  IF NEW.symptoms ~* '<\s*script' THEN
    RAISE EXCEPTION 'symptoms contains disallowed content';
  END IF;
  NEW.symptoms := btrim(NEW.symptoms);

  -- animal type whitelist (optional column)
  IF NEW.animal_type IS NOT NULL AND NEW.animal_type NOT IN ('Cow','Buffalo','Goat','Sheep','Poultry','Other') THEN
    RAISE EXCEPTION 'invalid animal_type';
  END IF;

  -- mode whitelist
  IF NEW.mode IS NULL OR NEW.mode NOT IN ('in_person','online','emergency') THEN
    RAISE EXCEPTION 'invalid mode';
  END IF;

  -- status must start as pending on insert (defense in depth)
  IF NEW.status IS NULL OR NEW.status <> 'pending' THEN
    NEW.status := 'pending';
  END IF;

  -- contact phone: normalize Indian mobile to 10 digits
  IF NEW.contact_phone IS NULL OR length(btrim(NEW.contact_phone)) = 0 THEN
    RAISE EXCEPTION 'contact_phone is required';
  END IF;
  digits := regexp_replace(NEW.contact_phone, '\D', '', 'g');
  IF length(digits) = 12 AND left(digits, 2) = '91' THEN
    normalized := substring(digits FROM 3);
  ELSIF length(digits) = 11 AND left(digits, 1) = '0' THEN
    normalized := substring(digits FROM 2);
  ELSIF length(digits) = 10 THEN
    normalized := digits;
  ELSE
    RAISE EXCEPTION 'contact_phone must be a valid 10-digit Indian mobile number';
  END IF;
  IF normalized !~ '^[6-9][0-9]{9}$' THEN
    RAISE EXCEPTION 'contact_phone must be a valid Indian mobile number';
  END IF;
  NEW.contact_phone := normalized;

  -- location length cap
  IF NEW.location IS NOT NULL AND length(NEW.location) > 200 THEN
    RAISE EXCEPTION 'location must be at most 200 characters';
  END IF;
  IF NEW.location IS NOT NULL THEN
    NEW.location := btrim(NEW.location);
    IF length(NEW.location) = 0 THEN NEW.location := NULL; END IF;
  END IF;

  -- preferred time bounds
  IF NEW.scheduled_at IS NOT NULL THEN
    IF NEW.scheduled_at < now() - interval '1 minute' THEN
      RAISE EXCEPTION 'scheduled_at must be in the future';
    END IF;
    IF NEW.scheduled_at > now() + interval '60 days' THEN
      RAISE EXCEPTION 'scheduled_at must be within 60 days';
    END IF;
  END IF;

  -- Vet validation: directory booking (directory_vet_id) or platform vet (vet_id)
  IF NEW.directory_vet_id IS NOT NULL THEN
    SELECT (status = 'approved' AND COALESCE(available, true) = true)
      INTO vet_ok
      FROM public.vet_doctors
      WHERE id = NEW.directory_vet_id;
    IF vet_ok IS DISTINCT FROM true THEN
      RAISE EXCEPTION 'selected vet is not currently available for booking';
    END IF;
  ELSE
    SELECT (verification_status = 'verified' AND COALESCE(available, true) = true)
      INTO vet_ok
      FROM public.vet_profiles
      WHERE user_id = NEW.vet_id;
    IF vet_ok IS DISTINCT FROM true THEN
      RAISE EXCEPTION 'selected vet is not currently available for booking';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_vet_of_appointment()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  farmer_name text;
BEGIN
  -- Directory bookings have no platform vet account to notify
  IF NEW.vet_id IS NULL THEN
    RETURN NEW;
  END IF;
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
$function$;