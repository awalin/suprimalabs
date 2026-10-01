
CREATE POLICY "demo public read entries" ON public.entries FOR SELECT TO anon USING (user_id = '00000000-0000-0000-0000-0000000000d1');
CREATE POLICY "demo public read meds" ON public.medications FOR SELECT TO anon USING (user_id = '00000000-0000-0000-0000-0000000000d1');
CREATE POLICY "demo public read insights" ON public.insights FOR SELECT TO anon USING (user_id = '00000000-0000-0000-0000-0000000000d1');
GRANT SELECT ON public.entries TO anon;
GRANT SELECT ON public.medications TO anon;
GRANT SELECT ON public.insights TO anon;
