GRANT SELECT, INSERT, UPDATE, DELETE ON public.dairy_companies TO authenticated;
GRANT ALL ON public.dairy_companies TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vet_doctors TO authenticated;
GRANT ALL ON public.vet_doctors TO service_role;