CREATE TABLE public.disease_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT,
  animal TEXT,
  breed TEXT,
  disease TEXT,
  confidence NUMERIC,
  severity TEXT,
  symptoms JSONB,
  treatment JSONB,
  recovery_chance NUMERIC,
  raw_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.disease_reports TO authenticated;
GRANT ALL ON public.disease_reports TO service_role;

ALTER TABLE public.disease_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own disease reports"
ON public.disease_reports FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_disease_reports_updated_at
BEFORE UPDATE ON public.disease_reports
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();