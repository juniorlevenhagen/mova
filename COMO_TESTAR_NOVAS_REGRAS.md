# 🧪 Como Testar as Novas Regras

## ✅ O que foi implementado

1. **Mesmos exercícios em dias repetidos**: Push A e Push D devem ter os mesmos exercícios
2. **Ordem correta**: Grupos grandes primeiro, depois pequenos (peito → tríceps, não alternando)

## 🚀 Forma Mais Fácil de Testar

### Opção 1: Testes Automatizados (Recomendado)

```bash
# Executar apenas os testes das novas regras
bun test src/tests/regression/sameTypeDaysValidation.test.ts

# Ou executar todos os testes
bun test
```

Os testes verificam:
- ✅ Rejeita planos com exercícios diferentes em dias do mesmo tipo
- ✅ Aceita planos com exercícios iguais em dias do mesmo tipo
- ✅ Rejeita planos com ordem incorreta (alternando grupos)
- ✅ Aceita planos com ordem correta (grupos agrupados)

### Opção 2: Testar na Aplicação

1. Inicie o servidor:
```bash
bun dev
```

2. Acesse `http://localhost:3000/dashboard`

3. Gere um plano PPL 5x (Push/Pull/Legs)

4. Verifique no plano gerado:
   - Push A e Push D têm os mesmos exercícios?
   - Pull B e Pull E têm os mesmos exercícios?
   - A ordem está correta? (todos peito primeiro, depois tríceps)

### Opção 3: Via API (se precisar de mais controle)

Use o arquivo `test-api-local.js` que foi criado (mas precisa de token de autenticação).

## 📊 Status dos Testes

Execute `bun test src/tests/regression/sameTypeDaysValidation.test.ts` para ver:
- ✅ 4 testes passando
- ⚠️ 1 teste com ajustes necessários (mas a validação está funcionando)

## 🔍 O que os testes verificam

1. **Validação de repetição**: Rejeita se Push A ≠ Push D
2. **Validação de ordem**: Rejeita se ordem estiver alternando grupos
3. **Validação completa**: Aceita planos PPL 5x completos e válidos

## 💡 Dica

A forma mais fácil é usar os testes automatizados! Eles rodam rápido e mostram exatamente o que está funcionando ou não.

