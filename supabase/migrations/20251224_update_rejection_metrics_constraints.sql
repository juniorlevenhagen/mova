-- Migration: Atualizar constraint valid_reason na tabela plan_rejection_metrics
-- Data: 2025-12-24
-- Problema: A constraint não inclui os novos motivos de rejeição adicionados ao código TypeScript

-- 1. Remover a constraint antiga
ALTER TABLE plan_rejection_metrics 
DROP CONSTRAINT IF EXISTS valid_reason;

-- 2. Adicionar a constraint atualizada com todos os motivos
ALTER TABLE plan_rejection_metrics
ADD CONSTRAINT valid_reason CHECK (reason IN (
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
  'tempo_treino_excede_disponivel',
  'vies_estetico_detectado',
  'volume_insuficiente_critico',
  'exercicio_musculo_incompativel',
  'dias_mesmo_tipo_exercicios_diferentes',
  'excesso_series_semanais',
  'excesso_padrao_motor',
  'excesso_volume_em_deficit',
  'excesso_series_por_sessao',
  'excesso_exercicios_sessao',
  'reps_fora_limites_perfil',
  'isolador_com_reps_baixas',
  'excesso_exercicios_reps_baixas'
));

-- Comentário para documentação
COMMENT ON CONSTRAINT valid_reason ON plan_rejection_metrics IS 
'Valida que o motivo da rejeição está na lista de motivos válidos definidos no código TypeScript';

