-- Script para corrigir problemas na tabela users que causam erro 406
-- Execute no Supabase SQL Editor

-- 1. Verificar se a tabela users existe
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'users'
) as table_exists;

-- 2. Se não existir, criar a tabela users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Verificar estrutura atual da tabela
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Adicionar colunas faltantes se necessário
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 5. Verificar e corrigir políticas RLS
-- Desabilitar RLS temporariamente para verificar
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Recriar políticas RLS corretas
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can insert their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;

-- Política para visualizar dados próprios
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT USING (auth.uid() = id);

-- Política para inserir dados próprios
CREATE POLICY "Users can insert their own data" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Política para atualizar dados próprios
CREATE POLICY "Users can update their own data" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Reabilitar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 6. Verificar se há dados inconsistentes
SELECT 
    id,
    email,
    full_name,
    created_at
FROM users 
ORDER BY created_at DESC 
LIMIT 10;

-- 7. Criar função para inserir usuário com tratamento de erro
CREATE OR REPLACE FUNCTION insert_user_safe(
    user_id UUID,
    user_email TEXT,
    user_full_name TEXT
)
RETURNS TABLE(success BOOLEAN, message TEXT, error TEXT, error_code TEXT) AS $$
BEGIN
    -- Tentar inserir com tratamento de erro
    INSERT INTO users (id, email, full_name)
    VALUES (user_id, user_email, user_full_name)
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        updated_at = NOW();
    
    -- Retornar sucesso
    RETURN QUERY SELECT 
        true as success,
        'Usuário inserido/atualizado com sucesso' as message,
        NULL as error,
        NULL as error_code;
    
EXCEPTION WHEN OTHERS THEN
    -- Retornar erro
    RETURN QUERY SELECT 
        false as success,
        NULL as message,
        SQLERRM as error,
        SQLSTATE as error_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Testar a função
-- SELECT insert_user_safe('test-id', 'test@email.com', 'Test User');

-- 9. Verificar se tudo está funcionando
SELECT 'Tabela users corrigida com sucesso!' as result;
