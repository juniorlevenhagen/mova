# 🔧 Aplicar Migração no Banco de Dados

## Problemas Identificados

1. **Constraint `valid_reason` incompleta**: A tabela `plan_rejection_metrics` não aceita os motivos:
   - `exercicio_musculo_incompativel`
   - `dias_mesmo_tipo_exercicios_diferentes`
   - `vies_estetico_detectado`
   - `volume_insuficiente_critico`

2. **CorrectionContext muito restritivo**: A interface exigia campos obrigatórios que nem sempre estavam disponíveis.

## Correções Aplicadas

### 1. Migração SQL
Arquivo criado: `supabase/migrations/20251222_fix_rejection_metrics_constraints.sql`

### 2. Correção no TypeScript
- `CorrectionContext` agora aceita campos opcionais
- Permite campos adicionais via index signature

## Como Aplicar a Migração

### Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Cole o conteúdo do arquivo `supabase/migrations/20251222_fix_rejection_metrics_constraints.sql`
4. Execute a query

### Opção 2: Via CLI do Supabase

```bash
supabase db push
```

### Opção 3: Executar SQL Manualmente

Execute o seguinte SQL no seu banco:

```sql
-- Remover a constraint antiga
ALTER TABLE plan_rejection_metrics 
DROP CONSTRAINT IF EXISTS valid_reason;

-- Adicionar a constraint atualizada
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
  'dias_mesmo_tipo_exercicios_diferentes'
));
```

## Verificação

Após aplicar a migração, verifique se funcionou:

```sql
-- Verificar se a constraint foi aplicada
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'plan_rejection_metrics'::regclass
  AND conname = 'valid_reason';

-- Testar inserção com um motivo que antes falhava
INSERT INTO plan_rejection_metrics (reason, timestamp, context)
VALUES (
  'exercicio_musculo_incompativel',
  EXTRACT(EPOCH FROM NOW()) * 1000,
  '{"test": true}'::jsonb
);

-- Se funcionou, remover o registro de teste
DELETE FROM plan_rejection_metrics WHERE context->>'test' = 'true';
```

## Arquivos Modificados

1. ✅ `supabase/migrations/20251222_fix_rejection_metrics_constraints.sql` - Nova migração
2. ✅ `src/lib/metrics/types.ts` - `CorrectionContext` agora com campos opcionais

## Próximos Passos

Após aplicar a migração:
1. Teste a geração de planos novamente
2. Verifique os logs para confirmar que não há mais erros de constraint
3. Monitore as métricas no dashboard

