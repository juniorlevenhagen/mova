/**
 * Sistema de Métricas de Qualidade de Planos
 *
 * Rastreia qualidade de planos válidos (warnings SOFT/FLEXIBLE, score de qualidade).
 * Diferente de rejeição (plano inválido) ou correção (plano consertado),
 * qualidade mede planos que passaram na validação mas têm concessões.
 *
 * Agora com persistência em banco de dados (Supabase).
 */

import { createClient } from "@supabase/supabase-js";
import { Exercise } from "@/lib/validators/trainingPlanValidator";

export interface SoftWarning {
  exercise: Exercise;
  reason: string;
  type:
    | "joint_shoulder"
    | "joint_knee"
    | "volume_distribution"
    | "alternative_used"
    | "other";
  timestamp: number;
}

export interface FlexibleWarning {
  reason: string;
  type: string;
  timestamp: number;
}

export interface PlanQualityContext {
  imc?: number;
  gender?: string;
  activityLevel?: string;
  age?: number;
  objective?: string;
  trainingDays?: number;
  [key: string]: unknown;
}

export interface PlanQualityMetric {
  planId?: string;
  softWarningsCount: number;
  flexibleWarningsCount: number;
  softWarningsByType: Record<string, number>;
  exercisesWithSoftWarnings: string[];
  alternativesUsedCount: number;
  qualityScore: number;
  context: PlanQualityContext;
  created_at?: string;
}

/**
 * Cliente Supabase para persistência
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
 * Acumulador de qualidade durante a geração
 * Vive apenas durante a geração de um plano
 */
export class PlanQualityAccumulator {
  private softWarnings: SoftWarning[] = [];
  private flexibleWarnings: FlexibleWarning[] = [];
  private alternativesUsed: number = 0;

