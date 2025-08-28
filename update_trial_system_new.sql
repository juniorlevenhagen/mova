-- Atualizar sistema de trial para nova lógica:
-- Usuário novo: 1 plano grátis
-- Premium: 2 planos a cada 30 dias

-- Atualizar tabela user_trials para nova lógica
ALTER TABLE user_trials 
ADD COLUMN IF NOT EXISTS last_plan_generated_at TIMESTAMP WITH TIME ZONE NULL,
ADD COLUMN IF NOT EXISTS premium_plan_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS premium_plan_cycle_start TIMESTAMP WITH TIME ZONE NULL,
ADD COLUMN IF NOT EXISTS premium_max_plans_per_cycle INTEGER DEFAULT 2,
ADD COLUMN IF NOT EXISTS premium_cycle_days INTEGER DEFAULT 30;

-- Função para verificar se usuário pode gerar novo plano (nova lógica)
CREATE OR REPLACE FUNCTION can_generate_plan_new(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    trial_record user_trials%ROWTYPE;
    days_since_cycle_start INTEGER;
BEGIN
    -- Buscar registro do trial
    SELECT * INTO trial_record
    FROM user_trials 
    WHERE user_id = user_uuid;
    
    -- Se não tem trial, pode gerar (primeiro plano grátis)
    IF NOT FOUND THEN
        RETURN TRUE;
    END IF;
    
    -- Se é premium
    IF trial_record.upgraded_to_premium THEN
        -- Se não tem ciclo iniciado, pode gerar
        IF trial_record.premium_plan_cycle_start IS NULL THEN
            RETURN TRUE;
        END IF;
        
        -- Calcular dias desde início do ciclo
        days_since_cycle_start := EXTRACT(DAY FROM (NOW() - trial_record.premium_plan_cycle_start));
        
        -- Se passou o ciclo (30 dias), resetar contador
        IF days_since_cycle_start >= trial_record.premium_cycle_days THEN
            RETURN TRUE;
        END IF;
        
        -- Se ainda tem planos disponíveis no ciclo atual
        RETURN trial_record.premium_plan_count < trial_record.premium_max_plans_per_cycle;
    END IF;
    
    -- Se não é premium, só pode gerar se nunca gerou (primeiro plano grátis)
    RETURN trial_record.plans_generated = 0;
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar após gerar plano (nova lógica)
CREATE OR REPLACE FUNCTION update_plan_generated_new(user_uuid UUID)
RETURNS VOID AS $$
DECLARE
    trial_record user_trials%ROWTYPE;
    days_since_cycle_start INTEGER;
BEGIN
    -- Buscar registro do trial
    SELECT * INTO trial_record
    FROM user_trials 
    WHERE user_id = user_uuid;
    
    -- Se não existe, criar com primeiro plano
    IF NOT FOUND THEN
        INSERT INTO user_trials (user_id, last_plan_generated_at, plans_generated)
        VALUES (user_uuid, NOW(), 1);
        RETURN;
    END IF;
    
    -- Se é premium
    IF trial_record.upgraded_to_premium THEN
        -- Se não tem ciclo iniciado ou ciclo expirou, iniciar novo ciclo
        IF trial_record.premium_plan_cycle_start IS NULL 
           OR EXTRACT(DAY FROM (NOW() - trial_record.premium_plan_cycle_start)) >= trial_record.premium_cycle_days THEN
            UPDATE user_trials 
            SET last_plan_generated_at = NOW(),
                plans_generated = plans_generated + 1,
                premium_plan_cycle_start = NOW(),
                premium_plan_count = 1
            WHERE user_id = user_uuid;
        ELSE
            -- Incrementar contador do ciclo atual
            UPDATE user_trials 
            SET last_plan_generated_at = NOW(),
                plans_generated = plans_generated + 1,
                premium_plan_count = premium_plan_count + 1
            WHERE user_id = user_uuid;
        END IF;
    ELSE
        -- Usuário free, apenas incrementar
        UPDATE user_trials 
        SET last_plan_generated_at = NOW(),
            plans_generated = plans_generated + 1
        WHERE user_id = user_uuid;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Função para obter status do trial (nova lógica)
CREATE OR REPLACE FUNCTION get_trial_status_new(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
    trial_record user_trials%ROWTYPE;
    days_since_cycle_start INTEGER;
    days_until_next_cycle INTEGER;
    can_generate BOOLEAN;
    plans_remaining INTEGER;
BEGIN
    -- Buscar registro do trial
    SELECT * INTO trial_record
    FROM user_trials 
    WHERE user_id = user_uuid;
    
    -- Se não tem trial (usuário novo)
    IF NOT FOUND THEN
        RETURN json_build_object(
            'is_new_user', true,
            'can_generate', true,
            'plans_remaining', 1,
            'is_premium', false,
            'message', 'Você pode gerar 1 plano grátis!'
        );
    END IF;
    
    -- Se é premium
    IF trial_record.upgraded_to_premium THEN
        -- Verificar se precisa resetar ciclo
        IF trial_record.premium_plan_cycle_start IS NULL THEN
            RETURN json_build_object(
                'is_premium', true,
                'can_generate', true,
                'plans_remaining', trial_record.premium_max_plans_per_cycle,
                'cycle_days', trial_record.premium_cycle_days,
                'message', 'Você pode gerar até 2 planos a cada 30 dias!'
            );
        END IF;
        
        days_since_cycle_start := EXTRACT(DAY FROM (NOW() - trial_record.premium_plan_cycle_start));
        
        -- Se ciclo expirou, resetar
        IF days_since_cycle_start >= trial_record.premium_cycle_days THEN
            RETURN json_build_object(
                'is_premium', true,
                'can_generate', true,
                'plans_remaining', trial_record.premium_max_plans_per_cycle,
                'cycle_days', trial_record.premium_cycle_days,
                'message', 'Novo ciclo iniciado! Você pode gerar até 2 planos.'
            );
        END IF;
        
        -- Calcular planos restantes no ciclo atual
        plans_remaining := trial_record.premium_max_plans_per_cycle - trial_record.premium_plan_count;
        days_until_next_cycle := trial_record.premium_cycle_days - days_since_cycle_start;
        
        RETURN json_build_object(
            'is_premium', true,
            'can_generate', plans_remaining > 0,
            'plans_remaining', plans_remaining,
            'days_until_next_cycle', days_until_next_cycle,
            'cycle_days', trial_record.premium_cycle_days,
            'message', CASE 
                WHEN plans_remaining > 0 THEN 'Você pode gerar ' || plans_remaining || ' plano(s) neste ciclo.'
                ELSE 'Próximo ciclo em ' || days_until_next_cycle || ' dias.'
            END
        );
    END IF;
    
    -- Usuário free
    can_generate := trial_record.plans_generated = 0;
    
    RETURN json_build_object(
        'is_premium', false,
        'can_generate', can_generate,
        'plans_remaining', CASE WHEN can_generate THEN 1 ELSE 0 END,
        'has_used_free_plan', trial_record.plans_generated > 0,
        'message', CASE 
            WHEN can_generate THEN 'Você pode gerar 1 plano grátis!'
            ELSE 'Você já usou seu plano grátis. Faça upgrade para continuar!'
        END
    );
END;
$$ LANGUAGE plpgsql;

-- Comentários para documentação
COMMENT ON FUNCTION can_generate_plan_new IS 'Verifica se usuário pode gerar plano no novo sistema: 1 grátis + premium 2/30dias';
COMMENT ON FUNCTION update_plan_generated_new IS 'Atualiza dados após gerar plano no novo sistema';
COMMENT ON FUNCTION get_trial_status_new IS 'Retorna status completo do trial no novo sistema';
