-- Script completo para recriar estrutura do banco de dados
-- Execute este script no Supabase SQL Editor para restaurar tudo

-- =============================================================================
-- 1. TABELA USERS
-- =============================================================================

-- Criar tabela users se não existir
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Configurar RLS para users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Políticas para users
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;

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
-- 2. TABELA USER_PROFILES
-- =============================================================================

-- Criar tabela user_profiles se não existir
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    birth_date DATE,
    age INTEGER,
    height DECIMAL(5,2), -- altura em cm com 2 casas decimais
    weight DECIMAL(5,2), -- peso em kg com 2 casas decimais  
    initial_weight DECIMAL(5,2), -- peso inicial
    gender TEXT CHECK (gender IN ('Masculino', 'Feminino', 'Outro')),
    objective TEXT,
    training_frequency TEXT,
    training_location TEXT,
    has_pain TEXT,
    dietary_restrictions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Configurar RLS para user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Políticas para user_profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;

CREATE POLICY "Users can view their own profile" 
ON public.user_profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.user_profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.user_profiles FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- 3. TABELA USER_EVOLUTIONS
-- =============================================================================

-- Criar tabela user_evolutions se não existir
CREATE TABLE IF NOT EXISTS public.user_evolutions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    peso DECIMAL(5,2),
    percentual_gordura DECIMAL(5,2),
    massa_magra DECIMAL(5,2),
    cintura DECIMAL(5,2),
    quadril DECIMAL(5,2),
    braco DECIMAL(5,2),
    coxa DECIMAL(5,2),
    treinos INTEGER,
    bem_estar INTEGER CHECK (bem_estar >= 1 AND bem_estar <= 10),
    observacoes TEXT,
    objetivo TEXT,
    nivel_atividade TEXT,
    arquivo_avaliacao_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Configurar RLS para user_evolutions
ALTER TABLE public.user_evolutions ENABLE ROW LEVEL SECURITY;

-- Políticas para user_evolutions
DROP POLICY IF EXISTS "Users can view their own evolutions" ON public.user_evolutions;
DROP POLICY IF EXISTS "Users can insert their own evolutions" ON public.user_evolutions;
DROP POLICY IF EXISTS "Users can update their own evolutions" ON public.user_evolutions;

CREATE POLICY "Users can view their own evolutions" 
ON public.user_evolutions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own evolutions" 
ON public.user_evolutions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own evolutions" 
ON public.user_evolutions FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- 4. TABELA USER_TRIALS
-- =============================================================================

-- Criar tabela user_trials se não existir
CREATE TABLE IF NOT EXISTS public.user_trials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    plans_generated INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    upgraded_to_premium BOOLEAN DEFAULT false,
    last_plan_generated_at TIMESTAMP WITH TIME ZONE NULL,
    premium_plan_count INTEGER DEFAULT 0,
    premium_plan_cycle_start TIMESTAMP WITH TIME ZONE NULL,
    premium_max_plans_per_cycle INTEGER DEFAULT 2,
    premium_cycle_days INTEGER DEFAULT 30,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Configurar RLS para user_trials
ALTER TABLE public.user_trials ENABLE ROW LEVEL SECURITY;

-- Políticas para user_trials
DROP POLICY IF EXISTS "Users can view their own trial" ON public.user_trials;
DROP POLICY IF EXISTS "Users can insert their own trial" ON public.user_trials;
DROP POLICY IF EXISTS "Users can update their own trial" ON public.user_trials;

CREATE POLICY "Users can view their own trial" 
ON public.user_trials FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trial" 
ON public.user_trials FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trial" 
ON public.user_trials FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- 5. TABELA SUBSCRIPTIONS (para o step3)
-- =============================================================================

-- Criar tabela subscriptions se não existir
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    status TEXT CHECK (status IN ('trial', 'active', 'canceled', 'expired')) DEFAULT 'trial',
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Configurar RLS para subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Políticas para subscriptions
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can insert their own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscription" ON public.subscriptions;

