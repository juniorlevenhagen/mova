import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseClient(token?: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Supabase URL ou ANON KEY não configuradas");
  }

  return createClient(
    url,
    anonKey,
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

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Supabase SERVICE_ROLE_KEY não configurada");
  }

  return createClient(url, serviceKey);
}

export async function GET(request: NextRequest) {
  try {
    // 🔐 Autenticação
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "Token de autorização não encontrado" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    const supabase = getSupabaseClient(token);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Token inválido ou usuário não autenticado" },
        { status: 401 }
      );
    }

    // 🔑 Client admin (após auth OK)
    const supabaseAdmin = getSupabaseAdmin();

    const { data: corrections, error } = await supabaseAdmin
      .from("plan_correction_metrics")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;

    const stats = {
      total: corrections.length,
      byReason: corrections.reduce<Record<string, number>>((acc, curr) => {
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
