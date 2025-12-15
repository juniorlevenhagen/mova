# 📊 Sistema de Monitoramento de Métricas de Rejeição

## ✅ Implementação Completa

Sistema de monitoramento implementado para rastrear quando e por que planos de treino são rejeitados.

---

## 📁 Arquivos Criados

### 1. `src/lib/metrics/planRejectionMetrics.ts`
Sistema central de métricas com:
- ✅ Armazenamento em memória de rejeições
- ✅ Tipos TypeScript para todos os motivos de rejeição
- ✅ Funções para obter estatísticas agregadas
- ✅ Suporte a filtros por período (24h, todas)

### 2. `src/app/api/metrics/plan-rejections/route.ts`
Endpoint REST para consultar métricas:
- ✅ `GET /api/metrics/plan-rejections?period=all|24h`
- ✅ Retorna estatísticas agregadas
- ✅ Suporte a filtro por período

---

## 🔍 Tipos de Rejeição Rastreados

```typescript
type RejectionReason =
  | "weeklySchedule_invalido"
  | "numero_dias_incompativel"
  | "divisao_incompativel_frequencia"
  | "dia_sem_exercicios"
  | "excesso_exercicios_nivel"
  | "exercicio_sem_primaryMuscle"
  | "grupo_muscular_proibido"
  | "lower_sem_grupos_obrigatorios"
  | "full_body_sem_grupos_obrigatorios"
  | "grupo_obrigatorio_ausente"
  | "ordem_exercicios_invalida"
  | "excesso_exercicios_musculo_primario"
  | "distribuicao_inteligente_invalida"
  | "secondaryMuscles_excede_limite"
  | "tempo_treino_excede_disponivel";
```

---

## 📊 Estatísticas Disponíveis

### Por Motivo de Rejeição
```typescript
statistics.byReason = {
  "excesso_exercicios_nivel": 15,
  "divisao_incompativel_frequencia": 8,
  // ...
}
```

### Por Nível de Atividade
```typescript
statistics.byActivityLevel = {
  "Iniciante": 10,
  "Moderado": 5,
  // ...
}
```

### Por Tipo de Dia
```typescript
statistics.byDayType = {
  "Upper": 8,
  "Lower": 3,
  // ...
}
```

### Rejeições Recentes
```typescript
statistics.recent = [
  {
    reason: "excesso_exercicios_nivel",
    timestamp: 1234567890,
    context: { activityLevel: "Iniciante", ... }
  },
  // ...
]
```

---

## 🔧 Integração

### Função Helper `rejectPlan()`
Criada função helper que:
- ✅ Registra no console (console.warn)
- ✅ Registra nas métricas (recordPlanRejection)
- ✅ Mantém consistência entre logs e métricas

### Pontos de Integração
Métricas registradas em:
- ✅ Validação de weeklySchedule
- ✅ Validação de número de dias
- ✅ Validação de divisão × frequência
- ✅ Validação de exercícios por nível
- ✅ Validação de primaryMuscle
- ✅ Validação de grupos proibidos
- ✅ Validação de grupos obrigatórios
- ✅ Validação de ordem de exercícios
- ✅ Validação de volume por músculo primário
- ✅ Validação de secondaryMuscles
- ✅ Validação de tempo de treino

---

## 📡 API Endpoint

### GET `/api/metrics/plan-rejections`

**Query Parameters:**
- `period`: `"all"` | `"24h"` (default: `"all"`)

**Response:**
```json
{
  "success": true,
  "period": "all",
  "statistics": {
    "total": 42,
    "byReason": {
      "excesso_exercicios_nivel": 15,
      "divisao_incompativel_frequencia": 8,
      // ...
    },
    "byActivityLevel": {
      "Iniciante": 10,
      "Moderado": 5,
      // ...
    },
    "byDayType": {
      "Upper": 8,
      "Lower": 3,
      // ...
    },
    "recent": [
      {
        "reason": "excesso_exercicios_nivel",
        "timestamp": 1234567890,
        "context": {
          "activityLevel": "Iniciante",
          "exerciseCount": 9,
          // ...
        }
      }
    ]
  },
  "timestamp": 1234567890
}
```

---

## 💡 Uso

### Consultar Todas as Métricas
```bash
GET /api/metrics/plan-rejections
```

### Consultar Últimas 24 Horas
```bash
GET /api/metrics/plan-rejections?period=24h
```

### No Código
```typescript
import { planRejectionMetrics } from "@/lib/metrics/planRejectionMetrics";

// Obter estatísticas
const stats = planRejectionMetrics.getStatistics();

// Obter últimas 24h
const stats24h = planRejectionMetrics.getLast24HoursStatistics();

// Obter métricas por período
const metrics = planRejectionMetrics.getMetricsByPeriod(
  startTime,
  endTime
);
```

---

## 🎯 Casos de Uso

### 1. Identificar Problemas Comuns
```typescript
const stats = planRejectionMetrics.getStatistics();
const topReason = Object.entries(stats.byReason)
  .sort(([, a], [, b]) => b - a)[0];

console.log(`Motivo mais comum: ${topReason[0]} (${topReason[1]} vezes)`);
```

### 2. Monitorar por Nível
```typescript
const stats = planRejectionMetrics.getStatistics();
console.log("Rejeições por nível:", stats.byActivityLevel);
```

### 3. Análise Temporal
```typescript
const stats24h = planRejectionMetrics.getLast24HoursStatistics();
const statsAll = planRejectionMetrics.getStatistics();

const recentTrend = stats24h.total / (statsAll.total / 7); // Taxa por dia
```

---

## ⚙️ Configuração

### Limite de Métricas
Por padrão, o sistema armazena até **10.000 métricas** em memória. Para alterar:

```typescript
// Em planRejectionMetrics.ts
private readonly maxMetrics = 20000; // Ajustar conforme necessário
```

### Persistência (Futuro)
Para persistir em banco de dados, adicione em `recordRejection()`:

```typescript
// Exemplo com Supabase
await supabase.from('plan_rejections').insert({
  reason,
  context,
  timestamp: new Date().toISOString(),
});
```

---

## 📈 Próximos Passos (Opcional)

1. **Dashboard de Métricas**
   - Criar página admin para visualizar métricas
   - Gráficos de tendências
   - Alertas automáticos

2. **Persistência**
   - Salvar em banco de dados
   - Histórico de longo prazo
   - Análise de tendências

3. **Alertas**
   - Notificar quando taxa de rejeição > threshold
   - Alertas por motivo específico
   - Alertas por nível de atividade

4. **Integração com Analytics**
   - Enviar para Google Analytics
   - Enviar para serviços de métricas (DataDog, New Relic)
   - Exportar para CSV/JSON

---

## ✅ Status

- ✅ Sistema de métricas implementado
- ✅ Integração com validações completa
- ✅ Endpoint API criado
- ✅ Tipos TypeScript definidos
- ✅ Documentação completa

**Pronto para uso em produção!**

