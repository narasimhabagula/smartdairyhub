CREATE OR REPLACE FUNCTION public.get_seller_contact(_seller_id uuid)
RETURNS TABLE(full_name text, phone text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.full_name, p.phone
  FROM public.profiles p
  WHERE p.user_id = _seller_id
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.products pr
      WHERE pr.seller_id = _seller_id
        AND pr.approval_status = 'approved'
    )
$$;

REVOKE EXECUTE ON FUNCTION public.get_seller_contact(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_seller_contact(uuid) TO authenticated;