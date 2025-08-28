-- Script para diagnosticar e corrigir erro 500 no cadastro (step1)
-- Execute no Supabase SQL Editor

-- 1. Verificar se a tabela users existe
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'users'
) as users_table_exists;

-- 2. Verificar estrutura da tabela users (se existir)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Criar tabela users se não existir
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Verificar e configurar RLS
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'users';

-- 5. Configurar RLS se necessário
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 6. Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;

-- 7. Criar políticas corretas
CREATE POLICY "Users can view their own data" 
ON public.users FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own data" 
ON public.users FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own data" 
ON public.users FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 8. Criar função para auto-atualizar updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Criar trigger para updated_at
DROP TRIGGER IF EXISTS handle_users_updated_at ON public.users;
CREATE TRIGGER handle_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 10. Verificar se tudo foi criado corretamente
SELECT 'Tabela users configurada com sucesso!' as result;

-- 11. Testar inserção (opcional - apenas para verificar se funcionará)
-- Descomente a linha abaixo se quiser testar (substitua o UUID por um real)
-- INSERT INTO public.users (id, email, full_name) VALUES ('test-uuid', 'test@example.com', 'Test User');
