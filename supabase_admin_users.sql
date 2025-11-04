-- Criar tabela de administradores
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'editor' CHECK (role IN ('admin', 'editor')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id),
  UNIQUE(email)
);

-- Índice para busca rápida
CREATE INDEX idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX idx_admin_users_email ON admin_users(email);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_admin_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_users_updated_at();

-- RLS (Row Level Security)
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Apenas usuários autenticados podem ver a tabela (para verificação)
CREATE POLICY "Usuários autenticados podem ver admins"
  ON admin_users FOR SELECT
  USING (auth.role() = 'authenticated');

-- Exemplo: Adicionar um usuário como admin (substitua o email pelo seu)
-- INSERT INTO admin_users (user_id, email, role)
-- SELECT id, email, 'admin'
-- FROM auth.users
-- WHERE email = 'seu-email@exemplo.com';

