-- Migration: Add collaborator availability rules
-- Run this in Supabase Dashboard -> SQL Editor

-- 1. Create collaborator_availability_rules table
CREATE TABLE IF NOT EXISTS collaborator_availability_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collaborator_id UUID NOT NULL REFERENCES collaborators(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time VARCHAR(5) NOT NULL,
  end_time VARCHAR(5) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(collaborator_id, day_of_week)
);

-- 2. Enable RLS on collaborator_availability_rules
ALTER TABLE collaborator_availability_rules ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policy for collaborator_availability_rules
DROP POLICY IF EXISTS "Users can manage own collaborator availability" ON collaborator_availability_rules;
CREATE POLICY "Users can manage own collaborator availability" ON collaborator_availability_rules
  FOR ALL USING (
    collaborator_id IN (
      SELECT c.id FROM collaborators c
      JOIN psychologists p ON c.psychologist_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

-- 4. Add appointment_type to collaborators (to specify which types they accept)
ALTER TABLE collaborators ADD COLUMN IF NOT EXISTS appointment_types TEXT[] DEFAULT ARRAY['presencial', 'videoconferencia'];
