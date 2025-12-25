# Guia: Reduzir Logs em Produção

## ✅ O que foi feito

1. **Criado sistema de logging centralizado** (`src/lib/logger.ts`)
   - `logger`: Logger geral (debug/info em dev, warn/error em prod)
   - `metricsLogger`: Logger para métricas (só em dev)
   - `apiLogger`: Logger para APIs (reduzido em prod)

2. **Atualizados arquivos principais:**
   - ✅ `src/lib/metrics/planCorrectionMetrics.ts`
   - ✅ `src/lib/metrics/planRejectionMetrics.ts`
   - ✅ `src/lib/rules/cardioProgression.ts`
   - ✅ `src/lib/rules/objectiveInterpretation.ts`
   - ✅ `src/app/api/generate-plan/route.ts` (parcialmente)

## 🔄 Como continuar a migração

### Padrão de substituição:

**Antes:**

```typescript
console.log("📊 Debug info:", data);
console.warn("⚠️ Warning:", warning);
console.error("❌ Error:", error);
```

**Depois:**

```typescript
// Para logs de debug/info em APIs
apiLogger.log("📊 Debug info:", data);

// Para métricas (só aparece em dev)
metricsLogger.log("📈 Métrica:", data);

// Para warnings/erros (sempre aparecem)
apiLogger.warn("⚠️ Warning:", warning);
apiLogger.error("❌ Error:", error);
```

### Arquivos que ainda precisam ser atualizados:

1. **`src/app/api/generate-plan/route.ts`** - Ainda tem ~25 console.log
   - Substituir `console.log` por `apiLogger.log`
   - Manter `console.error` ou trocar por `apiLogger.error`
   - Substituir `console.warn` por `apiLogger.warn`

2. **Outros arquivos de API:**
   - `src/app/api/generate-plan-field/route.ts`
   - `src/app/api/generate-training-plan/route.ts`
   - `src/app/api/verify-payment/route.ts`
   - `src/app/api/create-checkout-session/route.ts`

3. **Hooks:**
   - `src/hooks/usePlanGeneration.ts` (tem vários console.log)

### Comando para encontrar todos os console.log:

```bash
grep -r "console\.\(log\|warn\|info\)" src/app/api src/hooks --include="*.ts" --include="*.tsx"
```

## 🎯 Resultado esperado

- **Desenvolvimento**: Todos os logs aparecem normalmente
- **Produção**: Apenas erros e warnings críticos aparecem
- **Métricas**: Nunca aparecem em produção (só em dev)

## ⚠️ Importante

- **NUNCA** logar informações sensíveis (API keys, tokens, senhas)
- **SEMPRE** manter logs de erro (são críticos)
- **CONSIDERAR** usar um serviço de logging estruturado (ex: Sentry) em produção
