# 🔧 Como Corrigir o Nome que Aparece no OAuth

Quando você faz login com Google/Azure/Facebook, está aparecendo:

```
Prosseguir para ictlvqhrnhjxnhrwhfaq.supabase.co
```

Ao invés de:

```
Prosseguir para Mova+
```

## ✅ Solução: Configurar Site URL no Supabase

### Passo a Passo:

1. **Acesse o Supabase Dashboard**
   - [https://app.supabase.com](https://app.supabase.com)
   - Selecione seu projeto

2. **Vá em Authentication → URL Configuration**
   - Menu lateral: **Authentication** → **URL Configuration**

3. **Configure o Site URL:**
   - **Site URL**: `https://movamais.fit` (ou `http://localhost:3000` para desenvolvimento)
   - ⚠️ **IMPORTANTE**: Este campo deve estar preenchido! É ele que define qual URL aparece na tela do Google
   - Se estiver vazio, o Google mostrará o subdomínio do Supabase

4. **Adicione Redirect URLs:**
   Você precisa adicionar **TODAS** estas URLs:

   ```
   http://localhost:3000/auth/callback
   https://movamais.fit/auth/callback
   https://ictlvqhrnhjxnhrwhfaq.supabase.co/auth/v1/callback
   ```

   ⚠️ **A URL do Supabase é obrigatória!** O fluxo funciona assim:
   1. Google autentica → redireciona para Supabase
   2. Supabase processa → redireciona para sua aplicação

5. **Clique em "Save"**

### ⚠️ Importante:

- O **Site URL** é o que aparece na tela de consentimento do Google
- Use seu domínio de produção (`https://movamais.fit`) para que apareça "Mova+" ou "movamais.fit"
- Para desenvolvimento, use `http://localhost:3000`

### 🎯 Resultado Esperado:

Após configurar, quando o usuário clicar em "Continuar com Google", verá:

```
Escolha uma conta
Prosseguir para movamais.fit
```

Ou, se configurado corretamente no Google Cloud Console:

```
Escolha uma conta
Prosseguir para Mova+
```

---

## 📝 Configuração Adicional no Google Cloud Console

Para garantir que apareça "Mova+" no Google:

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Vá em **APIs e serviços** → **Tela de consentimento OAuth**
3. Verifique se o **Nome do app** está como **"Mova+"**
4. Adicione um **Logo do aplicativo** (opcional, mas recomendado)
5. Salve as alterações

---

## ✅ Checklist

- [ ] Site URL configurado no Supabase (`https://movamais.fit`)
- [ ] Redirect URLs adicionadas no Supabase
- [ ] Nome do app configurado no Google Cloud Console como "Mova+"
- [ ] Testado o login e verificado que aparece o nome correto

---

**Pronto!** Após essas configurações, o nome correto aparecerá na tela de OAuth! 🎉
