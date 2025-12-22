# 📋 Padrões de Geração de Treino

Este documento descreve todos os padrões pré-definidos usados para gerar planos de treino sem usar IA, economizando tokens e garantindo consistência.

## 🎯 Configurações de Volume por Nível

### Atleta Alto Rendimento

- **Músculos Grandes**: 5-8 exercícios
- **Músculos Pequenos**: 2-4 exercícios
- **Máximo Total**: 12 exercícios/dia

### Atleta / Avançado

- **Músculos Grandes**: 5-7 exercícios
- **Músculos Pequenos**: 2-3 exercícios
- **Máximo Total**: 10 exercícios/dia

### Intermediário

- **Músculos Grandes**: 3-5 exercícios
- **Músculos Pequenos**: 1-2 exercícios
- **Máximo Total**: 8 exercícios/dia

### Iniciante

- **Músculos Grandes**: 2-4 exercícios
- **Músculos Pequenos**: 1-2 exercícios
- **Máximo Total**: 6 exercícios/dia

### Moderado (Padrão)

- **Músculos Grandes**: 3-5 exercícios
- **Músculos Pequenos**: 1-2 exercícios
- **Máximo Total**: 8 exercícios/dia

## 🏋️ Banco de Exercícios por Grupo Muscular

### Peitoral (8 exercícios disponíveis)

1. Supino reto com barra (4 séries, 6-10 reps, 90-120s)
2. Supino inclinado com halteres (4 séries, 8-12 reps, 90-120s)
3. Supino declinado com barra (3 séries, 8-12 reps, 90-120s)
4. Supino com halteres (3 séries, 8-12 reps, 90-120s)
5. Crucifixo com halteres (3 séries, 12-15 reps, 60-90s)
6. Crossover com cabos (3 séries, 12-15 reps, 60-90s)
7. Supino inclinado com barra (4 séries, 6-10 reps, 90-120s)
8. Flexão de braços (3 séries, até a falha, 60-90s)

### Costas (8 exercícios disponíveis)

1. Puxada na barra fixa (4 séries, 6-10 reps, 90-120s)
2. Remada curvada com barra (4 séries, 6-10 reps, 90-120s)
3. Remada unilateral com halteres (3 séries, 8-12 reps, 60-90s)
4. Puxada na frente com barra (3 séries, 8-12 reps, 90-120s)
5. Remada baixa com polia (3 séries, 8-12 reps, 90-120s)
6. Puxada aberta (3 séries, 10-12 reps, 90-120s)
7. Remada alta (3 séries, 8-12 reps, 90-120s)
8. Puxada com pegada supinada (3 séries, 8-12 reps, 90-120s)

### Tríceps (5 exercícios disponíveis)

1. Tríceps testa com barra EZ (3 séries, 10-12 reps, 60-90s)
2. Tríceps na polia alta (3 séries, 10-12 reps, 60-90s)
3. Tríceps francês (3 séries, 10-12 reps, 60-90s)
4. Mergulho entre bancos (3 séries, 8-12 reps, 60-90s)
5. Tríceps coice com halteres (3 séries, 10-12 reps, 60-90s)

### Bíceps (5 exercícios disponíveis)

1. Rosca direta com barra (3 séries, 8-12 reps, 60-90s)
2. Rosca martelo com halteres (3 séries, 10-15 reps, 60-90s)
3. Rosca concentrada (3 séries, 8-12 reps, 60-90s)
4. Rosca alternada com halteres (3 séries, 10-12 reps, 60-90s)
5. Rosca com barra W (3 séries, 8-12 reps, 60-90s)

### Quadríceps (7 exercícios disponíveis)

1. Agachamento com barra (4 séries, 6-10 reps, 90-120s)
2. Leg press (4 séries, 8-12 reps, 90-120s)
3. Cadeira extensora (3 séries, 10-15 reps, 60-90s)
4. Agachamento frontal (3 séries, 8-12 reps, 90-120s)
5. Afundo com halteres (3 séries, 10-12 reps, 60-90s)
6. Agachamento búlgaro (3 séries, 10-12 reps, 60-90s)
7. Hack squat (4 séries, 8-12 reps, 90-120s)

### Posterior de Coxa (6 exercícios disponíveis)

1. Mesa flexora (3 séries, 10-15 reps, 60-90s)
2. Stiff com barra (3 séries, 8-12 reps, 90-120s)
3. Leg curl deitado (3 séries, 10-15 reps, 60-90s)
4. Leg curl sentado (3 séries, 10-15 reps, 60-90s)
5. Good morning (3 séries, 8-12 reps, 90-120s)
6. RDL (Romanian Deadlift) (3 séries, 8-12 reps, 90-120s)

