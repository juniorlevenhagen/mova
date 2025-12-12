# Análise de Ambiguidades no Prompt da IA

## 🔴 AMBIGUIDADES CRÍTICAS ENCONTRADAS

### 1. **NÍVEL DE ATIVIDADE vs. NÍVEL DE MUSCULAÇÃO** ⚠️ CRÍTICO

**Problema:**

- O prompt usa "nível de atividade" (Sedentário, Moderado, Atleta, Alto Rendimento) para calcular TDEE
- Mas também define "nível de musculação" (Iniciante, Intermediário, Avançado) para prescrição de exercícios
- Um usuário pode ser "Atleta" em nível de atividade (para TDEE) mas "Iniciante" em musculação

**Localização:**

- Linha 1250: "Nível de atividade (Sedentário, Moderado, Atleta, Alto Rendimento)"
- Linha 1272-1289: "Defina automaticamente o nível de musculação: INICIANTE/INTERMEDIÁRIO/AVANÇADO"
- Linha 1534-1586: Diretrizes por "Nível de Atividade" (Sedentário, Moderado, Atleta, Alto Rendimento)

**Solução proposta:**
Clarificar que:

- **Nível de Atividade** = usado APENAS para cálculo de TDEE (gasto energético)
- **Nível de Musculação** = usado APENAS para prescrição de exercícios, volume e complexidade
- Adicionar instrução: "Se o nível de atividade for 'Atleta' mas o usuário for iniciante em musculação, use as diretrizes de INICIANTE para prescrição de exercícios"

---

### 2. **QUANTIDADE DE EXERCÍCIOS: TOTAL vs. POR GRUPO MUSCULAR** ⚠️ CRÍTICO

**Problema:**

- Linha 1332-1347: Define exercícios "por grupo muscular" (Grandes: 1-2, 3-4, 4-6)
- Linha 1294-1296: Define exercícios "totais por treino" (6-8, 8-12, 12-16)
- Linha 1582: "Sedentário/Moderado: NUNCA prescrever mais de 4-5 exercícios por treino"
- **CONFLITO:** Se um iniciante treina peito (1-2 exercícios) + tríceps (1 exercício) = 2-3 exercícios, mas a linha 1294 diz 6-8 exercícios para 30-40min

**Exemplo de confusão:**

- Iniciante com 30-40min: 6-8 exercícios totais (linha 1294)
- Mas iniciante: 1-2 exercícios por músculo grande (linha 1333)
- Se treinar 3 grupos grandes = 3-6 exercícios, mais pequenos = 4-7 total
- Mas linha 1582 diz máximo 4-5 exercícios para Sedentário/Moderado

**Solução proposta:**
Clarificar hierarquia:

1. **Primeiro:** Respeitar limite TOTAL por treino baseado em tempo disponível (linha 1294-1296)
2. **Segundo:** Distribuir exercícios respeitando quantidade por grupo muscular (linha 1332-1347)
3. **Terceiro:** Respeitar limite máximo por nível de atividade (linha 1582)
4. Adicionar nota: "Se houver conflito, priorize o limite TOTAL por treino, mas nunca exceda o limite por nível de atividade"

---

### 3. **SÉRIES: POR EXERCÍCIO vs. VOLUME SEMANAL** ⚠️ CRÍTICO

**Problema:**

- Linha 1339-1347: Volume semanal obrigatório (Grandes: 14-22 séries, Pequenos: 10-16 séries) - APENAS para AVANÇADOS
- Linha 1539-1576: Séries por exercício por nível de atividade (2-3, 3-4, 3-5, 4-6)
- Linha 1457-1461: Séries por IMC (3-4, 2-3)
- **CONFLITO:** Como calcular? Se treinar peito 2x/semana, 3 exercícios, 4 séries cada = 24 séries semanais (excede 14-22)

**Exemplo:**

