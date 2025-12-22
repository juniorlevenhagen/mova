# 🧪 Como Testar as Novas Regras na Aplicação

## ✅ O que foi implementado

1. **Mesmos exercícios em dias repetidos**: Push A e Push D devem ter os mesmos exercícios
2. **Ordem correta**: Grupos grandes primeiro, depois pequenos (peito → tríceps, não alternando)
3. **Retry com feedback**: Se rejeitar, a segunda tentativa recebe feedback específico

## 🚀 Passos para Testar

### 1. Acesse a aplicação

- Abra: `http://localhost:3000/dashboard`
- Faça login (se necessário)

### 2. Gere um plano PPL 5x

- Vá até a seção de geração de plano
- Configure:
  - **Frequência**: 5x por semana
  - **Nível**: Atleta (para testar melhor)
  - **Objetivo**: Ganhar Massa
  - **Tempo**: 60 minutos

### 3. Verifique o plano gerado

#### ✅ Checklist - O que verificar:

1. **Dias repetidos têm os mesmos exercícios?**
   - Push A e Push D devem ter EXATAMENTE os mesmos exercícios
   - Pull B e Pull E devem ter EXATAMENTE os mesmos exercícios
   - Verifique: nome, séries, reps e descanso

2. **Ordem dos exercícios está correta?**
   - Push: TODOS os exercícios de peito primeiro, depois TODOS de tríceps
   - Pull: TODOS os exercícios de costas primeiro, depois TODOS de bíceps
   - Não deve alternar (ex: peito, tríceps, peito, tríceps)

3. **Volume adequado?**
   - Atleta: mínimo 5 exercícios de peito em Push
   - Atleta: mínimo 5 exercícios de costas em Pull

## 🔍 O que observar nos logs

Se abrir o console do servidor, você verá:

### ✅ Sucesso:

```
✅ Plano válido gerado na tentativa 1
```

### ⚠️ Se rejeitar (primeira tentativa):

```
❌ Plano rejeitado na tentativa 1. Motivo: ERRO CRÍTICO: Os dias do tipo "push" têm exercícios diferentes...
🔄 Tentativa 2 de gerar Resposta Perfeita...
⚠️ CORREÇÃO NECESSÁRIA (Tentativa anterior foi rejeitada): ...
```

### ✅ Sucesso na segunda tentativa:

```
✅ Plano válido gerado na tentativa 2
```

## 📊 Exemplo de Plano Correto (PPL 5x)

### Push A (Segunda-feira)

1. Supino reto com barra (peito)
2. Supino inclinado com halteres (peito)
3. Supino declinado (peito)
4. Crucifixo (peito)
5. Supino com halteres (peito)
6. Tríceps testa (tríceps)
7. Tríceps na polia (tríceps)

### Push D (Quinta-feira) - DEVE SER IDÊNTICO

1. Supino reto com barra (peito) ✅ MESMO
2. Supino inclinado com halteres (peito) ✅ MESMO
3. Supino declinado (peito) ✅ MESMO
4. Crucifixo (peito) ✅ MESMO
5. Supino com halteres (peito) ✅ MESMO
6. Tríceps testa (tríceps) ✅ MESMO
7. Tríceps na polia (tríceps) ✅ MESMO

## 🐛 Se encontrar problemas

1. **Exercícios diferentes em dias repetidos**
   - Verifique os logs do servidor
   - Deve aparecer o motivo da rejeição
   - A segunda tentativa deve corrigir

2. **Ordem incorreta**
   - Verifique se está alternando grupos
   - Deve estar agrupado: todos peito, depois todos tríceps

3. **Volume insuficiente**
   - Para atleta, mínimo 5 exercícios de peito/costas
   - Verifique se está respeitando o nível

## 💡 Dica

Se quiser testar rapidamente via API, use o arquivo `test-api-local.js` que criamos anteriormente!
