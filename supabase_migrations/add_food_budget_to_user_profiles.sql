-- Adicionar campo food_budget na tabela user_profiles
-- Este campo armazena o orçamento alimentar do usuário para personalizar sugestões de alimentos

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS food_budget TEXT DEFAULT 'moderado' CHECK (food_budget IN ('economico', 'moderado', 'premium'));

-- Comentário explicativo
COMMENT ON COLUMN user_profiles.food_budget IS 'Orçamento alimentar do usuário: economico (frango, ovos, iogurte comum), moderado (peixe mais barato, iogurte grego ocasional), premium (salmão, iogurte grego, alimentos caros)';
