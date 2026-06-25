ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS photos text[] NOT NULL DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS video_url text;