-- Migration: Adicionar coluna available_prompts à tabela user_trials
-- Execute este SQL no Supabase SQL Editor

-- Adicionar coluna available_prompts se não existir
ALTER TABLE user_trials 
ADD COLUMN IF NOT EXISTS available_prompts INTEGER DEFAULT 0;

-- Comentário da coluna
COMMENT ON COLUMN user_trials.available_prompts IS 'Número de prompts comprados disponíveis para o usuário gerar planos';

-- Atualizar registros existentes para ter 0 prompts (se necessário)
UPDATE user_trials 
SET available_prompts = 0 
WHERE available_prompts IS NULL;

