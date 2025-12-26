import { NextRequest, NextResponse } from "next/server";
import { planRejectionMetrics } from "@/lib/metrics/planRejectionMetrics";
import { supabase } from "@/lib/supabase";

/**
 * Endpoint para consultar métricas de rejeição de planos
 *
 * REQUER AUTENTICAÇÃO: Apenas usuários autenticados podem acessar
 *
 * GET /api/metrics/plan-rejections
 * Headers:
 *   - Authorization: Bearer <token>
 * Query params:
 *   - period: "all" | "24h" (default: "all")
 *   - source: "db" | "memory" (default: "db" - tenta banco primeiro)
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
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get("period") || "all";
    const source = searchParams.get("source") || "db";

    let statistics;

    // Tentar usar banco de dados se disponível, senão usar memória
    const useDB =
      source === "db" && planRejectionMetrics.isPersistenceEnabled();

    if (period === "24h") {
      if (useDB) {
        statistics =
          await planRejectionMetrics.getLast24HoursStatisticsFromDB();
      } else {
        statistics = planRejectionMetrics.getLast24HoursStatistics();
      }
    } else {
      if (useDB) {
        statistics = await planRejectionMetrics.getStatisticsFromDB();
      } else {
        statistics = planRejectionMetrics.getStatistics();
      }
    }

    return NextResponse.json({
      success: true,
      period,
      source: useDB ? "database" : "memory",
      persistenceEnabled: planRejectionMetrics.isPersistenceEnabled(),
      statistics,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Erro ao obter métricas de rejeição:", error);

    // Fallback para memória se o banco falhar
    try {
      const period = request.nextUrl.searchParams.get("period") || "all";
      let statistics;

      if (period === "24h") {
        statistics = planRejectionMetrics.getLast24HoursStatistics();
      } else {
        statistics = planRejectionMetrics.getStatistics();
      }

      return NextResponse.json({
        success: true,
        period,
        source: "memory",
        persistenceEnabled: false,
        statistics,
        timestamp: Date.now(),
        warning: "Banco de dados não disponível, usando dados em memória",
      });
    } catch {
      return NextResponse.json(
        { error: "Erro ao obter métricas", details: String(error) },
        { status: 500 }
      );
    }
  }
}