- Avançado treina peito 2x/semana
- Volume semanal obrigatório: 14-22 séries (linha 1346)
- Mas se usar 3 exercícios × 4 séries × 2 dias = 24 séries (excede máximo)
- Ou se usar 2 exercícios × 3 séries × 2 dias = 12 séries (abaixo do mínimo)

**Solução proposta:**
Clarificar cálculo:

- Volume semanal = (exercícios por grupo) × (séries por exercício) × (frequência semanal do grupo)
- Adicionar fórmula: "Para grupos grandes em avançados: mínimo 14 séries/semana, máximo 22 séries/semana"
- Adicionar exemplo: "Peito 2x/semana: 3 exercícios × 3 séries = 18 séries semanais ✓"

---

### 4. **FREQUÊNCIA DE TREINO: INTERPRETAÇÃO** ⚠️ MÉDIO

**Problema:**

- Linha 1391-1392: "A frequência se refere APENAS aos dias de musculação"
- Linha 1519-1521: "EXATAMENTE ${userData.trainingFrequency} dias de treino de musculação"
- **AMBIGUIDADE:** Se usuário diz "3x/semana", isso significa:
  - Exatamente 3 dias de musculação (pode ter cardio nos outros dias)?
  - Ou pode ter cardio no mesmo dia que musculação?

**Solução proposta:**
Já está parcialmente claro na linha 1822-1825, mas adicionar:

- "A frequência informada (ex: 3x/semana) = número EXATO de dias com treino de FORÇA"
- "Cardio pode ser feito nos MESMOS dias (após força) ou em dias separados"
- "Total de dias de atividade pode ser maior que a frequência informada"

---

### 5. **AERÓBICO: OBRIGATÓRIO vs. SE SOLICITADO** ⚠️ CRÍTICO

**Problema:**

- Linha 1393: "aerobicTraining - plano de TREINO AERÓBICO/CARDIOVASCULAR (OBRIGATÓRIO)"
- Linha 1399: "⚠️ **CRÍTICO: SEMPRE inclua o campo aerobicTraining em TODOS os planos!**"
- Linha 1867: "### NUTRIÇÃO (SE SOLICITADA)" - mas não há equivalente para aeróbico
- **CONFLITO:** Aeróbico é sempre obrigatório ou só quando solicitado?

**Solução proposta:**
Manter como obrigatório (já está correto), mas remover qualquer ambiguidade:

- Remover seção "NUTRIÇÃO (SE SOLICITADA)" ou clarificar que nutrição também é obrigatória
- Adicionar: "⚠️ CRÍTICO: Tanto aerobicTraining quanto nutritionPlan são OBRIGATÓRIOS em todos os planos"

---

### 6. **OBJETIVOS: DEFINIÇÃO INCOMPLETA** ⚠️ MÉDIO

**Problema:**

- Linha 1249: "Objetivo (ganhar massa, emagrecer, força, resistência ou definição)"
- Mas a tabela de decisão (linha 1417-1438) só cobre:
  - Ganhar Massa
  - Emagrecer
  - Manter
  - Condicionamento
- **FALTAM:** "força", "resistência", "definição" na tabela

**Solução proposta:**
Adicionar à tabela ou clarificar mapeamento:

- "força" = similar a "Ganhar Massa" mas com foco em força máxima (1-5 reps)
- "resistência" = similar a "Condicionamento"
- "definição" = similar a "Emagrecer" mas com foco em preservar massa

---

### 7. **PROGRESSÃO: CONFLITO COM OUTRAS REGRAS** ⚠️ MÉDIO

**Problema:**

- Linha 1380-1384: "Aumentar 2-5% em compostos quando reps alvo forem atingidas"
- Linha 1457-1461: Faixas de repetições fixas por IMC (ex: 8-12, 12-18)
- **CONFLITO:** Se usuário atinge 12 reps (máximo da faixa), deve aumentar carga ou manter na faixa?

**Solução proposta:**
Clarificar:

