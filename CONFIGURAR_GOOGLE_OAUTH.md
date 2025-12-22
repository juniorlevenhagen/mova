# 🔐 Como Configurar Login com Google (OAuth)

Este guia mostra como obter os **Client IDs** do Google e configurar o login com Google no Supabase.

---

## 📋 Passo a Passo Completo

### 1️⃣ Criar/Selecionar Projeto no Google Cloud Console

1. Acesse: [Google Cloud Console](https://console.cloud.google.com/)
2. Faça login com sua conta Google
3. No topo, clique no seletor de projetos
4. Clique em **"Novo Projeto"** (ou selecione um existente)
   - **Nome do projeto**: `Mova+` (ou outro nome de sua escolha)
   - Clique em **"Criar"**

---

### 2️⃣ Configurar Tela de Consentimento OAuth

1. No menu lateral, vá em **"APIs e serviços"** → **"Tela de consentimento OAuth"**
2. Selecione **"Externo"** (ou "Interno" se você usa Google Workspace)
3. Clique em **"Criar"**

#### Preencha as informações:

**Informações do aplicativo:**
- **Nome do app**: `Mova+`
- **Email de suporte do usuário**: Seu email
- **Email de contato do desenvolvedor**: Seu email
- **Logo do aplicativo**: (Opcional - pode adicionar depois)

Clique em **"Salvar e continuar"**

**Escopos:**
- Clique em **"Adicionar ou remover escopos"**
- Selecione:
  - ✅ `email`
  - ✅ `profile`
  - ✅ `openid`
- Clique em **"Atualizar"** → **"Salvar e continuar"**

**Usuários de teste:**
- Adicione emails de teste (opcional para desenvolvimento)
- Clique em **"Salvar e continuar"**

**Resumo:**
- Revise as informações
- Clique em **"Voltar ao painel"**

---

### 3️⃣ Criar Credenciais OAuth 2.0

1. No menu lateral, vá em **"APIs e serviços"** → **"Credenciais"**
2. Clique em **"+ Criar credenciais"** → **"ID do cliente OAuth"**

#### Configurações:

**Tipo de aplicativo:**
- Selecione **"Aplicativo da Web"**

**Nome:**
- `Mova+ Web Client` (ou outro nome)

**URIs de redirecionamento autorizados:**
Adicione as seguintes URLs (uma por linha):

```
http://localhost:3000/auth/callback
https://[seu-projeto].supabase.co/auth/v1/callback
```

**Importante:**
- **NÃO use o código da URL do dashboard** (ex: `ictlvqhrnhjxnhrwhfaq`)
- Use o **subdomínio completo** do seu projeto Supabase
- **Como encontrar**: Supabase Dashboard → **Settings** → **API** → Copie a **"Project URL"**
- Exemplo: Se a Project URL for `https://abcdefghijklmnop.supabase.co`, use: `https://abcdefghijklmnop.supabase.co/auth/v1/callback`
- Para produção, adicione também: `https://seu-dominio.com/auth/callback`

3. Clique em **"Criar"**

---

### 4️⃣ Copiar Client ID e Client Secret

Após criar, você verá uma tela com:

- ✅ **ID do cliente**: `123456789-abcdefghijklmnop.apps.googleusercontent.com`
- ✅ **Segredo do cliente**: `GOCSPX-abcdefghijklmnopqrstuvwxyz`

**⚠️ IMPORTANTE:**
- Copie **AMBOS** os valores
- O **Client Secret** só aparece uma vez! Anote-o com cuidado
- Se perder, você precisará criar novas credenciais

---

### 5️⃣ Configurar no Supabase

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **"Authentication"** → **"Providers"**
4. Encontre **"Google"** na lista
5. Clique para **ativar** o provider
6. Preencha:
   - **Client ID (for Google OAuth)**: Cole o **Client ID** do Google
   - **Client Secret (for Google OAuth)**: Cole o **Client Secret** do Google
7. Clique em **"Save"**

**✅ Pronto!** O Google OAuth está configurado no Supabase.

---

### 6️⃣ Adicionar URI de Redirecionamento no Google (Importante!)

Após configurar no Supabase, você precisa adicionar a URL de callback do Supabase:

1. Volte ao [Google Cloud Console](https://console.cloud.google.com/)
2. Vá em **"APIs e serviços"** → **"Credenciais"**
3. Clique no **Client ID** que você criou
4. Em **"URIs de redirecionamento autorizados"**, adicione:
   ```
   https://[seu-projeto].supabase.co/auth/v1/callback
   ```
5. Clique em **"Salvar"**

**Como encontrar a URL do seu projeto Supabase:**
1. No Supabase Dashboard → **Settings** (⚙️) → **API**
2. Na seção **"Project URL"**, você verá algo como: `https://abcdefghijklmnop.supabase.co`
3. Copie essa URL completa e adicione `/auth/v1/callback` no final
4. Exemplo final: `https://abcdefghijklmnop.supabase.co/auth/v1/callback`

**⚠️ Atenção:**
- **NÃO** use o código da URL do dashboard (ex: `ictlvqhrnhjxnhrwhfaq`)
- Use a **Project URL completa** que aparece em Settings → API
- Ou use o valor da variável `NEXT_PUBLIC_SUPABASE_URL` do seu `.env.local` + `/auth/v1/callback`

---

## 🎨 Implementar Botão no Código

Agora você pode adicionar o botão de login com Google no seu componente `LoginForm.tsx`:

```typescript
const handleGoogleLogin = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    console.error('Erro ao fazer login com Google:', error);
    setError('Erro ao fazer login com Google. Tente novamente.');
  }
};
```

E adicionar o botão no JSX:

```tsx
<button
  type="button"
  onClick={handleGoogleLogin}
  className="w-full flex items-center justify-center gap-3 py-3 px-4 border-2 border-gray-300 rounded-lg hover:border-black transition-colors"
>
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
  <span className="font-medium text-gray-700">Continuar com Google</span>
</button>
```

---

## 🔄 Criar Página de Callback

Crie o arquivo `src/app/auth/callback/route.ts`:

```typescript
import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL('/dashboard', request.url));
}
```

---

## ✅ Checklist de Configuração

- [ ] Projeto criado no Google Cloud Console
- [ ] Tela de consentimento OAuth configurada
- [ ] Credenciais OAuth 2.0 criadas
- [ ] Client ID e Client Secret copiados
- [ ] Provider Google ativado no Supabase
- [ ] Client ID e Secret configurados no Supabase
- [ ] URI de redirecionamento adicionada no Google Cloud Console
- [ ] Botão de login implementado no código
- [ ] Página de callback criada
- [ ] Testado em desenvolvimento

---

## 🧪 Testar

1. Inicie o servidor: `bun dev`
2. Acesse: `http://localhost:3000/auth/login`
3. Clique no botão "Continuar com Google"
4. Faça login com sua conta Google
5. Você deve ser redirecionado para `/dashboard`

---

## 🆘 Problemas Comuns

### Erro: "redirect_uri_mismatch"

**Causa**: A URI de redirecionamento não está configurada corretamente no Google.

**Solução**:
1. Verifique se adicionou `https://[seu-projeto].supabase.co/auth/v1/callback` no Google Cloud Console
2. Verifique se não há espaços ou caracteres extras
3. Certifique-se de que está usando `https://` (não `http://`)

### Erro: "invalid_client"

**Causa**: Client ID ou Client Secret incorretos no Supabase.

**Solução**:
1. Verifique se copiou corretamente do Google Cloud Console
2. Verifique se não há espaços antes/depois
3. Tente criar novas credenciais se necessário

### Erro: "access_denied"

**Causa**: Usuário cancelou o login ou não está na lista de usuários de teste.

**Solução**:
1. Adicione o email na lista de "Usuários de teste" no Google Cloud Console
2. Ou publique a tela de consentimento (após revisão do Google)

---

## 📝 Resumo

**Onde obter os Client IDs:**
1. Google Cloud Console → APIs e serviços → Credenciais
2. Criar ID do cliente OAuth 2.0
3. Copiar Client ID e Client Secret

**Onde configurar:**
1. Supabase Dashboard → Authentication → Providers → Google
2. Ativar e colar Client ID e Secret

**Pronto!** 🎉

