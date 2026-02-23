-- Migration: Add rooms support to schedule
-- Run this in Supabase Dashboard -> SQL Editor

-- 1. Create rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  psychologist_id UUID NOT NULL REFERENCES psychologists(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7) DEFAULT '#3B82F6',
  appointment_type VARCHAR(50) DEFAULT 'presencial',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add room_id column to slots (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'slots' AND column_name = 'room_id') THEN
    ALTER TABLE slots ADD COLUMN room_id UUID REFERENCES rooms(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 3. Add appointment_type column to slots (if not exists) - for video vs in-person
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'slots' AND column_name = 'appointment_type') THEN
    ALTER TABLE slots ADD COLUMN appointment_type VARCHAR(50) DEFAULT 'presencial';
  END IF;
END $$;

-- 4. Enable RLS on rooms
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policy for rooms
DROP POLICY IF EXISTS "Users can manage own rooms" ON rooms;
CREATE POLICY "Users can manage own rooms" ON rooms
  FOR ALL USING (psychologist_id IN (SELECT id FROM psychologists WHERE user_id = auth.uid()));

-- 6. Insert sample rooms for existing psychologists
INSERT INTO rooms (psychologist_id, name, color, appointment_type)
SELECT 
  id,
  'Sala ' || row_number::text,
  CASE (row_number % 5)
    WHEN 0 THEN '#3B82F6' -- blue
    WHEN 1 THEN '#10B981' -- green
    WHEN 2 THEN '#F59E0B' -- amber
    WHEN 3 THEN '#EF4444' -- red
    ELSE '#8B5CF6' -- purple
  END,
  'presencial'
FROM psychologists
WHERE onboarding_completed = true
ON CONFLICT DO NOTHING;
