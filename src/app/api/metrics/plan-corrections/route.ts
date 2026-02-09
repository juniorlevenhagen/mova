import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseClient(token?: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Supabase URL e/ou chave não encontradas");
  }
  return createClient(
    url,
    key,
    token
      ? {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        }
      : undefined
  );
}

/**
 * Endpoint para consultar métricas de correção de planos
 *
 * REQUER AUTENTICAÇÃO: Apenas usuários autenticados podem acessar
 *
 * GET /api/metrics/plan-corrections
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

    // Usar service role key para acessar dados (já validamos autenticação acima)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar as últimas 100 correções
    const { data: corrections, error } = await supabaseAdmin
      .from("plan_correction_metrics")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;

    // Agrupar estatísticas básicas
    const stats = {
      total: corrections.length,
      byReason: corrections.reduce((acc: Record<string, number>, curr) => {
        acc[curr.reason] = (acc[curr.reason] || 0) + 1;
        return acc;
      }, {}),
      recent: corrections.slice(0, 10),
    };

    return NextResponse.json({ success: true, stats, corrections });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
