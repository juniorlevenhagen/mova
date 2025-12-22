# 🧪 Como Testar OAuth Azure Após Modificações

## ⏱️ Tempo de Propagação

### Mudanças no Supabase:
- ✅ **Client ID e Client Secret**: Atualizam **quase instantaneamente** (segundos)
- ⚠️ **Pode levar até 1-2 minutos** em casos raros

### Mudanças no Azure Portal:
- ⚠️ **Pode levar 2-5 minutos** para propagar
- ⚠️ **Até 10 minutos** em casos extremos

## ✅ Teste Imediato

Você pode testar **agora mesmo**:

1. **Acesse**: `https://movamais.fit/auth/login`
2. **Clique em**: "Continuar com Azure"
3. **Tente fazer login**

### Se funcionar:
✅ **Pronto!** As mudanças já foram aplicadas.

### Se não funcionar:
1. **Aguarde 2-3 minutos**
2. **Limpe o cache do navegador** (Ctrl+Shift+Delete)
3. **Tente novamente**

## 🔍 Verificar se Está Correto

### No Supabase:
1. Supabase Dashboard → Authentication → Providers → Azure
2. Verifique se:
   - ✅ Provider está **ativado**
   - ✅ Client ID está correto (começa com `a6b6b1fb-...`)
   - ✅ Client Secret está preenchido (não está vazio)

### No Azure Portal:
1. Azure Portal → App Registrations → Seu App (Mova+)
2. **Overview** → Copie o **Application (client) ID**
3. Compare com o Client ID no Supabase
4. **Certificates & secrets** → Verifique se o secret mais recente está ativo

## 🆘 Se Ainda Não Funcionar

### Verificar Erros:

1. **Abra o DevTools** (F12) no navegador
2. Vá na aba **Console**
3. Tente fazer login com Azure
4. Veja se há erros no console

### Erros Comuns:

**"invalid_client"**
- Client ID ou Secret incorretos
- Verifique se copiou corretamente (sem espaços)

**"unauthorized_client"**
- App não está configurado para contas pessoais
- Verifique "Supported account types" no Azure

**"redirect_uri_mismatch"**
- URL de callback não está no Azure
- Adicione todas as URLs nas Redirect URIs

## 📝 Checklist Rápido

- [ ] Client ID correto no Supabase
- [ ] Client Secret correto no Supabase
- [ ] Provider Azure ativado no Supabase
- [ ] Aguardou 1-2 minutos após modificar
- [ ] Testou o login
- [ ] Verificou erros no console (se não funcionou)

---

**Dica**: Geralmente funciona em **menos de 1 minuto** após modificar no Supabase! 🚀

