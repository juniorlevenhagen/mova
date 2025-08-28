-- Adicionar coluna 'coxa' na tabela user_evolutions
ALTER TABLE user_evolutions 
ADD COLUMN coxa INTEGER DEFAULT NULL;

-- Opcional: Adicionar comentário
COMMENT ON COLUMN user_evolutions.coxa IS 'Medida da coxa em centímetros';