### Panturrilhas (3 exercícios disponíveis)

1. Elevação de panturrilha em pé (4 séries, 12-15 reps, 60-90s)
2. Elevação de panturrilha sentado (3 séries, 15-20 reps, 60-90s)
3. Elevação de panturrilha no leg press (3 séries, 12-15 reps, 60-90s)

### Ombros (6 exercícios disponíveis)

1. Desenvolvimento militar com barra (4 séries, 6-10 reps, 90-120s)
2. Desenvolvimento com halteres (4 séries, 6-10 reps, 90-120s)
3. Elevação lateral com halteres (3 séries, 10-15 reps, 60-90s)
4. Elevação frontal com halteres (3 séries, 10-15 reps, 60-90s)
5. Face pull (3 séries, 12-15 reps, 60-90s)
6. Elevação lateral invertida (3 séries, 12-15 reps, 60-90s)

## 📐 Estrutura por Tipo de Dia

### Push (Peito + Tríceps)

- **Ordem**: TODOS os exercícios de peito primeiro, depois TODOS de tríceps
- **Volume Peito**: Conforme nível (mínimo 5 para atleta)
- **Volume Tríceps**: Máximo 30% do total (ex: 2 exercícios se houver 5 de peito)

### Pull (Costas + Bíceps)

- **Ordem**: TODOS os exercícios de costas primeiro, depois TODOS de bíceps
- **Volume Costas**: Conforme nível (mínimo 5 para atleta)
- **Volume Bíceps**: Máximo 30% do total (ex: 2 exercícios se houver 5 de costas)

### Legs (Quadríceps + Posterior + Panturrilhas)

- **Ordem**: TODOS quadríceps → TODOS posterior → TODOS panturrilhas
- **Volume Quadríceps**: Conforme nível (mínimo 5 para atleta)
- **Volume Posterior**: Conforme nível (mínimo 5 para atleta)
- **Volume Panturrilhas**: Mínimo 1 exercício

### Upper (Superiores)

- **Grupos**: Peito + Costas + Ombros + Bíceps + Tríceps
- **Volume**: Distribuído entre todos os grupos

### Full Body (Corpo Inteiro)

- **Grupos**: 1 exercício de cada grupo principal
- **Volume**: Mínimo necessário para treino completo

## 🔄 Regras de Repetição

### Dias do Mesmo Tipo

- **Push A e Push D**: EXATAMENTE os mesmos exercícios, séries, reps e descanso
- **Pull B e Pull E**: EXATAMENTE os mesmos exercícios, séries, reps e descanso
- **Legs**: Se houver repetição, também devem ser idênticos

### Seleção de Exercícios

- Os exercícios são selecionados na ordem do banco de dados
- Primeiros exercícios = mais básicos/compostos
- Últimos exercícios = mais isolados/avançados

## 🎲 Lógica de Seleção

1. **Determina volume** baseado no nível de atividade
2. **Seleciona exercícios** do banco na ordem (slice do array)
3. **Garante ordem**: Grandes primeiro, depois pequenos
4. **Garante repetição**: Dias do mesmo tipo têm os mesmos exercícios
5. **Valida**: Verifica se atende todas as regras

## 💡 Exemplo: PPL 5x para Atleta

### Push A (Segunda-feira)

- **Peito** (5 exercícios): Supino reto, Supino inclinado, Supino declinado, Supino com halteres, Crucifixo
- **Tríceps** (2 exercícios): Tríceps testa, Tríceps na polia
- **Total**: 7 exercícios

### Push D (Quinta-feira)

- **MESMOS exercícios** do Push A (garantido automaticamente)

### Pull B (Terça-feira)

- **Costas** (5 exercícios): Puxada na barra fixa, Remada curvada, Remada unilateral, Puxada na frente, Remada baixa
- **Bíceps** (2 exercícios): Rosca direta, Rosca martelo
- **Total**: 7 exercícios

### Pull E (Sexta-feira)

- **MESMOS exercícios** do Pull B (garantido automaticamente)

### Legs C (Quarta-feira)

- **Quadríceps** (5 exercícios): Agachamento, Leg press, Cadeira extensora, Agachamento frontal, Afundo
- **Posterior** (5 exercícios): Mesa flexora, Stiff, Leg curl deitado, Leg curl sentado, Good morning
- **Panturrilhas** (1 exercício): Elevação em pé
- **Total**: 11 exercícios

## ✅ Garantias

1. ✅ Volume mínimo sempre respeitado
2. ✅ Ordem correta (grandes → pequenos)
3. ✅ Dias repetidos sempre idênticos
4. ✅ Limites máximos respeitados
5. ✅ Sem gasto de tokens da API
6. ✅ Consistência total
