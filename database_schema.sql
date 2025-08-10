-- Schema para integração de dados de evolução do Mova
-- Execute este SQL no seu projeto Supabase

-- 1. Tabela para evoluções do usuário
CREATE TABLE IF NOT EXISTS user_evolutions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  peso DECIMAL(5,2),
  percentual_gordura DECIMAL(4,1),
  massa_magra DECIMAL(5,2),
  cintura INTEGER,
  quadril INTEGER,
  braco INTEGER,
  objetivo VARCHAR(50),
  nivel_atividade VARCHAR(30),
  bem_estar INTEGER CHECK (bem_estar >= 1 AND bem_estar <= 5),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela para atividades e treinos
CREATE TABLE IF NOT EXISTS user_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  treinos_concluidos INTEGER DEFAULT 0,
  calorias_queimadas INTEGER DEFAULT 0,
  duracao_minutos INTEGER DEFAULT 0,
  tipo_treino VARCHAR(50),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela para metas do usuário
CREATE TABLE IF NOT EXISTS user_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo_meta VARCHAR(30) NOT NULL, -- 'peso', 'gordura', 'treinos_semanais', etc.
  valor_atual DECIMAL(8,2),
  valor_meta DECIMAL(8,2),
  data_inicio DATE DEFAULT CURRENT_DATE,
  data_fim DATE,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabela para sequência de treinos (streak)
CREATE TABLE IF NOT EXISTS user_streaks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  data_inicio DATE NOT NULL,
  data_ultimo_treino DATE NOT NULL,
  dias_consecutivos INTEGER DEFAULT 1,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_user_evolutions_user_id ON user_evolutions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_evolutions_date ON user_evolutions(date);
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_date ON user_activities(date);
CREATE INDEX IF NOT EXISTS idx_user_goals_user_id ON user_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_streaks_user_id ON user_streaks(user_id);

-- Políticas de segurança RLS (Row Level Security)
ALTER TABLE user_evolutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;

-- Políticas para user_evolutions
CREATE POLICY "Users can view their own evolutions" ON user_evolutions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own evolutions" ON user_evolutions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own evolutions" ON user_evolutions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own evolutions" ON user_evolutions
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para user_activities
CREATE POLICY "Users can view their own activities" ON user_activities
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activities" ON user_activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activities" ON user_activities
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own activities" ON user_activities
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para user_goals
CREATE POLICY "Users can view their own goals" ON user_goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goals" ON user_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals" ON user_goals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals" ON user_goals
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para user_streaks
CREATE POLICY "Users can view their own streaks" ON user_streaks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own streaks" ON user_streaks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own streaks" ON user_streaks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own streaks" ON user_streaks
  FOR DELETE USING (auth.uid() = user_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_user_evolutions_updated_at 
  BEFORE UPDATE ON user_evolutions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_goals_updated_at 
  BEFORE UPDATE ON user_goals 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_streaks_updated_at 
  BEFORE UPDATE ON user_streaks 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
