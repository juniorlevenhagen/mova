# 🔷 Azure Tenant URL - O que é e quando usar?

## ❓ O que é Azure Tenant URL?

A **Azure Tenant URL** é uma configuração **opcional** no Supabase que permite restringir o login Azure apenas para um tenant (organização) específico.

## ✅ Quando deixar em branco (Recomendado)

**Deixe o campo vazio** se você quer permitir:
- ✅ Contas pessoais da Microsoft (@outlook.com, @hotmail.com, etc.)
- ✅ Contas de qualquer organização (multitenant)
- ✅ Qualquer usuário com conta Microsoft

**Isso é o mais comum e recomendado para a maioria dos casos!**

## ⚠️ Quando preencher

**Preencha apenas se** você quer restringir o login para:
- ❌ Apenas uma organização específica
- ❌ Apenas contas de um tenant do Azure AD

### Como encontrar o Tenant ID:

1. **Azure Portal** → Seu App → **Overview**
2. Procure por **"Directory (tenant) ID"** ou **"ID do diretório (locatário)"**
3. Copie o ID (formato: `12345678-1234-1234-1234-123456789012`)

### Formato da URL:

```
https://login.microsoftonline.com/{tenant-id}
```

**Exemplo:**
```
https://login.microsoftonline.com/12345678-1234-1234-1234-123456789012
```

## 📝 Resumo

| Situação | Azure Tenant URL |
|----------|------------------|
| Permitir contas pessoais + organizações | **Deixe vazio** ✅ |
| Apenas uma organização específica | Preencha com a URL do tenant |

## 🎯 Para o Mova+

**Recomendação**: Deixe o campo **vazio** para permitir que qualquer pessoa com conta Microsoft possa fazer login.

---

**Pronto!** Agora você sabe quando usar o Azure Tenant URL! 🎉

