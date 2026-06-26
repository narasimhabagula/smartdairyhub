ALTER TABLE public.milk_rates
  ADD COLUMN IF NOT EXISTS bonus numeric,
  ADD COLUMN IF NOT EXISTS effective_time time;