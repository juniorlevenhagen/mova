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

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "Token de autorização não encontrado" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const supabase = getSupabaseClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const supabaseUser = getSupabaseClient(token);

    const { data, error } = await supabaseUser
      .from("user_plans")
      .select("*")
      .eq("user_id", user.id)
      .order("generated_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Normalizar e enriquecer os dados para o frontend
    const formattedPlans = data.map((p) => {
      const planData = p.plan_data || {};
      return {
        id: p.id,
        planData: planData,
        planType: p.plan_type,
        generatedAt: p.generated_at,
        expiresAt: p.expires_at,
        isActive: p.is_active,
        summary: {
          hasTrainingPlan: !!planData.trainingPlan,
          hasNutritionPlan: !!planData.nutritionPlan,
          hasAnalysis: !!planData.analysis,
          objective: planData.analysis?.currentStatus || null,
        },
      };
    });

    return NextResponse.json(
      { success: true, plans: formattedPlans },
      { status: 200 }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro interno" },
      { status: 500 }
    );
  }
}
