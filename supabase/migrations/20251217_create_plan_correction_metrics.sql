-- Tabela para métricas de correções aplicadas (não rejeições)
CREATE TABLE IF NOT EXISTS plan_correction_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reason TEXT NOT NULL,                -- Tipo da correção (ex: objetivo_convertido_fisiologico)
  payload JSONB NOT NULL,              -- Dados da correção (original, corrigido, massa magra, etc)
  context JSONB NOT NULL,              -- Contexto do usuário (IMC, gênero, nível)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance no Dashboard
CREATE INDEX IF NOT EXISTS idx_correction_reason ON plan_correction_metrics(reason);
CREATE INDEX IF NOT EXISTS idx_correction_created_at ON plan_correction_metrics(created_at);

-- Comentário para documentação
COMMENT ON TABLE plan_correction_metrics IS 'Métricas estratégicas de ajustes automáticos feitos pelo sistema (nível produção).';

