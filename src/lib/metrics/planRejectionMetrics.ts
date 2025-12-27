/**
 * Sistema de Monitoramento de Métricas de Rejeição de Planos
 *
 * Rastreia quando e por que planos de treino são rejeitados,
 * permitindo análise de padrões e identificação de problemas.
 *
 * Agora com persistência em banco de dados (Supabase).
 */

import { createClient } from "@supabase/supabase-js";

export type RejectionReason =
  | "weeklySchedule_invalido"
  | "numero_dias_incompativel"
  | "divisao_incompativel_frequencia"
  | "dia_sem_exercicios"
  | "excesso_exercicios_nivel"
  | "exercicio_sem_primaryMuscle"
  | "grupo_muscular_proibido"
  | "lower_sem_grupos_obrigatorios"
  | "full_body_sem_grupos_obrigatorios"
  | "grupo_obrigatorio_ausente"
  | "ordem_exercicios_invalida"
  | "excesso_exercicios_musculo_primario"
  | "distribuicao_inteligente_invalida"
  | "secondaryMuscles_excede_limite"
  | "tempo_treino_excede_disponivel"
  | "vies_estetico_detectado"
  | "volume_insuficiente_critico"
  | "exercicio_musculo_incompativel"
  | "dias_mesmo_tipo_exercicios_diferentes"
  | "excesso_series_semanais"
  | "excesso_padrao_motor"
  | "excesso_volume_em_deficit"
  | "excesso_series_por_sessao"
  | "excesso_exercicios_sessao"
  | "reps_fora_limites_perfil"
  | "isolador_com_reps_baixas"
  | "excesso_exercicios_reps_baixas"
  | "restricao_articular_ombro"
  | "restricao_articular_joelho"
  | "excesso_exercicios_alto_risco_idoso" // 🛡️ Novo: Idosos com exercícios de alto risco
  | "contract_violation"; // 📋 Violação de contrato muscular

export interface RejectionMetric {
  reason: RejectionReason;
  timestamp: number;
  context: {
    activityLevel?: string;
    trainingDays?: number;
    dayType?: string;
    exerciseCount?: number;
    muscle?: string;
    muscleCount?: number;
    maxAllowed?: number;
    [key: string]: unknown;
  };
}

// Interface DatabaseMetric removida - não está sendo usada

/**
 * Cliente Supabase para persistência
 * Usa service role key para garantir que as inserções sempre funcionem
 */
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Se não tiver service key, usar anon key (pode falhar se RLS bloquear)
  const supabaseKey =
    supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Armazena métricas em memória (fallback) e persiste no banco
 */
class PlanRejectionMetrics {
  private metrics: RejectionMetric[] = [];
  private readonly maxMetrics = 10000; // Limite para evitar uso excessivo de memória
  private supabase = getSupabaseClient();
  private persistenceEnabled = !!this.supabase;

  constructor() {
    if (!this.persistenceEnabled) {
      console.warn(
        "[PlanRejectionMetrics] Persistência em banco desabilitada. Variáveis de ambiente não configuradas."
      );
    }
  }

  /**
   * Registra uma rejeição de plano
   * Tenta persistir no banco, mas mantém em memória como fallback
   */
  async recordRejection(
    reason: RejectionReason,
    context: RejectionMetric["context"] = {}
  ): Promise<void> {
    const metric: RejectionMetric = {
      reason,
      timestamp: Date.now(),
      context,
    };

    // Sempre adicionar em memória (fallback)
    this.metrics.push(metric);

    // Limitar tamanho do array para evitar uso excessivo de memória
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Tentar persistir no banco (não bloqueia se falhar)
    if (this.persistenceEnabled && this.supabase) {
      try {
        const { error } = await this.supabase
          .from("plan_rejection_metrics")
          .insert({
            reason: metric.reason,
            timestamp: metric.timestamp,
            context: metric.context,
          });

        if (error) {
          console.error(
            "[PlanRejectionMetrics] Erro ao persistir métrica no banco:",
            error
          );
          // Não lançar erro - continuar funcionando com memória
        }
      } catch (error) {
        console.error(
          "[PlanRejectionMetrics] Exceção ao persistir métrica:",
          error
        );
        // Não lançar erro - continuar funcionando com memória
      }
    }
  }

