-- Allow anonymous (unauthenticated) users to read active schools
-- This is needed for the school code lookup on the landing page before login

CREATE POLICY "schools_select_anon" ON schools
  FOR SELECT
  TO anon
  USING (status = 'active');