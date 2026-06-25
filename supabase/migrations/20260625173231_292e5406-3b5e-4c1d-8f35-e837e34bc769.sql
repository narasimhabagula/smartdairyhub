
-- Update handle_new_user to honor role from signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
  IF chosen NOT IN ('farmer','mediator','industry') THEN
    chosen := 'farmer';
  END IF;
  chosen_role := chosen::public.app_role;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, chosen_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- dairy_companies
CREATE TABLE public.dairy_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  logo_url text,
  description text,
  address text,
  village text,
  district text,
  state text,
  pin_code text,
  latitude numeric,
  longitude numeric,
  phone text,
  email text,
  working_hours text,
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_dairy_companies_owner ON public.dairy_companies(owner_id);
CREATE INDEX idx_dairy_companies_district ON public.dairy_companies(district);

GRANT SELECT ON public.dairy_companies TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dairy_companies TO authenticated;
GRANT ALL ON public.dairy_companies TO service_role;

ALTER TABLE public.dairy_companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view dairy companies"
ON public.dairy_companies FOR SELECT USING (true);

CREATE POLICY "Industry owners can insert their company"
ON public.dairy_companies FOR INSERT TO authenticated
WITH CHECK (
  owner_id = auth.uid()
  AND (public.has_role(auth.uid(), 'industry') OR public.has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Owners and admins can update dairy companies"
ON public.dairy_companies FOR UPDATE TO authenticated
USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners and admins can delete dairy companies"
ON public.dairy_companies FOR DELETE TO authenticated
USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_dairy_companies_updated_at
BEFORE UPDATE ON public.dairy_companies
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- milk_rates
CREATE TABLE public.milk_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.dairy_companies(id) ON DELETE CASCADE,
  milk_type text NOT NULL CHECK (milk_type IN ('cow','buffalo')),
  fat numeric(4,2) NOT NULL,
  snf numeric(4,2) NOT NULL,
  price_per_litre numeric(8,2) NOT NULL,
  effective_date date NOT NULL DEFAULT CURRENT_DATE,
  collection_timing text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_milk_rates_company ON public.milk_rates(company_id);
CREATE INDEX idx_milk_rates_effective ON public.milk_rates(effective_date DESC);

GRANT SELECT ON public.milk_rates TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.milk_rates TO authenticated;
GRANT ALL ON public.milk_rates TO service_role;

ALTER TABLE public.milk_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view milk rates"
ON public.milk_rates FOR SELECT USING (true);

CREATE POLICY "Company owners can insert rates"
ON public.milk_rates FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.dairy_companies c
    WHERE c.id = milk_rates.company_id
      AND (c.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);

CREATE POLICY "Company owners can update rates"
ON public.milk_rates FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.dairy_companies c
    WHERE c.id = milk_rates.company_id
      AND (c.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.dairy_companies c
    WHERE c.id = milk_rates.company_id
      AND (c.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);

CREATE POLICY "Company owners can delete rates"
ON public.milk_rates FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.dairy_companies c
    WHERE c.id = milk_rates.company_id
      AND (c.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);

CREATE TRIGGER update_milk_rates_updated_at
BEFORE UPDATE ON public.milk_rates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  link text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, read, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications"
ON public.notifications FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users update own notifications"
ON public.notifications FOR UPDATE TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete own notifications"
ON public.notifications FOR DELETE TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins insert notifications"
ON public.notifications FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger: notify same-district farmers on rate add/update
CREATE OR REPLACE FUNCTION public.notify_farmers_of_rate_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  comp RECORD;
BEGIN
  SELECT name, district INTO comp FROM public.dairy_companies WHERE id = NEW.company_id;
  IF comp.district IS NULL THEN RETURN NEW; END IF;

  INSERT INTO public.notifications (user_id, title, body, link)
  SELECT ur.user_id,
         'Updated milk rate: ' || comp.name,
         comp.name || ' set ' || NEW.milk_type || ' milk at Rs.' || NEW.price_per_litre || '/L (FAT ' || NEW.fat || ', SNF ' || NEW.snf || ')',
         '/milk-rates'
  FROM public.user_roles ur
  JOIN public.profiles p ON p.user_id = ur.user_id
  WHERE ur.role = 'farmer'
    AND p.location ILIKE '%' || comp.district || '%';

  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.notify_farmers_of_rate_change() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_notify_farmers_rate_change
AFTER INSERT OR UPDATE ON public.milk_rates
FOR EACH ROW EXECUTE FUNCTION public.notify_farmers_of_rate_change();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.milk_rates;
