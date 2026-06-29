
-- 1) Column-level revoke on cattle_listings sensitive fields
REVOKE SELECT (contact_phone, whatsapp_phone) ON public.cattle_listings FROM anon, authenticated;

-- 2) Column-level revoke on vet_doctors sensitive fields
REVOKE SELECT (phone, email) ON public.vet_doctors FROM anon, authenticated;

-- 3) Lock down the trigger guard function from direct calls
REVOKE EXECUTE ON FUNCTION public.guard_user_roles_changes() FROM PUBLIC, anon, authenticated;
