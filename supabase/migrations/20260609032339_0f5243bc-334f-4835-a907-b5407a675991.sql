
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS family_history jsonb,
  ADD COLUMN IF NOT EXISTS reminder_time time,
  ADD COLUMN IF NOT EXISTS streak_count int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_checkin_date date;

-- Allow anon demo profile access (mirroring other tables)
DROP POLICY IF EXISTS "demo anon profile rw" ON public.profiles;
CREATE POLICY "demo anon profile rw" ON public.profiles
  TO anon
  USING (id = '00000000-0000-0000-0000-0000000000d1'::uuid)
  WITH CHECK (id = '00000000-0000-0000-0000-0000000000d1'::uuid);

GRANT SELECT, INSERT, UPDATE ON public.profiles TO anon;

-- Seed demo profile row if missing
INSERT INTO public.profiles (id, display_name)
VALUES ('00000000-0000-0000-0000-0000000000d1', 'Demo user')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.entries
  ADD COLUMN IF NOT EXISTS entry_type text NOT NULL DEFAULT 'journal';

CREATE TABLE IF NOT EXISTS public.vitals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  value numeric,
  value_text text,
  unit text,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL DEFAULT 'manual',
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vitals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vitals TO anon;
GRANT ALL ON public.vitals TO service_role;

ALTER TABLE public.vitals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own vitals all" ON public.vitals
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "demo anon vitals rw" ON public.vitals
  TO anon
  USING (user_id = '00000000-0000-0000-0000-0000000000d1'::uuid)
  WITH CHECK (user_id = '00000000-0000-0000-0000-0000000000d1'::uuid);

CREATE INDEX IF NOT EXISTS vitals_user_recorded_idx ON public.vitals (user_id, recorded_at DESC);
