-- Tabela para armazenar dados normalizados de treino aeróbico
-- Segue o mesmo padrão das outras tabelas normalizadas (plan_analyses, plan_trainings, plan_nutrition)

CREATE TABLE IF NOT EXISTS plan_aerobic (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID NOT NULL REFERENCES user_plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  overview TEXT,
  weekly_schedule JSONB, -- Array de atividades semanais com day, activity, duration, intensity, heartRateZone, notes
  recommendations TEXT,
  progression TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(plan_id) -- Garante idempotência: apenas um registro por plano
);

-- Índices para melhorar performance de consultas
CREATE INDEX IF NOT EXISTS idx_plan_aerobic_user_id ON plan_aerobic(user_id);
CREATE INDEX IF NOT EXISTS idx_plan_aerobic_plan_id ON plan_aerobic(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_aerobic_created_at ON plan_aerobic(created_at DESC);

-- Comentários para documentação
COMMENT ON TABLE plan_aerobic IS 'Dados normalizados de treino aeróbico/cardiovascular extraídos de user_plans.plan_data';
COMMENT ON COLUMN plan_aerobic.weekly_schedule IS 'Array JSONB com cronograma semanal: [{day, activity, duration, intensity, heartRateZone?, notes?}]';

