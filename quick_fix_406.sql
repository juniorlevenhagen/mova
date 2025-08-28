-- Script rápido para corrigir erro 406 na tabela user_trials
-- Execute no Supabase SQL Editor

-- Verificação rápida da estrutura
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'user_trials' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Adicionar colunas que podem estar faltando (sem erro se já existirem)
ALTER TABLE user_trials 
ADD COLUMN IF NOT EXISTS last_plan_generated_at TIMESTAMP WITH TIME ZONE NULL,
ADD COLUMN IF NOT EXISTS premium_plan_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS premium_plan_cycle_start TIMESTAMP WITH TIME ZONE NULL,
ADD COLUMN IF NOT EXISTS premium_max_plans_per_cycle INTEGER DEFAULT 2,
ADD COLUMN IF NOT EXISTS premium_cycle_days INTEGER DEFAULT 30;

-- Garantir RLS e políticas
ALTER TABLE user_trials ENABLE ROW LEVEL SECURITY;

-- Recriar políticas (removendo primeiro se existirem)
DROP POLICY IF EXISTS "Users can view their own trial" ON user_trials;
DROP POLICY IF EXISTS "Users can insert their own trial" ON user_trials;

CREATE POLICY "Users can view their own trial" ON user_trials
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trial" ON user_trials
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Criar registro para o usuário se não existir
INSERT INTO user_trials (user_id, plans_generated, is_active)
VALUES ('750a6804-fbcb-4fee-8c5e-2b1facc52ca3', 0, true)
ON CONFLICT (user_id) DO NOTHING;

-- Verificar se funcionou
SELECT * FROM user_trials WHERE user_id = '750a6804-fbcb-4fee-8c5e-2b1facc52ca3';

SELECT 'Fix aplicado! Teste a aplicação agora.' as result;
