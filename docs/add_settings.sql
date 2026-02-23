-- Migration: Add settings tables and columns
-- Run this in Supabase Dashboard -> SQL Editor

-- 1. Add new columns to psychologists table for general settings
ALTER TABLE psychologists ADD COLUMN IF NOT EXISTS clinic_phone VARCHAR(20);
ALTER TABLE psychologists ADD COLUMN IF NOT EXISTS clinic_email TEXT;
ALTER TABLE psychologists ADD COLUMN IF NOT EXISTS session_duration_minutes INTEGER DEFAULT 50;

-- 2. Add columns for event display settings
ALTER TABLE psychologists ADD COLUMN IF NOT EXISTS event_types_to_show TEXT[] DEFAULT ARRAY['appointment', 'blocked_time'];
ALTER TABLE psychologists ADD COLUMN IF NOT EXISTS event_card_order TEXT[] DEFAULT ARRAY['time', 'patient', 'type'];
ALTER TABLE psychologists ADD COLUMN IF NOT EXISTS primary_color VARCHAR(7) DEFAULT '#3B82F6';
ALTER TABLE psychologists ADD COLUMN IF NOT EXISTS secondary_color VARCHAR(7) DEFAULT '#10B981';

-- 3. Create rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  psychologist_id UUID NOT NULL REFERENCES psychologists(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7) DEFAULT '#3B82F6',
  appointment_type VARCHAR(50) DEFAULT 'presencial',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Add room_id column to slots
ALTER TABLE slots ADD COLUMN IF NOT EXISTS room_id UUID REFERENCES rooms(id) ON DELETE SET NULL;

-- 5. Add appointment_type column to slots
ALTER TABLE slots ADD COLUMN IF NOT EXISTS appointment_type VARCHAR(50) DEFAULT 'presencial';

-- 6. Enable RLS on rooms
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policy for rooms
DROP POLICY IF EXISTS "Users can manage own rooms" ON rooms;
CREATE POLICY "Users can manage own rooms" ON rooms
  FOR ALL USING (psychologist_id IN (SELECT id FROM psychologists WHERE user_id = auth.uid()));

-- 8. Create collaborators table (doctors/psychologists who work at the clinic)
CREATE TABLE IF NOT EXISTS collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  psychologist_id UUID NOT NULL REFERENCES psychologists(id) ON DELETE CASCADE,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  crp VARCHAR(20),
  specialty VARCHAR(100),
  bio TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(psychologist_id, email)
);

-- 9. Add foreign key to appointments for collaborators
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS collaborator_id UUID REFERENCES collaborators(id) ON DELETE SET NULL;

-- 10. Enable RLS on collaborators
ALTER TABLE collaborators ENABLE ROW LEVEL SECURITY;

-- 11. Create RLS policy for collaborators
DROP POLICY IF EXISTS "Users can manage own collaborators" ON collaborators;
CREATE POLICY "Users can manage own collaborators" ON collaborators
  FOR ALL USING (psychologist_id IN (SELECT id FROM psychologists WHERE user_id = auth.uid()));

-- 12. Create clinic_settings table for more complex settings
CREATE TABLE IF NOT EXISTS clinic_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  psychologist_id UUID NOT NULL UNIQUE REFERENCES psychologists(id) ON DELETE CASCADE,
  appointment_types TEXT[] DEFAULT ARRAY['presencial', 'online'],
  default_appointment_type VARCHAR(20) DEFAULT 'presencial',
  show_patient_phone BOOLEAN DEFAULT true,
  show_patient_email BOOLEAN DEFAULT true,
  require_patient_phone BOOLEAN DEFAULT true,
  require_patient_email BOOLEAN DEFAULT false,
  send_email_reminder BOOLEAN DEFAULT true,
  reminder_hours_before INTEGER DEFAULT 24,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 13. Enable RLS on clinic_settings
ALTER TABLE clinic_settings ENABLE ROW LEVEL SECURITY;

-- 14. Create RLS policy for clinic_settings
DROP POLICY IF EXISTS "Users can manage own clinic_settings" ON clinic_settings;
CREATE POLICY "Users can manage own clinic_settings" ON clinic_settings
  FOR ALL USING (psychologist_id IN (SELECT id FROM psychologists WHERE user_id = auth.uid()));

-- 15. Insert default settings for existing psychologists
INSERT INTO clinic_settings (psychologist_id)
SELECT id FROM psychologists
ON CONFLICT (psychologist_id) DO NOTHING;

-- 16. Insert default rooms for existing psychologists
INSERT INTO rooms (psychologist_id, name, color, appointment_type)
SELECT id, 'Sala Principal', '#3B82F6', 'presencial'
FROM psychologists
WHERE onboarding_completed = true
ON CONFLICT DO NOTHING;
