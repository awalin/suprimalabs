
CREATE TABLE IF NOT EXISTS public.schedule_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  entry_id uuid REFERENCES public.entries(id) ON DELETE SET NULL,
  kind text NOT NULL DEFAULT 'appointment',
  title text NOT NULL,
  start_at timestamptz,
  end_at timestamptz,
  all_day boolean NOT NULL DEFAULT false,
  location text,
  notes text,
  recurrence_rule text,
  source text NOT NULL DEFAULT 'parsed',
  done boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.schedule_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.schedule_items TO anon;
GRANT ALL ON public.schedule_items TO service_role;

ALTER TABLE public.schedule_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own schedule all" ON public.schedule_items
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "demo anon schedule rw" ON public.schedule_items
  TO anon
  USING (user_id = '00000000-0000-0000-0000-0000000000d1'::uuid)
  WITH CHECK (user_id = '00000000-0000-0000-0000-0000000000d1'::uuid);

CREATE INDEX IF NOT EXISTS schedule_user_start_idx ON public.schedule_items (user_id, start_at);