  /**
   * Obtém todas as métricas do banco de dados
   */
  async getAllMetricsFromDB(limit: number = 10000): Promise<RejectionMetric[]> {
    if (!this.persistenceEnabled || !this.supabase) {
      // Fallback para memória
      return this.getAllMetrics();
    }

    try {
      const { data, error } = await this.supabase
        .from("plan_rejection_metrics")
        .select("reason, timestamp, context")
        .order("timestamp", { ascending: false })
        .limit(limit);

      if (error) {
        console.error(
          "[PlanRejectionMetrics] Erro ao buscar métricas do banco:",
          error
        );
        // Fallback para memória
        return this.getAllMetrics();
      }

      return (data || []).map((row) => ({
        reason: row.reason as RejectionReason,
        timestamp: row.timestamp,
        context: (row.context || {}) as RejectionMetric["context"],
      }));
    } catch (error) {
      console.error(
        "[PlanRejectionMetrics] Exceção ao buscar métricas:",
        error
      );
      // Fallback para memória
      return this.getAllMetrics();
    }
  }

  /**
   * Obtém métricas filtradas por período do banco
   */
  async getMetricsByPeriodFromDB(
    startTime: number,
    endTime: number
  ): Promise<RejectionMetric[]> {
    if (!this.persistenceEnabled || !this.supabase) {
      // Fallback para memória
      return this.getMetricsByPeriod(startTime, endTime);
    }

    try {
      const { data, error } = await this.supabase
        .from("plan_rejection_metrics")
        .select("reason, timestamp, context")
        .gte("timestamp", startTime)
        .lte("timestamp", endTime)
        .order("timestamp", { ascending: false });

      if (error) {
        console.error(
          "[PlanRejectionMetrics] Erro ao buscar métricas por período:",
          error
        );
        // Fallback para memória
        return this.getMetricsByPeriod(startTime, endTime);
      }

      return (data || []).map((row) => ({
        reason: row.reason as RejectionReason,
        timestamp: row.timestamp,
        context: (row.context || {}) as RejectionMetric["context"],
      }));
    } catch (error) {
      console.error(
        "[PlanRejectionMetrics] Exceção ao buscar métricas por período:",
        error
      );
      // Fallback para memória
      return this.getMetricsByPeriod(startTime, endTime);
    }
  }

  /**
   * Obtém todas as métricas (da memória - método legado)
   */
  getAllMetrics(): RejectionMetric[] {
    return [...this.metrics];
  }

  /**
   * Obtém métricas filtradas por período (da memória - método legado)
   */
  getMetricsByPeriod(startTime: number, endTime: number): RejectionMetric[] {
    return this.metrics.filter(
      (m) => m.timestamp >= startTime && m.timestamp <= endTime
    );
  }

  /**
   * Obtém estatísticas agregadas do banco de dados
   */
  async getStatisticsFromDB(): Promise<{
    total: number;
    byReason: Record<RejectionReason, number>;
    byActivityLevel: Record<string, number>;
    byDayType: Record<string, number>;
    recent: RejectionMetric[];
  }> {
    const metrics = await this.getAllMetricsFromDB(10000);

    return this.calculateStatistics(metrics);
  }

  /**
   * Obtém estatísticas agregadas (da memória - método legado)
   */
  getStatistics(): {
    total: number;
    byReason: Record<RejectionReason, number>;
    byActivityLevel: Record<string, number>;
    byDayType: Record<string, number>;
    recent: RejectionMetric[];
  } {
    return this.calculateStatistics(this.metrics);
  }

