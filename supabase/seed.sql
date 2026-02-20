-- ============================================
-- SEED DATA FOR DEVELOPMENT TESTING
-- Run this in Supabase SQL Editor
-- ============================================

-- IMPORTANT: First run these migrations if needed:
-- ALTER TABLE psychologists ADD COLUMN email TEXT;
-- ALTER TABLE psychologists ADD COLUMN phone TEXT;
-- ALTER TABLE psychologists ADD COLUMN cpf TEXT;
-- ALTER TABLE psychologists ADD COLUMN clinic_name TEXT;
-- ALTER TABLE psychologists ADD COLUMN clinic_address TEXT;
-- ALTER TABLE psychologists ALTER COLUMN user_id DROP NOT NULL;
-- ALTER TABLE availability_rules ALTER COLUMN start_time DROP NOT NULL;
-- ALTER TABLE availability_rules ALTER COLUMN end_time DROP NOT NULL;

-- ============================================
-- 1. CREATE TEST PSYCHOLOGISTS
-- ============================================

-- Psychologist 1: Free Plan
INSERT INTO psychologists (
  email,
  full_name,
  cpf,
  phone,
  timezone,
  slug,
  clinic_name,
  clinic_address,
  default_session_price,
  plan,
  onboarding_completed
) VALUES (
  'psicologo.free@clinicamente.com',
  'Dr. Joao Silva (Free)',
  '123.456.789-00',
  '+5511999999001',
  'America/Sao_Paulo',
  'joao-silva-free',
  'Clinica Silva',
  'Rua das Flores, 123 - Sao Paulo, SP',
  15000,
  'free',
  true
) ON CONFLICT (slug) DO NOTHING;

-- Psychologist 2: Pro Plan
INSERT INTO psychologists (
  email,
  full_name,
  cpf,
  phone,
  timezone,
  slug,
  clinic_name,
  clinic_address,
  default_session_price,
  plan,
  plan_expires_at,
  onboarding_completed
) VALUES (
  'psicologo.pro@clinicamente.com',
  'Dr. Maria Santos (Pro)',
  '234.567.890-11',
  '+5511999999002',
  'America/Sao_Paulo',
  'maria-santos-pro',
  'Clinica Santos',
  'Av. Paulista, 456 - Sao Paulo, SP',
  20000,
  'pro',
  CURRENT_TIMESTAMP + INTERVAL '30 days',
  true
) ON CONFLICT (slug) DO NOTHING;

-- Psychologist 3: Pro Expired
INSERT INTO psychologists (
  email,
  full_name,
  cpf,
  phone,
  timezone,
  slug,
  clinic_name,
  clinic_address,
  default_session_price,
  plan,
  plan_expires_at,
  onboarding_completed
) VALUES (
  'psicologo.expired@clinicamente.com',
  'Dr. Pedro Oliveira (Expirado)',
  '345.678.901-22',
  '+5511999999003',
  'America/Sao_Paulo',
  'pedro-oliveira-expired',
  'Clinica Oliveira',
  'Rua Augusta, 789 - Sao Paulo, SP',
  18000,
  'pro',
  CURRENT_TIMESTAMP - INTERVAL '5 days',
  true
) ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 2. CREATE TEST PATIENTS (10 per psychologist)
-- ============================================

-- Patients for Dr. Joao Silva (Free)
DO $$
DECLARE
  psy_id UUID;
  i INT;
BEGIN
  SELECT id INTO psy_id FROM psychologists WHERE slug = 'joao-silva-free';
  
  FOR i IN 1..10 LOOP
    INSERT INTO patients (
      psychologist_id,
      full_name,
      email,
      phone,
      is_active
    ) VALUES (
      psy_id,
      'Paciente Free ' || i,
      'paciente.free' || i || '@email.com',
      '+5511999990' || LPAD(i::TEXT, 3, '0'),
      true
    );
  END LOOP;
END $$;

-- Patients for Dr. Maria Santos (Pro)
DO $$
DECLARE
  psy_id UUID;
  i INT;
BEGIN
  SELECT id INTO psy_id FROM psychologists WHERE slug = 'maria-santos-pro';
  
  FOR i IN 1..10 LOOP
    INSERT INTO patients (
      psychologist_id,
      full_name,
      email,
      phone,
      is_active
    ) VALUES (
      psy_id,
      'Paciente Pro ' || i,
      'paciente.pro' || i || '@email.com',
      '+5511999991' || LPAD(i::TEXT, 3, '0'),
      true
    );
  END LOOP;
END $$;

-- Patients for Dr. Pedro Oliveira (Expired)
DO $$
DECLARE
  psy_id UUID;
  i INT;
BEGIN
  SELECT id INTO psy_id FROM psychologists WHERE slug = 'pedro-oliveira-expired';
  
  FOR i IN 1..10 LOOP
    INSERT INTO patients (
      psychologist_id,
      full_name,
      email,
      phone,
      is_active
    ) VALUES (
      psy_id,
      'Paciente Expired ' || i,
      'paciente.expired' || i || '@email.com',
      '+5511999992' || LPAD(i::TEXT, 3, '0'),
      true
    );
  END LOOP;
