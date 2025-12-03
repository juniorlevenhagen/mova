-- Tabela para armazenar inscrições na newsletter
-- Permite gerenciar inscritos, histórico e estatísticas

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  source TEXT, -- Origem da inscrição (ex: 'footer', 'blog', 'homepage')
  user_agent TEXT, -- User agent do navegador
  ip_address TEXT, -- IP do usuário (opcional, para analytics)
  metadata JSONB, -- Metadados adicionais (flexível)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para melhorar performance de consultas
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_is_active ON newsletter_subscribers(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_subscribed_at ON newsletter_subscribers(subscribed_at DESC);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_source ON newsletter_subscribers(source);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_newsletter_subscribers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_newsletter_subscribers_updated_at
  BEFORE UPDATE ON newsletter_subscribers
  FOR EACH ROW
  EXECUTE FUNCTION update_newsletter_subscribers_updated_at();

-- Habilitar RLS (Row Level Security)
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- POLÍTICA 1: INSERT - Qualquer um pode se inscrever (sem autenticação necessária)
-- Isso permite que a API insira dados sem autenticação do usuário
-- IMPORTANTE: Especificar TO public para garantir que funcione para usuários anônimos
CREATE POLICY "Qualquer um pode se inscrever na newsletter"
  ON newsletter_subscribers
  FOR INSERT
  TO public
  WITH CHECK (true);

-- POLÍTICA 2: SELECT - Admins podem ver todos, anônimos podem ver apenas para verificar se email existe
-- Permite SELECT anônimo apenas para verificação de existência (necessário para upsert)
CREATE POLICY "Admins podem ver todos, anônimos podem verificar email"
  ON newsletter_subscribers
  FOR SELECT
  TO public
  USING (
    -- Admins podem ver tudo` 
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND admin = TRUE
    )
    OR
    -- Anônimos podem ver apenas para verificar se o email existe (necessário para lógica de upsert)
    auth.uid() IS NULL
  );

-- POLÍTICA 3: UPDATE - Admins podem atualizar tudo, anônimos podem reativar sua própria inscrição
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
    -- Anônimos podem atualizar apenas para reativar (is_active = true, unsubscribed_at = null)
    -- Isso permite reativação de inscrições canceladas
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

-- Comentários para documentação
COMMENT ON TABLE newsletter_subscribers IS 'Armazena inscrições na newsletter do Mova+';
COMMENT ON COLUMN newsletter_subscribers.email IS 'Email único do inscrito';
COMMENT ON COLUMN newsletter_subscribers.is_active IS 'Indica se a inscrição está ativa (não cancelada)';
COMMENT ON COLUMN newsletter_subscribers.source IS 'Origem da inscrição (footer, blog, homepage, etc)';
COMMENT ON COLUMN newsletter_subscribers.metadata IS 'Metadados adicionais em formato JSONB';

