# 🔷 Azure: Client ID vs Client Secret - Qual é Qual?

## ❓ Diferença Entre os Campos

### No Azure Portal:

1. **Application (client) ID**
   - ✅ Este é o **Client ID**
   - 🔍 Onde encontrar: Azure Portal → Seu App → **Overview**
   - 📋 Formato: `a6b6b1fb-face-4840-a2ac-0137607b9a14` (GUID)
   - 🔓 **É público** - pode ser exposto

2. **Client Secret** (ou "Value" do secret)
   - ✅ Este é o **Client Secret**
   - 🔍 Onde encontrar: Azure Portal → Seu App → **Certificates & secrets** → **Client secrets**
   - 📋 Formato: `VWn~...` (string longa)
   - 🔒 **É secreto** - NUNCA exponha!

---

## 📝 Como Preencher no Supabase

### No Supabase Dashboard → Authentication → Providers → Azure:

| Campo no Supabase           | O que colar do Azure                                           |
| --------------------------- | -------------------------------------------------------------- |
| **Application (client) ID** | **Application (client) ID** (do Overview)                      |
| **Secret Value**            | **Valor** (Value) do Client Secret (de Certificates & secrets) |

⚠️ **NÃO use o "ID secreto" (Secret ID)** - use apenas o **"Valor" (Value)**!

---

## 🔍 Passo a Passo

### 1️⃣ Obter Client ID (Application ID):

1. Azure Portal → Seu App (Mova+)
2. Vá em **Overview** (Visão geral)
3. Copie o **"Application (client) ID"**
   - Exemplo: `a6b6b1fb-face-4840-a2ac-0137607b9a14`
4. Cole no Supabase em **"Client ID"**

### 2️⃣ Obter Client Secret:

1. Azure Portal → Seu App (Mova+)
2. Vá em **Certificates & secrets** (Certificados e segredos)
3. Na aba **"Client secrets"**, encontre o secret mais recente
4. Você verá duas colunas:
   - **"ID secreto"** (Secret ID) - ❌ **NÃO use este!**
   - **"Valor"** (Value) - ✅ **Use este!**
5. Clique em **"Show"** ou **"Mostrar"** no campo **"Valor"**
6. Copie o **"Valor"** (não o "ID secreto")
   - Exemplo: `VWn~abc123...` (string longa)
7. Cole no Supabase em **"Secret Value"**

⚠️ **IMPORTANTE**:

- Use o **"Valor"** (Value), NÃO o "ID secreto" (Secret ID)
- O Valor só aparece uma vez! Se você não copiou, precisa criar um novo secret.

---

## ✅ Resumo

| Azure Portal            | Supabase                | É Secreto?       |
| ----------------------- | ----------------------- | ---------------- |
| Application (client) ID | Application (client) ID | ❌ Não (público) |
| Valor (Value)           | Secret Value            | ✅ Sim (secreto) |

⚠️ **NÃO confunda:**

- ❌ **ID secreto** (Secret ID) no Azure - NÃO use este!
- ✅ **Valor** (Value) no Azure - Use este no Supabase!

---

## 🆘 Se Você Perdeu o Client Secret

1. Azure Portal → Seu App → **Certificates & secrets**
2. Clique em **"+ New client secret"**
3. Preencha:
   - **Description**: `Mova+ OAuth Secret (Novo)`
   - **Expires**: Escolha o tempo (recomendado: 24 meses)
4. Clique em **"Add"**
5. **Copie o Value imediatamente** (só aparece uma vez!)
6. Cole no Supabase em **"Client Secret"**

---

**Pronto!** Agora você sabe a diferença! 🎉
