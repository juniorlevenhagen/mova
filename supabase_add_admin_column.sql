-- Adicionar coluna admin na tabela users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS admin BOOLEAN DEFAULT FALSE;

-- Criar índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_users_admin ON users(admin) WHERE admin = TRUE;

-- Exemplo: Tornar um usuário admin
-- UPDATE users SET admin = TRUE WHERE email = 'seu-email@exemplo.com';

-- Exemplo: Verificar todos os admins
-- SELECT id, email, full_name, admin FROM users WHERE admin = TRUE;

-- Exemplo: Remover admin de um usuário
-- UPDATE users SET admin = FALSE WHERE email = 'email-do-usuario@exemplo.com';

