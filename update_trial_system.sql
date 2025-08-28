-- Atualizar tabela user_trials para nova lógica de 1 plano a cada 7 dias
ALTER TABLE user_trials 
ADD COLUMN IF NOT EXISTS last_plan_generated_at TIMESTAMP WITH TIME ZONE NULL,
ADD COLUMN IF NOT EXISTS days_between_plans INTEGER DEFAULT 7;

-- Comentar: Agora em vez de max_plans_allowed, usamos days_between_plans
-- O campo max_plans_allowed continua existindo mas não será usado na nova lógica

-- Função para verificar se usuário pode gerar novo plano
CREATE OR REPLACE FUNCTION can_generate_plan(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    trial_record user_trials%ROWTYPE;
    days_since_last_plan INTEGER;
BEGIN
    -- Buscar registro do trial
    SELECT * INTO trial_record
    FROM user_trials 
    WHERE user_id = user_uuid;
    
    -- Se não tem trial, pode gerar (será criado automaticamente)
    IF NOT FOUND THEN
        RETURN TRUE;
    END IF;
    
    -- Se é premium, sempre pode gerar
    IF trial_record.upgraded_to_premium THEN
        RETURN TRUE;
    END IF;
    
    -- Se nunca gerou plano, pode gerar
    IF trial_record.last_plan_generated_at IS NULL THEN
        RETURN TRUE;
    END IF;
    
    -- Calcular dias desde último plano
    days_since_last_plan := EXTRACT(DAY FROM (NOW() - trial_record.last_plan_generated_at));
    
    -- Pode gerar se passaram os dias necessários
    RETURN days_since_last_plan >= trial_record.days_between_plans;
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar data do último plano gerado
CREATE OR REPLACE FUNCTION update_last_plan_generated(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE user_trials 
    SET last_plan_generated_at = NOW(),
        plans_generated = plans_generated + 1
    WHERE user_id = user_uuid;
    
    -- Se não existe, criar
    IF NOT FOUND THEN
        INSERT INTO user_trials (user_id, last_plan_generated_at, plans_generated)
        VALUES (user_uuid, NOW(), 1);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Função para obter dias restantes até próximo plano
CREATE OR REPLACE FUNCTION days_until_next_plan(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    trial_record user_trials%ROWTYPE;
    days_since_last_plan INTEGER;
BEGIN
    -- Buscar registro do trial
    SELECT * INTO trial_record
    FROM user_trials 
    WHERE user_id = user_uuid;
    
    -- Se não tem trial ou é premium, retorna 0 (pode gerar)
    IF NOT FOUND OR trial_record.upgraded_to_premium THEN
        RETURN 0;
    END IF;
    
    -- Se nunca gerou plano, pode gerar agora
    IF trial_record.last_plan_generated_at IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Calcular dias desde último plano
    days_since_last_plan := EXTRACT(DAY FROM (NOW() - trial_record.last_plan_generated_at));
    
    -- Retornar dias restantes (ou 0 se já pode gerar)
    RETURN GREATEST(0, trial_record.days_between_plans - days_since_last_plan);
END;
$$ LANGUAGE plpgsql;
