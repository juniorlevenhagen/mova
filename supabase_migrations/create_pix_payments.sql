-- Tabela para armazenar pagamentos PIX via Mercado Pago
-- Permite rastrear pagamentos, QR codes e status

CREATE TABLE IF NOT EXISTS pix_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mercado_pago_payment_id TEXT NOT NULL UNIQUE,
  purchase_type TEXT NOT NULL CHECK (purchase_type IN ('prompt_single', 'prompt_triple')),
  prompts_amount INTEGER NOT NULL CHECK (prompts_amount > 0),
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'BRL',
  qr_code TEXT, -- QR Code em base64 ou string (pode ser null temporariamente)
  qr_code_base64 TEXT, -- QR Code em base64 para exibição
  pix_code TEXT, -- Código PIX copia e cola
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'expired')),
  mercado_pago_status TEXT, -- Status retornado pelo Mercado Pago
  payment_method_id TEXT, -- ID do método de pagamento do Mercado Pago
  point_of_interaction JSONB, -- Dados do ponto de interação (QR code, etc)
  metadata JSONB, -- Metadados adicionais do Mercado Pago
  expires_at TIMESTAMPTZ NOT NULL, -- Quando o QR code expira
  paid_at TIMESTAMPTZ, -- Quando o pagamento foi aprovado
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para melhorar performance de consultas
CREATE INDEX IF NOT EXISTS idx_pix_payments_user_id ON pix_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_pix_payments_status ON pix_payments(status);
CREATE INDEX IF NOT EXISTS idx_pix_payments_mercado_pago_payment_id ON pix_payments(mercado_pago_payment_id);
CREATE INDEX IF NOT EXISTS idx_pix_payments_created_at ON pix_payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pix_payments_expires_at ON pix_payments(expires_at) WHERE status = 'pending';

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_pix_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_pix_payments_updated_at
  BEFORE UPDATE ON pix_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_pix_payments_updated_at();

-- Habilitar RLS (Row Level Security)
ALTER TABLE pix_payments ENABLE ROW LEVEL SECURITY;

-- POLÍTICA 1: SELECT - Usuários só podem ver seus próprios pagamentos
CREATE POLICY "Usuários podem ver seus próprios pagamentos PIX"
  ON pix_payments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- POLÍTICA 2: INSERT - Usuários podem criar seus próprios pagamentos
CREATE POLICY "Usuários podem criar seus próprios pagamentos PIX"
  ON pix_payments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- POLÍTICA 3: UPDATE - Usuários podem atualizar seus próprios pagamentos pendentes
-- (embora na prática, apenas webhooks devem atualizar)
CREATE POLICY "Webhooks podem atualizar pagamentos PIX"
  ON pix_payments
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Comentários para documentação
COMMENT ON TABLE pix_payments IS 'Armazena pagamentos PIX processados via Mercado Pago';
COMMENT ON COLUMN pix_payments.mercado_pago_payment_id IS 'ID único do pagamento no Mercado Pago';
COMMENT ON COLUMN pix_payments.qr_code IS 'QR Code do PIX para pagamento';
COMMENT ON COLUMN pix_payments.qr_code_base64 IS 'QR Code em base64 para exibição na UI';
COMMENT ON COLUMN pix_payments.pix_code IS 'Código PIX copia e cola';
COMMENT ON COLUMN pix_payments.status IS 'Status do pagamento: pending, approved, rejected, cancelled, expired';
COMMENT ON COLUMN pix_payments.expires_at IS 'Data de expiração do QR Code PIX';

