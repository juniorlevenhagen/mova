# Configuração do Mercado Pago para Pagamentos PIX

Este documento descreve como configurar o Mercado Pago para aceitar pagamentos via PIX no Mova+.

## 📋 Pré-requisitos

1. Conta no Mercado Pago (https://www.mercadopago.com.br/)
2. Chave PIX cadastrada no Mercado Pago
3. Acesso ao painel de desenvolvedores do Mercado Pago

## 🔑 Obter Credenciais

1. Acesse o painel do Mercado Pago: https://www.mercadopago.com.br/developers/panel/app
2. Selecione sua aplicação (ou crie uma nova)
3. Vá em **Credenciais**
4. Copie o **Access Token** (Token de Produção ou Token de Teste)

## 📝 Variáveis de Ambiente

Adicione a seguinte variável ao seu arquivo `.env.local`:

```env
MERCADOPAGO_ACCESS_TOKEN=seu_access_token_aqui
```

## 🗄️ Banco de Dados

Execute a migration SQL para criar a tabela de pagamentos PIX:

```bash
# No Supabase, execute o arquivo:
supabase_migrations/create_pix_payments.sql
```

Ou execute manualmente no SQL Editor do Supabase.

## 🔗 Configurar Webhook

Para receber notificações de pagamento automaticamente:

1. No painel do Mercado Pago, vá em **Webhooks**
2. Adicione uma nova URL:
   - **Produção**: `https://movamais.fit/api/webhooks/mercadopago`
   - **Desenvolvimento**: Use uma ferramenta como ngrok: `ngrok http 3000` e use a URL gerada
3. Selecione os eventos:
   - `payment`
   - `payment.updated`
4. Salve as configurações

## ✅ Testes

### Modo Teste (Sandbox)

1. Use o **Access Token de Teste** nas variáveis de ambiente
2. Use cartões de teste do Mercado Pago para simular pagamentos
3. Para PIX de teste, consulte a documentação do Mercado Pago

### Modo Produção

1. Altere para o **Access Token de Produção**
2. Certifique-se de que o webhook está configurado corretamente
3. Teste com um pagamento real de valor baixo primeiro

## 📚 Documentação

- [Documentação oficial do Mercado Pago](https://www.mercadopago.com.br/developers/pt/docs)
- [API de Pagamentos](https://www.mercadopago.com.br/developers/pt/reference/payments/_payments/post)
- [Webhooks](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks)

## 🔍 Troubleshooting

### Erro: "Mercado Pago não configurado"

- Verifique se a variável `MERCADOPAGO_ACCESS_TOKEN` está definida
- Certifique-se de que o token está correto e não expirou

### Pagamentos não estão sendo confirmados

- Verifique se o webhook está configurado corretamente
- Confirme que a URL do webhook está acessível publicamente
- Verifique os logs do servidor para erros

### QR Code não aparece

- Verifique se a chave PIX está cadastrada no Mercado Pago
- Confirme que o pagamento foi criado corretamente (verifique os logs)
