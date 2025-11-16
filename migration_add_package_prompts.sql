-- Migration: Adicionar coluna package_prompts à tabela user_trials
-- Execute este SQL no Supabase SQL Editor
-- Esta coluna rastreia quantos prompts do pacote de 3 o usuário tem (estes têm cooldown de 24h)

-- Adicionar coluna package_prompts se não existir
ALTER TABLE user_trials 
ADD COLUMN IF NOT EXISTS package_prompts INTEGER DEFAULT 0;

-- Comentário da coluna
COMMENT ON COLUMN user_trials.package_prompts IS 'Número de prompts do pacote de 3 que o usuário tem disponíveis (têm cooldown de 24h entre gerações)';

-- Atualizar registros existentes para ter 0 prompts do pacote (se necessário)
UPDATE user_trials 
SET package_prompts = 0 
WHERE package_prompts IS NULL;

