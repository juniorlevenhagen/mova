import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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
    } = await createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ).auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
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

    // Buscar dieta salva do usuário
    const { data: savedDiet, error } = await supabaseUser
      .from("user_plans")
      .select("plan_data")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("❌ Erro ao buscar dieta:", error);
      return NextResponse.json(
        { error: "Erro ao buscar dieta" },
        { status: 500 }
      );
    }

    // Extrair dieta do plan_data se existir
    // Priorizar nutritionPlan (estruturado) sobre dietPlan (legacy)
    const dietData =
      savedDiet?.plan_data?.nutritionPlan ||
      savedDiet?.plan_data?.dietPlan ||
      null;

    return NextResponse.json({
      success: true,
      dietPlan: dietData,
    });
  } catch (error: unknown) {
    console.error("❌ Erro ao buscar dieta:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json(
      { error: "Erro interno: " + errorMessage },
      { status: 500 }
    );
  }
}

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
    } = await createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ).auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
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

    const body = await request.json();
    const { dietPlan } = body;

    if (!dietPlan) {
      return NextResponse.json(
        { error: "Dados da dieta são obrigatórios" },
        { status: 400 }
      );
    }

    // Buscar plano ativo do usuário
    const { data: existingPlan, error: fetchError } = await supabaseUser
      .from("user_plans")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      console.error("❌ Erro ao buscar plano:", fetchError);
      return NextResponse.json(
        { error: "Erro ao buscar plano" },
        { status: 500 }
      );
    }

    if (existingPlan) {
      // Atualizar plano existente com a dieta
      // Parse dietPlan se for string (legacy), ou usar diretamente se for objeto
      let nutritionPlanData;
      try {
        nutritionPlanData =
          typeof dietPlan === "string" ? JSON.parse(dietPlan) : dietPlan;
      } catch (e) {
        nutritionPlanData = dietPlan;
      }

      const updatedPlanData = {
        ...existingPlan.plan_data,
        nutritionPlan: nutritionPlanData, // Atualizar nutritionPlan no plano completo
        dietPlan: dietPlan, // Manter dietPlan para compatibilidade
      };

      const { error: updateError } = await supabaseUser
        .from("user_plans")
        .update({
          plan_data: updatedPlanData,
        })
        .eq("id", existingPlan.id);

      if (updateError) {
        console.error("❌ Erro ao atualizar plano com dieta:", updateError);
        return NextResponse.json(
          { error: "Erro ao salvar dieta" },
          { status: 500 }
        );
      }

      console.log("✅ Dieta salva no plano existente:", existingPlan.id);
      return NextResponse.json({
        success: true,
        message: "Dieta salva com sucesso",
      });
    } else {
      // Se não existe plano, criar um novo apenas com a dieta
      const { error: insertError } = await supabaseUser
        .from("user_plans")
        .insert({
          user_id: user.id,
          plan_data: {
            dietPlan: dietPlan,
          },
          plan_type: "diet_only",
          generated_at: new Date().toISOString(),
          expires_at: new Date(
            Date.now() + 90 * 24 * 60 * 60 * 1000
          ).toISOString(),
          is_active: true,
        });

      if (insertError) {
        console.error("❌ Erro ao criar plano com dieta:", insertError);
        return NextResponse.json(
          { error: "Erro ao salvar dieta" },
          { status: 500 }
        );
      }

      console.log("✅ Dieta salva em novo plano");
      return NextResponse.json({
        success: true,
        message: "Dieta salva com sucesso",
      });
    }
  } catch (error: unknown) {
    console.error("❌ Erro ao salvar dieta:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json(
      { error: "Erro interno: " + errorMessage },
      { status: 500 }
    );
  }
}

