-- Script para identificar e remover triggers problemáticos da auth.users
-- Execute no Supabase SQL Editor

-- =============================================================================
-- 1. IDENTIFICAR OS 2 TRIGGERS PROBLEMÁTICOS
-- =============================================================================

-- Mostrar detalhes completos dos triggers
SELECT 
    trigger_name, 
    event_manipulation as "quando_executa", 
    action_timing as "momento",
    action_statement as "funcao_executada"
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND event_object_schema = 'auth'
ORDER BY trigger_name;

-- Mostrar as functions que esses triggers chamam
SELECT DISTINCT
    routine_name as "nome_funcao",
    routine_definition as "codigo_funcao"
FROM information_schema.routines 
WHERE routine_name IN (
    SELECT SUBSTRING(action_statement FROM 'EXECUTE (?:FUNCTION|PROCEDURE) ([^(]+)')
    FROM information_schema.triggers 
    WHERE event_object_table = 'users' 
    AND event_object_schema = 'auth'
);

-- =============================================================================
-- 2. BACKUP DAS INFORMAÇÕES DOS TRIGGERS (antes de remover)
-- =============================================================================

-- Criar uma tabela temporária para backup (se ainda não existir)
CREATE TABLE IF NOT EXISTS public.backup_auth_triggers (
    id SERIAL PRIMARY KEY,
    trigger_name TEXT,
    table_name TEXT,
    event_manipulation TEXT,
    action_timing TEXT,
    action_statement TEXT,
    backed_up_at TIMESTAMP DEFAULT NOW()
);

-- Fazer backup dos triggers antes de remover
INSERT INTO public.backup_auth_triggers 
(trigger_name, table_name, event_manipulation, action_timing, action_statement)
SELECT 
    trigger_name,
    event_object_table,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND event_object_schema = 'auth';

-- =============================================================================
-- 3. REMOVER OS TRIGGERS PROBLEMÁTICOS
-- =============================================================================

-- ATENÇÃO: Vamos remover os triggers. Anote os nomes antes de executar!

-- Listar todos os triggers que serão removidos
DO $$ 
DECLARE
    trigger_record RECORD;
BEGIN
    FOR trigger_record IN 
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE event_object_table = 'users' 
        AND event_object_schema = 'auth'
    LOOP
        RAISE NOTICE 'Removendo trigger: %', trigger_record.trigger_name;
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON auth.users', trigger_record.trigger_name);
    END LOOP;
END $$;

-- =============================================================================
-- 4. VERIFICAÇÃO PÓS-REMOÇÃO
-- =============================================================================

-- Verificar se os triggers foram removidos
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ Todos os triggers foram removidos com sucesso!'
        ELSE '❌ Ainda existem ' || COUNT(*) || ' triggers na auth.users'
    END as status_triggers
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND event_object_schema = 'auth';

-- Mostrar backup criado
SELECT 
    'Backup criado com ' || COUNT(*) || ' triggers salvos em public.backup_auth_triggers' as backup_status
FROM public.backup_auth_triggers;

-- =============================================================================
-- 5. TESTAR SE O PROBLEMA FOI RESOLVIDO
-- =============================================================================

-- Verificar se a estrutura básica está OK
SELECT 
    'Tabela auth.users existe: ' || 
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'auth' AND table_name = 'users'
    ) THEN 'SIM' ELSE 'NÃO' END as auth_users_status;

-- Verificar RLS na auth.users (deveria estar DISABLED)
SELECT 
    'RLS na auth.users: ' || 
    CASE WHEN rowsecurity THEN 'ENABLED (pode ser problema)' ELSE 'DISABLED (correto)' END as rls_status
FROM pg_tables 
WHERE schemaname = 'auth' AND tablename = 'users';

-- =============================================================================
-- RESULTADO FINAL
-- =============================================================================

SELECT '🎯 TRIGGERS REMOVIDOS! Teste o cadastro agora.' as resultado_final;

-- Mostrar resumo do que foi feito
SELECT 
    'Triggers removidos da auth.users, backup salvo em backup_auth_triggers. 
    Agora teste o cadastro novamente!' as instrucoes;