END $$;

-- ============================================
-- 3. CREATE SLOTS (next 30 days)
-- ============================================

DO $$
DECLARE
  psy_id UUID;
  session_duration INT;
  slot_date DATE;
  slot_hour INT;
  start_datetime TIMESTAMP;
  end_datetime TIMESTAMP;
BEGIN
  FOR psy_id IN SELECT id FROM psychologists LOOP
    SELECT COALESCE(session_duration_minutes, 50) INTO session_duration FROM psychologists WHERE id = psy_id;
    
    FOR slot_date IN SELECT generate_series DATE FROM generate_series(CURRENT_DATE, CURRENT_DATE + 29, '1 day'::INTERVAL) LOOP
      -- Morning slots: 8h, 9h, 10h, 11h
      FOR slot_hour IN SELECT generate_series FROM generate_series(8, 11) LOOP
        start_datetime := slot_date + (slot_hour || ':00')::TIME;
        end_datetime := start_datetime + (session_duration || ' minutes')::INTERVAL;
        
        INSERT INTO slots (psychologist_id, start_at, end_at, status)
        VALUES (
          psy_id,
          start_datetime,
          end_datetime,
          CASE WHEN random() < 0.7 THEN 'available' ELSE 'reserved' END
        );
      END LOOP;
      
      -- Afternoon slots: 14h, 15h, 16h, 17h
      FOR slot_hour IN SELECT generate_series FROM generate_series(14, 17) LOOP
        start_datetime := slot_date + (slot_hour || ':00')::TIME;
        end_datetime := start_datetime + (session_duration || ' minutes')::INTERVAL;
        
        INSERT INTO slots (psychologist_id, start_at, end_at, status)
        VALUES (
          psy_id,
          start_datetime,
          end_datetime,
          CASE WHEN random() < 0.7 THEN 'available' ELSE 'reserved' END
        );
      END LOOP;
    END LOOP;
  END LOOP;
END $$;

-- ============================================
-- 4. CREATE APPOINTMENTS (all states)
-- ============================================

-- Dr. Joao Silva (Free) - Mix of states
DO $$
DECLARE
  psy_id UUID;
  pat_id UUID;
  sl_id UUID;
  i INT;
BEGIN
  SELECT id INTO psy_id FROM psychologists WHERE slug = 'joao-silva-free';
  
  -- Pending appointments (future)
  FOR i IN 1..3 LOOP
    SELECT id INTO pat_id FROM patients WHERE psychologist_id = psy_id ORDER BY random() LIMIT 1;
    SELECT id INTO sl_id FROM slots WHERE psychologist_id = psy_id AND status = 'reserved' ORDER BY random() LIMIT 1;
    
    IF sl_id IS NOT NULL THEN
      UPDATE slots SET status = 'confirmed' WHERE id = sl_id;
      
      INSERT INTO appointments (psychologist_id, patient_id, slot_id, status, payment_status)
      VALUES (psy_id, pat_id, sl_id, 'pending', 'pending');
    END IF;
  END LOOP;
  
  -- Confirmed appointments (future with payment)
  FOR i IN 1..2 LOOP
    SELECT id INTO pat_id FROM patients WHERE psychologist_id = psy_id ORDER BY random() LIMIT 1;
    SELECT id INTO sl_id FROM slots WHERE psychologist_id = psy_id AND status IN ('reserved', 'available') ORDER BY random() LIMIT 1;
    
    IF sl_id IS NOT NULL THEN
      UPDATE slots SET status = 'confirmed' WHERE id = sl_id;
      
      INSERT INTO appointments (psychologist_id, patient_id, slot_id, status, payment_status)
      VALUES (psy_id, pat_id, sl_id, 'confirmed', 'paid');
    END IF;
  END LOOP;
  
  -- Completed appointments (past)
  FOR i IN 1..3 LOOP
    SELECT id INTO pat_id FROM patients WHERE psychologist_id = psy_id ORDER BY random() LIMIT 1;
    
    INSERT INTO appointments (psychologist_id, patient_id, status, payment_status)
    VALUES (psy_id, pat_id, 'completed', 'paid');
  END LOOP;
  
  -- Cancelled appointments
  FOR i IN 1..2 LOOP
    SELECT id INTO pat_id FROM patients WHERE psychologist_id = psy_id ORDER BY random() LIMIT 1;
    
    INSERT INTO appointments (psychologist_id, patient_id, status, payment_status, cancelled_by)
    VALUES (psy_id, pat_id, 'cancelled', 'refunded', 'patient');
  END LOOP;
END $$;

-- Dr. Maria Santos (Pro) - More diverse
DO $$
DECLARE
  psy_id UUID;
  pat_id UUID;
  sl_id UUID;
  i INT;
