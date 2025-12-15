-- Migration: Criar tabela para métricas de rejeição de planos
-- Data: 2024

-- Criar tabela para armazenar métricas de rejeição
CREATE TABLE IF NOT EXISTS plan_rejection_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reason TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  context JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Índices para consultas frequentes
  CONSTRAINT valid_reason CHECK (reason IN (
    'weeklySchedule_invalido',
    'numero_dias_incompativel',
    'divisao_incompativel_frequencia',
    'dia_sem_exercicios',
    'excesso_exercicios_nivel',
    'exercicio_sem_primaryMuscle',
    'grupo_muscular_proibido',
    'lower_sem_grupos_obrigatorios',
    'full_body_sem_grupos_obrigatorios',
    'grupo_obrigatorio_ausente',
    'ordem_exercicios_invalida',
    'excesso_exercicios_musculo_primario',
    'distribuicao_inteligente_invalida',
    'secondaryMuscles_excede_limite',
    'tempo_treino_excede_disponivel'
  ))
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_plan_rejection_metrics_timestamp 
  ON plan_rejection_metrics(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_plan_rejection_metrics_reason 
  ON plan_rejection_metrics(reason);

CREATE INDEX IF NOT EXISTS idx_plan_rejection_metrics_created_at 
  ON plan_rejection_metrics(created_at DESC);

-- Índice GIN para busca em JSONB (context)
CREATE INDEX IF NOT EXISTS idx_plan_rejection_metrics_context 
  ON plan_rejection_metrics USING GIN (context);

-- Índice composto para consultas por período e motivo
CREATE INDEX IF NOT EXISTS idx_plan_rejection_metrics_timestamp_reason 
  ON plan_rejection_metrics(timestamp DESC, reason);

-- Comentários para documentação
COMMENT ON TABLE plan_rejection_metrics IS 'Armazena métricas de rejeição de planos de treino para análise e monitoramento';
COMMENT ON COLUMN plan_rejection_metrics.reason IS 'Motivo da rejeição (tipo de validação que falhou)';
COMMENT ON COLUMN plan_rejection_metrics.timestamp IS 'Timestamp Unix em milissegundos da rejeição';
COMMENT ON COLUMN plan_rejection_metrics.context IS 'Contexto adicional da rejeição (nível, tipo de dia, etc.) em formato JSON';
COMMENT ON COLUMN plan_rejection_metrics.created_at IS 'Data/hora de criação do registro no banco';

-- Política RLS (Row Level Security)
-- Por padrão, permitir leitura para usuários autenticados
-- Em produção, você pode querer restringir apenas para admins

ALTER TABLE plan_rejection_metrics ENABLE ROW LEVEL SECURITY;

-- Política: Permitir INSERT para todos (o sistema precisa registrar métricas)
CREATE POLICY "Allow insert for all" ON plan_rejection_metrics
  FOR INSERT
  WITH CHECK (true);

-- Política: Permitir SELECT apenas para usuários autenticados
-- (Você pode ajustar isso para apenas admins se necessário)
CREATE POLICY "Allow select for authenticated users" ON plan_rejection_metrics
  FOR SELECT
  TO authenticated
  USING (true);

-- Política: Permitir DELETE apenas para service_role (limpeza/manutenção)
-- Não permitir DELETE para usuários normais

-- Função para limpeza automática de dados antigos (opcional)
-- Remove registros com mais de 90 dias
CREATE OR REPLACE FUNCTION cleanup_old_rejection_metrics()
RETURNS void AS $$
BEGIN
  DELETE FROM plan_rejection_metrics
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Comentário na função
COMMENT ON FUNCTION cleanup_old_rejection_metrics IS 'Remove métricas com mais de 90 dias para manter o banco limpo';

