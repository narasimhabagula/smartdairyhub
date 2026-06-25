
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.notify_farmers_of_rate_change() FROM PUBLIC, authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.guard_order_updates() FROM PUBLIC, authenticated, anon;
