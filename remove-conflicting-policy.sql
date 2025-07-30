-- Remove the conflicting policy that's applied to public role
DROP POLICY "Users can create caregivers" ON public.caregivers;