-- Script para corrigir as políticas RLS da tabela newsletter_subscribers
-- Execute este script se estiver tendo problemas com permissões

-- Remover políticas existentes (se houver)
DROP POLICY IF EXISTS "Qualquer um pode se inscrever na newsletter" ON newsletter_subscribers;
DROP POLICY IF EXISTS "Admins podem ver todos, anônimos podem verificar email" ON newsletter_subscribers;
DROP POLICY IF EXISTS "Admins podem atualizar tudo, anônimos podem reativar" ON newsletter_subscribers;
DROP POLICY IF EXISTS "Apenas admins podem deletar inscrições" ON newsletter_subscribers;

-- POLÍTICA 1: INSERT - Qualquer um pode se inscrever (sem autenticação necessária)
-- IMPORTANTE: Usar USING também para INSERT quando possível
CREATE POLICY "Qualquer um pode se inscrever na newsletter"
  ON newsletter_subscribers
  FOR INSERT
  TO public
  WITH CHECK (true);

-- POLÍTICA 2: SELECT - Admins podem ver todos, anônimos podem verificar email
CREATE POLICY "Admins podem ver todos, anônimos podem verificar email"
  ON newsletter_subscribers
  FOR SELECT
  TO public
  USING (
    -- Admins podem ver tudo
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND admin = TRUE
    )
    OR
    -- Anônimos podem ver (necessário para verificar se email existe)
    auth.uid() IS NULL
  );

-- POLÍTICA 3: UPDATE - Admins podem atualizar tudo, anônimos podem reativar
CREATE POLICY "Admins podem atualizar tudo, anônimos podem reativar"
  ON newsletter_subscribers
  FOR UPDATE
  TO public
  USING (
    -- Admins podem atualizar tudo
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND admin = TRUE
    )
    OR
    -- Anônimos podem atualizar (para reativar inscrições)
    auth.uid() IS NULL
  )
  WITH CHECK (
    -- Admins podem fazer qualquer update
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND admin = TRUE
    )
    OR
    -- Anônimos só podem reativar (is_active deve ser true após o update)
    (auth.uid() IS NULL AND is_active = TRUE)
  );

-- POLÍTICA 4: DELETE - Apenas admins podem deletar inscrições
CREATE POLICY "Apenas admins podem deletar inscrições"
  ON newsletter_subscribers
  FOR DELETE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND admin = TRUE
    )
  );

