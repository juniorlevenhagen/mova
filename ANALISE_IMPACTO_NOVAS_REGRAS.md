# 🔄 Análise de Impacto: Novas Regras de Treino

## 📋 Resumo Executivo

As novas regras introduzem uma **mudança estrutural significativa** no modelo de exercício:

- **ANTES**: `muscleGroups: string[]` (array de grupos)
- **DEPOIS**: `primaryMuscle: string` + `secondaryMuscles: string[]` (músculo primário + secundários)

---

## 🚨 Mudanças Críticas Necessárias

### 1. **Estrutura de Dados do Exercício**

#### ❌ Estrutura Atual:

```typescript
interface Exercise {
  name: string;
  sets: string;
  reps: string;
  rest: string;
  notes: string;
  muscleGroups: MuscleGroup[]; // Array de grupos
}
```

#### ✅ Nova Estrutura Necessária:

```typescript
interface Exercise {
  name: string;
  primaryMuscle: string; // NOVO: 1 músculo primário obrigatório
  secondaryMuscles?: string[]; // NOVO: máximo 2 secundários opcionais
  sets: number; // MUDANÇA: de string para number
  reps: string;
  rest: string;
  notes?: string; // MUDANÇA: opcional
}
```

**Impacto:**

- ⚠️ **BREAKING CHANGE**: Todos os exercícios existentes precisam ser migrados
- ⚠️ **Schema JSON**: Precisa ser atualizado completamente
- ⚠️ **Validações**: Toda lógica de contagem de grupos precisa ser reescrita

---

### 2. **Validação de Volume por Músculo Primário**

#### ❌ Validação Atual:

```typescript
// Conta TODOS os grupos em muscleGroups[]
for (const ex of day.exercises) {
  for (const mg of ex.muscleGroups) {
    counts.set(mg, (counts.get(mg) || 0) + 1);
  }
}
// Valida: grupos grandes 3-10, grupos pequenos 1-5
```

#### ✅ Nova Validação Necessária:

```typescript
// Conta APENAS primaryMuscle
const primaryMuscleCounts = new Map<string, number>();
for (const ex of day.exercises) {
  const primary = normalize(ex.primaryMuscle);
  primaryMuscleCounts.set(primary, (primaryMuscleCounts.get(primary) || 0) + 1);
}

// Valida limites por nível:
const maxPerMuscleByLevel: Record<string, number> = {
  idoso: 3,
  limitado: 3,
  iniciante: 4,
  moderado: 5,
  atleta: 6,
  atleta_altorendimento: 8,
};

for (const [muscle, count] of primaryMuscleCounts) {
  const max = maxPerMuscleByLevel[normalizeLevel(level)] || 5;
  if (count > max) {
    console.warn(
      "Plano rejeitado: excesso de exercícios com mesmo músculo primário",
      {
        muscle,
        count,
        max,
        level,
      }
    );
    return false;
  }
}
```

**Impacto:**

- ⚠️ Função `primaryGroup()` precisa ser reescrita
- ⚠️ Função `isBig()` e `isSmall()` podem precisar de ajustes
- ⚠️ Toda lógica de contagem precisa considerar apenas `primaryMuscle`

---

### 3. **Distribuição Inteligente por Tipo de Dia**

#### ✅ Nova Regra Obrigatória:

**Dias Push:**

- Alternar `primaryMuscle` entre: Peitoral, Ombros
- Tríceps **nunca** deve ser primário na maioria dos exercícios
- Validação: máximo 30% dos exercícios podem ter tríceps como primário

**Dias Pull:**

- Alternar `primaryMuscle` entre: Costas, Posterior de coxa
- Bíceps **nunca** deve dominar o dia
- Validação: máximo 30% dos exercícios podem ter bíceps como primário

**Lower / Legs:**

- Distribuir entre: Quadríceps, Posterior de coxa, Glúteos
- Não concentrar tudo em um único músculo
- Validação: nenhum músculo pode ter mais de 50% dos exercícios

**Impacto:**

- ⚠️ Nova função `validateMuscleDistribution()` precisa ser criada
- ⚠️ Integrar na função `isTrainingPlanUsable()`

---

### 4. **Schema JSON para OpenAI**

#### ❌ Schema Atual:

```json
{
  "muscleGroups": {
    "type": "array",
    "items": { "type": "string" },
    "minItems": 1,
    "maxItems": 4
  }
}
```

#### ✅ Novo Schema Necessário:

```json
{
  "primaryMuscle": {
    "type": "string",
    "description": "Músculo primário do exercício (obrigatório)"
  },
  "secondaryMuscles": {
    "type": "array",
    "items": { "type": "string" },
    "minItems": 0,
    "maxItems": 2,
    "description": "Músculos secundários (opcional, máximo 2)"
  },
  "sets": {
    "type": "number",
    "description": "Número de séries"
  }
}
```

**Impacto:**

- ⚠️ `TRAINING_SCHEMA` precisa ser completamente reescrito
- ⚠️ Prompt da IA precisa ser atualizado com exemplos do novo formato

---

### 5. **Validação de Tempo de Treino**

