import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import {
  generateInsights,
  MetricsSummary,
} from "@/lib/metrics/metricsInsights";
import { RejectionReason } from "@/lib/metrics/planRejectionMetrics";
import { CorrectionReason } from "@/lib/metrics/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Endpoint para obter resumo comparativo de métricas
 *
 * GET /api/metrics/summary?period=weekly|monthly
 * Headers:
 *   - Authorization: Bearer <token>
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "Token de autorização não encontrado" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: "Token inválido ou usuário não autenticado" },
        { status: 401 }
      );
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: "Configuração do Supabase ausente" },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const searchParams = request.nextUrl.searchParams;
    const period = (searchParams.get("period") || "weekly") as
      | "daily"
      | "weekly"
      | "monthly";

    // Calcular períodos
    const now = Date.now();
    let currentStart: number;
    const currentEnd: number = now;
    let previousStart: number;
    let previousEnd: number;

    if (period === "daily") {
      // Hoje vs ontem
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      currentStart = today.getTime();

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      previousStart = yesterday.getTime();
      previousEnd = today.getTime();
    } else if (period === "weekly") {
      // Esta semana vs semana passada
      const today = new Date();
      const dayOfWeek = today.getDay();
      const diff = today.getDate() - dayOfWeek; // Domingo da semana atual

      const currentWeekStart = new Date(today.setDate(diff));
      currentWeekStart.setHours(0, 0, 0, 0);
      currentStart = currentWeekStart.getTime();

      const previousWeekStart = new Date(currentWeekStart);
      previousWeekStart.setDate(previousWeekStart.getDate() - 7);
      previousStart = previousWeekStart.getTime();
      previousEnd = currentWeekStart.getTime();
    } else {
      // Este mês vs mês passado
      const today = new Date();
      const currentMonthStart = new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      );
      currentMonthStart.setHours(0, 0, 0, 0);
      currentStart = currentMonthStart.getTime();

      const previousMonthStart = new Date(
        today.getFullYear(),
        today.getMonth() - 1,
        1
      );
      previousMonthStart.setHours(0, 0, 0, 0);
      previousStart = previousMonthStart.getTime();
      previousEnd = currentMonthStart.getTime();
    }

    // Buscar métricas do período atual
    const [currentRejections, currentCorrections, currentQuality] =
      await Promise.all([
        getRejectionsByPeriod(supabaseAdmin, currentStart, currentEnd),
        getCorrectionsByPeriod(supabaseAdmin, currentStart, currentEnd),
        getQualityByPeriod(supabaseAdmin, currentStart, currentEnd),
      ]);

    // Buscar métricas do período anterior (se disponível)
    const [previousRejections, previousCorrections, previousQuality] =
      await Promise.all([
        getRejectionsByPeriod(supabaseAdmin, previousStart, previousEnd),
        getCorrectionsByPeriod(supabaseAdmin, previousStart, previousEnd),
        getQualityByPeriod(supabaseAdmin, previousStart, previousEnd),
      ]);

    // Calcular estatísticas do período atual
    const currentStats = calculateCurrentStats(
      currentRejections,
      currentCorrections,
      currentQuality
    );

    // Calcular estatísticas do período anterior
    const previousStats =
      previousRejections.length > 0 ||
      previousCorrections.length > 0 ||
      previousQuality.length > 0
        ? calculatePreviousStats(
            previousRejections,
            previousCorrections,
            previousQuality
          )
        : undefined;

    // Calcular tendências
    const trends = calculateTrends(currentStats, previousStats);

    // Criar resumo
    const summary: MetricsSummary = {
      period,
      current: currentStats,
      previous: previousStats,
      trends,
      insights: [],
    };

    // Gerar insights
    summary.insights = generateInsights(summary);

    return NextResponse.json({
      success: true,
      summary,
      timestamp: Date.now(),
    });
  } catch (err) {
    console.error("Erro ao gerar resumo de métricas:", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

/**
 * Busca rejeições por período
 */
async function getRejectionsByPeriod(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: ReturnType<typeof createClient<any, "public", any>>,
  startTime: number,
  endTime: number
) {
  const { data, error } = await supabase
    .from("plan_rejection_metrics")
    .select("reason, timestamp, context")
    .gte("timestamp", startTime)
    .lte("timestamp", endTime);

  if (error) {
    console.error("Erro ao buscar rejeições:", error);
    return [];
  }

  return (data || []).map((row) => ({
    reason: row.reason as RejectionReason,
    timestamp: row.timestamp,
    context: (row.context || {}) as Record<string, unknown>,
  }));
}

/**
 * Busca correções por período
 */
async function getCorrectionsByPeriod(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: ReturnType<typeof createClient<any, "public", any>>,
  startTime: number,
  endTime: number
): Promise<
  Array<{
    reason: CorrectionReason;
    context: Record<string, unknown>;
    payload?: unknown;
  }>
> {
  const { data, error } = await supabase
    .from("plan_correction_metrics")
    .select("reason, payload, context, created_at")
    .gte("created_at", new Date(startTime).toISOString())
    .lte("created_at", new Date(endTime).toISOString());

  if (error) {
    console.error("Erro ao buscar correções:", error);
    return [];
  }

  return (data || []).map((row) => ({
    reason: row.reason as CorrectionReason,
    context: (row.context || {}) as Record<string, unknown>,
    payload: row.payload,
  }));
}

/**
 * Busca métricas de qualidade por período
 */
async function getQualityByPeriod(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: ReturnType<typeof createClient<any, "public", any>>,
  startTime: number,
  endTime: number
) {
  const { data, error } = await supabase
    .from("plan_quality_metrics")
    .select(
      "quality_score, soft_warnings_count, flexible_warnings_count, context, created_at"
    )
    .gte("created_at", new Date(startTime).toISOString())
    .lte("created_at", new Date(endTime).toISOString());

  if (error) {
    console.error("Erro ao buscar métricas de qualidade:", error);
    return [];
  }

  return data || [];
}

/**
 * Calcula estatísticas do período atual
 */
function calculateCurrentStats(
  rejections: Array<{
    reason: RejectionReason;
    context: Record<string, unknown>;
  }>,
  corrections: Array<{
    reason: CorrectionReason;
    context: Record<string, unknown>;
    payload?: unknown;
  }>,
  quality: Array<{ quality_score: number; context: Record<string, unknown> }>
) {
  const totalRejections = rejections.length;
  const totalCorrections = corrections.length;
  const totalQualityMetrics = quality.length;

  // Calcular top motivos de rejeição
  const rejectionReasons: Record<string, number> = {};
  for (const r of rejections) {
    rejectionReasons[r.reason] = (rejectionReasons[r.reason] || 0) + 1;
  }
  const topRejectionReasons = Object.entries(rejectionReasons)
    .map(([reason, count]) => ({
      reason: reason as RejectionReason,
      count,
      percentage: totalRejections > 0 ? (count / totalRejections) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Calcular top motivos de correção
  const correctionReasons: Record<string, number> = {};
  for (const c of corrections) {
    correctionReasons[c.reason] = (correctionReasons[c.reason] || 0) + 1;
  }
  const topCorrectionReasons = Object.entries(correctionReasons)
    .map(([reason, count]) => ({
      reason: reason as CorrectionReason,
      count,
      percentage: totalCorrections > 0 ? (count / totalCorrections) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Calcular score médio de qualidade
  const averageQualityScore =
    quality.length > 0
      ? quality.reduce((sum, q) => sum + q.quality_score, 0) / quality.length
      : 0;

  // Calcular taxa de rejeição (assumindo que cada rejeição = 1 plano rejeitado)
  // Taxa = rejeições / (rejeições + planos válidos)
  // Planos válidos = métricas de qualidade (planos que passaram)
  const totalPlans = totalRejections + totalQualityMetrics;
  const rejectionRate =
    totalPlans > 0 ? (totalRejections / totalPlans) * 100 : 0;

  // Taxa de sucesso de correção (assumindo que correções = planos corrigidos com sucesso)
  const correctionSuccessRate =
    totalRejections > 0 ? (totalCorrections / totalRejections) * 100 : 0;

  // Agrupar por nível de atividade
  const byActivityLevel: Record<
    string,
    {
      rejections: number;
      corrections: number;
      qualityScore: number;
      qualityCount: number;
    }
  > = {};
  for (const r of rejections) {
    const level = (r.context.activityLevel as string) || "Não informado";
    if (!byActivityLevel[level]) {
      byActivityLevel[level] = {
        rejections: 0,
        corrections: 0,
        qualityScore: 0,
        qualityCount: 0,
      };
    }
    byActivityLevel[level].rejections++;
  }
  for (const c of corrections) {
    const level =
      (c.context as { activityLevel?: string })?.activityLevel ||
      "Não informado";
    if (!byActivityLevel[level]) {
      byActivityLevel[level] = {
        rejections: 0,
        corrections: 0,
        qualityScore: 0,
        qualityCount: 0,
      };
    }
    byActivityLevel[level].corrections++;
  }
  for (const q of quality) {
    const level =
      (q.context as { activityLevel?: string })?.activityLevel ||
      "Não informado";
    if (!byActivityLevel[level]) {
      byActivityLevel[level] = {
        rejections: 0,
        corrections: 0,
        qualityScore: 0,
        qualityCount: 0,
      };
    }
    byActivityLevel[level].qualityScore += q.quality_score;
    byActivityLevel[level].qualityCount++;
  }
  // Calcular média de qualidade por nível
  const byActivityLevelFinal: Record<
    string,
    { rejections: number; corrections: number; qualityScore: number }
  > = {};
  for (const [level, data] of Object.entries(byActivityLevel)) {
    byActivityLevelFinal[level] = {
      rejections: data.rejections,
      corrections: data.corrections,
      qualityScore:
        data.qualityCount > 0 ? data.qualityScore / data.qualityCount : 0,
    };
  }

  // Agrupar por tipo de dia
  const byDayType: Record<string, { rejections: number; corrections: number }> =
    {};
  for (const r of rejections) {
    const dayType = (r.context.dayType as string) || "Não informado";
    if (!byDayType[dayType]) {
      byDayType[dayType] = { rejections: 0, corrections: 0 };
    }
    byDayType[dayType].rejections++;
  }

  // Agrupar por músculo
  const byMuscle: Record<string, { rejections: number; corrections: number }> =
    {};
  for (const r of rejections) {
    const muscle = r.context.muscle as string;
    if (muscle) {
      if (!byMuscle[muscle]) {
        byMuscle[muscle] = { rejections: 0, corrections: 0 };
      }
      byMuscle[muscle].rejections++;
    }
  }
  for (const c of corrections) {
    const payload = c.payload as { muscle?: string };
    if (payload?.muscle) {
      if (!byMuscle[payload.muscle]) {
        byMuscle[payload.muscle] = { rejections: 0, corrections: 0 };
      }
      byMuscle[payload.muscle].corrections++;
    }
  }

  return {
    totalRejections,
    totalCorrections,
    totalQualityMetrics,
    averageQualityScore: Math.round(averageQualityScore * 10) / 10,
    topRejectionReasons,
    topCorrectionReasons,
    rejectionRate: Math.round(rejectionRate * 10) / 10,
    correctionSuccessRate: Math.round(correctionSuccessRate * 10) / 10,
    byActivityLevel: byActivityLevelFinal,
    byDayType,
    byMuscle,
  };
}

/**
 * Calcula estatísticas do período anterior
 */
function calculatePreviousStats(
  rejections: Array<{ reason: RejectionReason }>,
  corrections: Array<{ reason: CorrectionReason; payload?: unknown }>,
  quality: Array<{ quality_score: number }>
) {
  const totalRejections = rejections.length;
  const totalCorrections = corrections.length;
  const averageQualityScore =
    quality.length > 0
      ? quality.reduce((sum, q) => sum + q.quality_score, 0) / quality.length
      : 0;

  const totalPlans = totalRejections + quality.length;
  const rejectionRate =
    totalPlans > 0 ? (totalRejections / totalPlans) * 100 : 0;
  const correctionSuccessRate =
    totalRejections > 0 ? (totalCorrections / totalRejections) * 100 : 0;

  return {
    totalRejections,
    totalCorrections,
    averageQualityScore: Math.round(averageQualityScore * 10) / 10,
    rejectionRate: Math.round(rejectionRate * 10) / 10,
    correctionSuccessRate: Math.round(correctionSuccessRate * 10) / 10,
  };
}

/**
 * Calcula tendências comparando períodos
 */
function calculateTrends(
  current: ReturnType<typeof calculateCurrentStats>,
  previous?: ReturnType<typeof calculatePreviousStats>
) {
  if (!previous) {
    return {
      rejectionRate: "stable" as const,
      qualityScore: "stable" as const,
      correctionRate: "stable" as const,
    };
  }

  const rejectionRateChange = current.rejectionRate - previous.rejectionRate;
  const qualityScoreChange =
    current.averageQualityScore - previous.averageQualityScore;
  const correctionRateChange =
    current.correctionSuccessRate - previous.correctionSuccessRate;

  return {
    rejectionRate: (Math.abs(rejectionRateChange) < 2
      ? "stable"
      : rejectionRateChange > 0
        ? "increasing"
        : "decreasing") as "increasing" | "decreasing" | "stable",
    qualityScore: (Math.abs(qualityScoreChange) < 2
      ? "stable"
      : qualityScoreChange > 0
        ? "improving"
        : "degrading") as "stable" | "improving" | "degrading",
    correctionRate: (Math.abs(correctionRateChange) < 2
      ? "stable"
      : correctionRateChange > 0
        ? "increasing"
        : "decreasing") as "increasing" | "decreasing" | "stable",
  };
}
