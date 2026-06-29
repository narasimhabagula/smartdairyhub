
-- 1) cattle_listings: tighten direct table SELECT to owner/admin
DROP POLICY IF EXISTS "Authenticated users can view active cattle" ON public.cattle_listings;
CREATE POLICY "Owner or admin can view cattle row"
ON public.cattle_listings FOR SELECT TO authenticated
USING (auth.uid() = seller_id OR public.has_role(auth.uid(), 'admin'::public.app_role));

GRANT SELECT ON public.cattle_listings_public TO anon, authenticated;

-- 2) vet_doctors: tighten direct table SELECT
DROP POLICY IF EXISTS "Authenticated users can view approved vets" ON public.vet_doctors;
-- "Users can view own suggestions" and "Admins can manage vets" remain.
GRANT SELECT ON public.vet_doctors_public TO anon, authenticated;

-- 3) appointments: revoke direct column access to contact_phone for app roles.
--    Farmer, vet, and admin still read it via get_appointment_contact_phone().
REVOKE SELECT (contact_phone) ON public.appointments FROM anon, authenticated;

-- 4) user_roles: defense-in-depth trigger to block non-admin role assignment
CREATE OR REPLACE FUNCTION public.guard_user_roles_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  RAISE EXCEPTION 'Only administrators may modify user roles';
END;
$$;

DROP TRIGGER IF EXISTS guard_user_roles_changes_trg ON public.user_roles;
CREATE TRIGGER guard_user_roles_changes_trg
BEFORE INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.guard_user_roles_changes();
