# Estratégia de Administração de Prompts

## 🎯 Implementação Atual

### Cooldown de 24 horas entre gerações
- Quando o usuário compra prompts (1 ou 3), há um **cooldown de 24 horas** entre cada geração de plano
- Isso evita que o usuário use todos os prompts imediatamente
- Garante uso responsável dos prompts comprados

### Como funciona:
1. Usuário compra 3 prompts → `available_prompts = 3`
2. Usuário gera 1º plano → usa 1 prompt, `available_prompts = 2`
3. Usuário tenta gerar 2º plano imediatamente → **BLOQUEADO** (cooldown de 24h ativo)
4. Após 24 horas → pode gerar 2º plano, usa 1 prompt, `available_prompts = 1`
5. Mais 24 horas → pode gerar 3º plano, usa 1 prompt, `available_prompts = 0`

### Benefícios:
- ✅ Previne uso abusivo (gerar 3 planos em sequência)
- ✅ Garante que o usuário teste e siga cada plano antes de gerar outro
- ✅ Distribui o uso ao longo do tempo
- ✅ Mantém qualidade - usuário tem tempo para implementar cada plano

## ⚙️ Opções de Configuração

### Opção 1: Cooldown de 24 horas (ATUAL - RECOMENDADO)
- **Tempo entre gerações:** 24 horas
- **Máximo por semana:** ~7 planos (teórico, mas limita naturalmente)
- **Máximo por mês:** ~30 planos (teórico, mas limita naturalmente)
- **Vantagem:** Balanceado - permite flexibilidade mas evita abuso

### Opção 2: Cooldown de 48 horas
- **Tempo entre gerações:** 48 horas
- **Máximo por semana:** ~3-4 planos
- **Máximo por mês:** ~15 planos
- **Vantagem:** Mais conservador, garante mais tempo entre planos

### Opção 3: Cooldown de 72 horas (3 dias)
- **Tempo entre gerações:** 3 dias
- **Máximo por semana:** ~2 planos
- **Máximo por mês:** ~10 planos
- **Vantagem:** Muito conservador, ideal para acompanhamento médico/profissional

### Opção 4: Cooldown de 12 horas
- **Tempo entre gerações:** 12 horas
- **Máximo por semana:** ~14 planos (teórico)
- **Máximo por mês:** ~60 planos (teórico)
- **Vantagem:** Mais flexível, permite 2 planos por dia (manhã/tarde)

### Opção 5: Sem cooldown (NÃO RECOMENDADO)
- **Tempo entre gerações:** 0 horas
- **Risco:** Usuário pode usar todos os 3 prompts em minutos
- **Desvantagem:** Perda de valor, abuso do sistema

## 📊 Recomendação

**Cooldown de 24 horas é o ideal porque:**
1. Permite flexibilidade (1 plano por dia)
2. Previne abuso (não pode usar todos de uma vez)
3. Garante tempo para implementar cada plano
4. Alinha com o conceito de acompanhamento progressivo
5. Distribui o uso ao longo do tempo (3 prompts = 3 dias mínimo)

## 🔧 Como Alterar o Cooldown

Para alterar o tempo de cooldown, edite a constante em `src/app/api/generate-plan/route.ts`:

```typescript
// Linha ~585
const promptCooldownHours = 24; // Altere este valor (ex: 48, 72, 12)
```

**Valores sugeridos:**
- `12` = 12 horas (2 planos por dia máximo)
- `24` = 1 dia (RECOMENDADO)
- `48` = 2 dias (mais conservador)
- `72` = 3 dias (muito conservador)

## 💡 Alternativas Consideradas

### Limite Diário
- ❌ **Problema:** Se usuário tem 3 prompts e compra à noite, teria que esperar dias para usar todos
- ✅ **Solução:** Cooldown baseado em tempo desde último plano (mais justo)

### Limite Semanal
- ❌ **Problema:** Muito restritivo - se comprar no final da semana, perde a semana
- ✅ **Solução:** Cooldown de 24h é mais flexível

### Limite Mensal
- ❌ **Problema:** Usuário pode usar todos os 3 no início do mês e ficar sem
- ✅ **Solução:** Cooldown de 24h distribui naturalmente

## 📈 Exemplo Prático

**Cenário:** Usuário compra pacote de 3 prompts

**Dia 1 - 10:00:**
- Compra 3 prompts → `available_prompts = 3`
- Gera 1º plano → usa 1 prompt, `available_prompts = 2`
- ⏳ Cooldown: 24h (próximo plano disponível: Dia 2 - 10:00)

**Dia 2 - 10:00:**
- ⏰ Cooldown passou
- Gera 2º plano → usa 1 prompt, `available_prompts = 1`
- ⏳ Cooldown: 24h (próximo plano disponível: Dia 3 - 10:00)

**Dia 3 - 10:00:**
- ⏰ Cooldown passou
- Gera 3º plano → usa 1 prompt, `available_prompts = 0`
- ✅ Todos os prompts usados

**Resultado:** 3 planos gerados em 3 dias (mínimo) com tempo adequado para implementar cada um.

