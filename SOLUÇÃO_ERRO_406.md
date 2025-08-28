# Solução para Erro 406 na Tabela user_trials

## 🔍 Diagnóstico

O erro **406 (Not Acceptable)** que você está recebendo ao carregar o dashboard é causado por incompatibilidades entre:

1. **Interface TypeScript** no `useTrial.ts` que espera colunas que podem não existir
2. **Estrutura da tabela** `user_trials` no banco de dados
3. **Políticas RLS** inadequadas ou conflitantes
4. **Funções do banco** (`get_trial_status_new`) que podem não existir

## ⚠️ Causas Identificadas

### 1. Colunas Faltando na Tabela

O código TypeScript espera estas colunas que podem não existir no banco:

- `last_plan_generated_at`
- `premium_plan_count`
- `premium_plan_cycle_start`
- `premium_max_plans_per_cycle`
- `premium_cycle_days`

### 2. Políticas RLS Conflitantes

As políticas de Row Level Security podem estar mal configuradas ou conflitantes.

### 3. Função `get_trial_status_new` Inexistente

O código chama `supabase.rpc("get_trial_status_new")` mas a função pode não ter sido criada no banco.

## 🛠️ Soluções Disponíveis

### Opção 1: Script Completo de Diagnóstico e Correção

Execute o arquivo `fix_user_trials_406_error.sql` no **Supabase SQL Editor**:

- Faz diagnóstico completo da estrutura
- Adiciona colunas faltantes
- Corrige políticas RLS
- Recria funções necessárias
- Testa com seu usuário específico

### Opção 2: Script Rápido (Recomendado)

Execute o arquivo `quick_fix_406.sql` no **Supabase SQL Editor**:

- Correção mais direta e simples
- Adiciona colunas faltantes
- Corrige políticas básicas
- Cria registro para seu usuário

## 📋 Passos para Resolver

1. **Abra o Supabase Dashboard**
2. **Vá em SQL Editor**
3. **Execute um dos scripts:**
   - `quick_fix_406.sql` (recomendado para correção rápida)
   - `fix_user_trials_406_error.sql` (para diagnóstico completo)
4. **Teste a aplicação novamente**

## 🔧 O Que os Scripts Fazem

### Adicionam Colunas Faltantes:

```sql
ALTER TABLE user_trials
ADD COLUMN IF NOT EXISTS last_plan_generated_at TIMESTAMP WITH TIME ZONE NULL,
ADD COLUMN IF NOT EXISTS premium_plan_count INTEGER DEFAULT 0,
-- ... outras colunas
```

### Corrigem Políticas RLS:

```sql
DROP POLICY IF EXISTS "Users can view their own trial" ON user_trials;
CREATE POLICY "Users can view their own trial" ON user_trials
  FOR SELECT USING (auth.uid() = user_id);
```

### Garantem Registro do Usuário:

```sql
INSERT INTO user_trials (user_id, plans_generated, is_active)
VALUES ('750a6804-fbcb-4fee-8c5e-2b1facc52ca3', 0, true)
ON CONFLICT (user_id) DO NOTHING;
```

## ✅ Verificação Pós-Correção

Após executar o script, verifique:

1. A página do dashboard carrega sem erros 406
2. A seção de trial aparece corretamente
3. Não há mais mensagens de erro no console do navegador

## 🆘 Se o Problema Persistir

Se ainda houver erro após executar os scripts:

1. Verifique o console do navegador para erros mais específicos
2. Execute o script de diagnóstico completo (`fix_user_trials_406_error.sql`)
3. Verifique se todas as funções foram criadas corretamente
4. Confirme se as políticas RLS estão ativas

## 📝 Detalhes Técnicos

O erro 406 especificamente indica que o servidor Supabase não consegue retornar os dados no formato esperado, geralmente devido a:

- Schema incompatível entre interface TypeScript e tabela SQL
- Políticas RLS bloqueando acesso
- Funções RPC inexistentes ou com erro

A correção garante que a estrutura da tabela seja compatível com o código TypeScript e que as permissões estejam corretas.