  /**
   * Calcula estatísticas a partir de uma lista de métricas
   */
  private calculateStatistics(metrics: RejectionMetric[]): {
    total: number;
    byReason: Record<RejectionReason, number>;
    byActivityLevel: Record<string, number>;
    byDayType: Record<string, number>;
    recent: RejectionMetric[];
  } {
    const byReason: Record<string, number> = {};
    const byActivityLevel: Record<string, number> = {};
    const byDayType: Record<string, number> = {};

    for (const metric of metrics) {
      // Contar por motivo
      byReason[metric.reason] = (byReason[metric.reason] || 0) + 1;

      // Contar por nível de atividade
      if (metric.context.activityLevel) {
        const level = metric.context.activityLevel;
        byActivityLevel[level] = (byActivityLevel[level] || 0) + 1;
      }

      // Contar por tipo de dia
      if (metric.context.dayType) {
        const dayType = metric.context.dayType;
        byDayType[dayType] = (byDayType[dayType] || 0) + 1;
      }
    }

    // Últimas 100 rejeições
    const recent = metrics.slice(-100).reverse();

    return {
      total: metrics.length,
      byReason: byReason as Record<RejectionReason, number>,
      byActivityLevel,
      byDayType,
      recent,
    };
  }

  /**
   * Obtém estatísticas das últimas 24 horas do banco
   */
  async getLast24HoursStatisticsFromDB(): Promise<
    ReturnType<PlanRejectionMetrics["getStatisticsFromDB"]>
  > {
    const now = Date.now();
    const last24Hours = now - 24 * 60 * 60 * 1000;
    const metrics24h = await this.getMetricsByPeriodFromDB(last24Hours, now);

    return this.calculateStatistics(metrics24h);
  }

  /**
   * Obtém estatísticas das últimas 24 horas (da memória - método legado)
   */
  getLast24HoursStatistics(): ReturnType<
    PlanRejectionMetrics["getStatistics"]
  > {
    const now = Date.now();
    const last24Hours = now - 24 * 60 * 60 * 1000;
    const metrics24h = this.getMetricsByPeriod(last24Hours, now);

    return this.calculateStatistics(metrics24h);
  }

  /**
   * Limpa todas as métricas da memória (útil para testes)
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * Verifica se a persistência está habilitada
   */
  isPersistenceEnabled(): boolean {
    return this.persistenceEnabled;
  }
}

// Instância singleton
export const planRejectionMetrics = new PlanRejectionMetrics();

/**
 * Função helper para registrar rejeições de forma consistente
 * Agora é async para suportar persistência
 */
export async function recordPlanRejection(
  reason: RejectionReason,
  context: RejectionMetric["context"] = {}
): Promise<void> {
  await planRejectionMetrics.recordRejection(reason, context);
}

/**
 * Mapeia mensagens de console.warn para RejectionReason
 */
export function mapWarnMessageToReason(
  message: string
): RejectionReason | null {
  const reasonMap: Record<string, RejectionReason> = {
    "weeklySchedule inválido ou ausente": "weeklySchedule_invalido",
    "número de dias incompatível": "numero_dias_incompativel",
    "divisão incompatível com frequência": "divisao_incompativel_frequencia",
    "dia sem exercícios": "dia_sem_exercicios",
    "excesso de exercícios por nível": "excesso_exercicios_nivel",
    "exercício sem primaryMuscle": "exercicio_sem_primaryMuscle",
    "grupo muscular proibido no dia": "grupo_muscular_proibido",
    "grupo muscular não permitido": "grupo_muscular_proibido",
    "Lower day sem grupos obrigatórios": "lower_sem_grupos_obrigatorios",
    "Full Body day sem grupos obrigatórios":
      "full_body_sem_grupos_obrigatorios",
    "grupo muscular obrigatório ausente": "grupo_obrigatorio_ausente",
    "ordem de exercícios inválida": "ordem_exercicios_invalida",
    "excesso de exercícios com mesmo músculo primário":
      "excesso_exercicios_musculo_primario",
    "tríceps como primário em excesso no dia Push":
      "distribuicao_inteligente_invalida",
    "bíceps como primário em excesso no dia Pull":
      "distribuicao_inteligente_invalida",
    "Push day sem Peitoral ou Ombros como primários":
      "distribuicao_inteligente_invalida",
    "músculo concentrado demais no dia Lower":
      "distribuicao_inteligente_invalida",
    "secondaryMuscles excede limite de 2": "secondaryMuscles_excede_limite",
    "tempo de treino excede disponível": "tempo_treino_excede_disponivel",
    "exercício com músculo primário incompatível":
      "exercicio_musculo_incompativel",
  };

  for (const [key, reason] of Object.entries(reasonMap)) {
    if (message.includes(key)) {
      return reason;
    }
  }

  return null;
}
