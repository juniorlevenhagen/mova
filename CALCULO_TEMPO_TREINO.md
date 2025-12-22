# ⏱️ Cálculo de Tempo de Treino

## 📊 Fórmula Atual

O sistema calcula o tempo de treino usando a seguinte fórmula:

```typescript
tempoPorExercicio = sets * (tempoExecucao + tempoDescanso);
```

Onde:

- **`tempoExecucao`**: 30 segundos por série (fixo)
- **`tempoDescanso`**: Valor do campo `rest` do exercício (ex: "60s", "90s", "2min")
- **`sets`**: Número de séries do exercício

## 🔢 Exemplo Prático

### Exemplo 1: Exercício com 3 séries e 60s de descanso

```
Tempo = 3 * (30s + 60s) = 3 * 90s = 270s = 4.5 minutos
```

### Exemplo 2: Exercício com 4 séries e 90s de descanso

```
Tempo = 4 * (30s + 90s) = 4 * 120s = 480s = 8 minutos
```

### Exemplo 3: Exercício com 3 séries e 120s (2min) de descanso

```
Tempo = 3 * (30s + 120s) = 3 * 150s = 450s = 7.5 minutos
```

## 📈 Tempo Total de um Dia

Para calcular o tempo total de um dia de treino:

```typescript
tempoTotal = soma(tempoPorExercicio) para todos os exercícios
```

### Exemplo: Push Day com 7 exercícios

| Exercício        | Sets | Descanso | Tempo por Exercício            |
| ---------------- | ---- | -------- | ------------------------------ |
| Supino reto      | 4    | 90s      | 4 \* (30 + 90) = 480s = 8min   |
| Supino inclinado | 3    | 90s      | 3 \* (30 + 90) = 360s = 6min   |
| Crucifixo        | 3    | 60s      | 3 \* (30 + 60) = 270s = 4.5min |
| Desenvolvimento  | 3    | 90s      | 3 \* (30 + 90) = 360s = 6min   |
| Elevação lateral | 3    | 60s      | 3 \* (30 + 60) = 270s = 4.5min |
| Tríceps pulley   | 3    | 60s      | 3 \* (30 + 60) = 270s = 4.5min |
| Tríceps francês  | 3    | 60s      | 3 \* (30 + 60) = 270s = 4.5min |

**Total**: 480 + 360 + 270 + 360 + 270 + 270 + 270 = **2280s = 38 minutos**

## ⚠️ Problema Identificado

No log do terminal, vemos:

```
Plano rejeitado: tempo de treino excede disponível {
  required: '62.0',
  available: 60,
  day: 'Treino A – Peito/Tríceps',
  type: 'Push'
}
```

Isso significa que o plano gerado está calculando **62 minutos** quando o limite é **60 minutos**.

## 🔍 Análise do Problema

### Possíveis causas:

1. **Muitos exercícios**: O gerador pode estar criando mais exercícios do que o tempo permite
2. **Descanso muito longo**: Se os exercícios têm descanso de 90s ou 120s, o tempo acumula rapidamente
3. **Muitas séries**: Exercícios com 4-5 séries aumentam significativamente o tempo

### Exemplo de cálculo que resulta em 62 minutos:

Se tivermos **7 exercícios** com **3 séries cada** e **90s de descanso**:

```
7 exercícios * 3 séries * (30s + 90s) = 7 * 3 * 120s = 2520s = 42 minutos
```

Para chegar a **62 minutos**, precisaríamos de:

- **8 exercícios** com **4 séries** e **90s**: 8 _ 4 _ 120s = 3840s = **64 minutos** ✅ (próximo de 62)
- **9 exercícios** com **3 séries** e **90s**: 9 _ 3 _ 120s = 3240s = **54 minutos**
- **7 exercícios** com **4 séries** e **120s**: 7 _ 4 _ 150s = 4200s = **70 minutos**

## 💡 Solução Implementada

A função `adjustExercisesForTime` agora:

1. **Calcula o tempo total** dos exercícios gerados
2. **Remove exercícios isolados** primeiro (do final da lista)
3. **Reduz séries** de isolados (de 3 para 2 séries)
4. **Remove mais exercícios** se necessário (mantém mínimo de 3)

Isso garante que o plano sempre respeite o tempo disponível.

## 📝 Valores Padrão no Banco de Exercícios

### Descanso (rest):

- **Exercícios compostos** (Supino, Agachamento, etc.): `"90-120s"` → parser usa **90s** (primeiro valor)
- **Exercícios isolados** (Crucifixo, Curl, etc.): `"60-90s"` → parser usa **60s** (primeiro valor)

