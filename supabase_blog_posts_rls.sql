-- Políticas RLS para a tabela blog_posts
-- Este arquivo configura as permissões para que admins possam criar, editar e deletar posts

-- Habilitar RLS na tabela blog_posts (se ainda não estiver habilitado)
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Função auxiliar para verificar se o usuário é admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = user_id AND admin = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- POLÍTICA 1: SELECT - Qualquer um pode ler posts publicados
-- Posts não publicados só podem ser vistos por admins
CREATE POLICY "Qualquer um pode ler posts publicados"
  ON blog_posts FOR SELECT
  USING (
    published_at IS NOT NULL 
    AND published_at <= NOW()
    OR (
      -- Admins podem ver todos os posts
      EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() AND admin = TRUE
      )
    )
  );

-- POLÍTICA 2: INSERT - Apenas admins podem criar posts
CREATE POLICY "Apenas admins podem criar posts"
  ON blog_posts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND admin = TRUE
    )
  );

-- POLÍTICA 3: UPDATE - Apenas admins podem editar posts
CREATE POLICY "Apenas admins podem editar posts"
  ON blog_posts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND admin = TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND admin = TRUE
    )
  );

-- POLÍTICA 4: DELETE - Apenas admins podem deletar posts
CREATE POLICY "Apenas admins podem deletar posts"
  ON blog_posts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND admin = TRUE
    )
  );

-- Nota: Se você já tem políticas RLS, pode ser necessário removê-las primeiro:
-- DROP POLICY IF EXISTS "nome_da_politica" ON blog_posts;

