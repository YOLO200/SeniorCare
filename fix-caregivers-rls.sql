-- Create a more permissive INSERT policy for caregivers
-- Anyone authenticated can create caregivers
CREATE POLICY "Authenticated users can create caregivers" ON public.caregivers
  FOR INSERT
  TO authenticated
  WITH CHECK (true);