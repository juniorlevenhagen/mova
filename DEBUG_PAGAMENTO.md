# Checklist de Debug - Pagamento de Prompts

## Problema
Após efetuar um pagamento teste, o dashboard não está sendo atualizado com os prompts comprados.

## Checklist de Verificação

### 1. ✅ Verificar se a coluna `available_prompts` existe no banco

**Ação:** Execute no Supabase SQL Editor:
```sql
-- Verificar se a coluna existe
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_trials' 
AND column_name = 'available_prompts';
```

**Se não existir**, execute:
```sql
ALTER TABLE user_trials 
ADD COLUMN IF NOT EXISTS available_prompts INTEGER DEFAULT 0;

UPDATE user_trials 
SET available_prompts = 0 
WHERE available_prompts IS NULL;
```

### 2. ✅ Verificar configuração do Webhook no Stripe

1. Acesse: https://dashboard.stripe.com/webhooks
2. Verifique se há um webhook configurado apontando para:
   - **Produção:** `https://movamais.fit/api/webhooks/stripe`
   - **Desenvolvimento:** `https://seu-dominio.ngrok.io/api/webhooks/stripe` (ou similar)
3. Verifique se o webhook está escutando o evento: `checkout.session.completed`
4. Verifique se o `STRIPE_WEBHOOK_SECRET` está configurado corretamente no `.env.local`

### 3. ✅ Verificar logs do Webhook

**No terminal do servidor (Next.js), procure por:**
- `🔔 Webhook recebido - checkout.session.completed`
- `✅ Processando compra de X prompt(s) para usuário:`
- `✅ X prompt(s) adicionado(s). Total disponível: Y`
- `❌ Erro ao atualizar prompts:` (se houver erro)

**No Stripe Dashboard:**
1. Acesse: https://dashboard.stripe.com/webhooks
2. Clique no webhook configurado
3. Veja os eventos recentes
4. Verifique se há erros (vermelho) nos eventos `checkout.session.completed`

### 4. ✅ Verificar logs do verify-payment

**No terminal do servidor, após o retorno do Stripe, procure por:**
- `🔍 Verificando sessão do Stripe:`
- `✅ Pagamento confirmado: X prompt(s) comprado(s)`
- `📊 Trial encontrado: available_prompts=X`

### 5. ✅ Verificar retorno do Stripe no Frontend

**No console do navegador (F12), procure por:**
- Erros no console ao retornar do Stripe
- Verifique se `refetchTrial()` e `refetchPlanStatus()` estão sendo chamados

### 6. ✅ Testar manualmente

Execute no Supabase SQL Editor para verificar o estado atual:
```sql
SELECT 
  user_id,
  available_prompts,
  plans_generated,
  max_plans_allowed,
  is_active,
  upgraded_to_premium,
  updated_at
FROM user_trials
WHERE user_id = 'SEU_USER_ID_AQUI'
ORDER BY updated_at DESC;
```

### 7. ✅ Verificar variáveis de ambiente

Certifique-se de que estão configuradas:
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Solução Rápida (se webhook não estiver funcionando)

Se o webhook não estiver sendo chamado, você pode executar manualmente após o pagamento:

1. Obtenha o `session_id` da URL de retorno do Stripe
2. Execute no Supabase SQL Editor (ajustando os valores):
```sql
-- Substituir USER_ID e PROMPTS_AMOUNT pelos valores corretos
UPDATE user_trials
SET 
  available_prompts = COALESCE(available_prompts, 0) + 1, -- ou 3 para pacote
  updated_at = NOW()
WHERE user_id = 'USER_ID_AQUI';
```

## Próximos Passos

1. Execute a migração SQL para criar a coluna (se necessário)
2. Verifique os logs do webhook após fazer um pagamento teste
3. Verifique se o webhook está configurado corretamente no Stripe
4. Teste novamente e verifique os logs

