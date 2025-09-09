import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
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

    // Criar cliente Supabase autenticado
    const { createClient } = await import("@supabase/supabase-js");
    const supabaseUser = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    const testPlan = {
      treino: {
        exercicios: [
          {
            nome: "Teste Push-up",
            series: 3,
            repeticoes: 10,
            descanso: "1 min",
          },
        ],
      },
      nutricao: {
        refeicoes: [
          {
            nome: "Café da manhã teste",
            alimentos: ["Aveia", "Banana"],
          },
        ],
      },
    };

    const generatedAt = new Date().toISOString();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90);

    console.log("🧪 TESTE DIRETO: Inserindo na user_plans...");
    console.log("🔍 user_id:", user.id);
    console.log("🔍 generated_at:", generatedAt);
    console.log("🔍 expires_at:", expiresAt.toISOString());

    const { data: savedPlan, error: planSaveError } = await supabaseUser
      .from("user_plans")
      .insert({
        user_id: user.id,
        plan_data: testPlan,
        plan_type: "test_direct",
        generated_at: generatedAt,
        expires_at: expiresAt.toISOString(),
        is_active: true,
      })
      .select()
      .maybeSingle();

    if (planSaveError) {
      console.error("❌ TESTE: Erro ao salvar plano:", planSaveError);
      return NextResponse.json({
        success: false,
        error: planSaveError.message,
        error_code: planSaveError.code,
        details: planSaveError,
      });
    } else {
      console.log("✅ TESTE: Plano salvo com sucesso:", savedPlan?.id);

      // Verificar se realmente foi salvo
      const { data: verifyPlan } = await supabaseUser
        .from("user_plans")
        .select("*")
        .eq("id", savedPlan?.id)
        .maybeSingle();

      return NextResponse.json({
        success: true,
        message: "Plano teste inserido com sucesso na user_plans",
        plan_id: savedPlan?.id,
        verification: verifyPlan
          ? "✅ Confirmado no banco"
          : "❌ Não encontrado no banco",
        plan_data: savedPlan,
      });
    }
  } catch (error) {
    console.error("❌ TESTE: Erro inesperado:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor", details: error },
      { status: 500 }
    );
  }
}

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

    return NextResponse.json({
      user_id: user.id,
      user_email: user.email,
      user_plans_count: userPlans?.length || 0,
      user_plans_data: userPlans || [],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Erro ao buscar user_plans:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