  /**
   * Registra um warning SOFT ou FLEXIBLE
   */
  register(
    result: {
      allowed: boolean;
      reasonType?: "HARD" | "SOFT" | "FLEXIBLE";
      reason?: string;
    },
    context: {
      exercise?: Exercise;
      [key: string]: unknown;
    }
  ): void {
    if (result.reasonType === "SOFT" && context.exercise) {
      // Determinar tipo do warning SOFT
      const warningType = this.determineWarningType(result.reason || "");

      this.softWarnings.push({
        exercise: context.exercise,
        reason: result.reason || "Restrição SOFT",
        type: warningType,
        timestamp: Date.now(),
      });
    }

    if (result.reasonType === "FLEXIBLE") {
      this.flexibleWarnings.push({
        reason: result.reason || "Ajuste FLEXIBLE",
        type: this.determineFlexibleType(result.reason || ""),
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Registra uso de alternativa (quando SOFT foi evitado)
   */
  recordAlternativeUsed(): void {
    this.alternativesUsed++;
  }

  /**
   * Calcula score de qualidade (0-100)
   * Score = 100 - (softWarnings * 5) - (flexibleWarnings * 2) - (alternativesNotFound * 3)
   * Mínimo: 60
   */
  calculateQualityScore(): number {
    let score = 100;

    // Penalizar warnings SOFT (mais grave)
    score -= this.softWarnings.length * 5;

    // Penalizar warnings FLEXIBLE (menos grave)
    score -= this.flexibleWarnings.length * 2;

    // Bonus por usar alternativas (indica que o sistema tentou evitar o problema)
    // Não penalizar, mas não dar bonus excessivo
    // Se não há warnings SOFT mas há alternativas usadas, significa que o sistema evitou problemas

    // Garantir mínimo de 60 (plano tecnicamente válido)
    return Math.max(60, Math.min(100, score));
  }

  /**
   * Gera métrica final para persistência
   */
  generateMetric(
    context: PlanQualityContext,
    planId?: string
  ): PlanQualityMetric {
    // Agrupar warnings SOFT por tipo
    const softWarningsByType: Record<string, number> = {};
    const exercisesWithSoftWarnings: string[] = [];

    for (const warning of this.softWarnings) {
      softWarningsByType[warning.type] =
        (softWarningsByType[warning.type] || 0) + 1;

      if (
        warning.exercise.name &&
        !exercisesWithSoftWarnings.includes(warning.exercise.name)
      ) {
        exercisesWithSoftWarnings.push(warning.exercise.name);
      }
    }

    return {
      planId,
      softWarningsCount: this.softWarnings.length,
      flexibleWarningsCount: this.flexibleWarnings.length,
      softWarningsByType,
      exercisesWithSoftWarnings,
      alternativesUsedCount: this.alternativesUsed,
      qualityScore: this.calculateQualityScore(),
      context,
    };
  }

  /**
   * Determina o tipo de warning SOFT baseado na razão e no exercício
   */
  private determineWarningType(reason: string): SoftWarning["type"] {
    const reasonLower = reason.toLowerCase();

    if (reasonLower.includes("ombro") || reasonLower.includes("shoulder")) {
      return "joint_shoulder";
    }
    if (reasonLower.includes("joelho") || reasonLower.includes("knee")) {
      return "joint_knee";
    }
    if (
      reasonLower.includes("volume") ||
      reasonLower.includes("distribuição")
    ) {
      return "volume_distribution";
    }
    if (reasonLower.includes("alternativa")) {
      return "alternative_used";
    }

    return "other";
  }

  /**
   * Determina o tipo de warning FLEXIBLE
   */
  private determineFlexibleType(reason: string): string {
    const reasonLower = reason.toLowerCase();

    if (reasonLower.includes("série") || reasonLower.includes("series")) {
      return "series_adjustment";
    }
    if (reasonLower.includes("volume")) {
      return "volume_adjustment";
    }

    return "other";
  }

  /**
   * Limpa o acumulador (útil para testes)
   */
  clear(): void {
    this.softWarnings = [];
    this.flexibleWarnings = [];
    this.alternativesUsed = 0;
  }
}

/**
 * Classe singleton para persistência de métricas
 */
class PlanQualityMetrics {
  private supabase = getSupabaseClient();
  private persistenceEnabled = !!this.supabase;

  constructor() {
    if (!this.persistenceEnabled) {
      console.warn(
        "[PlanQualityMetrics] Persistência em banco desabilitada. Variáveis de ambiente não configuradas."
      );
    }
  }

  /**
   * Persiste uma métrica de qualidade no banco
   */
  async recordQuality(metric: PlanQualityMetric): Promise<void> {
    // Log imediato (para debug em dev)
    console.log(`📊 [Métrica de Qualidade] Score: ${metric.qualityScore}`, {
      softWarnings: metric.softWarningsCount,
      flexibleWarnings: metric.flexibleWarningsCount,
      alternativesUsed: metric.alternativesUsedCount,
    });

    if (!this.persistenceEnabled || !this.supabase) {
      return;
    }

    // Persistência em background (não bloqueia)
    try {
      const { error } = await this.supabase
        .from("plan_quality_metrics")
        .insert({
          plan_id: metric.planId || null,
          soft_warnings_count: metric.softWarningsCount,
          flexible_warnings_count: metric.flexibleWarningsCount,
          soft_warnings_by_type: metric.softWarningsByType,
          exercises_with_soft_warnings: metric.exercisesWithSoftWarnings,
          alternatives_used_count: metric.alternativesUsedCount,
          quality_score: metric.qualityScore,
          context: metric.context,
        });

      if (error) {
        console.error(
          "[PlanQualityMetrics] Erro ao persistir métrica no banco:",
          error
        );
      }
    } catch (error) {
      console.error(
        "[PlanQualityMetrics] Exceção ao persistir métrica:",
        error
      );
    }
  }

  /**
   * Verifica se a persistência está habilitada
   */
  isPersistenceEnabled(): boolean {
    return this.persistenceEnabled;
  }
}

// Instância singleton
export const planQualityMetrics = new PlanQualityMetrics();

/**
 * Função helper para registrar qualidade de forma consistente
 */
export async function recordPlanQuality(
  metric: PlanQualityMetric
): Promise<void> {
  await planQualityMetrics.recordQuality(metric);
}
