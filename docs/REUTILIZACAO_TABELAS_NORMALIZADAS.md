# 📊 Reutilização de Tabelas Normalizadas para Melhorar Prompts

## 🎯 Objetivo

As tabelas normalizadas (`plan_analyses`, `plan_trainings`, `plan_nutrition`, `plan_aerobic`) permitem **reutilizar dados históricos** para criar um **efeito composto** nos planos gerados pela IA, melhorando continuamente os resultados.

## 📋 Estrutura das Tabelas

### 1. `plan_analyses`
Armazena análises do status do usuário:
- `current_status`: Status atual do usuário
- `strengths`: Array de pontos fortes
- `improvements`: Array de áreas de melhoria
- `special_considerations`: Considerações especiais

### 2. `plan_trainings`
Armazena dados de treino de força:
- `overview`: Visão geral do treino
- `progression`: Estratégia de progressão
- `exercises`: JSONB com cronograma semanal de exercícios

### 3. `plan_nutrition`
Armazena dados nutricionais:
- `daily_calories`: Calorias diárias
- `protein_grams`, `carbs_grams`, `fats_grams`: Macronutrientes
- `meal_plan`: JSONB com plano alimentar

### 4. `plan_aerobic` (NOVO)
Armazena dados de treino aeróbico:
- `overview`: Visão geral do treino aeróbico
- `weekly_schedule`: JSONB com cronograma semanal de atividades aeróbicas
- `recommendations`: Recomendações específicas
- `progression`: Estratégia de progressão

## 🔄 Como Reutilizar nos Prompts

### Exemplo de Consulta Agregada

```typescript
// Buscar dados históricos agregados do usuário
const { data: historicalData } = await supabaseUser
  .from("plan_aerobic")
  .select("*")
  .eq("user_id", user.id)
  .order("created_at", { ascending: false })
  .limit(5);

// Extrair insights:
const insights = {
  averageFrequency: calcularMediaFrequencia(historicalData),
  preferredActivities: atividadesMaisUsadas(historicalData),
  intensityProgression: analisarProgressaoIntensidade(historicalData),
  durationTrend: tendenciaDuracao(historicalData),
};
```

### Incluir no Prompt da IA

```typescript
const userPrompt = `
📊 HISTÓRICO DE TREINOS AERÓBICOS DO USUÁRIO:

Últimos 5 planos gerados:
${historicalData.map((plan, idx) => `
${idx + 1}º Plano (${formatDate(plan.created_at)}):
- Frequência: ${calcularFrequencia(plan.weekly_schedule)}x/semana
- Atividades preferidas: ${extrairAtividades(plan.weekly_schedule).join(", ")}
- Intensidade média: ${calcularIntensidadeMedia(plan.weekly_schedule)}
- Progressão: ${plan.progression || "Não especificada"}
`).join("")}

💡 INSIGHTS PARA O NOVO PLANO:
- O usuário tem preferência por: ${insights.preferredActivities.join(", ")}
- Frequência média histórica: ${insights.averageFrequency}x/semana
- Tendência de progressão: ${insights.intensityProgression}

⚠️ IMPORTANTE: Use esses dados para criar um plano PROGRESSIVO e MELHORADO, não apenas repetir o anterior.
`;
```

## 🎯 Casos de Uso Práticos

### 1. **Análise de Progressão**
```sql
-- Verificar se o usuário está progredindo em intensidade
SELECT 
  user_id,
  AVG(EXTRACT(EPOCH FROM (created_at - LAG(created_at) OVER (PARTITION BY user_id ORDER BY created_at)))) as dias_entre_planos,
  COUNT(*) as total_planos
FROM plan_aerobic
WHERE user_id = '...'
GROUP BY user_id;
```

### 2. **Atividades Mais Eficazes**
```sql
-- Descobrir quais atividades o usuário mais pratica
SELECT 
  activity,
  COUNT(*) as frequencia,
  AVG(duration_minutes) as duracao_media
FROM plan_aerobic,
  jsonb_array_elements(weekly_schedule) as schedule
WHERE user_id = '...'
GROUP BY activity
ORDER BY frequencia DESC;
```

### 3. **Comparação com Objetivo**
```sql
-- Comparar treinos aeróbicos com objetivo do usuário
SELECT 
  pa.*,
  up.plan_data->>'objective' as objetivo
FROM plan_aerobic pa
JOIN user_plans up ON pa.plan_id = up.id
WHERE pa.user_id = '...'
ORDER BY pa.created_at DESC;
```

## 🚀 Implementação no `generate-plan/route.ts`

### Passo 1: Consultar Dados Históricos

```typescript
// Após buscar previousPlans, também buscar dados normalizados
const { data: historicalAerobic } = await supabaseUser
  .from("plan_aerobic")
  .select("*")
  .eq("user_id", user.id)
  .order("created_at", { ascending: false })
  .limit(5);

const { data: historicalNutrition } = await supabaseUser
  .from("plan_nutrition")
  .select("*")
  .eq("user_id", user.id)
  .order("created_at", { ascending: false })
  .limit(5);
```

### Passo 2: Extrair Insights

```typescript
function extractAerobicInsights(historicalData: any[]) {
  if (!historicalData || historicalData.length === 0) return null;

  const activities = new Map<string, number>();
  let totalFrequency = 0;
  let totalDuration = 0;

  historicalData.forEach((plan) => {
    if (plan.weekly_schedule && Array.isArray(plan.weekly_schedule)) {
      plan.weekly_schedule.forEach((session: any) => {
        const activity = session.activity || "Não especificado";
        activities.set(activity, (activities.get(activity) || 0) + 1);
        
        // Extrair duração (ex: "30-40 minutos" -> 35)
        const durationMatch = session.duration?.match(/(\d+)/);
        if (durationMatch) {
          totalDuration += parseInt(durationMatch[1]);
        }
      });
      totalFrequency += plan.weekly_schedule.length;
    }
  });

  return {
    averageFrequency: totalFrequency / historicalData.length,
    averageDuration: totalDuration / totalFrequency,
    preferredActivities: Array.from(activities.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([activity]) => activity),
    lastProgression: historicalData[0]?.progression || null,
  };
}
```

### Passo 3: Incluir no Prompt

```typescript
const aerobicInsights = extractAerobicInsights(historicalAerobic);

const userPrompt = `
${aerobicInsights ? `
📊 HISTÓRICO DE TREINOS AERÓBICOS:
- Frequência média: ${aerobicInsights.averageFrequency.toFixed(1)}x/semana
- Duração média: ${aerobicInsights.averageDuration.toFixed(0)} minutos
- Atividades preferidas: ${aerobicInsights.preferredActivities.join(", ")}
- Última progressão: ${aerobicInsights.lastProgression || "Não especificada"}

⚠️ Use esses dados para criar um plano PROGRESSIVO. Se o usuário já fazia 2x/semana, considere aumentar para 3x/semana (se o objetivo permitir).
` : ""}
`;
```

## 📈 Benefícios

1. **Efeito Composto**: Cada novo plano é melhor que o anterior
2. **Personalização Crescente**: A IA aprende as preferências do usuário
3. **Progressão Inteligente**: Aumenta intensidade/frequência gradualmente
4. **Análise de Tendências**: Identifica padrões de sucesso
5. **Otimização Contínua**: Ajusta estratégias baseado em resultados históricos

## 🔍 Próximos Passos

1. ✅ Criar tabela `plan_aerobic`
2. ✅ Implementar ingestão automática
3. ⏳ Implementar consultas agregadas no `generate-plan`
4. ⏳ Criar funções de análise de insights
5. ⏳ Integrar insights no prompt da IA

