CREATE OR REPLACE FUNCTION public.guard_user_roles_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Allow trusted, non-end-user contexts:
  --  * the auth service running the signup transaction (handle_new_user)
  --  * backend/service-role and superuser maintenance
  IF session_user IN ('supabase_auth_admin', 'service_role', 'postgres', 'supabase_admin')
     OR auth.uid() IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  RAISE EXCEPTION 'Only administrators may modify user roles';
END;
$function$;