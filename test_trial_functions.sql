-- Script para testar as funções do novo sistema de trial

-- 1. Testar usuário novo (que não tem registro na tabela)
SELECT 'TESTE 1: Usuário novo (sem registro)' as test_name;
SELECT get_trial_status_new('00000000-0000-0000-0000-000000000001'::uuid) as result;

-- 2. Testar usuário que nunca gerou plano (tem registro mas plans_generated = 0)
SELECT 'TESTE 2: Usuário com registro mas nunca gerou plano' as test_name;

-- Criar um registro de teste
INSERT INTO user_trials (user_id, plans_generated, last_plan_generated_at)
VALUES ('00000000-0000-0000-0000-000000000002'::uuid, 0, NULL)
ON CONFLICT (user_id) DO UPDATE SET 
    plans_generated = 0, 
    last_plan_generated_at = NULL;

SELECT get_trial_status_new('00000000-0000-0000-0000-000000000002'::uuid) as result;

-- 3. Testar usuário que já gerou 1 plano (deve estar bloqueado)
SELECT 'TESTE 3: Usuário que já gerou 1 plano' as test_name;

-- Criar um registro de teste
INSERT INTO user_trials (user_id, plans_generated, last_plan_generated_at)
VALUES ('00000000-0000-0000-0000-000000000003'::uuid, 1, NOW())
ON CONFLICT (user_id) DO UPDATE SET 
    plans_generated = 1, 
    last_plan_generated_at = NOW();

SELECT get_trial_status_new('00000000-0000-0000-0000-000000000003'::uuid) as result;

-- 4. Testar usuário premium novo (sem ciclo iniciado)
SELECT 'TESTE 4: Usuário premium novo' as test_name;

-- Criar um registro premium
INSERT INTO user_trials (user_id, upgraded_to_premium, premium_plan_cycle_start, premium_plan_count)
VALUES ('00000000-0000-0000-0000-000000000004'::uuid, true, NULL, 0)
ON CONFLICT (user_id) DO UPDATE SET 
    upgraded_to_premium = true, 
    premium_plan_cycle_start = NULL, 
    premium_plan_count = 0;

SELECT get_trial_status_new('00000000-0000-0000-0000-000000000004'::uuid) as result;

-- 5. Testar usuário premium com 1 plano usado no ciclo
SELECT 'TESTE 5: Usuário premium com 1 plano usado' as test_name;

-- Criar um registro premium com ciclo ativo
INSERT INTO user_trials (user_id, upgraded_to_premium, premium_plan_cycle_start, premium_plan_count, premium_max_plans_per_cycle, premium_cycle_days)
VALUES ('00000000-0000-0000-0000-000000000005'::uuid, true, NOW() - INTERVAL '10 days', 1, 2, 30)
ON CONFLICT (user_id) DO UPDATE SET 
    upgraded_to_premium = true, 
    premium_plan_cycle_start = NOW() - INTERVAL '10 days', 
    premium_plan_count = 1,
    premium_max_plans_per_cycle = 2,
    premium_cycle_days = 30;

SELECT get_trial_status_new('00000000-0000-0000-0000-000000000005'::uuid) as result;

-- 6. Testar usuário premium com 2 planos usados (ciclo esgotado)
SELECT 'TESTE 6: Usuário premium com ciclo esgotado' as test_name;

-- Criar um registro premium com ciclo esgotado
INSERT INTO user_trials (user_id, upgraded_to_premium, premium_plan_cycle_start, premium_plan_count, premium_max_plans_per_cycle, premium_cycle_days)
VALUES ('00000000-0000-0000-0000-000000000006'::uuid, true, NOW() - INTERVAL '10 days', 2, 2, 30)
ON CONFLICT (user_id) DO UPDATE SET 
    upgraded_to_premium = true, 
    premium_plan_cycle_start = NOW() - INTERVAL '10 days', 
    premium_plan_count = 2,
    premium_max_plans_per_cycle = 2,
    premium_cycle_days = 30;

SELECT get_trial_status_new('00000000-0000-0000-0000-000000000006'::uuid) as result;

-- 7. Testar usuário premium com ciclo expirado (deve resetar)
SELECT 'TESTE 7: Usuário premium com ciclo expirado' as test_name;

-- Criar um registro premium com ciclo expirado
INSERT INTO user_trials (user_id, upgraded_to_premium, premium_plan_cycle_start, premium_plan_count, premium_max_plans_per_cycle, premium_cycle_days)
VALUES ('00000000-0000-0000-0000-000000000007'::uuid, true, NOW() - INTERVAL '35 days', 2, 2, 30)
ON CONFLICT (user_id) DO UPDATE SET 
    upgraded_to_premium = true, 
    premium_plan_cycle_start = NOW() - INTERVAL '35 days', 
    premium_plan_count = 2,
    premium_max_plans_per_cycle = 2,
    premium_cycle_days = 30;

SELECT get_trial_status_new('00000000-0000-0000-0000-000000000007'::uuid) as result;

-- 8. Limpeza - remover registros de teste (opcional)
-- DELETE FROM user_trials WHERE user_id IN (
--     '00000000-0000-0000-0000-000000000002'::uuid,
--     '00000000-0000-0000-0000-000000000003'::uuid,
--     '00000000-0000-0000-0000-000000000004'::uuid,
--     '00000000-0000-0000-0000-000000000005'::uuid,
--     '00000000-0000-0000-0000-000000000006'::uuid,
--     '00000000-0000-0000-0000-000000000007'::uuid
-- );

SELECT 'Testes concluídos!' as final_message;
