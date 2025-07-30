# Supabase Database Schema

## Tables

### 1. Users Table
Stores user account information for authentication and profile data.

```sql
-- Users table is already created
-- Contains: id, email, supabase_id, auth_method, first_name, last_name, phone_number, timezone
```

### 2. Parents Table (Members/Recipients)
Stores care recipients that users manage.

```sql
-- Parents table is already created
-- Contains: id, name, phone_number, timezone, user_id
```

### 3. Reminders Table
Stores reminder information for care recipients.

```sql
-- Reminders table is already created
-- Contains reminder details with days of week, delivery method, etc.
```

### 4. Caregivers Table
Stores caregivers who help care for recipients. Multiple users can share caregivers.

```sql
-- Create caregivers table
CREATE TABLE public.caregivers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Caregiver',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique constraint on email to prevent duplicate caregivers
ALTER TABLE public.caregivers 
ADD CONSTRAINT caregivers_email_key UNIQUE (email);

-- Create index for faster lookups
CREATE INDEX idx_caregivers_email ON public.caregivers(email);
```

### 5. User Caregivers Junction Table
Links users to caregivers they have access to (many-to-many relationship).

```sql
-- Create junction table for user-caregiver relationships
CREATE TABLE public.user_caregivers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  caregiver_id INTEGER NOT NULL REFERENCES public.caregivers(id) ON DELETE CASCADE,
  access_level TEXT NOT NULL DEFAULT 'view', -- 'view', 'edit', 'admin'
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  added_by INTEGER REFERENCES public.users(id),
  UNIQUE(user_id, caregiver_id)
);

-- Create indexes for faster queries
CREATE INDEX idx_user_caregivers_user_id ON public.user_caregivers(user_id);
CREATE INDEX idx_user_caregivers_caregiver_id ON public.user_caregivers(caregiver_id);
```

### 6. Caregiver Assignments Table
Links caregivers to specific care recipients they are assigned to.

```sql
-- Create caregiver assignments table
CREATE TABLE public.caregiver_assignments (
  id SERIAL PRIMARY KEY,
  caregiver_id INTEGER NOT NULL REFERENCES public.caregivers(id) ON DELETE CASCADE,
  parent_id INTEGER NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
  assigned_by INTEGER REFERENCES public.users(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'inactive', 'pending'
  notes TEXT,
  UNIQUE(caregiver_id, parent_id)
);

-- Create indexes for faster queries
CREATE INDEX idx_caregiver_assignments_caregiver_id ON public.caregiver_assignments(caregiver_id);
CREATE INDEX idx_caregiver_assignments_parent_id ON public.caregiver_assignments(parent_id);
```

## Row Level Security (RLS) Policies

### Caregivers Table RLS

```sql
-- Enable RLS on caregivers table
ALTER TABLE public.caregivers ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view caregivers they have access to
CREATE POLICY "Users can view their caregivers" ON public.caregivers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_caregivers uc
      JOIN public.users u ON u.id = uc.user_id
      WHERE uc.caregiver_id = caregivers.id
      AND u.supabase_id = auth.uid()
    )
  );

-- Policy: Users can insert caregivers (will need to add user_caregiver record too)
CREATE POLICY "Users can create caregivers" ON public.caregivers
  FOR INSERT
  WITH CHECK (true);

-- Policy: Users can update caregivers they have edit/admin access to
CREATE POLICY "Users can update their caregivers" ON public.caregivers
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_caregivers uc
      JOIN public.users u ON u.id = uc.user_id
      WHERE uc.caregiver_id = caregivers.id
      AND u.supabase_id = auth.uid()
      AND uc.access_level IN ('edit', 'admin')
    )
  );

-- Policy: Users can delete caregivers they have admin access to
CREATE POLICY "Users can delete their caregivers" ON public.caregivers
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_caregivers uc
      JOIN public.users u ON u.id = uc.user_id
      WHERE uc.caregiver_id = caregivers.id
      AND u.supabase_id = auth.uid()
      AND uc.access_level = 'admin'
    )
  );
```

### User Caregivers Table RLS

