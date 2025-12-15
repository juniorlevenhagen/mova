# 🔍 Diagnóstico: Combinações de Perfil (Nível + Objetivo)

## Resumo dos Erros Encontrados

Os testes revelaram os seguintes problemas quando planos realistas são validados:

---

## ❌ Problemas Identificados

### 1. **Divisão × Frequência - Full Body 2x e 3x**

**Erro:**

```
Plano rejeitado: divisão incompatível com frequência {
  frequency: 2,
}
Plano rejeitado: divisão incompatível com frequência {
  frequency: 3,
}
```

**Cenários afetados:**

- ✅ Iniciante + Emagrecimento (3x, 6 ex): `false`
- ✅ Iniciante + Emagrecimento (3x, 4 ex): `false`
- ✅ Idoso + Manutenção (2x, 5 ex): `false`
- ✅ Idoso + Manutenção (2x, 3 ex): `false`

**Causa:** A validação `validateDivisionByFrequency` não está aceitando "Full Body" para 2x e 3x por semana.

**O que verificar:**

- `validateDivisionByFrequency()` em `route.ts` linha ~180
- Verificar se `expectedDivisionByFrequency` inclui `["full", "fullbody"]` para frequências 2 e 3

---

### 2. **Volume de Grupos Grandes - Excesso**

**Erro:**

```
Plano rejeitado: volume de grupo grande inválido {
  group: "peitoral",
  count: 12,
  day: "Dia 1",
  type: "Push",
}
```

**Cenário afetado:**

- ✅ Atleta + Performance (6x, 12 ex): `false`

**Causa:** Quando um dia Push tem 12 exercícios, todos com `muscleGroups: ["peitoral", "ombros", "triceps"]`, o sistema conta 12 exercícios para "peitoral", excedendo o limite de 10.

**O que verificar:**

- Validação de volume em `route.ts` linha ~547
- Limite atual: grupos grandes 3-10 exercícios
- Para Atleta Alto Rendimento com 12 exercícios/dia, pode precisar ajustar distribuição

---

### 3. **Volume de Grupos Pequenos - Excesso**

**Erro:**

```
Plano rejeitado: volume de grupo pequeno inválido {
  group: "triceps",
  count: 10,
  day: "Dia 1",
  type: "Push",
}
Plano rejeitado: volume de grupo pequeno inválido {
  group: "triceps",
  count: 8,
  day: "Dia 1",
  type: "Push",
}
Plano rejeitado: volume de grupo pequeno inválido {
  group: "triceps",
  count: 6,
  day: "Dia 1",
  type: "Push",
}
```

**Cenários afetados:**

- ✅ Atleta + Performance (6x, 10 ex): `false`
- ✅ Intermediário + Força (5x, 8 ex): `false`
- ✅ Avançado + Definição (6x, 10 ex): `false`
- ✅ Avançado + Definição (6x, 6 ex): `false`

**Causa:** Limite atual de grupos pequenos é 1-5 exercícios. Quando um dia Push tem muitos exercícios, todos com `triceps` no `muscleGroups`, o limite é excedido.

**O que verificar:**

- Validação de volume em `route.ts` linha ~561
- Limite atual: grupos pequenos 1-5 exercícios
- Para dias com muitos exercícios, pode precisar ajustar distribuição ou limites

---

## ✅ Cenários que Passaram

- ✅ Moderado + Hipertrofia (4x, 8 ex): `true`
- ✅ Moderado + Hipertrofia (4x, 6 ex): `true`
- ✅ Intermediário + Força (4x, 8 ex): `true`

---

## 🎯 Próximos Passos para Correção

1. **Corrigir validação de divisão × frequência**
   - Garantir que Full Body seja aceito para 2x e 3x por semana
   - Verificar `normalizeDivisionName()` e `validateDivisionByFrequency()`

2. **Ajustar distribuição de grupos musculares**
   - Quando um dia tem muitos exercícios, distribuir melhor os grupos
   - Evitar que todos os exercícios tenham o mesmo grupo principal

3. **Revisar limites de volume por grupo**
   - Considerar se limites atuais (grandes: 3-10, pequenos: 1-5) são adequados
   - Para Atleta Alto Rendimento com 12 ex/dia, pode precisar limites maiores

4. **Melhorar criação de planos de teste**
   - Distribuir grupos musculares de forma mais realista
   - Não colocar todos os exercícios com os mesmos grupos

---

## 📊 Estatísticas dos Testes

- **Total de testes:** 12
- **Passando:** 12 (todos documentam erros)
- **Falhando:** 0
- **Erros únicos identificados:** 3 tipos principais

---

## 🔧 Arquivos para Revisar

1. `src/app/api/generate-training-plan/route.ts`
   - Função `validateDivisionByFrequency()` (linha ~180)
   - Função `normalizeDivisionName()` (linha ~170)
   - Validação de volume grupos grandes (linha ~547)
   - Validação de volume grupos pequenos (linha ~561)

2. `src/tests/validators/profileCombinations.test.ts`
   - Testes de diagnóstico criados
