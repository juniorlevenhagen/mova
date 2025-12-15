import { NextRequest, NextResponse } from "next/server";
import {
  planRejectionMetrics,
  recordPlanRejection,
  type RejectionReason,
} from "@/lib/metrics/planRejectionMetrics";

/**
 * Endpoint de teste para verificar persistência de métricas
 *
 * GET /api/test-metrics - Verifica status da persistência
 * POST /api/test-metrics - Cria uma métrica de teste
 */
export async function GET() {
  try {
    const persistenceEnabled = planRejectionMetrics.isPersistenceEnabled();
    const stats = planRejectionMetrics.getStatistics();

    return NextResponse.json({
      success: true,
      persistenceEnabled,
      metricsInMemory: stats.total,
      message: persistenceEnabled
        ? "Persistência em banco habilitada"
        : "Persistência em banco desabilitada (usando memória)",
      statistics: {
        total: stats.total,
        byReason: Object.keys(stats.byReason).length,
        byActivityLevel: Object.keys(stats.byActivityLevel).length,
        byDayType: Object.keys(stats.byDayType).length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao verificar métricas",
        details: String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const reason = body.reason || "excesso_exercicios_nivel";
    const context = body.context || {
      activityLevel: "Iniciante",
      exerciseCount: 9,
      dayType: "Upper",
    };

    // Registrar uma métrica de teste
    await recordPlanRejection(
      reason as Parameters<typeof recordPlanRejection>[0],
      context
    );

    // Verificar se foi registrada
    const stats = planRejectionMetrics.getStatistics();

    return NextResponse.json({
      success: true,
      message: "Métrica de teste registrada com sucesso",
      registered: {
        reason,
        context,
        timestamp: Date.now(),
      },
      currentStats: {
        total: stats.total,
        byReason: stats.byReason[reason as RejectionReason] || 0,
      },
      persistenceEnabled: planRejectionMetrics.isPersistenceEnabled(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao registrar métrica de teste",
        details: String(error),
      },
      { status: 500 }
    );
  }
}
