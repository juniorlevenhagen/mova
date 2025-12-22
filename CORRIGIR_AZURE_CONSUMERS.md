# 🔧 Corrigir Erro Azure: "unauthorized_client: The client does not exist or is not enabled for consumers"

## ❌ Erro

```
unauthorized_client: The client does not exist or is not enabled for consumers.
```

## ✅ Solução

O aplicativo Azure não está configurado para permitir contas pessoais da Microsoft (consumers).

### Passo a Passo:

1. **Acesse o Azure Portal**
   - [Azure Portal - App Registrations](https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade)
   - Ou: Azure Portal → **Microsoft Entra ID** → **App registrations**

2. **Selecione seu aplicativo** (Mova+)

3. **Vá em "Authentication"** (no menu lateral)
   - Você verá a página "Configuração do URI de redirecionamento"

4. **Role a página para baixo** ou clique na aba **"Configurações"** (Settings)
   - Procure por **"Tipos de conta com suporte"** ou **"Supported account types"**

5. **Clique em "Editar"** (Edit) ao lado de "Supported account types"

6. **Selecione uma das opções:**
   - ✅ **"Contas em qualquer diretório organizacional e contas pessoais da Microsoft"** (Recomendado)
   - ✅ **"Apenas contas pessoais da Microsoft"**
   - ❌ **NÃO selecione**: "Apenas contas neste diretório organizacional"

7. **Clique em "Salvar"** (Save)

8. **Na mesma página, role para baixo** até encontrar **"Fluxos de cliente público"** ou **"Allow public client flows"**
   - Ative o toggle **"Permitir fluxos de cliente público"** (Allow public client flows)
   - ⚠️ **Isso é necessário para OAuth funcionar!**

9. **Clique em "Salvar"** (Save) novamente

10. **Aguarde 2-5 minutos** para as mudanças propagarem

11. **Teste novamente** o login com Azure

---

## 🔍 Verificar se Está Correto

Após salvar, verifique:

1. Vá em **Authentication** → **Supported account types**
2. Deve mostrar:
   - ✅ "Accounts in any organizational directory and personal Microsoft accounts"
   - OU
   - ✅ "Personal Microsoft accounts only"

---

## ⚠️ Se Ainda Não Funcionar

### Verificar Redirect URIs:

1. Na mesma página **Authentication**
2. Em **"Redirect URIs"**, verifique se tem:
   ```
   https://[seu-projeto].supabase.co/auth/v1/callback
   http://localhost:3000/auth/callback
   https://movamais.fit/auth/callback
   ```

### Verificar Permissões:

1. Vá em **API permissions**
2. Verifique se tem:
   - ✅ `email`
   - ✅ `openid`
   - ✅ `profile`
   - ✅ `User.Read`
3. Clique em **"Grant admin consent"** (se necessário)

---

## 📝 Resumo

**O que fazer:**

1. Azure Portal → Seu App → Authentication
2. Editar "Supported account types"
3. Selecionar opção que permite contas pessoais
4. Salvar e aguardar alguns minutos

**Por que acontece:**

- O app foi criado apenas para contas organizacionais
- Precisa permitir contas pessoais da Microsoft também

---

**Pronto!** Após essas configurações, o login com Azure deve funcionar! 🎉