#### ✅ Nova Regra:

```typescript
function validateTrainingTime(
  day: TrainingDay,
  availableTimeMinutes: number
): boolean {
  let totalTime = 0;
  for (const ex of day.exercises) {
    const sets = parseInt(ex.sets) || 3;
    const restSeconds = parseRestTime(ex.rest); // "60s" -> 60
    const exerciseTime = sets * restSeconds;
    totalTime += exerciseTime;
  }

  // Adicionar tempo de execução (estimado 30s por série)
  const executionTime = day.exercises.reduce((acc, ex) => {
    const sets = parseInt(ex.sets) || 3;
    return acc + sets * 30;
  }, 0);

  totalTime += executionTime;
  const totalMinutes = totalTime / 60;

  if (totalMinutes > availableTimeMinutes) {
    console.warn("Plano rejeitado: tempo de treino excede disponível", {
      required: totalMinutes,
      available: availableTimeMinutes,
      day: day.day,
    });
    return false;
  }

  return true;
}
```

**Impacto:**

- ⚠️ Nova função de validação precisa ser criada
- ⚠️ Precisa receber `availableTimeMinutes` como parâmetro
- ⚠️ Precisa parsear `rest` (formato "60s", "90s", etc.)

---

## 📊 Checklist de Implementação

### Fase 1: Estrutura de Dados

- [ ] Atualizar interface `Exercise` com `primaryMuscle` e `secondaryMuscles`
- [ ] Atualizar `TRAINING_SCHEMA` JSON
- [ ] Criar função de migração (se necessário manter compatibilidade)
- [ ] Atualizar tipos TypeScript em todos os arquivos

### Fase 2: Validações

- [ ] Reescrever `primaryGroup()` para usar `primaryMuscle`
- [ ] Criar `validatePrimaryMuscleVolume()` com limites por nível
- [ ] Criar `validateMuscleDistribution()` para distribuição inteligente
- [ ] Criar `validateTrainingTime()` para tempo disponível
- [ ] Atualizar `isTrainingPlanUsable()` para incluir novas validações

### Fase 3: Prompt da IA

- [ ] Atualizar `systemPrompt` com novo formato de exercício
- [ ] Adicionar exemplos do novo formato
- [ ] Adicionar regras de distribuição inteligente
- [ ] Adicionar regras de limites por músculo primário

### Fase 4: Testes

- [ ] Atualizar testes existentes para novo formato
- [ ] Criar testes para limites por músculo primário
- [ ] Criar testes para distribuição inteligente
- [ ] Criar testes para validação de tempo

---

## 🔍 Arquivos que Precisam ser Modificados

### Arquivos Principais:

1. **`src/app/api/generate-training-plan/route.ts`**
   - Interface `Exercise` (linha 12)
   - `TRAINING_SCHEMA` (linha 53)
   - Função `primaryGroup()` (linha 140)
   - Função `isTrainingPlanUsable()` (linha 286)
   - `systemPrompt` (linha 672)

2. **`src/lib/validators/exerciseCountValidator.ts`**
   - Pode precisar de nova função `validatePrimaryMuscleVolume()`

3. **`src/tests/validators/isTrainingPlanUsable.test.ts`**
   - Todos os testes precisam usar novo formato

4. **`src/tests/validators/profileCombinations.test.ts`**
   - Atualizar `createRealisticPlan()` para novo formato

---

## ⚠️ Riscos e Considerações

### 1. **Breaking Change Completo**

- Todos os planos existentes no banco de dados terão formato antigo
- Precisa de estratégia de migração ou compatibilidade reversa

### 2. **Complexidade da Validação**

- Validação de distribuição inteligente é mais complexa
- Pode impactar performance se não otimizada

### 3. **Prompt da IA**

- IA precisa ser re-treinada/ajustada para novo formato
- Pode gerar planos inválidos inicialmente

### 4. **Testes**

- Todos os testes precisam ser reescritos
- Testes de diagnóstico podem mostrar novos erros

---

## 🎯 Recomendações

### Opção 1: Implementação Completa (Recomendado)

- Migrar tudo de uma vez
- Manter compatibilidade com formato antigo temporariamente
- Deprecar formato antigo após migração

### Opção 2: Implementação Gradual

- Suportar ambos os formatos temporariamente
- Validar ambos os formatos
- Migrar gradualmente

### Opção 3: Feature Flag

- Implementar novo formato atrás de feature flag
- Testar em produção com usuários selecionados
- Ativar globalmente após validação

---

## 📝 Próximos Passos Sugeridos

1. **Decidir estratégia de migração** (completa vs gradual)
2. **Criar branch de feature** para implementação
3. **Implementar Fase 1** (estrutura de dados)
4. **Atualizar testes** para novo formato
5. **Implementar Fase 2** (validações)
6. **Atualizar prompt da IA**
7. **Testar com dados reais**
8. **Deploy gradual**

---

## 🔗 Referências

- Documento de regras fornecido pelo usuário
- `DIAGNOSTICO_COMBINACOES_PERFIL.md` - Erros atuais identificados
- `src/app/api/generate-training-plan/route.ts` - Código atual
