
CREATE POLICY "demo anon write entries" ON public.entries FOR ALL TO anon
  USING (user_id = '00000000-0000-0000-0000-0000000000d1')
  WITH CHECK (user_id = '00000000-0000-0000-0000-0000000000d1');

CREATE POLICY "demo anon write meds" ON public.medications FOR ALL TO anon
  USING (user_id = '00000000-0000-0000-0000-0000000000d1')
  WITH CHECK (user_id = '00000000-0000-0000-0000-0000000000d1');

CREATE POLICY "demo anon write attachments" ON public.attachments FOR ALL TO anon
  USING (user_id = '00000000-0000-0000-0000-0000000000d1')
  WITH CHECK (user_id = '00000000-0000-0000-0000-0000000000d1');

CREATE POLICY "demo anon write entry_meds" ON public.entry_medications FOR ALL TO anon
  USING (EXISTS (SELECT 1 FROM public.entries e WHERE e.id = entry_medications.entry_id AND e.user_id = '00000000-0000-0000-0000-0000000000d1'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.entries e WHERE e.id = entry_medications.entry_id AND e.user_id = '00000000-0000-0000-0000-0000000000d1'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.entries TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.medications TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attachments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.entry_medications TO anon;
