-- Migration: Add expenses and tasks tables for dashboard
-- Run this in Supabase Dashboard -> SQL Editor

-- 1. Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  psychologist_id UUID NOT NULL REFERENCES psychologists(id) ON DELETE CASCADE,
  description VARCHAR(255) NOT NULL,
  amount INTEGER NOT NULL,
  category VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  psychologist_id UUID NOT NULL REFERENCES psychologists(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date DATE,
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Enable RLS on expenses
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policy for expenses
DROP POLICY IF EXISTS "Users can manage own expenses" ON expenses;
CREATE POLICY "Users can manage own expenses" ON expenses
  FOR ALL USING (psychologist_id IN (SELECT id FROM psychologists WHERE user_id = auth.uid()));

-- 5. Enable RLS on tasks
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policy for tasks
DROP POLICY IF EXISTS "Users can manage own tasks" ON tasks;
CREATE POLICY "Users can manage own tasks" ON tasks
  FOR ALL USING (psychologist_id IN (SELECT id FROM psychologists WHERE user_id = auth.uid()));

-- 7. Insert sample expenses for existing psychologists
INSERT INTO expenses (psychologist_id, description, amount, category, date)
SELECT 
  p.id,
  'Sample Expense ' || (row_number() % 3 + 1)::text,
  CASE (row_number() % 3)
    WHEN 0 THEN 10000 -- R$ 100
    WHEN 1 THEN 25000 -- R$ 250
    ELSE 50000       -- R$ 500
  END,
  CASE (row_number() % 3)
    WHEN 0 THEN 'supplies'
    WHEN 1 THEN 'equipment'
    ELSE 'rent'
  END,
  CURRENT_DATE - (random() * 30)::integer
FROM psychologists p
WHERE onboarding_completed = true
WITH ORDINALITY AS t(row_number)
ON CONFLICT DO NOTHING;

-- 8. Insert sample tasks for existing psychologists
INSERT INTO tasks (psychologist_id, title, description, due_date, priority, completed)
SELECT 
  p.id,
  'Task ' || (row_number() % 4 + 1)::text,
  'Sample task description',
  CURRENT_DATE + (row_number() % 7),
  CASE (row_number() % 3)
    WHEN 0 THEN 'high'
    WHEN 1 THEN 'medium'
    ELSE 'low'
  END,
  false
FROM psychologists p
WHERE onboarding_completed = true
WITH ORDINALITY AS t(row_number)
ON CONFLICT DO NOTHING;

-- 9. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_expenses_psychologist_id ON expenses(psychologist_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_tasks_psychologist_id ON tasks(psychologist_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);
