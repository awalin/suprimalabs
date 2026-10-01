DROP INDEX IF EXISTS public.lab_results_external_uniq;
DROP INDEX IF EXISTS public.medications_external_uniq;
DROP INDEX IF EXISTS public.entries_external_uniq;
DROP INDEX IF EXISTS public.vitals_external_uniq;

CREATE UNIQUE INDEX lab_results_external_uniq ON public.lab_results (user_id, external_provider, external_id);
CREATE UNIQUE INDEX medications_external_uniq ON public.medications (user_id, external_provider, external_id);
CREATE UNIQUE INDEX entries_external_uniq ON public.entries (user_id, external_provider, external_id);
CREATE UNIQUE INDEX vitals_external_uniq ON public.vitals (user_id, external_provider, external_id);