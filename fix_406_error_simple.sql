-- Script simples para corrigir erro 406
-- Execute no Supabase SQL Editor

-- 1. Criar tabela users se não existir
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Configurar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 3. Criar políticas RLS
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can insert their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;

CREATE POLICY "Users can view their own data" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own data" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON users
    FOR UPDATE USING (auth.uid() = id);

-- 4. Criar função corrigida (sem JSON)
CREATE OR REPLACE FUNCTION insert_user_safe(
    user_id UUID,
    user_email TEXT,
    user_full_name TEXT
)
RETURNS TABLE(success BOOLEAN, message TEXT, error TEXT, error_code TEXT) AS $$
BEGIN
    -- Tentar inserir
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

-- 5. Verificar se funcionou
SELECT 'Script executado com sucesso!' as status;

