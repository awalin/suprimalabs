CREATE POLICY "own calendar connections" ON public.calendar_connections
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.calendar_connections TO authenticated;
GRANT ALL ON public.calendar_connections TO service_role;

CREATE POLICY "own oauth states" ON public.oauth_states
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.oauth_states TO authenticated;
GRANT ALL ON public.oauth_states TO service_role;