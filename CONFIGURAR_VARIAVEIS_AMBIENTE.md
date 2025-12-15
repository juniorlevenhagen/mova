# 🔧 Como Configurar Variáveis de Ambiente

## 📋 O que são Variáveis de Ambiente?

Variáveis de ambiente são valores de configuração que o seu aplicativo usa, mas que **não ficam no código** (por segurança). Elas são armazenadas em um arquivo `.env.local` que fica apenas na sua máquina/servidor.

---

## 🎯 Variável Necessária para Persistência

Para que a persistência em banco funcione **perfeitamente**, você precisa adicionar esta variável:

```env
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
```

### Por que é recomendado?

- ✅ **Bypassa RLS**: A service role key ignora as políticas de segurança (Row Level Security)
- ✅ **Sempre funciona**: Garante que as inserções no banco sempre funcionem
- ✅ **Produção**: Essencial para ambientes de produção

### Por que é opcional?

- ⚠️ Se não configurar, o sistema usa `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ⚠️ Pode falhar se as políticas RLS bloquearem INSERTs
- ⚠️ Mas o sistema continua funcionando (usa memória como fallback)

---

## 📝 Passo a Passo

### 1. Encontrar a Service Role Key no Supabase

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **Settings** (⚙️) → **API**
4. Na seção **Project API keys**, encontre:
   - **`service_role`** (secret) ← **Esta é a que você precisa!**
5. Clique em **Reveal** para mostrar a chave
6. **Copie a chave** (ela começa com `eyJ...`)

⚠️ **IMPORTANTE**: Esta chave é **SECRETA** e **NUNCA** deve ser exposta no frontend ou commitada no Git!

---

### 2. Adicionar no Arquivo `.env.local`

1. Abra o arquivo `.env.local` na raiz do projeto
   - Se não existir, crie um novo arquivo com esse nome

2. Adicione a linha:

```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvdXJfcHJvamVjdCIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE2NDUxOTIwMDAsImV4cCI6MTk2MDc2ODAwMH0.sua_chave_aqui
```

**Exemplo completo do arquivo `.env.local`:**

```env
# Supabase (já deve existir)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvdXJfcHJvamVjdCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjQ1MTkyMDAwLCJleHAiOjE5NjA3NjgwMDB9.sua_anon_key_aqui

# Service Role Key (NOVA - adicione esta linha)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvdXJfcHJvamVjdCIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE2NDUxOTIwMDAsImV4cCI6MTk2MDc2ODAwMH0.sua_service_role_key_aqui

# Outras variáveis que você já tem...
OPENAI_API_KEY=sua_chave_openai
STRIPE_SECRET_KEY=sua_chave_stripe
# etc...
```

---

### 3. Reiniciar o Servidor

Após adicionar a variável, **reinicie o servidor de desenvolvimento**:

```bash
# Pare o servidor (Ctrl+C)
# Depois inicie novamente
bun dev
```

---

## 🔍 Verificar se Está Funcionando

### Opção 1: Verificar no Console

Quando o servidor iniciar, você deve ver:

- ✅ **Sem avisos** sobre variáveis não encontradas
- ✅ Se aparecer: `[PlanRejectionMetrics] Persistência em banco desabilitada` → a variável não foi encontrada

### Opção 2: Verificar no Dashboard

1. Acesse `/admin/metrics`
2. Veja o campo **"Fonte"** na resposta da API
3. Deve mostrar: `"source": "database"` (não "memory")

### Opção 3: Verificar no Banco

Execute no Supabase SQL Editor:

```sql
SELECT COUNT(*) FROM plan_rejection_metrics;
```

Se retornar um número > 0, as métricas estão sendo persistidas! 🎉

---

## 🚀 Configuração em Produção (Vercel/Outros)

Se você usa **Vercel** ou outro serviço de hospedagem:

### Vercel:

1. Acesse seu projeto no [Vercel Dashboard](https://vercel.com)
2. Vá em **Settings** → **Environment Variables**
3. Adicione:
   - **Name**: `SUPABASE_SERVICE_ROLE_KEY`
   - **Value**: Cole sua service role key
   - **Environment**: Selecione **Production**, **Preview**, **Development** (ou todos)
4. Clique em **Save**
5. **Redeploy** o projeto para aplicar as mudanças

### Outros Serviços:

- Siga o mesmo processo: adicione a variável nas configurações do ambiente
- Reinicie/redeploy o aplicativo

---

## ⚠️ Segurança

### ✅ FAÇA:

- ✅ Adicione `.env.local` no `.gitignore` (já deve estar)
- ✅ Use service role key apenas no **backend** (server-side)
- ✅ Mantenha a chave **secreta** e **privada**

### ❌ NÃO FAÇA:

- ❌ **NUNCA** commite `.env.local` no Git
- ❌ **NUNCA** exponha a service role key no frontend
- ❌ **NUNCA** compartilhe a chave publicamente

---

## 📊 Diferença entre as Chaves

| Chave                           | Uso                | Segurança            | RLS            |
| ------------------------------- | ------------------ | -------------------- | -------------- |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Frontend + Backend | Pública (pode expor) | Respeita RLS   |
| `SUPABASE_SERVICE_ROLE_KEY`     | **Apenas Backend** | **Secreta**          | **Ignora RLS** |

**Por isso a service role key é melhor para persistência automática!**

---

## 🆘 Problemas Comuns

### Problema: "Persistência em banco desabilitada"

**Causa**: Variável `SUPABASE_SERVICE_ROLE_KEY` não encontrada

**Solução**:

1. Verifique se adicionou no `.env.local`
2. Verifique se o nome está correto (sem espaços)
3. Reinicie o servidor

### Problema: Métricas não aparecem no banco

**Causa**: Políticas RLS bloqueando INSERTs

**Solução**:

1. Adicione `SUPABASE_SERVICE_ROLE_KEY` (bypassa RLS)
2. Ou ajuste as políticas RLS no Supabase

### Problema: Erro ao inserir no banco

**Causa**: Tabela não criada ou migração não executada

**Solução**:

1. Execute a migração SQL no Supabase
2. Verifique se a tabela `plan_rejection_metrics` existe

---

## ✅ Checklist

- [ ] Service Role Key copiada do Supabase Dashboard
- [ ] Variável adicionada no `.env.local`
- [ ] Servidor reiniciado
- [ ] Verificado que persistência está habilitada
- [ ] Testado inserindo uma métrica
- [ ] Verificado no banco que dados foram salvos

---

## 📝 Resumo

**O que fazer:**

1. Copiar `service_role` key do Supabase
2. Adicionar `SUPABASE_SERVICE_ROLE_KEY=...` no `.env.local`
3. Reiniciar servidor

**Por que fazer:**

- Garante que persistência sempre funcione
- Bypassa políticas RLS
- Essencial para produção

**É obrigatório?**

- ❌ Não, mas **altamente recomendado**
- Sistema funciona sem ela (usa memória)
- Mas pode falhar em alguns casos

---

**Pronto!** Agora sua persistência em banco está configurada corretamente! 🎉
