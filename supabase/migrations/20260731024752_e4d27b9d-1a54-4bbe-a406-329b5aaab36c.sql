CREATE TABLE IF NOT EXISTS public.translation_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lang TEXT NOT NULL,
  source_hash TEXT NOT NULL,
  source_text TEXT NOT NULL,
  translated_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (lang, source_hash)
);

GRANT SELECT ON public.translation_cache TO anon;
GRANT SELECT ON public.translation_cache TO authenticated;
GRANT ALL ON public.translation_cache TO service_role;

ALTER TABLE public.translation_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Translations are public to read"
ON public.translation_cache FOR SELECT
USING (true);