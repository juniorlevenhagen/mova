-- Simplificar completamente a lógica de geração de planos
-- Permitir apenas 1 plano por usuário, sem complicações

-- 1. Resetar o usuário atual para permitir gerar 1 plano
UPDATE user_trials 
SET 
    plans_generated = 0,
    last_plan_generated_at = NULL,
    premium_plan_count = 0,
    premium_plan_cycle_start = NULL,
    is_active = true,
    upgraded_to_premium = false
WHERE user_id = '750a6804-fbcb-4fee-8c5e-2b1facc52ca3';

-- 2. Criar função SUPER SIMPLES que sempre permite 1 plano por usuário
CREATE OR REPLACE FUNCTION get_trial_status_simple(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
    trial_record user_trials%ROWTYPE;
    has_generated_plan BOOLEAN;
BEGIN
    -- Buscar registro do trial
    SELECT * INTO trial_record
    FROM user_trials 
    WHERE user_id = user_uuid;
    
    -- Se não tem trial (usuário novo), sempre pode gerar
    IF NOT FOUND THEN
        RETURN json_build_object(
            'isNewUser', true,
            'canGenerate', true,
            'plansRemaining', 1,
            'isPremium', false,
            'hasUsedFreePlan', false,
            'message', 'Você pode gerar 1 plano grátis!'
        );
    END IF;
    
    -- Verificar se já gerou plano (lógica simples)
    has_generated_plan := COALESCE(trial_record.plans_generated, 0) > 0 
                         AND trial_record.last_plan_generated_at IS NOT NULL;
    
    -- LÓGICA SUPER SIMPLES: 1 plano por usuário, sem complicação
    RETURN json_build_object(
        'isNewUser', false,
        'canGenerate', NOT has_generated_plan,
        'plansRemaining', CASE WHEN has_generated_plan THEN 0 ELSE 1 END,
        'isPremium', false,  -- Sempre false por enquanto
        'hasUsedFreePlan', has_generated_plan,
        'message', CASE 
            WHEN has_generated_plan THEN 'Você já usou seu plano gratuito.'
            ELSE 'Você pode gerar 1 plano grátis!'
        END
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Criar função SUPER SIMPLES para atualizar após gerar plano
CREATE OR REPLACE FUNCTION update_plan_generated_simple(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
    -- Inserir ou atualizar para marcar que o usuário gerou 1 plano
    INSERT INTO user_trials (user_id, plans_generated, last_plan_generated_at, is_active)
    VALUES (user_uuid, 1, NOW(), true)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        plans_generated = 1,
        last_plan_generated_at = NOW(),
        is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Testar as funções simples
SELECT 'TESTE FUNÇÃO SIMPLES' as section;
SELECT get_trial_status_simple('750a6804-fbcb-4fee-8c5e-2b1facc52ca3'::uuid) as simple_status;

-- 5. Verificar dados finais
SELECT 'DADOS FINAIS' as section;
SELECT * FROM user_trials WHERE user_id = '750a6804-fbcb-4fee-8c5e-2b1facc52ca3';

SELECT 'LÓGICA SIMPLIFICADA APLICADA!' as resultado;
