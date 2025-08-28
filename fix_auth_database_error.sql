-- Script para corrigir erro "Database error saving new user"
-- Execute no Supabase SQL Editor

-- =============================================================================
-- 1. DIAGNÓSTICO - Verificar triggers e functions na auth.users
-- =============================================================================

-- Verificar triggers na tabela auth.users
SELECT 
    trigger_name, 
    event_manipulation, 
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND event_object_schema = 'auth';

-- Verificar policies na tabela auth.users (não deveria ter RLS ativo)
SELECT schemaname, tablename, policyname, roles, cmd, qual
FROM pg_policies 
WHERE schemaname = 'auth' AND tablename = 'users';

-- Verificar se RLS está ativo na auth.users (deveria estar OFF)
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'auth' AND tablename = 'users';

-- =============================================================================
-- 2. CORREÇÃO - Remover triggers problemáticos
-- =============================================================================

-- Verificar se existe trigger automático para criar usuário na tabela public.users
-- Isso é uma causa comum do erro "Database error saving new user"

-- Listar todas as functions que podem estar causando problema
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_definition ILIKE '%auth.users%'
OR routine_definition ILIKE '%users%insert%';

-- Remover triggers automáticos problemáticos (se existirem)
-- CUIDADO: Execute apenas se tiver certeza

-- Exemplo de triggers que podem causar problema:
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- DROP FUNCTION IF EXISTS public.handle_new_user();

-- =============================================================================
-- 3. VERIFICAR ESTRUTURA DA TABELA PUBLIC.USERS
-- =============================================================================

-- Verificar se existe conflito na tabela public.users
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- Verificar constraints que podem estar causando conflito
SELECT 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public' 
AND tc.table_name = 'users';

-- =============================================================================
-- 4. SOLUÇÃO TEMPORÁRIA - Desabilitar triggers automáticos
-- =============================================================================

-- Se houver trigger automático que cria usuário na public.users,
-- vamos desabilitá-lo temporariamente para permitir cadastro manual

-- Verificar functions específicas que podem estar causando problema
DO $$ 
BEGIN
    -- Verificar se existe function handle_new_user
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') THEN
        RAISE NOTICE 'Function handle_new_user encontrada - pode estar causando conflito';
    END IF;
    
    -- Verificar triggers na auth.users
    IF EXISTS (SELECT 1 FROM information_schema.triggers 
               WHERE event_object_table = 'users' 
               AND event_object_schema = 'auth') THEN
        RAISE NOTICE 'Triggers encontrados na auth.users - podem estar causando conflito';
    END IF;
END $$;

-- =============================================================================
-- 5. CRIAR ESTRUTURA CORRETA SE NECESSÁRIO
-- =============================================================================

-- Garantir que a tabela public.users existe com estrutura correta
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Configurar RLS corretamente na public.users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Remover políticas conflitantes
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;

-- Criar políticas corretas
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

-- =============================================================================
-- 6. VERIFICAÇÃO FINAL
-- =============================================================================

SELECT 'Diagnóstico completo! Verifique os resultados acima.' as status;

-- Mostrar configuração atual da auth.users
SELECT 
    'auth.users RLS status: ' || 
    CASE WHEN rowsecurity THEN 'ENABLED (PROBLEMA!)' ELSE 'DISABLED (OK)' END as auth_users_rls
FROM pg_tables 
WHERE schemaname = 'auth' AND tablename = 'users';

-- Contar triggers na auth.users
SELECT 
    'Triggers na auth.users: ' || COUNT(*) as trigger_count
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND event_object_schema = 'auth';
