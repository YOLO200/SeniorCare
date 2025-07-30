-- First, let's see what policies exist
SELECT schemaname, tablename, policyname, cmd, roles, qual, with_check 
FROM pg_policies 
WHERE tablename = 'caregivers';

-- Drop the existing problematic policy and recreate it
DROP POLICY IF EXISTS "Users can create caregivers" ON public.caregivers;

-- Create the correct policy
CREATE POLICY "Users can create caregivers" ON public.caregivers
  FOR INSERT
  TO authenticated
  WITH CHECK (true);