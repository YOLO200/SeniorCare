-- Fix the missing UPDATE policy for user_caregivers table
-- This policy allows users to update caregiver relationships where they have edit/admin access

-- First check what policies exist
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'user_caregivers'
ORDER BY cmd;

-- Create the missing UPDATE policy for user_caregivers
CREATE POLICY "Users can update caregiver relationships" ON public.user_caregivers
  FOR UPDATE
  USING (
    -- Users can update relationships for their own caregivers
    user_id IN (
      SELECT id FROM public.users WHERE supabase_id = auth.uid()::text
    )
    AND (
      -- They added the caregiver originally, OR
      added_by IN (
        SELECT id FROM public.users WHERE supabase_id = auth.uid()::text
      )
      OR
      -- They have edit or admin access level
      access_level IN ('edit', 'admin')
    )
  )
  WITH CHECK (
    -- Same conditions for the updated data
    user_id IN (
      SELECT id FROM public.users WHERE supabase_id = auth.uid()::text
    )
  );

-- Verify the policy was created
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'user_caregivers'
ORDER BY cmd;