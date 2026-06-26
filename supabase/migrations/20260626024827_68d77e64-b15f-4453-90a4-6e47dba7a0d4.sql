
CREATE TABLE public.help_search_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL CHECK (event_type IN ('search','faq_open')),
  term TEXT,
  faq_index INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT INSERT ON public.help_search_events TO anon, authenticated;
GRANT ALL ON public.help_search_events TO service_role;

ALTER TABLE public.help_search_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can log help events"
ON public.help_search_events
FOR INSERT
TO anon, authenticated
WITH CHECK (
  event_type IN ('search','faq_open')
  AND (term IS NULL OR length(term) <= 120)
);

CREATE INDEX help_search_events_type_created_idx
  ON public.help_search_events (event_type, created_at DESC);

CREATE OR REPLACE FUNCTION public.get_top_help_searches(_limit INT DEFAULT 8)
RETURNS TABLE(term TEXT, hits BIGINT)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT lower(btrim(term)) AS term, count(*) AS hits
  FROM public.help_search_events
  WHERE event_type = 'search'
    AND term IS NOT NULL
    AND length(btrim(term)) >= 2
    AND created_at > now() - interval '30 days'
  GROUP BY lower(btrim(term))
  ORDER BY hits DESC, term ASC
  LIMIT GREATEST(1, LEAST(_limit, 25))
$$;

CREATE OR REPLACE FUNCTION public.get_top_help_faqs(_limit INT DEFAULT 5)
RETURNS TABLE(faq_index INTEGER, hits BIGINT)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT faq_index, count(*) AS hits
  FROM public.help_search_events
  WHERE event_type = 'faq_open'
    AND faq_index IS NOT NULL
    AND created_at > now() - interval '30 days'
  GROUP BY faq_index
  ORDER BY hits DESC, faq_index ASC
  LIMIT GREATEST(1, LEAST(_limit, 25))
$$;

GRANT EXECUTE ON FUNCTION public.get_top_help_searches(INT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_top_help_faqs(INT) TO anon, authenticated;
