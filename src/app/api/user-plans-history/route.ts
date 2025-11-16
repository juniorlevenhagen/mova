import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

    // Criar cliente Supabase com token do usuário
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

    // Buscar os últimos 5 planos do usuário
    const { data: userPlans, error: plansError } = await supabaseUser
      .from("user_plans")
      .select("id, plan_data, plan_type, generated_at, expires_at, is_active")
      .eq("user_id", user.id)
      .order("generated_at", { ascending: false })
      .limit(5);

    if (plansError) {
      console.error("❌ Erro ao buscar planos:", plansError);
      return NextResponse.json(
        { error: "Erro ao buscar planos" },
        { status: 500 }
      );
    }

    // Formatar dados para retorno
    const formattedPlans = (userPlans || []).map((plan) => ({
      id: plan.id,
      planData: plan.plan_data,
      planType: plan.plan_type,
      generatedAt: plan.generated_at,
      expiresAt: plan.expires_at,
      isActive: plan.is_active,
      // Extrair informações resumidas do plano
      summary: {
        hasTrainingPlan: !!plan.plan_data?.trainingPlan,
        hasNutritionPlan: !!plan.plan_data?.nutritionPlan,
        hasAnalysis: !!plan.plan_data?.analysis,
        objective: plan.plan_data?.goals?.objective || plan.plan_data?.analysis?.objective || null,
      },
    }));

    return NextResponse.json({
      success: true,
      plans: formattedPlans,
      count: formattedPlans.length,
    });
  } catch (error) {
    console.error("❌ Erro ao buscar histórico de planos:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

