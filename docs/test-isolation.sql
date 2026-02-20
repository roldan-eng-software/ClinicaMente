-- ============================================================
-- TESTE DE ISOLAMENTO ENTRE TENANTS
-- Execute este script no Editor SQL do Supabase
-- ============================================================

-- AVISO: Execute apenas em ambiente de desenvolvimento/teste

-- ============================================================
-- PARTE 1: Criar usuários de teste (execute com service_role)
-- ============================================================

-- Criar usuários de teste no auth.users
-- Execute as linhas abaixo separadamente no SQL Editor:

/*
-- Usuário 1: Dr. João Silva
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'joao.teste@clinicamente.com',
  crypt('teste123', gen_salt('bf')),
  NOW(),
  NOW()
);

-- Usuário 2: Dra. Maria Santos
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'maria.teste@clinicamente.com',
  crypt('teste123', gen_salt('bf')),
  NOW(),
  NOW()
);
*/

-- ============================================================
-- PARTE 2: Criar registros de psicólogos (execute com service_role)
-- ============================================================

/*
-- Psicólogo 1: Dr. João Silva
INSERT INTO psychologists (id, user_id, slug, full_name, crp, specialty, plan)
VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '11111111-1111-1111-1111-111111111111',
  'joao-silva',
  'Dr. João Silva',
  '06/123456',
  'Psicologia Clínica',
  'free'
);

-- Psicólogo 2: Dra. Maria Santos
INSERT INTO psychologists (id, user_id, slug, full_name, crp, specialty, plan)
VALUES (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  '22222222-2222-2222-2222-222222222222',
  'maria-santos',
  'Dra. Maria Santos',
  '07/654321',
  'Psicologia Organizacional',
  'pro'
);
*/

-- ============================================================
-- PARTE 3: Inserir dados de teste
-- ============================================================

/*
-- Paciente do Dr. João
INSERT INTO patients (psychologist_id, full_name, email, phone)
VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Pedro Paciente',
  'pedro@email.com',
  '+5511999999999'
);

-- Paciente da Dra. Maria
INSERT INTO patients (psychologist_id, full_name, email, phone)
VALUES (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'Ana Paciente',
  'ana@email.com',
  '+5511888888888'
);
*/

-- ============================================================
-- PARTE 4: Testar isolamento (execute como usuário autenticado)
-- ============================================================

-- Para testar, você precisa simular a sessão do usuário.
-- Configure a variável de sessão:

/*
SET LOCAL auth.jwt.claims.sub = '11111111-1111-1111-1111-111111111111';
*/

-- Depois execute as queries de teste abaixo:

-- ============================================================
-- TESTE 1: Psicólogo 1 tentando ver pacientes
-- ============================================================
-- Com a sessão do Dr. João, execute:
-- SELECT * FROM patients;

-- Resultado esperado: APENAS 1 paciente (Pedro)
-- Se retornar 2 pacientes = FALHA NO ISOLAMENTO

-- ============================================================
-- TESTE 2: Psicólogo tentando ver psychologists
-- ============================================================
-- Com a sessão do Dr. João, execute:
-- SELECT id, full_name, slug FROM psychologists;

-- Resultado esperado: APENAS 1 registro (Dr. João)
-- Se retornar 2 registros = FALHA NO ISOLAMENTO

-- ============================================================
-- PARTE 5: Limpeza dos dados de teste
-- ============================================================

/*
-- Execute com service_role para limpar
DELETE FROM patients WHERE psychologist_id IN (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
);

DELETE FROM psychologists WHERE id IN (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
);

DELETE FROM auth.users WHERE id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222'
);
*/

-- ============================================================
-- VERIFICAÇÃO RÁPIDA: Verificar políticas existentes
-- ============================================================

SELECT 
  tablename,
  policyname,
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN 'WITH CHECK'
    ELSE 'USING'
  END as policy_type,
  SUBSTRING(qual::text, 1, 100) as condition_preview
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
