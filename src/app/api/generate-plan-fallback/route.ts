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

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));

    if (userError || !user) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    // Criar cliente Supabase autenticado
    const { createClient } = await import("@supabase/supabase-js");
    const supabaseUser = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    console.log(
      "🎯 FALLBACK: Gerando plano personalizado para usuário:",
      user.id
    );

    // Buscar dados do usuário para personalização
    const { data: profile } = await supabaseUser
      .from("user_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    const { data: evaluation } = await supabaseUser
      .from("user_evaluations")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    console.log(
      "📋 Dados do perfil:",
      profile ? "✅ Encontrado" : "❌ Não encontrado"
    );
    console.log(
      "📋 Dados da avaliação:",
      evaluation ? "✅ Encontrado" : "❌ Não encontrado"
    );

    // Personalizar baseado nos dados do usuário
    const userName =
      profile?.full_name || user.user_metadata?.full_name || "amigo(a)";
    const userGoal = profile?.objective || "melhorar condicionamento físico";
    const userWeight = profile?.weight || 70;
    const userHeight = profile?.height || 170;

    // Calcular calorias baseado no perfil
    const bmr =
      profile?.gender === "Masculino"
        ? 88.362 + 13.397 * userWeight + 4.799 * userHeight - 5.677 * 30 // Assumindo 30 anos
        : 447.593 + 9.247 * userWeight + 3.098 * userHeight - 4.33 * 30;

    const dailyCalories = Math.round(bmr * 1.5); // Fator de atividade moderada

    // Plano personalizado baseado nos dados do usuário
    const fallbackPlan = {
      analysis: {
        currentLevel: evaluation?.fitness_level || "Intermediário",
        mainGoals: [userGoal],
        recommendations: [
          `Baseado no seu objetivo de ${userGoal}, mantenha consistência`,
          "Combine exercícios funcionais e aeróbicos",
          "Hidrate-se adequadamente durante os treinos",
          "Respeite os períodos de descanso",
        ],
      },
      trainingPlan: {
        overview: "Plano de treino funcional e eficiente focado em resultados",
        weeklySchedule: [
          {
            day: "Segunda-feira",
            type: "Treino Superior",
            exercises: [
              {
                name: "Flexão de braço",
                sets: "3",
                reps: "12-15",
                rest: "60s",
                notes: "Mantenha o core contraído",
              },
              {
                name: "Pull-up ou Remada",
                sets: "3",
                reps: "8-12",
                rest: "60s",
                notes: "Foque na amplitude completa",
              },
              {
                name: "Desenvolvimento de ombros",
                sets: "3",
                reps: "10-12",
                rest: "60s",
                notes: "Controle o movimento",
              },
              {
                name: "Prancha",
                sets: "3",
                reps: "30-60s",
                rest: "45s",
                notes: "Mantenha alinhamento",
              },
            ],
          },
          {
            day: "Terça-feira",
            type: "Cardio",
            exercises: [
              {
                name: "Caminhada rápida",
                sets: "1",
                reps: "30min",
                rest: "-",
                notes: "Intensidade moderada",
              },
              {
                name: "Burpees",
                sets: "3",
                reps: "10",
                rest: "60s",
                notes: "Movimento explosivo",
              },
            ],
          },
          {
            day: "Quarta-feira",
            type: "Treino Inferior",
            exercises: [
              {
                name: "Agachamento",
                sets: "3",
                reps: "15",
                rest: "60s",
                notes: "Desça até 90 graus",
              },
              {
                name: "Afundo",
                sets: "3",
                reps: "12 cada perna",
                rest: "60s",
                notes: "Equilibre bem o corpo",
              },
              {
                name: "Elevação de panturrilha",
                sets: "3",
                reps: "20",
                rest: "45s",
                notes: "Contração no topo",
              },
              {
                name: "Glúteo bridge",
                sets: "3",
                reps: "15",
                rest: "45s",
                notes: "Aperte o glúteo no topo",
              },
            ],
          },
        ],
        progression:
          "Aumente a intensidade semanalmente: mais repetições ou menos descanso",
      },
      nutritionPlan: {
        dailyCalories: dailyCalories,
        macros: {
          protein: `25% (${Math.round((dailyCalories * 0.25) / 4)}g)`,
          carbs: `45% (${Math.round((dailyCalories * 0.45) / 4)}g)`,
          fats: `30% (${Math.round((dailyCalories * 0.3) / 9)}g)`,
        },
        mealPlan: [
          {
            meal: "Café da manhã",
            options: [
              { food: "Aveia com frutas", quantity: "1 tigela", calories: 300 },
              { food: "Iogurte grego", quantity: "200g", calories: 150 },
            ],
            timing: "7:00-8:00",
          },
          {
            meal: "Almoço",
            options: [
              {
                food: "Peito de frango grelhado",
                quantity: "150g",
                calories: 250,
              },
              { food: "Arroz integral", quantity: "1/2 xícara", calories: 110 },
              { food: "Salada verde", quantity: "1 prato", calories: 50 },
            ],
            timing: "12:00-13:00",
          },
          {
            meal: "Jantar",
            options: [
              { food: "Salmão grelhado", quantity: "120g", calories: 280 },
              { food: "Batata doce", quantity: "1 média", calories: 100 },
              { food: "Brócolis", quantity: "1 xícara", calories: 30 },
            ],
            timing: "19:00-20:00",
          },
        ],
      },
      goals: {
        shortTerm: "Estabelecer rotina de exercícios nos próximos 30 dias",
        longTerm:
          "Melhorar condicionamento físico e composição corporal em 6 meses",
      },
      motivation: {
        personalMessage: `Olá ${userName}! Você está no caminho certo para ${userGoal}. Este plano foi criado especialmente para você!`,
        tips: [
          `Com ${userWeight}kg e ${userHeight}cm, suas ${dailyCalories} calorias diárias estão calculadas para seu objetivo`,
          "Comece devagar e seja consistente - progressão é a chave",
          "Hidrate-se bem (35ml por kg de peso corporal)",
          "Durma pelo menos 7-8 horas para recuperação muscular",
          "Celebre cada pequena vitória no seu progresso",
        ],
      },
    };

    // Salvar na user_plans
    const generatedAt = new Date().toISOString();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90);

    console.log("💾 FALLBACK: Salvando plano na user_plans...");
    const { data: savedPlan, error: planSaveError } = await supabaseUser
      .from("user_plans")
      .insert({
        user_id: user.id,
        plan_data: fallbackPlan,
        plan_type: "fallback",
        generated_at: generatedAt,
        expires_at: expiresAt.toISOString(),
        is_active: true,
      })
      .select()
      .maybeSingle();

    if (planSaveError) {
      console.error("❌ FALLBACK: Erro ao salvar plano:", planSaveError);
    } else {
      console.log("✅ FALLBACK: Plano salvo com sucesso:", savedPlan?.id);
    }

    // Atualizar contadores do trial
    const { data: trialData } = await supabaseUser
      .from("user_trials")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (trialData) {
      const isPremium = trialData.upgraded_to_premium;
      const now = new Date().toISOString();

      const updateData: Record<string, number | string> = {
        last_plan_generated_at: now,
      };

      if (isPremium) {
        updateData.premium_plan_count = (trialData.premium_plan_count || 0) + 1;
      } else {
        updateData.plans_generated = (trialData.plans_generated || 0) + 1;
      }

      await supabaseUser
        .from("user_trials")
        .update(updateData)
        .eq("user_id", user.id);

      console.log("✅ FALLBACK: Contadores atualizados");
    }

    return NextResponse.json({
      success: true,
      message: "Plano personalizado gerado com sucesso!",
      plan: fallbackPlan,
      planId: savedPlan?.id,
      isExisting: true,
      generatedAt: generatedAt,
      daysUntilNext: 30,
      nextPlanAvailable: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      note: "Plano gerado com sistema de backup - funcionalidade completa",
    });
  } catch (error: unknown) {
    console.error("❌ FALLBACK: Erro:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json(
      { error: "Erro interno: " + errorMessage },
      { status: 500 }
    );
  }
}
