CREATE TABLE public.calendar_connections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'google',
  account_email text,
  access_token text NOT NULL,
  refresh_token text,
  scope text,
  expires_at timestamptz,
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.calendar_connections TO service_role;
ALTER TABLE public.calendar_connections ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.oauth_states (
  state text NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  redirect_to text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.oauth_states TO service_role;
ALTER TABLE public.oauth_states ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER calendar_connections_uat BEFORE UPDATE ON public.calendar_connections
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.schedule_items
  ADD COLUMN IF NOT EXISTS external_id text,
  ADD COLUMN IF NOT EXISTS external_provider text,
  ADD COLUMN IF NOT EXISTS prep_prompted_at timestamptz,
  ADD COLUMN IF NOT EXISTS prep_questions jsonb,
  ADD COLUMN IF NOT EXISTS reflection_prompted_at timestamptz,
  ADD COLUMN IF NOT EXISTS reflection_entry_id uuid REFERENCES public.entries(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS schedule_items_external_uniq
  ON public.schedule_items (user_id, external_provider, external_id)
  WHERE external_id IS NOT NULL;