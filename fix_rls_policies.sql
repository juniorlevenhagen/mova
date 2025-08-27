-- Corrigir políticas RLS para user_profiles
-- Execute este SQL no Supabase

-- 1. Verificar políticas existentes
SELECT schemaname, tablename, policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- 2. Verificar se RLS está habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'user_profiles';

-- 3. Se não existir a tabela user_profiles, criar com as políticas corretas
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  age INTEGER,
  birth_date DATE,
  height DECIMAL(5,1),
  weight DECIMAL(5,2),
  initial_weight DECIMAL(5,2),
  gender VARCHAR(10),
  objective VARCHAR(50),
  training_frequency VARCHAR(30),
  training_location VARCHAR(50),
  has_pain VARCHAR(10),
  dietary_restrictions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Habilitar RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 5. Criar políticas RLS corretas
-- Permitir que usuários vejam apenas seus próprios perfis
DROP POLICY IF EXISTS "Users can view their own profiles" ON user_profiles;
CREATE POLICY "Users can view their own profiles" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Permitir que usuários insiram apenas seus próprios perfis
DROP POLICY IF EXISTS "Users can insert their own profiles" ON user_profiles;
CREATE POLICY "Users can insert their own profiles" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Permitir que usuários atualizem apenas seus próprios perfis
DROP POLICY IF EXISTS "Users can update their own profiles" ON user_profiles;
CREATE POLICY "Users can update their own profiles" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Permitir que usuários deletem apenas seus próprios perfis
DROP POLICY IF EXISTS "Users can delete their own profiles" ON user_profiles;
CREATE POLICY "Users can delete their own profiles" ON user_profiles
  FOR DELETE USING (auth.uid() = user_id);

-- 6. Verificar se as políticas foram criadas corretamente
SELECT schemaname, tablename, policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'user_profiles';
