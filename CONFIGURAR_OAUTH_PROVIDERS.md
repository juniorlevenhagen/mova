# 🔐 Como Configurar Login com OAuth (Google, Azure, Facebook)

Este guia mostra como configurar login com **Google**, **Azure** e **Facebook** no Supabase.

---

## 📋 Índice

- [Google OAuth](#-google-oauth)
- [Azure OAuth](#-azure-oauth)
- [Facebook OAuth](#-facebook-oauth)
- [Configuração no Supabase](#-configuração-no-supabase)
- [URIs de Redirecionamento](#-uris-de-redirecionamento)

---

## 🔵 Google OAuth

### 1️⃣ Criar/Selecionar Projeto no Google Cloud Console

1. Acesse: [Google Cloud Console](https://console.cloud.google.com/)
2. Faça login com sua conta Google
3. No topo, clique no seletor de projetos
4. Clique em **"Novo Projeto"** (ou selecione um existente)
   - **Nome do projeto**: `Mova+` (ou outro nome de sua escolha)
   - Clique em **"Criar"**

### 2️⃣ Configurar Tela de Consentimento OAuth

1. No menu lateral, vá em **"APIs e serviços"** → **"Tela de consentimento OAuth"**
2. Selecione **"Externo"** (ou "Interno" se você usa Google Workspace)
3. Clique em **"Criar"**

**Preencha as informações:**

- **Nome do app**: `Mova+`
- **Email de suporte do usuário**: Seu email
- **Email de contato do desenvolvedor**: Seu email
- **Escopos**: `email`, `profile`, `openid`

### 3️⃣ Criar Credenciais OAuth 2.0

1. **"APIs e serviços"** → **"Credenciais"**
2. Clique em **"+ Criar credenciais"** → **"ID do cliente OAuth"**
3. Tipo: **"Aplicativo da Web"**
4. **URIs de redirecionamento autorizados:**
   ```
   http://localhost:3000/auth/callback
   https://movamais.fit/auth/callback
   https://[seu-projeto].supabase.co/auth/v1/callback
   ```
5. Clique em **"Criar"**
6. **Copie o Client ID e Client Secret**

**⚠️ IMPORTANTE:** O Client Secret só aparece uma vez! Anote com cuidado.

---

## 🔷 Azure OAuth

### 1️⃣ Registrar Aplicativo no Azure Portal

**Opção 1: Link Direto (Mais Rápido)**

1. Acesse diretamente: [Azure Portal - App Registrations](https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade)
2. Clique em **"+ New registration"** (ou **"+ Registrar um aplicativo"**)

**Opção 2: Navegação pelo Menu**

1. Acesse: [Azure Portal](https://portal.azure.com/)
2. No menu superior, procure por **"Microsoft Entra ID"** (ou digite na barra de pesquisa)
   - ⚠️ **NÃO clique em "Criar um recurso"** - isso é para outros tipos de recursos
3. No menu lateral esquerdo, clique em **"App registrations"** (ou **"Registros de aplicativo"**)
4. Clique em **"+ New registration"** (ou **"+ Novo registro"**)

**Preencha:**

- **Name**: `Mova+`
- **Supported account types**: ⚠️ **IMPORTANTE** - Selecione:
  - **"Accounts in any organizational directory and personal Microsoft accounts"**
  - Ou: **"Personal Microsoft accounts only"**
  - ⚠️ **NÃO selecione apenas "Accounts in this organizational directory only"** - isso bloqueia contas pessoais!
- **Redirect URI**:
  - Clique em **"Add a platform"** → **"Web"**
  - Adicione as seguintes URIs (uma por vez):
    ```
    https://[seu-projeto].supabase.co/auth/v1/callback
    http://localhost:3000/auth/callback
    https://movamais.fit/auth/callback
    ```
  - Substitua `[seu-projeto]` pela URL do seu projeto Supabase

4. Clique em **"Register"**

**⚠️ Se você já criou o app e está recebendo erro "unauthorized_client":**

1. Vá em **"Authentication"** no menu lateral
2. Em **"Supported account types"**, clique em **"Edit"**
3. Selecione: **"Accounts in any organizational directory and personal Microsoft accounts"**
4. **Ative "Permitir fluxos de cliente público"** (Allow public client flows)
   - Role até **"Advanced settings"** ou **"Configurações avançadas"**
   - Ative o toggle **"Allow public client flows"**
   - ⚠️ **Isso é necessário para OAuth funcionar!**
5. Clique em **"Save"**
6. Aguarde alguns minutos para as mudanças propagarem

### 2️⃣ Obter Client ID e Secret

1. Na página do aplicativo (Overview), copie o **"Application (client) ID"** (Client ID)
2. No menu lateral, vá em **"Certificates & secrets"**
3. Na aba **"Client secrets"**, clique em **"+ New client secret"**
4. Preencha:
   - **Description**: `Mova+ OAuth Secret`
   - **Expires**: Escolha o tempo de expiração (recomendado: 24 meses)
5. Clique em **"Add"**
6. **Copie o Value** (Client Secret) - ⚠️ só aparece uma vez! Anote com cuidado

### 3️⃣ Configurar Permissões

1. No menu lateral, vá em **"API permissions"**
2. Clique em **"+ Add a permission"**
3. Selecione **"Microsoft Graph"**
4. Selecione **"Delegated permissions"**
5. Procure e adicione:
   - ✅ `email`
   - ✅ `openid`
   - ✅ `profile`
   - ✅ `User.Read` (geralmente já vem por padrão)
6. Clique em **"Add permissions"**
7. **Importante**: Clique em **"Grant admin consent for [seu-tenant]"** para aprovar as permissões
   - Isso é necessário para que os usuários possam fazer login

---

## 🔵 Facebook OAuth

### 1️⃣ Criar App no Facebook Developers

1. Acesse: [Facebook Developers](https://developers.facebook.com/)
2. Clique em **"My Apps"** → **"Create App"**
3. Selecione **"Consumer"** ou **"Business"**
4. Preencha:
   - **App Name**: `Mova+`
   - **App Contact Email**: Seu email
5. Clique em **"Create App"**

### 2️⃣ Configurar Facebook Login

1. No painel do app, vá em **"Add Product"**
2. Encontre **"Facebook Login"** e clique em **"Set Up"**
3. Vá em **"Settings"** → **"Basic"**
4. Adicione **"App Domains"** (seu domínio)
5. Em **"Facebook Login"** → **"Settings"**, adicione:

**Valid OAuth Redirect URIs:**

```
http://localhost:3000/auth/callback
https://movamais.fit/auth/callback
https://[seu-projeto].supabase.co/auth/v1/callback
```

### 3️⃣ Obter App ID e App Secret

1. Em **"Settings"** → **"Basic"**, copie:
   - **App ID** (Client ID)
   - **App Secret** (Client Secret) - clique em **"Show"** para revelar

### 4️⃣ Configurar Permissões

1. Vá em **"Facebook Login"** → **"Settings"**
2. Em **"User & Friend Permissions"**, adicione:
   - `email`
   - `public_profile`

---

## ⚙️ Configuração no Supabase

### 1️⃣ Configurar Site URL (Importante para personalizar o nome!)

Para que apareça "Mova+" ao invés de "ictlvqhrnhjxnhrwhfaq.supabase.co" na tela do Google:

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **"Authentication"** → **"URL Configuration"**
4. Em **"Site URL"**, configure:
   - **Desenvolvimento**: `http://localhost:3000`
   - **Produção**: `https://movamais.fit`
5. Em **"Redirect URLs"**, adicione:
   ```
   http://localhost:3000/auth/callback
   https://movamais.fit/auth/callback
   ```
6. Clique em **"Save"**

**✅ Isso fará com que apareça "Mova+" ou "movamais.fit" ao invés do subdomínio do Supabase!**

### 2️⃣ Configurar Providers OAuth

Para cada provider (Google, Azure, Facebook):

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **"Authentication"** → **"Providers"**
4. Encontre o provider (Google, Azure, Facebook)
5. Clique para **ativar**
6. Preencha:
   - **Client ID**: Cole o Client ID do provedor
   - **Client Secret**: Cole o Client Secret do provedor
   - **Azure Tenant URL** (Opcional): Deixe em branco na maioria dos casos
     - ⚠️ **Só preencha se** você quiser restringir login apenas para um tenant específico
     - Formato: `https://login.microsoftonline.com/{tenant-id}`
     - Exemplo: `https://login.microsoftonline.com/12345678-1234-1234-1234-123456789012`
     - **Para permitir contas pessoais e organizacionais**: Deixe vazio
7. Clique em **"Save"**

---

## 🔗 URIs de Redirecionamento

### URLs que você precisa adicionar em cada provedor:

```
http://localhost:3000/auth/callback
https://movamais.fit/auth/callback
https://[seu-projeto].supabase.co/auth/v1/callback
```

**Como encontrar a URL do Supabase:**

1. Supabase Dashboard → **Settings** (⚙️) → **API**
2. Copie a **"Project URL"** (ex: `https://ictlvqhrnhjxnhrwhfaq.supabase.co`)
3. Adicione `/auth/v1/callback` no final

---

## ✅ Checklist de Configuração

### Google:

- [ ] Projeto criado no Google Cloud Console
- [ ] Tela de consentimento OAuth configurada
- [ ] Credenciais OAuth 2.0 criadas
- [ ] Client ID e Secret copiados
- [ ] URIs de redirecionamento adicionadas
- [ ] Provider ativado no Supabase

### Azure:

- [ ] App registrado no Azure Portal
- [ ] Client ID e Secret copiados
- [ ] Permissões configuradas (email, openid, profile)
- [ ] URIs de redirecionamento adicionadas
- [ ] Provider ativado no Supabase

### Facebook:

- [ ] App criado no Facebook Developers
- [ ] Facebook Login configurado
- [ ] App ID e Secret copiados
- [ ] Permissões configuradas (email, public_profile)
- [ ] URIs de redirecionamento adicionadas
- [ ] Provider ativado no Supabase

---

## 🧪 Testar

1. Inicie o servidor: `bun dev`
2. Acesse: `http://localhost:3000/auth/login`
3. Clique em qualquer botão OAuth (Google, Azure, Facebook)
4. Faça login com sua conta
5. Você deve ser redirecionado para `/dashboard`

---

## 🆘 Problemas Comuns

### Erro: "redirect_uri_mismatch"

**Causa**: URI de redirecionamento não configurada corretamente.

**Solução**:

1. Verifique se adicionou todas as URIs necessárias
2. Certifique-se de usar `https://` (não `http://`) para produção
3. Verifique se não há espaços ou caracteres extras

### Erro: "invalid_client"

**Causa**: Client ID ou Client Secret incorretos.

**Solução**:

1. Verifique se copiou corretamente
2. Verifique se não há espaços antes/depois
3. Tente criar novas credenciais se necessário

### Erro: "access_denied"

**Causa**: Usuário cancelou ou não tem permissão.

**Solução**:

1. Verifique se as permissões estão configuradas corretamente
2. Para Google: adicione email na lista de usuários de teste
3. Para Azure: verifique se deu "Grant admin consent"
4. Para Facebook: verifique se o app está em modo de desenvolvimento/teste

---

## 📝 Resumo

**Onde obter Client IDs:**

- **Google**: Google Cloud Console → APIs e serviços → Credenciais
- **Azure**: Azure Portal → Azure AD → App registrations
- **Facebook**: Facebook Developers → My Apps → Settings

**Onde configurar:**

- Supabase Dashboard → Authentication → Providers → [Provider]
- Ativar e colar Client ID e Secret

**Pronto!** 🎉