```sql
-- Enable RLS on user_caregivers table
ALTER TABLE public.user_caregivers ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own caregiver relationships
CREATE POLICY "Users can view their caregiver relationships" ON public.user_caregivers
  FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM public.users WHERE supabase_id = auth.uid()
    )
  );

-- Policy: Users can create caregiver relationships for themselves
CREATE POLICY "Users can create caregiver relationships" ON public.user_caregivers
  FOR INSERT
  WITH CHECK (
    user_id IN (
      SELECT id FROM public.users WHERE supabase_id = auth.uid()
    )
  );

-- Policy: Users can update their own caregiver relationships if they have admin access
CREATE POLICY "Users can update their caregiver relationships" ON public.user_caregivers
  FOR UPDATE
  USING (
    user_id IN (
      SELECT id FROM public.users WHERE supabase_id = auth.uid()
    )
    AND access_level = 'admin'
  );

-- Policy: Users can delete their own caregiver relationships
CREATE POLICY "Users can delete their caregiver relationships" ON public.user_caregivers
  FOR DELETE
  USING (
    user_id IN (
      SELECT id FROM public.users WHERE supabase_id = auth.uid()
    )
  );
```

### Caregiver Assignments Table RLS

```sql
-- Enable RLS on caregiver_assignments table
ALTER TABLE public.caregiver_assignments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view assignments for their caregivers and parents
CREATE POLICY "Users can view caregiver assignments" ON public.caregiver_assignments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_caregivers uc
      JOIN public.users u ON u.id = uc.user_id
      WHERE uc.caregiver_id = caregiver_assignments.caregiver_id
      AND u.supabase_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.parents p
      JOIN public.users u ON u.id = p.user_id
      WHERE p.id = caregiver_assignments.parent_id
      AND u.supabase_id = auth.uid()
    )
  );

-- Policy: Users can create assignments for their caregivers and parents
CREATE POLICY "Users can create caregiver assignments" ON public.caregiver_assignments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_caregivers uc
      JOIN public.users u ON u.id = uc.user_id
      WHERE uc.caregiver_id = caregiver_id
      AND u.supabase_id = auth.uid()
      AND uc.access_level IN ('edit', 'admin')
    )
    AND
    EXISTS (
      SELECT 1 FROM public.parents p
      JOIN public.users u ON u.id = p.user_id
      WHERE p.id = parent_id
      AND u.supabase_id = auth.uid()
    )
  );

-- Policy: Users can update assignments they created or have admin access to
CREATE POLICY "Users can update caregiver assignments" ON public.caregiver_assignments
  FOR UPDATE
  USING (
    assigned_by IN (
      SELECT id FROM public.users WHERE supabase_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.user_caregivers uc
      JOIN public.users u ON u.id = uc.user_id
      WHERE uc.caregiver_id = caregiver_assignments.caregiver_id
      AND u.supabase_id = auth.uid()
      AND uc.access_level = 'admin'
    )
  );

-- Policy: Users can delete assignments they created or have admin access to
CREATE POLICY "Users can delete caregiver assignments" ON public.caregiver_assignments
  FOR DELETE
  USING (
    assigned_by IN (
      SELECT id FROM public.users WHERE supabase_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.user_caregivers uc
      JOIN public.users u ON u.id = uc.user_id
      WHERE uc.caregiver_id = caregiver_assignments.caregiver_id
      AND u.supabase_id = auth.uid()
      AND uc.access_level = 'admin'
    )
  );
```

## Functions and Triggers

### Updated timestamp trigger

```sql
-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for caregivers table
CREATE TRIGGER update_caregivers_updated_at BEFORE UPDATE ON public.caregivers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Sample Queries

### Get all caregivers for a user
```sql
SELECT c.*, uc.access_level
FROM caregivers c
JOIN user_caregivers uc ON c.id = uc.caregiver_id
WHERE uc.user_id = :user_id
ORDER BY c.name;
```

### Get caregivers assigned to a specific care recipient
```sql
SELECT c.*, ca.status, ca.assigned_at
FROM caregivers c
JOIN caregiver_assignments ca ON c.id = ca.caregiver_id
WHERE ca.parent_id = :parent_id
AND ca.status = 'active'
ORDER BY c.name;
```

### Add a new caregiver and grant access to current user
```sql
-- Insert caregiver
INSERT INTO caregivers (name, email, phone_number, role, notes)
VALUES (:name, :email, :phone_number, :role, :notes)
RETURNING id;

-- Grant access to user
INSERT INTO user_caregivers (user_id, caregiver_id, access_level, added_by)
VALUES (:user_id, :caregiver_id, 'admin', :user_id);
```