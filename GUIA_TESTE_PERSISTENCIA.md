# 🧪 Guia de Teste - Persistência em Banco de Dados

## ✅ Testes Automatizados

Os testes automatizados já foram executados e **todos passaram** (13/13)!

```bash
bun test src/tests/metrics/planRejectionMetrics.test.ts
```

---

## 🔍 Testes Manuais

### 1. Verificar Status da Persistência

**Endpoint de Teste:**
```bash
GET /api/test-metrics
```

**Como testar:**
1. Inicie o servidor: `bun dev`
2. Acesse: `http://localhost:3000/api/test-metrics`
3. Ou use curl:
```bash
curl http://localhost:3000/api/test-metrics
```

**Resposta esperada:**
```json
{
  "success": true,
  "persistenceEnabled": true,  // ou false se não configurado
  "metricsInMemory": 0,
  "message": "Persistência em banco habilitada",
  "statistics": {
    "total": 0,
    "byReason": 0,
    "byActivityLevel": 0,
    "byDayType": 0
  }
}
```

---

### 2. Criar Métrica de Teste

**Endpoint de Teste:**
```bash
POST /api/test-metrics
```

**Como testar:**
```bash
curl -X POST http://localhost:3000/api/test-metrics \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "excesso_exercicios_nivel",
    "context": {
      "activityLevel": "Iniciante",
      "exerciseCount": 9,
      "dayType": "Upper"
    }
  }'
```

**Resposta esperada:**
```json
{
  "success": true,
  "message": "Métrica de teste registrada com sucesso",
  "registered": {
    "reason": "excesso_exercicios_nivel",
    "context": {
      "activityLevel": "Iniciante",
      "exerciseCount": 9,
      "dayType": "Upper"
    },
    "timestamp": 1234567890
  },
  "currentStats": {
    "total": 1,
    "byReason": 1
  },
  "persistenceEnabled": true
}
```

---

### 3. Verificar no Dashboard

1. Acesse: `http://localhost:3000/admin/metrics`
2. Verifique:
   - ✅ Total de rejeições > 0
   - ✅ Fonte: "database" (se persistência habilitada)
   - ✅ Métricas aparecem na tabela

---

### 4. Verificar no Banco de Dados

**No Supabase SQL Editor:**

```sql
-- Contar total de métricas
SELECT COUNT(*) as total FROM plan_rejection_metrics;

-- Ver últimas 10 métricas
SELECT 
  reason,
  timestamp,
  context,
  created_at
FROM plan_rejection_metrics
ORDER BY timestamp DESC
LIMIT 10;

-- Verificar se sua métrica de teste está lá
SELECT * FROM plan_rejection_metrics
WHERE context->>'activityLevel' = 'Iniciante'
ORDER BY timestamp DESC;
```

**Resultado esperado:**
- ✅ `COUNT(*)` retorna número > 0
- ✅ Sua métrica de teste aparece nos resultados
- ✅ Campo `created_at` está preenchido

---

### 5. Testar Fluxo Completo

1. **Gerar um plano inválido** (para forçar rejeição):
   - Acesse o dashboard
   - Tente gerar um plano que será rejeitado
   - Exemplo: Usuário "Iniciante" com 9 exercícios por dia

2. **Verificar métrica registrada:**
   - Acesse `/admin/metrics`
   - Veja se a rejeição aparece
   - Verifique o motivo e contexto

3. **Verificar no banco:**
   - Execute o SQL acima
   - Confirme que a métrica foi persistida

---

## 🎯 Checklist de Teste

### Configuração
- [ ] Migração SQL executada no Supabase
- [ ] Tabela `plan_rejection_metrics` existe
- [ ] Variável `SUPABASE_SERVICE_ROLE_KEY` configurada (opcional)
- [ ] Servidor reiniciado após configurar variáveis

### Testes Automatizados
- [ ] `bun test src/tests/metrics/planRejectionMetrics.test.ts` - Todos passando

### Testes Manuais
- [ ] GET `/api/test-metrics` retorna status correto
- [ ] POST `/api/test-metrics` cria métrica com sucesso
- [ ] Dashboard `/admin/metrics` mostra métricas
- [ ] Banco de dados contém as métricas

### Fluxo Real
- [ ] Rejeição de plano real registra métrica
- [ ] Métrica aparece no dashboard
- [ ] Métrica persiste no banco

---

## 🐛 Troubleshooting

### Problema: "persistenceEnabled: false"

**Causa:** Variáveis de ambiente não configuradas

**Solução:**
1. Verifique `.env.local`
2. Confirme que `NEXT_PUBLIC_SUPABASE_URL` existe
3. Adicione `SUPABASE_SERVICE_ROLE_KEY` (recomendado)
4. Reinicie o servidor

### Problema: Métrica não aparece no banco

**Causa:** Erro na inserção

**Verificar:**
1. Console do servidor (deve mostrar erro)
2. Políticas RLS no Supabase
3. Tabela existe?

**Solução:**
1. Adicione `SUPABASE_SERVICE_ROLE_KEY` (bypassa RLS)
2. Ou ajuste políticas RLS para permitir INSERT

### Problema: Dashboard mostra "memory" como fonte

**Causa:** Endpoint não consegue acessar banco

**Solução:**
1. Verifique se persistência está habilitada
2. Verifique logs do endpoint
3. Teste com `?source=memory` para forçar memória

---

## 📊 Exemplo de Teste Completo

```bash
# 1. Verificar status
curl http://localhost:3000/api/test-metrics

# 2. Criar métrica de teste
curl -X POST http://localhost:3000/api/test-metrics \
  -H "Content-Type: application/json" \
  -d '{"reason": "excesso_exercicios_nivel", "context": {"activityLevel": "Iniciante"}}'

# 3. Verificar no dashboard
# Acesse: http://localhost:3000/admin/metrics

# 4. Verificar no banco (SQL Editor do Supabase)
SELECT COUNT(*) FROM plan_rejection_metrics;
```

---

## ✅ Resultado Esperado

Se tudo estiver funcionando:

1. ✅ **Testes automatizados**: 13/13 passando
2. ✅ **Endpoint de teste**: Retorna `persistenceEnabled: true`
3. ✅ **Métrica criada**: Aparece no dashboard e no banco
4. ✅ **Dashboard**: Mostra `"source": "database"`
5. ✅ **Banco**: Contém as métricas com `created_at` preenchido

---

## 🎉 Pronto!

Se todos os testes passaram, sua persistência está funcionando corretamente! 🚀

