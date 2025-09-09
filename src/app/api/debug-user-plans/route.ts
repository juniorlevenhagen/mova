import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

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
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    // Buscar dados nas tabelas relevantes
    const { data: userPlans } = await supabase
      .from("user_plans")
      .select("*")
      .eq("user_id", user.id)
      .order("generated_at", { ascending: false });

    const { data: userTrials } = await supabase
      .from("user_trials")
      .select("*")
      .eq("user_id", user.id);

    const { data: userEvolutions } = await supabase
      .from("user_evolutions")
      .select("*")
      .eq("user_id", user.id)
      .eq("objetivo", "Plano personalizado gerado")
      .order("date", { ascending: false })
      .limit(5);

    return NextResponse.json({
      user_id: user.id,
      user_email: user.email,
      user_plans: {
        count: userPlans?.length || 0,
        data: userPlans || [],
      },
      user_trials: {
        count: userTrials?.length || 0,
        data: userTrials || [],
      },
      user_evolutions_plans: {
        count: userEvolutions?.length || 0,
        data: userEvolutions || [],
      },
      debug_info: {
        timestamp: new Date().toISOString(),
        tables_checked: ["user_plans", "user_trials", "user_evolutions"],
      },
    });
  } catch (error) {
    console.error("❌ Erro ao buscar dados de debug:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
