
ALTER TABLE public.entries DROP CONSTRAINT IF EXISTS entries_user_id_fkey;
ALTER TABLE public.medications DROP CONSTRAINT IF EXISTS medications_user_id_fkey;
ALTER TABLE public.attachments DROP CONSTRAINT IF EXISTS attachments_user_id_fkey;
ALTER TABLE public.insights DROP CONSTRAINT IF EXISTS insights_user_id_fkey;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
