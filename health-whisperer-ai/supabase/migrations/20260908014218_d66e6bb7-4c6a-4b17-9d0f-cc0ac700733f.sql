ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS demographics jsonb;

COMMENT ON COLUMN public.profiles.demographics IS 'Self-reported, optional: birth_year, sex_at_birth, gender, ancestry (array), pregnancy_status, notes. Used to tailor suggestions and evidence.';