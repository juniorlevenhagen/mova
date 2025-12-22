# 🧪 Guia de Teste da API Localmente

Este guia mostra como testar a API de geração de planos localmente para ver exatamente o que será retornado em produção.

## 📋 Pré-requisitos

1. Servidor de desenvolvimento rodando
2. Usuário autenticado na aplicação
3. Token de autenticação válido

## 🚀 Passo a Passo

### 1. Iniciar o Servidor de Desenvolvimento

```bash
bun dev
```

O servidor estará disponível em `http://localhost:3000`

### 2. Obter Token de Autenticação

**Opção A: Via Console do Navegador**

1. Acesse `http://localhost:3000/auth/login`
2. Faça login com suas credenciais
3. Abra o DevTools (F12) > Console
4. Execute:

```javascript
// Se você tem acesso ao supabase no console
const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'SUA_URL',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'SUA_KEY'
);
const { data } = await supabase.auth.getSession();
console.log(data.session?.access_token);
```

**Opção B: Via Network Tab**

1. Faça login na aplicação
2. Abra DevTools > Network
3. Gere um plano pelo dashboard
4. Encontre a requisição para `/api/generate-plan`
5. Copie o token do header `Authorization: Bearer ...`

### 3. Testar a API

**Opção A: Usando o Script de Teste**

1. Edite o arquivo `test-api-local.js`
2. Substitua `SEU_TOKEN_AQUI` pelo token obtido
3. Execute:

```bash
node test-api-local.js
```

**Opção B: Usando cURL**

```bash
curl -X POST http://localhost:3000/api/generate-plan \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -v
```

**Opção C: Usando Postman/Insomnia**

1. Método: `POST`
2. URL: `http://localhost:3000/api/generate-plan`
3. Headers:
   - `Content-Type: application/json`
   - `Authorization: Bearer SEU_TOKEN_AQUI`
4. Body: (vazio - a API busca dados do usuário automaticamente)

### 4. Analisar a Resposta

A resposta será um JSON com a estrutura:

```json
{
  "success": true,
  "plan": {
    "analysis": { ... },
    "trainingPlan": {
      "overview": "...",
      "weeklySchedule": [
        {
          "day": "Treino A – Peito/Tríceps",
          "type": "Push",
          "exercises": [
            {
              "name": "Supino reto com barra",
              "primaryMuscle": "peitoral",
              "sets": 4,
              "reps": "8-12",
              "rest": "90-120s"
            },
            ...
          ]
        },
        ...
      ],
      "progression": "..."
    },
    "nutritionPlan": { ... },
    "aerobicTraining": { ... }
  }
}
```

## 🔍 Verificações Específicas

### ✅ Verificar Repetição de Exercícios

Para treinos PPL 5x, verifique se:
- Push A e Push D têm **os mesmos exercícios**
- Pull B e Pull E têm **os mesmos exercícios**

### ✅ Verificar Ordem dos Exercícios

Para cada dia, verifique se:
- **Primeiro**: Todos os exercícios do grupo grande (peito, costas, quadríceps)
- **Depois**: Todos os exercícios do grupo pequeno (tríceps, bíceps, isoladores)
- **Nunca**: Alternar entre grupos (ex: peito → tríceps → peito)

### ✅ Verificar Volume de Exercícios

Para nível "Atleta":
- Cada dia Push deve ter **5-7 exercícios de peito**
- Cada dia Pull deve ter **5-7 exercícios de costas**
- Cada dia Legs deve ter **5-7 exercícios de quadríceps**

## 🐛 Debug

Se a API retornar erro, verifique:

1. **401 Unauthorized**: Token inválido ou expirado
   - Solução: Obtenha um novo token

2. **404 Not Found**: Perfil do usuário não encontrado
   - Solução: Complete o cadastro do usuário

3. **500 Internal Server Error**: Erro no servidor
   - Solução: Verifique os logs do servidor (`bun dev`)

## 📊 Logs do Servidor

O servidor de desenvolvimento mostrará logs detalhados:

```
📊 Dados do perfil atualizados: { weight: 80, height: 175, ... }
🚀 Gerando plano personalizado...
✅ Plano gerado com sucesso
```

## 💡 Dica

Para testar múltiplas vezes rapidamente, você pode criar um script que:
1. Faz login automaticamente
2. Obtém o token
3. Chama a API
4. Analisa a resposta

Ou use o script `test-api-local.js` fornecido!