### Séries (sets):

- **Exercícios principais**: **4 séries**
- **Exercícios secundários**: **3 séries**

## 🔢 Cálculo Real com Valores do Banco

### Exemplo: Push Day com 7 exercícios (Atleta)

| Exercício                   | Sets | Descanso | Cálculo        | Tempo       |
| --------------------------- | ---- | -------- | -------------- | ----------- |
| Supino reto (composto)      | 4    | 90s      | 4 \* (30 + 90) | **8.0 min** |
| Supino inclinado (composto) | 4    | 90s      | 4 \* (30 + 90) | **8.0 min** |
| Crucifixo (isolado)         | 3    | 60s      | 3 \* (30 + 60) | **4.5 min** |
| Desenvolvimento (composto)  | 3    | 90s      | 3 \* (30 + 90) | **6.0 min** |
| Elevação lateral (isolado)  | 3    | 60s      | 3 \* (30 + 60) | **4.5 min** |
| Tríceps pulley (isolado)    | 3    | 60s      | 3 \* (30 + 60) | **4.5 min** |
| Tríceps francês (isolado)   | 3    | 60s      | 3 \* (30 + 60) | **4.5 min** |

**Total**: 8.0 + 8.0 + 4.5 + 6.0 + 4.5 + 4.5 + 4.5 = **40.0 minutos** ✅

### Exemplo: Push Day com 8 exercícios (ultrapassa 60min)

| Exercício        | Sets | Descanso | Cálculo        | Tempo       |
| ---------------- | ---- | -------- | -------------- | ----------- |
| Supino reto      | 4    | 90s      | 4 \* (30 + 90) | **8.0 min** |
| Supino inclinado | 4    | 90s      | 4 \* (30 + 90) | **8.0 min** |
| Supino declinado | 3    | 90s      | 3 \* (30 + 90) | **6.0 min** |
| Crucifixo        | 3    | 60s      | 3 \* (30 + 60) | **4.5 min** |
| Desenvolvimento  | 3    | 90s      | 3 \* (30 + 90) | **6.0 min** |
| Elevação lateral | 3    | 60s      | 3 \* (30 + 60) | **4.5 min** |
| Tríceps pulley   | 3    | 60s      | 3 \* (30 + 60) | **4.5 min** |
| Tríceps francês  | 3    | 60s      | 3 \* (30 + 60) | **4.5 min** |

**Total**: 8.0 + 8.0 + 6.0 + 4.5 + 6.0 + 4.5 + 4.5 + 4.5 = **48.0 minutos** ✅

### Exemplo: Push Day com 9 exercícios (ultrapassa 60min)

Adicionando mais um exercício de peito:

- Supino com halteres: 3 séries, 90s = **6.0 min**

**Total anterior**: 48.0 min  
**Total novo**: 48.0 + 6.0 = **54.0 minutos** ✅

### Exemplo: Push Day com 10 exercícios (ultrapassa 60min)

Adicionando mais um exercício de tríceps:

- Tríceps coice: 3 séries, 60s = **4.5 min**

**Total anterior**: 54.0 min  
**Total novo**: 54.0 + 4.5 = **58.5 minutos** ✅

## ⚠️ Por que está dando 62 minutos?

Para chegar a **62 minutos**, precisaríamos de:

### Cenário 1: Mais exercícios compostos

- 5 exercícios compostos (4 séries, 90s) = 5 \* 8.0 = **40.0 min**
- 5 exercícios isolados (3 séries, 60s) = 5 \* 4.5 = **22.5 min**
- **Total**: 40.0 + 22.5 = **62.5 minutos** ✅ (próximo de 62)

### Cenário 2: Exercícios com mais séries

- Se alguns exercícios tiverem **5 séries** em vez de 3-4:
  - 5 séries _ (30 + 90) = 5 _ 120s = **10.0 min** por exercício
  - Com 6 exercícios assim: 6 \* 10.0 = **60.0 min**
  - Adicionando mais 2 exercícios de 3 séries: 2 \* 4.5 = **9.0 min**
  - **Total**: 60.0 + 9.0 = **69.0 minutos**

## 💡 Solução: Ajuste Automático

A função `adjustExercisesForTime` agora:

1. Calcula o tempo total
2. Se exceder 60min, remove exercícios isolados primeiro
3. Se ainda exceder, reduz séries de isolados (3 → 2)
4. Se ainda exceder, remove mais exercícios

Isso garante que o plano sempre respeite o limite de tempo.
