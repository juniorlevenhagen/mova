# 🔵 Como Configurar Login com Facebook

## 📋 Passo a Passo

### 1️⃣ Criar App no Facebook Developers

1. Acesse: [Facebook Developers](https://developers.facebook.com/)
2. Faça login com sua conta Facebook
3. Clique em **"My Apps"** → **"Create App"**
4. Selecione **"Consumer"** ou **"Business"**
5. Preencha:
   - **App Name**: `Mova+`
   - **App Contact Email**: Seu email
6. Clique em **"Create App"**

---

### 2️⃣ Configurar Facebook Login

1. No painel do app, vá em **"Add Product"** (ou **"Adicionar Produto"**)
2. Encontre **"Facebook Login"** e clique em **"Set Up"** (ou **"Configurar"**)
3. Vá em **"Settings"** → **"Basic"** (ou **"Configurações"** → **"Básico"**)
4. Em **"App Domains"**, adicione:
   ```
   movamais.fit
   localhost
   ```

**Configuração de pré-carregamento** (opcional, para compartilhamento):

- Marque **"HTML"** e **"JavaScript e CSS"**
- Isso ajuda o Facebook a pré-carregar conteúdo quando alguém compartilha links do seu site
- Não é obrigatório para OAuth funcionar

5. Role até **"Facebook Login"** → **"Settings"** (ou **"Configurações"**)
6. Em **"Valid OAuth Redirect URIs"**, adicione (uma por linha):

   ```
   http://localhost:3000/auth/callback
   https://movamais.fit/auth/callback
   https://ictlvqhrnhjxnhrwhfaq.supabase.co/auth/v1/callback
   ```

7. **Validador da URI de redirecionamento** (opcional, para teste):
   - Cole uma das URIs acima para testar
   - Exemplo: `https://movamais.fit/auth/callback`
   - Clique em **"Verificar"** para testar se está funcionando

8. Clique em **"Save Changes"** (ou **"Salvar alterações"**)

---

### 3️⃣ Configurar App Domains (nas Configurações Básicas)

1. No menu lateral, vá em **"Settings"** → **"Basic"** (ou **"Configurações"** → **"Básico"**)
2. Em **"App Domains"**, adicione:
   ```
   movamais.fit
   localhost
   ```
3. **Gerenciador de Domínios**: Adicione `https://movamais.fit/` (se ainda não tiver)
4. Clique em **"Save Changes"**

**Configuração de pré-carregamento** (opcional):

- Marque **"HTML"** e **"JavaScript e CSS"**
- Não é obrigatório para OAuth funcionar

### 4️⃣ Obter App ID e App Secret

1. Na mesma página **"Settings"** → **"Basic"**
2. Copie o **"App ID"** (este é o Client ID)
3. Clique em **"Show"** ao lado de **"App Secret"**
4. Copie o **"App Secret"** (este é o Client Secret)
   - ⚠️ **Só aparece uma vez!** Anote com cuidado

---

### 5️⃣ Configurar Permissões

1. Vá em **"Facebook Login"** → **"Settings"** (ou **"Configurações"**)
2. Role até **"User & Friend Permissions"** (ou **"Permissões de Usuário e Amigos"**)
3. Clique em **"Add Permissions"** (ou **"Adicionar Permissões"**)
4. Adicione:
   - ✅ `email`
   - ✅ `public_profile`
5. Clique em **"Save Changes"**

---

### 6️⃣ Configurar no Supabase

1. Acesse: [Supabase Dashboard](https://app.supabase.com)
2. Seu projeto → **Authentication** → **Providers**
3. Encontre **"Facebook"** e clique para **ativar**
4. Preencha:
   - **Client ID**: Cole o **App ID** do Facebook
   - **Client Secret**: Cole o **App Secret** do Facebook
5. Clique em **"Save"**

---

## ⚠️ Importante: Modo de Desenvolvimento

Se o app estiver em **modo de desenvolvimento**, apenas você (e usuários adicionados como testadores) poderá fazer login.

### Para permitir qualquer pessoa fazer login:

1. Facebook Developers → Seu App → **"App Review"** (ou **"Revisão do App"**)
2. Para produção, você precisará:
   - Submeter o app para revisão do Facebook
   - OU adicionar usuários como testadores/desenvolvedores

### Adicionar Testadores (Desenvolvimento):

1. Vá em **"Roles"** → **"Test Users"** (ou **"Funções"** → **"Usuários de Teste"**)
2. Clique em **"Add Test Users"** (ou **"Adicionar Usuários de Teste"**)
3. Adicione emails de pessoas que podem testar

---

## ✅ Checklist

- [ ] App criado no Facebook Developers
- [ ] Facebook Login adicionado como produto
- [ ] App Domains configurado (movamais.fit, localhost)
- [ ] Valid OAuth Redirect URIs adicionadas (3 URLs)
- [ ] App ID e App Secret copiados
- [ ] Permissões configuradas (email, public_profile)
- [ ] Provider ativado no Supabase
- [ ] Client ID e Secret configurados no Supabase

---

## 🧪 Testar

1. Acesse: `https://movamais.fit/auth/login`
2. Clique em **"Continuar com Facebook"**
3. Faça login com sua conta Facebook
4. Você deve ser redirecionado para `/dashboard`

---

## 🆘 Problemas Comuns

### Erro: "App Not Setup"

**Causa**: Facebook Login não está configurado corretamente.

**Solução**:

1. Verifique se adicionou "Facebook Login" como produto
2. Verifique se as Redirect URIs estão configuradas
3. Verifique se as permissões estão adicionadas

### Erro: "redirect_uri_mismatch"

**Causa**: URL de redirecionamento não está no Facebook.

**Solução**:

1. Verifique se adicionou todas as 3 URLs nas "Valid OAuth Redirect URIs"
2. Certifique-se de usar `https://` para produção
3. Salve as alterações

### Erro: "App is in development mode"

**Causa**: App está em modo de desenvolvimento e você não está na lista de testadores.

**Solução**:

1. Adicione seu email como testador/desenvolvedor
2. OU submeta o app para revisão do Facebook (para produção)

---

**Pronto!** Após seguir esses passos, o login com Facebook deve funcionar! 🎉
