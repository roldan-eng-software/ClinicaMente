-- ============================================
-- SISTEMA DE PRONTUÁRIO PSICOLÓGICO
-- ClinicaMente - Migration v1.0
-- ============================================
-- Execute este SQL no Supabase SQL Editor
-- ============================================

BEGIN;

-- ============================================
-- TABELA: prontuarios (Mestre)
-- ============================================
CREATE TABLE IF NOT EXISTS prontuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paciente_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    psicologo_id UUID NOT NULL REFERENCES psychologists(id) ON DELETE RESTRICT,
    status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'encerrado', 'suspenso')),
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    versao INT DEFAULT 1,
    
    CONSTRAINT unique_prontuario_paciente_psicologo 
        UNIQUE(paciente_id, psicologo_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_prontuarios_psicologo_id 
    ON prontuarios(psicologo_id);

CREATE INDEX IF NOT EXISTS idx_prontuarios_paciente_id 
    ON prontuarios(paciente_id);

CREATE INDEX IF NOT EXISTS idx_prontuarios_status 
    ON prontuarios(status);

-- ============================================
-- TABELA: prontuario_secoes (Modular - JSON)
-- ============================================
CREATE TABLE IF NOT EXISTS prontuario_secoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prontuario_id UUID NOT NULL REFERENCES prontuarios(id) ON DELETE CASCADE,
    tipo_secao VARCHAR(50) NOT NULL CHECK (
        tipo_secao IN (
            'identificacao',
            'anamnese',
            'queixa_principal',
            'historia_clinica',
            'historia_familiar',
            'objetivos_terapeuticos',
            'planejamento_tratamento',
            'evolucao',
            'encerramento'
        )
    ),
    dados_json JSONB DEFAULT '{}'::jsonb,
    data_preenchimento TIMESTAMP WITH TIME ZONE,
    preenchido_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    versao_registro INT DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_secao_prontuario_tipo 
        UNIQUE(prontuario_id, tipo_secao)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_prontuario_secoes_prontuario_id 
    ON prontuario_secoes(prontuario_id);

CREATE INDEX IF NOT EXISTS idx_prontuario_secoes_tipo_secao 
    ON prontuario_secoes(tipo_secao);

-- ============================================
-- TABELA: sessoes_clinicas
-- ============================================
CREATE TABLE IF NOT EXISTS sessoes_clinicas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prontuario_id UUID NOT NULL REFERENCES prontuarios(id) ON DELETE CASCADE,
    numero_sessao INT NOT NULL,
    data_sessao DATE NOT NULL,
    hora_sessao TIME,
    duracao_minutos INT DEFAULT 50,
    tipo_sessao VARCHAR(20) DEFAULT 'presencial' CHECK (tipo_sessao IN ('presencial', 'online', 'telefonica')),
    tema_principal TEXT,
    intervencoes TEXT,
    evolucao TEXT,
    observacoes TEXT,
    proximas_tarefas TEXT,
    presenca VARCHAR(20) DEFAULT 'compareceu' CHECK (presenca IN ('compareceu', 'faltou', 'remarcado', 'cancelado')),
    registradas_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    data_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_sessao_prontuario_numero 
        UNIQUE(prontuario_id, numero_sessao)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_sessoes_clinicas_prontuario_id 
    ON sessoes_clinicas(prontuario_id);

CREATE INDEX IF NOT EXISTS idx_sessoes_clinicas_data_sessao 
    ON sessoes_clinicas(data_sessao);

-- ============================================
-- TABELA: prontuario_versoes (Auditoria)
-- ============================================
CREATE TABLE IF NOT EXISTS prontuario_versoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prontuario_id UUID NOT NULL REFERENCES prontuarios(id) ON DELETE CASCADE,
    secao_id UUID REFERENCES prontuario_secoes(id) ON DELETE CASCADE,
    sessao_id UUID REFERENCES sessoes_clinicas(id) ON DELETE CASCADE,
    tipo_registro VARCHAR(20) NOT NULL CHECK (tipo_registro IN ('prontuario', 'secao', 'sessao')),
    dados_anteriores JSONB,
    dados_novos JSONB,
    alterado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para auditoria
CREATE INDEX IF NOT EXISTS idx_prontuario_versoes_prontuario_id 
    ON prontuario_versoes(prontuario_id);

CREATE INDEX IF NOT EXISTS idx_prontuario_versoes_created_at 
    ON prontuario_versoes(created_at);

CREATE INDEX IF NOT EXISTS idx_prontuario_versoes_alterado_por 
    ON prontuario_versoes(alterado_por);

-- ============================================
-- FUNÇÃO: Atualizar timestamp automaticamente
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
CREATE TRIGGER update_prontuarios_updated_at 
    BEFORE UPDATE ON prontuarios 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prontuario_secoes_updated_at 
    BEFORE UPDATE ON prontuario_secoes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessoes_clinicas_updated_at 
    BEFORE UPDATE ON sessoes_clinicas 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS - Row Level Security (Opcional)
-- ============================================
-- Descomente se quiser habilitar RLS

-- ENABLE RLS ON prontuarios;
-- ENABLE RLS ON prontuario_secoes;
-- ENABLE RLS ON sessoes_clinicas;
-- ENABLE RLS ON prontuario_versoes;

-- Policy para psychologists verem apenas seus prontuarios
-- CREATE POLICY "psychologists_access_own_prontuarios" ON prontuarios
--     FOR ALL USING (
--         psicologo_id IN (
--             SELECT id FROM psychologists 
--             WHERE user_id = auth.uid()
--         )
--     );

COMMIT;

-- ============================================
-- VERIFICAÇÃO
-- ============================================
SELECT 
    'prontuarios' AS table_name, 
    COUNT(*) AS exists 
FROM information_schema.tables 
WHERE table_name = 'prontuarios'
UNION ALL
SELECT 
    'prontuario_secoes', 
    COUNT(*) 
FROM information_schema.tables 
WHERE table_name = 'prontuario_secoes'
UNION ALL
SELECT 
    'sessoes_clinicas', 
    COUNT(*) 
FROM information_schema.tables 
WHERE table_name = 'sessoes_clinicas'
UNION ALL
SELECT 
    'prontuario_versoes', 
    COUNT(*) 
FROM information_schema.tables 
WHERE table_name = 'prontuario_versoes';
