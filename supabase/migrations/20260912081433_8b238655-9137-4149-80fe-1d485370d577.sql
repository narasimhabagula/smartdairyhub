CREATE TABLE public.api_rate_limits (
  bucket text NOT NULL,
  caller text NOT NULL,
  window_start timestamptz NOT NULL,
  hits integer NOT NULL DEFAULT 1,
  PRIMARY KEY (bucket, caller, window_start)
);

GRANT ALL ON public.api_rate_limits TO service_role;

ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages rate limits"
  ON public.api_rate_limits FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE OR REPLACE FUNCTION public.api_rate_limit_hit(
  _bucket text,
  _caller text,
  _limit integer,
  _window_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  w timestamptz;
  c integer;
BEGIN
  w := to_timestamp(floor(extract(epoch from now()) / GREATEST(_window_seconds, 1)) * GREATEST(_window_seconds, 1));

  INSERT INTO public.api_rate_limits (bucket, caller, window_start, hits)
  VALUES (left(_bucket, 60), left(_caller, 100), w, 1)
  ON CONFLICT (bucket, caller, window_start)
  DO UPDATE SET hits = public.api_rate_limits.hits + 1
  RETURNING hits INTO c;

  DELETE FROM public.api_rate_limits
  WHERE window_start < now() - interval '1 day';

  RETURN c <= GREATEST(_limit, 1);
END;
$$;

REVOKE ALL ON FUNCTION public.api_rate_limit_hit(text, text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.api_rate_limit_hit(text, text, integer, integer) TO service_role;