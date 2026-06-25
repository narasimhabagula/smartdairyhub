
-- Approval workflow for product submissions
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid;

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_approval_status_check;
ALTER TABLE public.products
  ADD CONSTRAINT products_approval_status_check
  CHECK (approval_status IN ('pending','approved','rejected'));

-- Backfill from legacy boolean
UPDATE public.products SET approval_status = 'approved' WHERE approved = true AND approval_status = 'pending';

-- Keep approved boolean in sync with status (for legacy reads/RLS using `approved`)
CREATE OR REPLACE FUNCTION public.sync_product_approval()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.approved := (NEW.approval_status = 'approved');
  IF TG_OP = 'UPDATE' AND NEW.approval_status IS DISTINCT FROM OLD.approval_status THEN
    NEW.reviewed_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_product_approval ON public.products;
CREATE TRIGGER trg_sync_product_approval
BEFORE INSERT OR UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.sync_product_approval();

-- Prevent sellers from self-approving: reset moderation fields on non-admin updates,
-- and force new inserts to 'pending'.
CREATE OR REPLACE FUNCTION public.guard_product_moderation()
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
      NEW.approval_status := 'pending';
      NEW.rejection_reason := NULL;
      NEW.reviewed_at := NULL;
      NEW.reviewed_by := NULL;
    END IF;
    RETURN NEW;
  END IF;

  -- UPDATE
  IF NOT is_admin THEN
    -- Sellers cannot change moderation fields
    NEW.approval_status := OLD.approval_status;
    NEW.rejection_reason := OLD.rejection_reason;
    NEW.reviewed_at := OLD.reviewed_at;
    NEW.reviewed_by := OLD.reviewed_by;
    -- If a seller edits meaningful content of an approved/rejected product, send back to pending
    IF (NEW.name IS DISTINCT FROM OLD.name
        OR NEW.description IS DISTINCT FROM OLD.description
        OR NEW.category IS DISTINCT FROM OLD.category
        OR NEW.image_url IS DISTINCT FROM OLD.image_url
        OR NEW.photos IS DISTINCT FROM OLD.photos
        OR NEW.video_url IS DISTINCT FROM OLD.video_url)
    THEN
      NEW.approval_status := 'pending';
      NEW.rejection_reason := NULL;
      NEW.reviewed_at := NULL;
      NEW.reviewed_by := NULL;
    END IF;
  ELSE
    IF NEW.approval_status IS DISTINCT FROM OLD.approval_status THEN
      NEW.reviewed_by := auth.uid();
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_product_moderation ON public.products;
CREATE TRIGGER trg_guard_product_moderation
BEFORE INSERT OR UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.guard_product_moderation();

-- Notify seller when moderation status changes
CREATE OR REPLACE FUNCTION public.notify_seller_of_product_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.approval_status IS DISTINCT FROM OLD.approval_status
     AND NEW.approval_status IN ('approved','rejected') THEN
    INSERT INTO public.notifications (user_id, title, body, link)
    VALUES (
      NEW.seller_id,
      'Listing ' || NEW.approval_status || ': ' || NEW.name,
      CASE WHEN NEW.approval_status = 'approved'
           THEN 'Your product is now live on the marketplace.'
           ELSE 'Reason: ' || COALESCE(NEW.rejection_reason, 'Not specified') END,
      '/seller'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_seller_of_product_review ON public.products;
CREATE TRIGGER trg_notify_seller_of_product_review
AFTER UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.notify_seller_of_product_review();
