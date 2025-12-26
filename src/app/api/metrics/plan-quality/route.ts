import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Endpoint para consultar métricas de qualidade de planos
 *
 * REQUER AUTENTICAÇÃO: Apenas usuários autenticados podem acessar
 *
 * GET /api/metrics/plan-quality
 * Headers:
 *   - Authorization: Bearer <token>
 * Query params:
 *   - limit: número de registros (default: 100)
 *   - minScore: score mínimo para filtrar (default: 0)
 *   - maxScore: score máximo para filtrar (default: 100)
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

    // Verificar configuração do Supabase
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: "Configuração do Supabase ausente" },
        { status: 500 }
      );
    }

    // Usar service role key para acessar dados (já validamos autenticação acima)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const minScore = parseInt(searchParams.get("minScore") || "0", 10);
    const maxScore = parseInt(searchParams.get("maxScore") || "100", 10);

    // Buscar métricas de qualidade
    const query = supabaseAdmin
      .from("plan_quality_metrics")
      .select("*")
      .gte("quality_score", minScore)
      .lte("quality_score", maxScore)
      .order("created_at", { ascending: false })
      .limit(limit);

    const { data: metrics, error } = await query;

    if (error) throw error;

    // Calcular estatísticas agregadas
    const stats = {
      total: metrics.length,
      averageScore:
        metrics.length > 0
          ? Math.round(
              metrics.reduce((sum, m) => sum + m.quality_score, 0) /
                metrics.length
            )
          : 0,
      totalSoftWarnings: metrics.reduce(
        (sum, m) => sum + (m.soft_warnings_count || 0),
        0
      ),
      totalFlexibleWarnings: metrics.reduce(
        (sum, m) => sum + (m.flexible_warnings_count || 0),
        0
      ),
      byScoreRange: {
        excellent: metrics.filter((m) => m.quality_score >= 90).length,
        good: metrics.filter(
          (m) => m.quality_score >= 80 && m.quality_score < 90
        ).length,
        acceptable: metrics.filter(
          (m) => m.quality_score >= 70 && m.quality_score < 80
        ).length,
        needsImprovement: metrics.filter((m) => m.quality_score < 70).length,
      },
      softWarningsByType: metrics.reduce(
        (acc: Record<string, number>, curr) => {
          const warningsByType = curr.soft_warnings_by_type || {};
          for (const [type, count] of Object.entries(warningsByType)) {
            acc[type] = (acc[type] || 0) + (count as number);
          }
          return acc;
        },
        {}
      ),
      byActivityLevel: metrics.reduce((acc: Record<string, number>, curr) => {
        const level =
          (curr.context as { activityLevel?: string })?.activityLevel ||
          "Não informado";
        acc[level] = (acc[level] || 0) + 1;
        return acc;
      }, {}),
    };

    return NextResponse.json({
      success: true,
      stats,
      metrics,
      timestamp: Date.now(),
    });
  } catch (err) {
    console.error("Erro ao buscar métricas de qualidade:", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
