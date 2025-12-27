/**
 * Sistema de Insights Automáticos
 *
 * Analisa métricas e gera insights e recomendações automáticas
 * para identificar problemas e sugerir correções.
 */

import { RejectionReason } from "./planRejectionMetrics";
import { CorrectionReason } from "./types";

export interface Insight {
  type: "problem" | "success" | "warning" | "info";
  severity: "high" | "medium" | "low";
  title: string;
  description: string;
  suggestion?: string;
  affectedLevels?: string[];
  affectedDayTypes?: string[];
  affectedMuscles?: string[];
  metric?: string;
  trend?: "increasing" | "decreasing" | "stable";
  changePercent?: number;
}

export interface MetricsSummary {
  period: "daily" | "weekly" | "monthly";
  current: {
    totalRejections: number;
    totalCorrections: number;
    totalQualityMetrics: number;
    averageQualityScore: number;
    topRejectionReasons: Array<{
      reason: RejectionReason;
      count: number;
      percentage: number;
    }>;
    topCorrectionReasons: Array<{
      reason: CorrectionReason;
      count: number;
      percentage: number;
    }>;
    rejectionRate: number; // % de planos rejeitados
    correctionSuccessRate: number; // % de planos corrigidos com sucesso
    byActivityLevel: Record<
      string,
      { rejections: number; corrections: number; qualityScore: number }
    >;
    byDayType: Record<string, { rejections: number; corrections: number }>;
    byMuscle: Record<string, { rejections: number; corrections: number }>;
  };
  previous?: {
    totalRejections: number;
    totalCorrections: number;
    averageQualityScore: number;
    rejectionRate: number;
    correctionSuccessRate: number;
  };
  trends: {
    rejectionRate: "increasing" | "decreasing" | "stable";
    qualityScore: "improving" | "degrading" | "stable";
    correctionRate: "increasing" | "decreasing" | "stable";
  };
  insights: Insight[];
}

/**
 * Gera insights automáticos baseado em análise de métricas
 */
export function generateInsights(summary: MetricsSummary): Insight[] {
  const insights: Insight[] = [];

  // 1. Análise de taxa de rejeição
  if (summary.current.rejectionRate > 20) {
    insights.push({
      type: "problem",
      severity: "high",
      title: "Taxa de rejeição alta",
      description: `${summary.current.rejectionRate.toFixed(1)}% dos planos estão sendo rejeitados. Isso indica problemas na geração ou validação.`,
      suggestion:
        "Revisar validações e limites. Verificar se ApprovalContract está funcionando corretamente.",
      metric: "rejection_rate",
    });
  } else if (
    summary.current.rejectionRate < 5 &&
    summary.previous &&
    summary.trends.rejectionRate === "decreasing"
  ) {
    insights.push({
      type: "success",
      severity: "low",
      title: "Taxa de rejeição excelente",
      description: `Taxa de rejeição de ${summary.current.rejectionRate.toFixed(1)}% está muito baixa. Sistema funcionando bem.`,
      metric: "rejection_rate",
    });
  }

  // 2. Análise de tendências
  if (summary.previous) {
    const rejectionChange =
      summary.current.totalRejections - summary.previous.totalRejections;
    const rejectionChangePercent =
      summary.previous.totalRejections > 0
        ? (rejectionChange / summary.previous.totalRejections) * 100
        : 0;

    if (rejectionChangePercent > 30) {
      insights.push({
        type: "warning",
        severity: "high",
        title: "Aumento significativo de rejeições",
        description: `Rejeições aumentaram ${rejectionChangePercent.toFixed(1)}% em relação ao período anterior (${summary.previous.totalRejections} → ${summary.current.totalRejections}).`,
        suggestion:
          "Investigar mudanças recentes no código ou validações. Verificar se há novos padrões de erro.",
        trend: "increasing",
        changePercent: rejectionChangePercent,
      });
    } else if (rejectionChangePercent < -20) {
      insights.push({
        type: "success",
        severity: "medium",
        title: "Redução significativa de rejeições",
        description: `Rejeições diminuíram ${Math.abs(rejectionChangePercent).toFixed(1)}% em relação ao período anterior.`,
        trend: "decreasing",
        changePercent: rejectionChangePercent,
      });
    }
  }

  // 3. Análise de motivos de rejeição mais comuns
  if (summary.current.topRejectionReasons.length > 0) {
    const topReason = summary.current.topRejectionReasons[0];

    if (topReason.percentage > 40) {
      // Motivo específico muito frequente
      const reasonInsight = analyzeRejectionReason(
        topReason.reason,
        topReason.percentage,
        summary
      );
      if (reasonInsight) {
        insights.push(reasonInsight);
      }
    }
  }

  // 4. Análise de qualidade
  if (summary.current.averageQualityScore < 70) {
    insights.push({
      type: "problem",
      severity: "high",
      title: "Score de qualidade baixo",
      description: `Score médio de qualidade está em ${summary.current.averageQualityScore.toFixed(1)}/100. Planos estão sendo gerados com muitas concessões.`,
      suggestion:
        "Revisar lógica de geração. Verificar se ApprovalContract está sendo respeitado. Analisar warnings SOFT e FLEXIBLE mais comuns.",
      metric: "quality_score",
    });
  } else if (summary.current.averageQualityScore >= 90) {
    insights.push({
      type: "success",
      severity: "low",
      title: "Score de qualidade excelente",
      description: `Score médio de ${summary.current.averageQualityScore.toFixed(1)}/100 indica que os planos estão sendo gerados com alta qualidade.`,
      metric: "quality_score",
    });
  }

  // 5. Análise por nível de atividade
  for (const [level, data] of Object.entries(summary.current.byActivityLevel)) {
    if (
      data.rejections > 10 &&
      data.rejections / summary.current.totalRejections > 0.3
    ) {
      insights.push({
        type: "warning",
        severity: "medium",
        title: `Nível "${level}" com muitas rejeições`,
        description: `${data.rejections} rejeições (${((data.rejections / summary.current.totalRejections) * 100).toFixed(1)}%) ocorrem no nível ${level}.`,
        suggestion: `Revisar limites e validações específicas para nível ${level}. Verificar se os perfis técnicos estão corretos.`,
        affectedLevels: [level],
      });
    }

    if (data.qualityScore < 70 && summary.current.totalQualityMetrics > 0) {
      insights.push({
        type: "warning",
        severity: "medium",
        title: `Qualidade baixa para nível "${level}"`,
        description: `Score de qualidade de ${data.qualityScore.toFixed(1)}/100 para nível ${level} está abaixo do ideal.`,
        suggestion: `Revisar geração de planos para nível ${level}. Verificar se há restrições excessivas.`,
        affectedLevels: [level],
        metric: "quality_score",
      });
    }
  }

  // 6. Análise por tipo de dia
  for (const [dayType, data] of Object.entries(summary.current.byDayType)) {
    if (
      data.rejections > 5 &&
      data.rejections / summary.current.totalRejections > 0.25
    ) {
      insights.push({
        type: "warning",
        severity: "medium",
        title: `Dias "${dayType}" com muitas rejeições`,
        description: `${data.rejections} rejeições (${((data.rejections / summary.current.totalRejections) * 100).toFixed(1)}%) ocorrem em dias ${dayType}.`,
        suggestion: `Revisar lógica de geração para dias ${dayType}. Verificar validações específicas deste tipo.`,
        affectedDayTypes: [dayType],
      });
    }
  }

  // 7. Análise por músculo
  for (const [muscle, data] of Object.entries(summary.current.byMuscle)) {
    if (
      data.rejections > 5 &&
      data.rejections / summary.current.totalRejections > 0.2
    ) {
      insights.push({
        type: "warning",
        severity: "medium",
        title: `Músculo "${muscle}" causando muitas rejeições`,
        description: `${data.rejections} rejeições (${((data.rejections / summary.current.totalRejections) * 100).toFixed(1)}%) estão relacionadas ao músculo ${muscle}.`,
        suggestion: `Revisar limites semanais e por sessão para ${muscle}. Verificar se a validação contextual está funcionando corretamente.`,
        affectedMuscles: [muscle],
      });
    }
  }

  // 8. Análise de taxa de correção
  if (summary.current.correctionSuccessRate > 95) {
    insights.push({
      type: "success",
      severity: "low",
      title: "Sistema de correção funcionando muito bem",
      description: `${summary.current.correctionSuccessRate.toFixed(1)}% dos planos são corrigidos automaticamente.`,
      metric: "correction_success_rate",
    });
  } else if (summary.current.correctionSuccessRate < 80) {
    insights.push({
      type: "warning",
      severity: "medium",
      title: "Taxa de correção pode melhorar",
      description: `Apenas ${summary.current.correctionSuccessRate.toFixed(1)}% dos planos são corrigidos automaticamente.`,
      suggestion:
        "Revisar lógica de correção automática. Verificar se correctSameTypeDaysExercises está funcionando corretamente.",
      metric: "correction_success_rate",
    });
  }

  return insights;
}

