-- Migração para corrigir tipos de peso e altura na tabela user_profiles
-- Execute este SQL no seu projeto Supabase

-- 1. Alterar o tipo da coluna weight para DECIMAL(5,2)
-- Permite valores como 999.99 kg
ALTER TABLE user_profiles 
ALTER COLUMN weight TYPE DECIMAL(5,2);

-- 2. Alterar o tipo da coluna initial_weight para DECIMAL(5,2)
ALTER TABLE user_profiles 
ALTER COLUMN initial_weight TYPE DECIMAL(5,2);

-- 3. Alterar o tipo da coluna height para DECIMAL(5,1) 
-- Permite valores como 999.9 cm (ex: 175.5 cm)
ALTER TABLE user_profiles 
ALTER COLUMN height TYPE DECIMAL(5,1);

-- 4. Verificar as alterações
SELECT column_name, data_type, numeric_precision, numeric_scale 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name IN ('weight', 'initial_weight', 'height');