- "Quando atingir o MÁXIMO da faixa de repetições (ex: 12 reps em faixa 8-12), aumentar carga 2-5%"
- "Nunca exceder o máximo da faixa sem aumentar carga primeiro"
- "Se atingir o máximo e aumentar carga, voltar ao mínimo da faixa (ex: 12 reps → aumentar carga → voltar a 8 reps)"

---

### 8. **TEMPO DISPONÍVEL: CONFLITO COM NÚMERO DE EXERCÍCIOS** ⚠️ MÉDIO

**Problema:**

- Linha 1294-1296: Tempo → número de exercícios (30-40min = 6-8 exercícios)
- Linha 1332-1347: Nível → número de exercícios por grupo
- **CONFLITO:** Iniciante com 60-90min pode ter 12-16 exercícios totais, mas iniciante só deve ter 1-2 por grupo grande

**Solução proposta:**
Clarificar hierarquia:

1. Tempo disponível define o MÁXIMO de exercícios totais
2. Nível de musculação define a DISTRIBUIÇÃO por grupo
3. Se iniciante com muito tempo, pode fazer Full Body com mais grupos, mas mantendo 1-2 exercícios por grupo

---

### 9. **VOLUME SEMANAL: COMO CALCULAR PARA INTERMEDIÁRIOS** ⚠️ MÉDIO

**Problema:**

- Linha 1345-1347: Volume semanal obrigatório APENAS para AVANÇADOS
- **FALTA:** Volume semanal recomendado para INICIANTES e INTERMEDIÁRIOS

**Solução proposta:**
Adicionar:

- **INICIANTE:** 8-12 séries semanais por grupo grande
- **INTERMEDIÁRIO:** 12-18 séries semanais por grupo grande
- **AVANÇADO:** 14-22 séries semanais por grupo grande (já existe)

---

### 10. **SINERGIAS: "OMBRO SEPARADO OU COM COSTAS"** ⚠️ BAIXO

**Problema:**

- Linha 1357: "Ombro separado ou com costas"
- Linha 1360: "Evitar: Peito + ombro"
- **AMBIGUIDADE:** Se ombro pode ir com costas, mas peito não pode ir com ombro, como fica a divisão?

**Solução proposta:**
Clarificar:

- "Ombro pode ser treinado com costas (Pull) OU em dia separado"
- "NUNCA treinar ombro no mesmo dia de peito (Push) - deltoide anterior já é muito ativado"
- "Se treinar Push/Pull/Legs: Push = Peito + Tríceps (sem ombro), Pull = Costas + Bíceps + Ombros"

---

## 📋 RESUMO DE PRIORIDADES

### 🔴 CRÍTICO (Corrigir imediatamente):

1. Nível de atividade vs. Nível de musculação
2. Quantidade de exercícios: Total vs. Por grupo
3. Séries: Por exercício vs. Volume semanal
4. Aeróbico: Obrigatório vs. Se solicitado

### 🟡 MÉDIO (Corrigir em breve):

5. Frequência de treino: Interpretação
6. Objetivos: Definição incompleta
7. Progressão: Conflito com outras regras
8. Tempo disponível: Conflito com número de exercícios
9. Volume semanal: Como calcular para intermediários

### 🟢 BAIXO (Melhorar quando possível):

10. Sinergias: "Ombro separado ou com costas"

---

## ✅ RECOMENDAÇÕES GERAIS

1. **Adicionar seção de PRIORIDADES** no início do prompt:
   - Quando houver conflito entre regras, qual tem prioridade?
   - Exemplo: "Se conflito entre tempo disponível e nível de atividade, priorize nível de atividade para segurança"

2. **Adicionar exemplos práticos** para cada regra complexa:
   - Exemplo: "Usuário: Iniciante, 3x/semana, 45min → Full Body 3x, 4-5 exercícios por treino, 2-3 séries cada"

3. **Unificar terminologia**:
   - Usar sempre "nível de atividade" para TDEE
   - Usar sempre "nível de musculação" para prescrição

4. **Adicionar validação final**:
   - Checklist antes de retornar o plano
   - Verificar se todas as regras foram respeitadas
