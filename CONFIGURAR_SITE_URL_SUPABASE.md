# 🔧 Como Configurar Site URL no Supabase (Passo a Passo)

## ❌ Problema

Você configurou as Redirect URLs, mas ainda aparece:
```
Prosseguir para ictlvqhrnhjxnhrwhfaq.supabase.co
```

## ✅ Solução Completa

### 1️⃣ Configurar Site URL

1. Acesse: [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **Authentication** → **URL Configuration**
4. **Site URL** (campo no topo):
   - **Cole**: `https://movamais.fit`
   - ⚠️ **Este campo NÃO pode estar vazio!**
   - É este campo que define o que aparece na tela do Google

### 2️⃣ Configurar Redirect URLs

Na mesma página, em **Redirect URLs**, você deve ter **TODAS** estas URLs:

```
http://localhost:3000/auth/callback
https://movamais.fit/auth/callback
https://ictlvqhrnhjxnhrwhfaq.supabase.co/auth/v1/callback
```

**Como encontrar a URL do Supabase:**
- Supabase Dashboard → **Settings** (⚙️) → **API**
- Copie a **"Project URL"** (ex: `https://ictlvqhrnhjxnhrwhfaq.supabase.co`)
- Adicione `/auth/v1/callback` no final

### 3️⃣ Salvar

Clique em **"Save"** no final da página.

---

## 🔍 Verificar se Está Correto

Após salvar, verifique:

1. **Site URL** está preenchido com `https://movamais.fit` ✅
2. **Redirect URLs** tem 3 URLs (ou mais):
   - `http://localhost:3000/auth/callback` ✅
   - `https://movamais.fit/auth/callback` ✅
   - `https://ictlvqhrnhjxnhrwhfaq.supabase.co/auth/v1/callback` ✅

---

## 🧪 Testar

1. Faça logout (se estiver logado)
2. Acesse: `http://localhost:3000/auth/login`
3. Clique em "Continuar com Google"
4. Agora deve aparecer:
   ```
   Escolha uma conta
   Prosseguir para movamais.fit
   ```
   Ou (se configurado no Google):
   ```
   Escolha uma conta
   Prosseguir para Mova+
   ```

---

## ⚠️ Problemas Comuns

### Ainda aparece o subdomínio do Supabase?

**Causa**: Site URL não está configurado ou está vazio.

**Solução**:
1. Verifique se o campo **Site URL** está preenchido
2. Use `https://movamais.fit` (não `http://`)
3. Clique em **Save**

### Erro de redirecionamento?

**Causa**: Falta a URL do Supabase nas Redirect URLs.

**Solução**:
1. Adicione: `https://ictlvqhrnhjxnhrwhfaq.supabase.co/auth/v1/callback`
2. Substitua `ictlvqhrnhjxnhrwhfaq` pela URL do seu projeto
3. Clique em **Save**

---

## 📝 Resumo

**O que fazer:**
1. Preencher **Site URL** com `https://movamais.fit`
2. Adicionar **3 Redirect URLs** (localhost, produção, Supabase)
3. Clicar em **Save**

**Resultado:**
- Aparecerá "movamais.fit" ou "Mova+" na tela do Google
- OAuth funcionará corretamente

---

**Pronto!** 🎉

