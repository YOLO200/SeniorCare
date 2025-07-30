-- Step 1: Create the caregivers table
CREATE TABLE IF NOT EXISTS public.caregivers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Caregiver',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create unique constraint on email
ALTER TABLE public.caregivers 
ADD CONSTRAINT caregivers_email_key UNIQUE (email);

-- Step 3: Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_caregivers_email ON public.caregivers(email);

-- Step 4: Create the user_caregivers junction table
CREATE TABLE IF NOT EXISTS public.user_caregivers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  caregiver_id INTEGER NOT NULL REFERENCES public.caregivers(id) ON DELETE CASCADE,
  access_level TEXT NOT NULL DEFAULT 'view',
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  added_by INTEGER REFERENCES public.users(id),
  UNIQUE(user_id, caregiver_id)
);

-- Step 5: Create indexes for user_caregivers
CREATE INDEX IF NOT EXISTS idx_user_caregivers_user_id ON public.user_caregivers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_caregivers_caregiver_id ON public.user_caregivers(caregiver_id);

-- Step 6: Enable RLS on caregivers table
ALTER TABLE public.caregivers ENABLE ROW LEVEL SECURITY;

-- Step 7: Enable RLS on user_caregivers table
ALTER TABLE public.user_caregivers ENABLE ROW LEVEL SECURITY;

-- Step 8: Create RLS policy for viewing caregivers
CREATE POLICY "Users can view their caregivers" ON public.caregivers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_caregivers uc
      JOIN public.users u ON u.id = uc.user_id
      WHERE uc.caregiver_id = caregivers.id
      AND u.supabase_id = auth.uid()::text
    )
  );

-- Step 9: Create RLS policy for inserting caregivers
CREATE POLICY "Users can create caregivers" ON public.caregivers
  FOR INSERT
  WITH CHECK (true);

-- Step 10: Create RLS policy for updating caregivers
CREATE POLICY "Users can update their caregivers" ON public.caregivers
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_caregivers uc
      JOIN public.users u ON u.id = uc.user_id
      WHERE uc.caregiver_id = caregivers.id
      AND u.supabase_id = auth.uid()::text
      AND uc.access_level IN ('edit', 'admin')
    )
  );

-- Step 11: Create RLS policy for viewing user_caregivers relationships
CREATE POLICY "Users can view their caregiver relationships" ON public.user_caregivers
  FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM public.users WHERE supabase_id = auth.uid()::text
    )
  );

-- Step 12: Create RLS policy for creating user_caregivers relationships
CREATE POLICY "Users can create caregiver relationships" ON public.user_caregivers
  FOR INSERT
  WITH CHECK (
    user_id IN (
      SELECT id FROM public.users WHERE supabase_id = auth.uid()::text
    )
  );

-- Step 13: Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 14: Create trigger for caregivers table
CREATE TRIGGER update_caregivers_updated_at 
  BEFORE UPDATE ON public.caregivers
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();