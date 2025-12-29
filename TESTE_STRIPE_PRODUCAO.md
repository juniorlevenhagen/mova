# Guia de Teste do Stripe em Produção

## 📋 Checklist Pré-Teste

- [ ] Variáveis de ambiente configuradas em produção
- [ ] Webhook configurado no Stripe Dashboard
- [ ] Código atualizado e deploy realizado
- [ ] Produtos criados no catálogo do Stripe com Price IDs corretos

## 🧪 Como Testar

### Teste 1: Compra de 1 Prompt (R$ 49,90)

1. Acesse: `https://movamais.fit/dashboard`
2. Faça login na sua conta
3. Clique em "Comprar Créditos" ou "Gerar Plano"
4. Selecione "1 Prompt - R$ 49,90"
5. Escolha "Cartão de Crédito"
6. Complete o checkout com um cartão real (valor será cobrado)
7. Após o pagamento, você será redirecionado para o dashboard

### Teste 2: Compra de 3 Prompts (R$ 119,90)

Repita os passos acima, selecionando "3 Prompts - R$ 119,90"

### Teste 3: Compra de 5 Prompts (R$ 179,90)

Repita os passos acima, selecionando "5 Prompts - R$ 179,90"

## ✅ O que Verificar Após o Teste

### 1. No Frontend (Dashboard)
- [ ] Redirecionamento para `/dashboard?purchase=success&session_id=...`
- [ ] Mensagem de sucesso aparecendo
- [ ] Prompts adicionados à conta (verificar contador de prompts disponíveis)
- [ ] Interface atualizada mostrando os novos prompts

### 2. No Stripe Dashboard
- [ ] Acesse: https://dashboard.stripe.com/payments
- [ ] Verifique se o pagamento aparece como "Pago" (Paid)
- [ ] Verifique se os produtos corretos estão associados
- [ ] Confira os valores: R$ 49,90, R$ 119,90 ou R$ 179,90

### 3. Webhook (CRÍTICO)
- [ ] Acesse: https://dashboard.stripe.com/webhooks
- [ ] Clique no seu endpoint
- [ ] Verifique "Eventos recentes" (Recent events)
- [ ] Procure por `checkout.session.completed`
- [ ] Status deve ser "Succeeded" (✅ verde)
- [ ] Se houver falha (❌ vermelho), clique para ver os logs de erro

### 4. No Banco de Dados (Supabase)
- [ ] Acesse o Supabase Dashboard
- [ ] Vá para a tabela `user_trials`
- [ ] Procure seu `user_id`
- [ ] Verifique se `available_prompts` foi incrementado corretamente:
  - 1 prompt → deve adicionar 1
  - 3 prompts → deve adicionar 3
  - 5 prompts → deve adicionar 5

### 5. Logs do Servidor
Verifique os logs da aplicação (Vercel, Railway, etc.):
- [ ] Procurar por: `🔍 Iniciando criação de sessão de checkout...`
- [ ] Procurar por: `✅ Usuário autenticado`
- [ ] Procurar por: `🔔 Webhook recebido - checkout.session.completed`
- [ ] Procurar por: `✅ Processando compra de X prompt(s)`

## 🔍 Troubleshooting

### Webhook não está sendo processado?
1. Verifique se `STRIPE_WEBHOOK_SECRET` está correto
2. Verifique se a URL do webhook está correta: `https://movamais.fit/api/webhooks/stripe`
3. Verifique se o endpoint está acessível (não bloqueado por firewall)
4. Veja os logs de erro no Stripe Dashboard → Webhooks → Seu endpoint → Eventos recentes

### Prompts não estão sendo adicionados?
1. Verifique os logs do webhook no Stripe Dashboard
2. Verifique os logs do servidor para erros no processamento
3. Verifique se o `user_id` está sendo passado corretamente no metadata
4. Verifique se a tabela `user_trials` existe e tem a coluna `available_prompts`

### Erro ao criar sessão de checkout?
1. Verifique se os Price IDs estão corretos
2. Verifique se as chaves do Stripe estão no modo "live" (não "test")
3. Verifique os logs do servidor para mensagens de erro específicas

## 📊 Monitoramento Contínuo

### Configurar Alertas no Stripe
1. Acesse: https://dashboard.stripe.com/settings/alerts
2. Configure alertas para:
   - Falhas de webhook
   - Pagamentos falhos
   - Disputas de pagamento

### Configurar Logs no Servidor
Monitore os logs da aplicação regularmente para:
- Erros de processamento de webhook
- Falhas na criação de sessões de checkout
- Problemas de conexão com o Stripe

## 💡 Dica de Segurança

**IMPORTANTE**: Nunca compartilhe suas chaves do Stripe:
- `STRIPE_SECRET_KEY` (começa com `sk_live_`)
- `STRIPE_WEBHOOK_SECRET` (começa com `whsec_`)

Mantenha essas chaves seguras e nunca as comite no Git.

