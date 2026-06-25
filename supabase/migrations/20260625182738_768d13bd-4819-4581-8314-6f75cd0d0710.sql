
REVOKE EXECUTE ON FUNCTION public.sync_product_approval() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_product_moderation() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_seller_of_product_review() FROM PUBLIC, anon, authenticated;