/**
 * Analisa um motivo específico de rejeição e gera insight
 */
function analyzeRejectionReason(
  reason: RejectionReason,
  percentage: number,
  summary: MetricsSummary
): Insight | null {
  switch (reason) {
    case "excesso_series_por_sessao":
      return {
        type: "problem",
        severity: "high",
        title: "Excesso de séries por sessão: problema recorrente",
        description: `${percentage.toFixed(1)}% das rejeições são por excesso de séries por sessão.`,
        suggestion:
          "Revisar validação contextual (validateFrequencyVolume). Verificar se PRIMARY_MUSCLE_SESSION_BONUS está adequado. Considerar ajustar limites por tipo de dia.",
        metric: "excesso_series_por_sessao",
      };

    case "excesso_series_semanais":
      return {
        type: "problem",
        severity: "high",
        title: "Excesso de séries semanais: problema recorrente",
        description: `${percentage.toFixed(1)}% das rejeições são por excesso de séries semanais.`,
        suggestion:
          "Revisar ApprovalContract. Verificar se getWeeklySeriesLimits está retornando valores corretos. Verificar se correctSameTypeDaysExercises está respeitando limites.",
        metric: "excesso_series_semanais",
      };

    case "dias_mesmo_tipo_exercicios_diferentes":
      return {
        type: "problem",
        severity: "medium",
        title: "Inconsistência entre dias do mesmo tipo",
        description: `${percentage.toFixed(1)}% das rejeições são por dias do mesmo tipo terem exercícios diferentes.`,
        suggestion:
          "Verificar se correctSameTypeDaysExercises está sendo chamado corretamente. Garantir que todos os dias do mesmo tipo são padronizados.",
        metric: "dias_mesmo_tipo_exercicios_diferentes",
      };

    case "excesso_padrao_motor":
      return {
        type: "warning",
        severity: "medium",
        title: "Excesso de padrões motores",
        description: `${percentage.toFixed(1)}% das rejeições são por excesso de padrões motores.`,
        suggestion:
          "Revisar limites de padrões motores. Verificar se ApprovalContract está respeitando esses limites durante a geração.",
        metric: "excesso_padrao_motor",
      };

    default:
      return null;
  }
}