BEGIN
  SELECT id INTO psy_id FROM psychologists WHERE slug = 'maria-santos-pro';
  
  -- Pending (future)
  FOR i IN 1..4 LOOP
    SELECT id INTO pat_id FROM patients WHERE psychologist_id = psy_id ORDER BY random() LIMIT 1;
    SELECT id INTO sl_id FROM slots WHERE psychologist_id = psy_id AND status = 'reserved' ORDER BY random() LIMIT 1;
    
    IF sl_id IS NOT NULL THEN
      UPDATE slots SET status = 'confirmed' WHERE id = sl_id;
      
      INSERT INTO appointments (psychologist_id, patient_id, slot_id, status, payment_status)
      VALUES (psy_id, pat_id, sl_id, 'pending', 'pending');
    END IF;
  END LOOP;
  
  -- Confirmed (future with payment)
  FOR i IN 1..3 LOOP
    SELECT id INTO pat_id FROM patients WHERE psychologist_id = psy_id ORDER BY random() LIMIT 1;
    SELECT id INTO sl_id FROM slots WHERE psychologist_id = psy_id AND status IN ('reserved', 'available') ORDER BY random() LIMIT 1;
    
    IF sl_id IS NOT NULL THEN
      UPDATE slots SET status = 'confirmed' WHERE id = sl_id;
      
      INSERT INTO appointments (psychologist_id, patient_id, slot_id, status, payment_status)
      VALUES (psy_id, pat_id, sl_id, 'confirmed', 'paid');
    END IF;
  END LOOP;
  
  -- Completed (past)
  FOR i IN 1..5 LOOP
    SELECT id INTO pat_id FROM patients WHERE psychologist_id = psy_id ORDER BY random() LIMIT 1;
    
    INSERT INTO appointments (psychologist_id, patient_id, status, payment_status)
    VALUES (psy_id, pat_id, 'completed', 'paid');
  END LOOP;
  
  -- Cancelled (past)
  FOR i IN 1..2 LOOP
    SELECT id INTO pat_id FROM patients WHERE psychologist_id = psy_id ORDER BY random() LIMIT 1;
    
    INSERT INTO appointments (psychologist_id, patient_id, status, payment_status, cancelled_by)
    VALUES (psy_id, pat_id, 'cancelled', 'refunded', 'psychologist');
  END LOOP;
END $$;

-- ============================================
-- 5. CREATE PAYMENTS
-- ============================================

DO $$
DECLARE
  appt RECORD;
  appt_status TEXT;
BEGIN
  FOR appt IN SELECT id, psychologist_id, payment_status FROM appointments LOOP
    appt_status := appt.payment_status;
    
    INSERT INTO payments (
      psychologist_id,
      appointment_id,
      gateway,
      amount,
      status,
      payment_method,
      paid_at
    ) VALUES (
      appt.psychologist_id,
      appt.id,
      'stripe',
      15000,
      CASE 
        WHEN appt_status = 'paid' THEN 'paid'
        WHEN appt_status = 'pending' THEN 'pending'
        WHEN appt_status = 'refunded' THEN 'refunded'
        ELSE 'pending'
      END,
      CASE WHEN appt_status = 'paid' THEN 'pix' ELSE NULL END,
      CASE WHEN appt_status = 'paid' THEN CURRENT_TIMESTAMP - (random() * 30 || ' days')::INTERVAL END
    );
  END LOOP;
END $$;

-- ============================================
-- 6. CREATE AVAILABILITY RULES
-- ============================================

DO $$
DECLARE
  psy_id UUID;
  day_of_week INT;
BEGIN
  FOR psy_id IN SELECT id FROM psychologists LOOP
    -- Weekday rules (Monday to Friday) - 1 = Monday, 5 = Friday
    FOR day_of_week IN SELECT generate_series FROM generate_series(1, 5) LOOP
      INSERT INTO availability_rules (psychologist_id, day_of_week, start_time, end_time, is_active)
      VALUES (psy_id, day_of_week, '08:00:00', '12:00:00', true);
      
      INSERT INTO availability_rules (psychologist_id, day_of_week, start_time, end_time, is_active)
      VALUES (psy_id, day_of_week, '14:00:00', '18:00:00', true);
    END LOOP;
    
    -- Weekend rules (Saturday=6 and Sunday=0) - not available
    FOR day_of_week IN SELECT generate_series FROM generate_series(0, 6) LOOP
      IF day_of_week = 0 OR day_of_week = 6 THEN
        INSERT INTO availability_rules (psychologist_id, day_of_week, is_active)
        VALUES (psy_id, day_of_week, false);
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- ============================================
-- VERIFY SEED DATA
-- ============================================

SELECT 'Psychologists created:' AS info, COUNT(*)::TEXT AS count FROM psychologists
UNION ALL
SELECT 'Patients created:', COUNT(*)::TEXT FROM patients
UNION ALL
SELECT 'Slots created:', COUNT(*)::TEXT FROM slots
UNION ALL
SELECT 'Appointments created:', COUNT(*)::TEXT FROM appointments
UNION ALL
SELECT 'Payments created:', COUNT(*)::TEXT FROM payments
UNION ALL
SELECT 'Availability rules created:', COUNT(*)::TEXT FROM availability_rules;
