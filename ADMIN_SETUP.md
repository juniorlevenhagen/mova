# Sistema de Administração do Blog - Versão Simplificada

## Configuração Inicial

### 1. Adicionar coluna `admin` na tabela `users`

Execute o SQL do arquivo `supabase_add_admin_column.sql` no SQL Editor do Supabase Dashboard.

```sql
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS admin BOOLEAN DEFAULT FALSE;
```

### 2. Tornar um usuário admin

No SQL Editor do Supabase, execute:

```sql
-- Substitua 'seu-email@exemplo.com' pelo email do usuário que você quer tornar admin
UPDATE users SET admin = TRUE WHERE email = 'seu-email@exemplo.com';
```

**Nota:** O usuário precisa existir primeiro na tabela `users` (ou seja, precisa ter feito login pelo menos uma vez).

## Como Funciona

1. **Middleware** (`middleware.ts`): Protege rotas `/admin/*` exigindo autenticação
2. **AdminProtectedRoute** (`src/components/AdminProtectedRoute.tsx`): Verifica se o usuário tem `admin = TRUE` na tabela `users`
3. **useAdminAuth** (`src/hooks/useAdminAuth.ts`): Hook que verifica o campo `admin` do usuário atual

## Páginas Protegidas

- `/admin/blog` - Listagem de posts
- `/admin/blog/new` - Criar novo post
- `/admin/blog/[slug]/edit` - Editar post existente

## Gerenciar Administradores

### Tornar um usuário admin

```sql
UPDATE users SET admin = TRUE WHERE email = 'email-do-usuario@exemplo.com';
```

### Remover admin de um usuário

```sql
UPDATE users SET admin = FALSE WHERE email = 'email-do-usuario@exemplo.com';
```

### Listar todos os administradores

```sql
SELECT id, email, full_name, admin, created_at 
FROM users 
WHERE admin = TRUE;
```

### Verificar se um usuário é admin

```sql
SELECT admin FROM users WHERE email = 'email-do-usuario@exemplo.com';
```

## Via Table Editor (Interface Gráfica)

1. Acesse o Supabase Dashboard
2. Vá para Table Editor > `users`
3. Encontre o usuário pelo email
4. Clique na linha do usuário
5. Marque/desmarque a coluna `admin` (TRUE/FALSE)
6. Clique em "Save"

## Troubleshooting

### Usuário não consegue acessar `/admin/blog`

1. Verifique se o usuário está autenticado (pode acessar `/dashboard`)
2. Verifique se o campo `admin` está como `TRUE`:
   ```sql
   SELECT id, email, admin FROM users WHERE email = 'email-do-usuario@exemplo.com';
   ```
3. Se `admin` for `NULL` ou `FALSE`, atualize:
   ```sql
   UPDATE users SET admin = TRUE WHERE email = 'email-do-usuario@exemplo.com';
   ```

### Erro: "column users.admin does not exist"

Execute o SQL do arquivo `supabase_add_admin_column.sql` novamente no SQL Editor.

## Vantagens desta Abordagem

✅ **Simples**: Apenas uma coluna boolean na tabela `users`  
✅ **Rápido**: Uma única query verifica se é admin  
✅ **Fácil de gerenciar**: Pode ser feito via Table Editor do Supabase  
✅ **Menos código**: Não precisa de tabela separada ou lógica complexa  
✅ **Escalável**: Se precisar de roles no futuro, pode adicionar outra coluna
