
DROP POLICY IF EXISTS "demo anon write entries" ON public.entries;
DROP POLICY IF EXISTS "demo public read entries" ON public.entries;
DROP POLICY IF EXISTS "demo anon write meds" ON public.medications;
DROP POLICY IF EXISTS "demo public read meds" ON public.medications;
DROP POLICY IF EXISTS "demo public read insights" ON public.insights;
DROP POLICY IF EXISTS "demo anon write attachments" ON public.attachments;
DROP POLICY IF EXISTS "demo anon write entry_meds" ON public.entry_medications;
DROP POLICY IF EXISTS "demo anon vitals rw" ON public.vitals;
DROP POLICY IF EXISTS "demo anon schedule rw" ON public.schedule_items;
DROP POLICY IF EXISTS "demo anon profile rw" ON public.profiles;

CREATE POLICY "own files update" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'health-attachments' AND (auth.uid())::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'health-attachments' AND (auth.uid())::text = (storage.foldername(name))[1]);
