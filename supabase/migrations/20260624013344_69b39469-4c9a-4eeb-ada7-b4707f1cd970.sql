
-- Extend cattle_listings
ALTER TABLE public.cattle_listings
  ADD COLUMN IF NOT EXISTS photos text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS video_url text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS vaccination_status text,
  ADD COLUMN IF NOT EXISTS health_status text;

ALTER TABLE public.cattle_listings DROP CONSTRAINT IF EXISTS cattle_listings_type_check;
ALTER TABLE public.cattle_listings
  ADD CONSTRAINT cattle_listings_type_check
  CHECK (type = ANY (ARRAY['cow','buffalo','calf','other']));

-- Cap photos array length to 10
ALTER TABLE public.cattle_listings DROP CONSTRAINT IF EXISTS cattle_listings_photos_max;
ALTER TABLE public.cattle_listings
  ADD CONSTRAINT cattle_listings_photos_max CHECK (array_length(photos, 1) IS NULL OR array_length(photos, 1) <= 10);

-- Favorites
CREATE TABLE IF NOT EXISTS public.cattle_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES public.cattle_listings(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, listing_id)
);
GRANT SELECT, INSERT, DELETE ON public.cattle_favorites TO authenticated;
GRANT ALL ON public.cattle_favorites TO service_role;
ALTER TABLE public.cattle_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their favorites"
  ON public.cattle_favorites FOR ALL TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id);

-- Reports
CREATE TABLE IF NOT EXISTS public.cattle_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES public.cattle_listings(id) ON DELETE CASCADE,
  reason text NOT NULL CHECK (char_length(reason) BETWEEN 3 AND 500),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewed','dismissed')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.cattle_reports TO authenticated;
GRANT ALL ON public.cattle_reports TO service_role;
ALTER TABLE public.cattle_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reporters see own reports, admins see all"
  ON public.cattle_reports FOR SELECT TO authenticated
  USING (auth.uid() = reporter_id OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can submit reports"
  ON public.cattle_reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Admins update reports"
  ON public.cattle_reports FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'));