CREATE POLICY "Users can view their own subscription" 
ON public.subscriptions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription" 
ON public.subscriptions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription" 
ON public.subscriptions FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- 6. FUNÇÕES AUXILIARES
-- =============================================================================

-- Função para auto-atualizar updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
DROP TRIGGER IF EXISTS handle_users_updated_at ON public.users;
CREATE TRIGGER handle_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER handle_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_user_evolutions_updated_at ON public.user_evolutions;
CREATE TRIGGER handle_user_evolutions_updated_at
    BEFORE UPDATE ON public.user_evolutions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_user_trials_updated_at ON public.user_trials;
CREATE TRIGGER handle_user_trials_updated_at
    BEFORE UPDATE ON public.user_trials
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER handle_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- 7. FUNÇÃO PARA STATUS DO TRIAL
-- =============================================================================

-- Função para verificar status do trial
CREATE OR REPLACE FUNCTION get_trial_status_new(user_uuid UUID)
RETURNS TABLE (
    is_premium BOOLEAN,
    has_used_free_plan BOOLEAN,
    can_generate BOOLEAN,
    plans_remaining INTEGER,
    days_until_next_cycle INTEGER
) AS $$
DECLARE
    trial_record user_trials%ROWTYPE;
    days_since_cycle_start INTEGER;
BEGIN
    -- Buscar registro do trial
    SELECT * INTO trial_record
    FROM user_trials 
    WHERE user_id = user_uuid;
    
    -- Se não tem trial, é usuário novo (pode gerar plano grátis)
    IF NOT FOUND THEN
        RETURN QUERY SELECT 
            false as is_premium,
            false as has_used_free_plan,
            true as can_generate,
            1 as plans_remaining,
            0 as days_until_next_cycle;
        RETURN;
    END IF;
    
    -- Se é premium
    IF trial_record.upgraded_to_premium THEN
        -- Se não tem ciclo iniciado, pode gerar
        IF trial_record.premium_plan_cycle_start IS NULL THEN
            RETURN QUERY SELECT 
                true as is_premium,
                true as has_used_free_plan,
                true as can_generate,
                trial_record.premium_max_plans_per_cycle as plans_remaining,
                0 as days_until_next_cycle;
            RETURN;
        END IF;
        
        -- Calcular dias desde início do ciclo
        days_since_cycle_start := EXTRACT(DAY FROM (NOW() - trial_record.premium_plan_cycle_start));
        
        -- Se passou o ciclo (30 dias), resetar contador
        IF days_since_cycle_start >= trial_record.premium_cycle_days THEN
            RETURN QUERY SELECT 
                true as is_premium,
                true as has_used_free_plan,
                true as can_generate,
                trial_record.premium_max_plans_per_cycle as plans_remaining,
                0 as days_until_next_cycle;
            RETURN;
        END IF;
        
        -- Calcular dias até próximo ciclo
        days_until_next_cycle := trial_record.premium_cycle_days - days_since_cycle_start;
        
        -- Verificar se ainda tem planos disponíveis no ciclo atual
        RETURN QUERY SELECT 
            true as is_premium,
            true as has_used_free_plan,
            (trial_record.premium_plan_count < trial_record.premium_max_plans_per_cycle) as can_generate,
            (trial_record.premium_max_plans_per_cycle - trial_record.premium_plan_count) as plans_remaining,
            days_until_next_cycle;
        RETURN;
    END IF;
    
    -- Se não é premium, verificar se já usou o plano grátis
    RETURN QUERY SELECT 
        false as is_premium,
        (trial_record.plans_generated > 0) as has_used_free_plan,
        (trial_record.plans_generated = 0) as can_generate,
        CASE WHEN trial_record.plans_generated = 0 THEN 1 ELSE 0 END as plans_remaining,
        0 as days_until_next_cycle;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- FINALIZAÇÃO
-- =============================================================================

SELECT 'Estrutura do banco de dados recriada com sucesso!' as result;

-- Verificar se todas as tabelas foram criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'user_profiles', 'user_evolutions', 'user_trials', 'subscriptions')
ORDER BY table_name;
