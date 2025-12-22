# 🚀 Configurar OAuth Google em Produção (Vercel)

Se o login com Google funciona em `localhost` mas não funciona em produção (`movamais.fit`), siga este guia.

---

## ✅ Checklist de Verificação

### 1️⃣ Variáveis de Ambiente no Vercel

**IMPORTANTE**: Todas as variáveis do `.env.local` precisam estar no Vercel!

1. Acesse: [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecione seu projeto
3. Vá em **Settings** → **Environment Variables**
4. Verifique se **TODAS** estas variáveis estão configuradas:

**Variáveis Obrigatórias:**

```
NEXT_PUBLIC_SUPABASE_URL=https://ictlvqhrnhjxnhrwhfaq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_key
```

**Variáveis Recomendadas:**

```
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
```

5. Para cada variável, certifique-se de que:
   - ✅ Está marcada para **Production**
   - ✅ Está marcada para **Preview** (opcional, mas recomendado)
   - ✅ Está marcada para **Development** (opcional)

6. Clique em **Save** para cada variável

7. **Redeploy** o projeto:
   - Vá em **Deployments**
   - Clique nos **3 pontos** (⋯) do último deployment
   - Clique em **Redeploy**

---

### 2️⃣ Verificar URLs no Google Cloud Console

A URL de produção **DEVE** estar nas URIs de redirecionamento do Google:

1. Acesse: [Google Cloud Console](https://console.cloud.google.com/)
2. Vá em **APIs e serviços** → **Credenciais**
3. Clique no **Client ID** do OAuth que você criou
4. Em **"URIs de redirecionamento autorizados"**, verifique se tem:

```
http://localhost:3000/auth/callback
https://movamais.fit/auth/callback
https://ictlvqhrnhjxnhrwhfaq.supabase.co/auth/v1/callback
```

5. Se **NÃO tiver** `https://movamais.fit/auth/callback`:
   - Clique em **"+ Add URI"** ou **"+ Adicionar URI"**
   - Cole: `https://movamais.fit/auth/callback`
   - Clique em **Save**

---

### 3️⃣ Verificar Site URL no Supabase

O Site URL deve estar configurado para produção:

1. Acesse: [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **Authentication** → **URL Configuration**
4. Verifique o **Site URL**:
   - Deve estar: `https://movamais.fit`
   - **NÃO** deve estar: `http://localhost:3000`

5. Em **Redirect URLs**, verifique se tem:

   ```
   http://localhost:3000/auth/callback
   https://movamais.fit/auth/callback
   https://ictlvqhrnhjxnhrwhfaq.supabase.co/auth/v1/callback
   ```

6. Clique em **Save** (se fez alterações)

---

## 🔍 Diagnóstico de Problemas

### Problema: "redirect_uri_mismatch" em produção

**Causa**: URL de produção não está no Google Cloud Console.

**Solução**:

1. Adicione `https://movamais.fit/auth/callback` no Google Cloud Console
2. Aguarde alguns minutos para propagar
3. Tente novamente

### Problema: Erro ao redirecionar após login

**Causa**: Site URL ou Redirect URLs incorretos no Supabase.

**Solução**:

1. Verifique se Site URL está como `https://movamais.fit`
2. Verifique se `https://movamais.fit/auth/callback` está nas Redirect URLs
3. Salve e aguarde alguns minutos

### Problema: Variáveis de ambiente não encontradas

**Causa**: Variáveis não configuradas no Vercel ou não foram redeployadas.

**Solução**:

1. Adicione todas as variáveis no Vercel
2. Certifique-se de marcar para **Production**
3. Faça **Redeploy** do projeto

---

## 📝 Passo a Passo Completo

### Passo 1: Configurar Variáveis no Vercel

```
1. Vercel Dashboard → Seu Projeto → Settings → Environment Variables
2. Adicione/Verifique:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY (recomendado)
3. Marque todas para "Production"
4. Clique em "Save"
```

### Passo 2: Adicionar URL de Produção no Google

```
1. Google Cloud Console → APIs e serviços → Credenciais
2. Clique no Client ID
3. Adicione: https://movamais.fit/auth/callback
4. Clique em "Save"
```

### Passo 3: Verificar Supabase

```
1. Supabase Dashboard → Authentication → URL Configuration
2. Site URL: https://movamais.fit
3. Redirect URLs: deve ter https://movamais.fit/auth/callback
4. Clique em "Save"
```

### Passo 4: Redeploy no Vercel

```
1. Vercel Dashboard → Deployments
2. Clique nos 3 pontos (⋯) do último deployment
3. Clique em "Redeploy"
4. Aguarde o deploy terminar
```

### Passo 5: Testar

```
1. Acesse: https://movamais.fit/auth/login
2. Clique em "Continuar com Google"
3. Faça login
4. Deve redirecionar para /dashboard
```

---

## ⚠️ Importante

### URLs que DEVEM estar configuradas:

**No Google Cloud Console:**

- ✅ `http://localhost:3000/auth/callback` (desenvolvimento)
- ✅ `https://movamais.fit/auth/callback` (produção)
- ✅ `https://ictlvqhrnhjxnhrwhfaq.supabase.co/auth/v1/callback` (Supabase)

**No Supabase:**

- ✅ Site URL: `https://movamais.fit`
- ✅ Redirect URLs: todas as 3 URLs acima

**No Vercel:**

- ✅ Todas as variáveis de ambiente do `.env.local`

---

## 🧪 Teste Rápido

Após configurar tudo, teste:

1. **Acesse**: `https://movamais.fit/auth/login`
2. **Clique**: "Continuar com Google"
3. **Resultado esperado**:
   - Redireciona para Google
   - Aparece "Prosseguir para movamais.fit" ou "Prosseguir para Mova+"
   - Após login, redireciona para `/dashboard`

---

## 🆘 Ainda não funciona?

### Verifique os logs:

1. **Vercel**: Vá em **Deployments** → Clique no deployment → **Functions** → Veja os logs
2. **Navegador**: Abra DevTools (F12) → Console → Veja erros
3. **Supabase**: Dashboard → Logs → Auth Logs

### Erros comuns:

- **"redirect_uri_mismatch"**: URL não está no Google Cloud Console
- **"invalid_client"**: Client ID/Secret incorretos no Supabase
- **"CORS error"**: Verifique se Site URL está correto no Supabase

---

## ✅ Checklist Final

- [ ] Variáveis de ambiente configuradas no Vercel (Production)
- [ ] `https://movamais.fit/auth/callback` no Google Cloud Console
- [ ] Site URL = `https://movamais.fit` no Supabase
- [ ] Redirect URLs corretas no Supabase
- [ ] Redeploy feito no Vercel
- [ ] Testado em produção

---

**Pronto!** Após seguir todos os passos, o OAuth deve funcionar em produção! 🎉
