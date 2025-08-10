// Tipos para dados de evolução do usuário

export interface UserEvolution {
  id: string;
  user_id: string;
  date: string;
  peso?: number;
  percentual_gordura?: number;
  massa_magra?: number;
  cintura?: number;
  quadril?: number;
  braco?: number;
  objetivo?: string;
  nivel_atividade?: string;
  bem_estar?: number;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

export interface UserActivity {
  id: string;
  user_id: string;
  date: string;
  treinos_concluidos: number;
  calorias_queimadas: number;
  duracao_minutos: number;
  tipo_treino?: string;
  observacoes?: string;
  created_at: string;
}

export interface UserGoal {
  id: string;
  user_id: string;
  tipo_meta: 'peso' | 'gordura' | 'treinos_semanais' | 'calorias' | 'massa_magra';
  valor_atual?: number;
  valor_meta: number;
  data_inicio: string;
  data_fim?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserStreak {
  id: string;
  user_id: string;
  data_inicio: string;
  data_ultimo_treino: string;
  dias_consecutivos: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

// Tipos para dados de entrada (sem IDs e timestamps)
export interface CreateEvolutionData {
  date?: string;
  peso?: number;
  percentual_gordura?: number;
  massa_magra?: number;
  cintura?: number;
  quadril?: number;
  braco?: number;
  objetivo?: string;
  nivel_atividade?: string;
  bem_estar?: number;
  observacoes?: string;
}

export interface CreateActivityData {
  date?: string;
  treinos_concluidos?: number;
  calorias_queimadas?: number;
  duracao_minutos?: number;
  tipo_treino?: string;
  observacoes?: string;
}

export interface CreateGoalData {
  tipo_meta: 'peso' | 'gordura' | 'treinos_semanais' | 'calorias' | 'massa_magra';
  valor_atual?: number;
  valor_meta: number;
  data_inicio?: string;
  data_fim?: string;
}

// Tipos para dados consolidados do dashboard
export interface EvolutionSummary {
  peso_atual: number;
  percentual_gordura_atual: number;
  massa_magra_atual: number;
  treinos_concluidos_total: number;
  calorias_queimadas_semana: number;
  sequencia_atual: number;
  peso_inicial: number;
  percentual_gordura_inicial: number;
  massa_magra_inicial: number;
}

export interface ChartData {
  date: string;
  peso?: number;
  cintura?: number;
  percentual_gordura?: number;
  massa_magra?: number;
  treinos_concluidos?: number;
  calorias_queimadas?: number;
}

export interface WeeklyActivityData {
  semana: string;
  treinos: number;
  meta: number;
}

export interface GoalProgressData {
  mes: string;
  atual: number;
  meta: number;
}
