
-- 1) Columns
ALTER TABLE public.dairy_companies
  ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS registration_number text,
  ADD COLUMN IF NOT EXISTS gst_number text,
  ADD COLUMN IF NOT EXISTS business_doc_url text,
  ADD COLUMN IF NOT EXISTS contact_phone_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS contact_email_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'dairy_companies_verification_status_chk'
  ) THEN
    ALTER TABLE public.dairy_companies
      ADD CONSTRAINT dairy_companies_verification_status_chk
      CHECK (verification_status IN ('pending','verified','rejected'));
  END IF;
END $$;

-- 2) Backfill from legacy `verified` boolean
UPDATE public.dairy_companies
   SET verification_status = 'verified'
 WHERE verified = true AND verification_status = 'pending';

CREATE INDEX IF NOT EXISTS idx_dairy_companies_verification_status
  ON public.dairy_companies (verification_status);

-- 3) Guard trigger: protect moderation fields, reset to pending on meaningful edits
CREATE OR REPLACE FUNCTION public.guard_dairy_company_moderation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin boolean := public.has_role(auth.uid(), 'admin'::public.app_role);
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NOT is_admin THEN
      NEW.verification_status := 'pending';
      NEW.rejection_reason := NULL;
      NEW.reviewed_at := NULL;
      NEW.reviewed_by := NULL;
      NEW.contact_phone_verified := false;
      NEW.contact_email_verified := false;
      NEW.submitted_at := now();
    END IF;
    NEW.verified := (NEW.verification_status = 'verified');
    RETURN NEW;
  END IF;

  -- UPDATE
  IF NOT is_admin THEN
    -- owners can't change moderation fields
    NEW.verification_status := OLD.verification_status;
    NEW.rejection_reason := OLD.rejection_reason;
    NEW.reviewed_at := OLD.reviewed_at;
    NEW.reviewed_by := OLD.reviewed_by;
    NEW.contact_phone_verified := OLD.contact_phone_verified;
    NEW.contact_email_verified := OLD.contact_email_verified;

    -- if any key business detail changed, send back for re-review
    IF (NEW.name IS DISTINCT FROM OLD.name
        OR NEW.registration_number IS DISTINCT FROM OLD.registration_number
        OR NEW.gst_number IS DISTINCT FROM OLD.gst_number
        OR NEW.business_doc_url IS DISTINCT FROM OLD.business_doc_url
        OR NEW.phone IS DISTINCT FROM OLD.phone
        OR NEW.email IS DISTINCT FROM OLD.email
        OR NEW.address IS DISTINCT FROM OLD.address)
    THEN
      NEW.verification_status := 'pending';
      NEW.rejection_reason := NULL;
      NEW.reviewed_at := NULL;
      NEW.reviewed_by := NULL;
      NEW.contact_phone_verified := false;
      NEW.contact_email_verified := false;
      NEW.submitted_at := now();
    END IF;
  ELSE
    IF NEW.verification_status IS DISTINCT FROM OLD.verification_status THEN
      NEW.reviewed_by := auth.uid();
      NEW.reviewed_at := now();
      IF NEW.verification_status = 'verified' THEN
        NEW.rejection_reason := NULL;
      END IF;
    END IF;
  END IF;

  NEW.verified := (NEW.verification_status = 'verified');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_dairy_company_moderation ON public.dairy_companies;
CREATE TRIGGER trg_guard_dairy_company_moderation
BEFORE INSERT OR UPDATE ON public.dairy_companies
FOR EACH ROW EXECUTE FUNCTION public.guard_dairy_company_moderation();

-- 4) Notification trigger on status change
CREATE OR REPLACE FUNCTION public.notify_owner_of_company_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.verification_status IS DISTINCT FROM OLD.verification_status
     AND NEW.verification_status IN ('verified','rejected') THEN
    INSERT INTO public.notifications (user_id, title, body, link)
    VALUES (
      NEW.owner_id,
      'Company ' || NEW.verification_status || ': ' || NEW.name,
      CASE WHEN NEW.verification_status = 'verified'
           THEN 'Your dairy company is verified. You can now publish milk rates and announcements.'
           ELSE 'Reason: ' || COALESCE(NEW.rejection_reason, 'Not specified') END,
      '/industry'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_owner_of_company_review ON public.dairy_companies;
CREATE TRIGGER trg_notify_owner_of_company_review
AFTER UPDATE ON public.dairy_companies
FOR EACH ROW EXECUTE FUNCTION public.notify_owner_of_company_review();

-- 5) Restrict milk_rates writes to verified companies (admins exempt)
DROP POLICY IF EXISTS "Company owners can insert rates" ON public.milk_rates;
CREATE POLICY "Verified owners can insert rates"
ON public.milk_rates FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.dairy_companies c
    WHERE c.id = milk_rates.company_id
      AND (
        public.has_role(auth.uid(), 'admin'::public.app_role)
        OR (c.owner_id = auth.uid() AND c.verification_status = 'verified')
      )
  )
);

DROP POLICY IF EXISTS "Company owners can update rates" ON public.milk_rates;
CREATE POLICY "Verified owners can update rates"
ON public.milk_rates FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.dairy_companies c
    WHERE c.id = milk_rates.company_id
      AND (
        public.has_role(auth.uid(), 'admin'::public.app_role)
        OR (c.owner_id = auth.uid() AND c.verification_status = 'verified')
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.dairy_companies c
    WHERE c.id = milk_rates.company_id
      AND (
        public.has_role(auth.uid(), 'admin'::public.app_role)
        OR (c.owner_id = auth.uid() AND c.verification_status = 'verified')
      )
  )
);

DROP POLICY IF EXISTS "Company owners can delete rates" ON public.milk_rates;
CREATE POLICY "Verified owners can delete rates"
ON public.milk_rates FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.dairy_companies c
    WHERE c.id = milk_rates.company_id
      AND (
        public.has_role(auth.uid(), 'admin'::public.app_role)
        OR (c.owner_id = auth.uid() AND c.verification_status = 'verified')
      )
  )
);
