-- Provider record connections (SMART on FHIR, read-only)
CREATE TABLE public.ehr_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_name text NOT NULL,
  fhir_base_url text NOT NULL,
  patient_id text,
  patient_name text,
  auth_mode text NOT NULL DEFAULT 'open',
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  scope text,
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ehr_connections TO authenticated;
GRANT ALL ON public.ehr_connections TO service_role;
ALTER TABLE public.ehr_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own ehr connections" ON public.ehr_connections
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER ehr_connections_updated_at BEFORE UPDATE ON public.ehr_connections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Lab results imported from a provider record
CREATE TABLE public.lab_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  code text,
  value numeric,
  value_text text,
  unit text,
  reference_range text,
  interpretation text,
  observed_at timestamptz,
  panel text,
  source text NOT NULL DEFAULT 'manual',
  external_provider text,
  external_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lab_results TO authenticated;
GRANT ALL ON public.lab_results TO service_role;
ALTER TABLE public.lab_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own lab results" ON public.lab_results
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE UNIQUE INDEX lab_results_external_uniq ON public.lab_results (user_id, external_provider, external_id)
  WHERE external_id IS NOT NULL;

-- Dedupe keys for imported meds / visits / vitals
ALTER TABLE public.medications ADD COLUMN IF NOT EXISTS external_provider text;
ALTER TABLE public.medications ADD COLUMN IF NOT EXISTS external_id text;
ALTER TABLE public.entries ADD COLUMN IF NOT EXISTS external_provider text;
ALTER TABLE public.entries ADD COLUMN IF NOT EXISTS external_id text;
ALTER TABLE public.vitals ADD COLUMN IF NOT EXISTS external_provider text;
ALTER TABLE public.vitals ADD COLUMN IF NOT EXISTS external_id text;

CREATE UNIQUE INDEX medications_external_uniq ON public.medications (user_id, external_provider, external_id)
  WHERE external_id IS NOT NULL;
CREATE UNIQUE INDEX entries_external_uniq ON public.entries (user_id, external_provider, external_id)
  WHERE external_id IS NOT NULL;
CREATE UNIQUE INDEX vitals_external_uniq ON public.vitals (user_id, external_provider, external_id)
  WHERE external_id IS NOT NULL;