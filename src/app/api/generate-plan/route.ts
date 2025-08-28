/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { supabase } from "@/lib/supabase";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

    // Obter o usuário atual
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

    console.log(
      "🎯 Iniciando geração de plano personalizado para:",
      user.email
    );

    // Criar cliente Supabase com token do usuário
    const authToken = authHeader.replace("Bearer ", "");
    const { createClient } = await import("@supabase/supabase-js");
    const supabaseUser = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      }
    );

    // 1. Buscar dados completos do usuário
    console.log("📊 Coletando dados do usuário...");

    // Perfil do usuário
    const { data: profile, error: profileError } = await supabaseUser
      .from("user_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (profileError) {
      return NextResponse.json(
        { error: "Perfil do usuário não encontrado" },
        { status: 404 }
      );
    }

    // Evoluções do usuário (últimas 10)
    const { data: evolutions, error: evolutionsError } = await supabaseUser
      .from("user_evolutions")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(10);

    // Atividades recentes (últimas 20)
    const { data: activities, error: activitiesError } = await supabaseUser
      .from("user_activities")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(20);

    // Metas do usuário
    const { data: goals, error: goalsError } = await supabaseUser
      .from("user_goals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    console.log("📋 Dados coletados:", {
      profile: !!profile,
      evolutions: evolutions?.length || 0,
      activities: activities?.length || 0,
      goals: goals?.length || 0,
    });

    // 🔒 VERIFICAR SE JÁ EXISTE PLANO VÁLIDO NO MÊS ATUAL
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const startOfMonth = new Date(currentYear, currentMonth, 1).toISOString();
    const endOfMonth = new Date(
      currentYear,
      currentMonth + 1,
      0,
      23,
      59,
      59
    ).toISOString();

    console.log("🔍 Verificando plano existente para:", {
      startOfMonth,
      endOfMonth,
    });

    // CONTROLE: Verificar se já há plano gerado nos últimos 30 dias
    console.log("🔍 Buscando plano gerado nos últimos 30 dias...");

    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    console.log(
      `📅 Buscando desde: ${thirtyDaysAgo.toLocaleDateString("pt-BR")}`
    );

    const { data: monthlyPlanResults, error: searchError } = await supabaseUser
      .from("user_evolutions")
      .select("*")
      .eq("user_id", user.id)
      .eq("objetivo", "Plano personalizado gerado")
      .gte("date", thirtyDaysAgo.toISOString().split("T")[0])
      .order("date", { ascending: false })
      .limit(1);

    const monthlyPlanCheck =
      monthlyPlanResults && monthlyPlanResults.length > 0
        ? monthlyPlanResults[0]
        : null;

    console.log("🔍 Resultado da busca:", {
      found: !!monthlyPlanCheck,
      count: monthlyPlanResults?.length || 0,
      error: searchError?.message,
      lastPlanDate: monthlyPlanCheck?.date || "nenhum",
    });

    if (monthlyPlanCheck) {
      console.log(
        "✅ Plano já foi gerado nos últimos 30 dias - retornando plano existente"
      );

      // Tentar extrair plano das observações
      let existingPlan = null;
      try {
        const planData = JSON.parse(monthlyPlanCheck.observacoes);
        if (planData.type === "monthly_plan" && planData.plan_data) {
          existingPlan = planData.plan_data;
          console.log("📋 Plano existente recuperado com sucesso!");
        }
      } catch (error) {
        console.warn(
          "⚠️ Marcador antigo detectado - não contém dados do plano"
        );
        console.log(
          "🔄 Permitindo regeneração para salvar o plano corretamente"
        );

        // Marcador antigo - deletar para permitir novo
        await supabaseUser
          .from("user_evolutions")
          .delete()
          .eq("id", monthlyPlanCheck.id);

        console.log("🗑️ Marcador antigo removido, continuando com geração...");
        // Continua para a geração normal
      }

      // Calcular dias restantes para próximo plano (30 dias após geração)
      let generatedDate;
      try {
        const planData = JSON.parse(monthlyPlanCheck.observacoes);
        generatedDate = new Date(planData.generated_at);
      } catch {
        // Fallback para data do marcador se não conseguir extrair
        generatedDate = new Date(monthlyPlanCheck.date + "T00:00:00");
      }

      const nextPlanDate = new Date(
        generatedDate.getTime() + 30 * 24 * 60 * 60 * 1000
      ); // +30 dias
      const daysUntilNext = Math.ceil(
        (nextPlanDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      console.log(
        `📅 Plano gerado em: ${generatedDate.toLocaleDateString("pt-BR")}`
      );
      console.log(
        `📅 Próximo plano em: ${nextPlanDate.toLocaleDateString(
          "pt-BR"
        )} (${daysUntilNext} dias)`
      );

      // Só retorna se encontrou um plano válido
      if (existingPlan) {
        // Retorna o plano existente
        return NextResponse.json({
          success: true,
          message: "Plano do mês atual recuperado!",
          plan: existingPlan,
          planId: monthlyPlanCheck.id,
          isExisting: true,
          generatedAt: monthlyPlanCheck.date,
          daysUntilNext,
          nextPlanAvailable: nextPlanDate.toISOString().split("T")[0],
        });
      }

      // Se chegou aqui, é porque o marcador antigo foi removido
      // Continua para gerar novo plano
    }

    console.log("🆕 Nenhum plano encontrado no mês atual, gerando novo...");

    // 2. Preparar dados para OpenAI
    const userData = {
      // Dados básicos
      age: profile.age,
      gender: profile.gender,
      height: profile.height,
      weight: profile.weight,
      initialWeight: profile.initial_weight,

      // Objetivos e preferências
      objective: profile.objective,
      trainingFrequency: profile.training_frequency,
      trainingLocation: profile.training_location,

      // Restrições
      hasPain: profile.has_pain,
      dietaryRestrictions: profile.dietary_restrictions,

      // Histórico de evolução
      latestEvolution: evolutions?.[0] || null,
      evolutionHistory: evolutions || [],

      // Atividades recentes
      recentActivities: activities || [],

      // Metas
      currentGoals: goals || [],

      // Cálculos
      imc:
        profile.height && profile.weight
          ? (profile.weight / Math.pow(profile.height / 100, 2)).toFixed(1)
          : null,
      weightChange:
        profile.weight && profile.initial_weight
          ? (profile.weight - profile.initial_weight).toFixed(1)
          : null,
    };

    console.log("🤖 Enviando dados para OpenAI...");

    // 3. Gerar plano com OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Você é um personal trainer e nutricionista especialista. 
          
Crie um plano COMPLETO e PERSONALIZADO baseado nos dados do usuário, incluindo:

1. ANÁLISE PERSONALIZADA
- Análise do perfil atual
- Pontos fortes e áreas de melhoria
- Considerações especiais

2. PLANO DE TREINO DETALHADO
- Cronograma semanal específico
- Exercícios por dia com séries, repetições e descanso
- Progressão gradual
- Adaptações para local de treino
- Considerações para dores/limitações

3. PLANO ALIMENTAR COMPLETO
- Calorias diárias recomendadas
- Distribuição de macronutrientes
- Cardápio semanal com opções
- Suplementação se necessária
- Adaptações para restrições alimentares

4. METAS E ACOMPANHAMENTO
- Metas semanais e mensais
- Indicadores de progresso
- Ajustes recomendados

Seja específico, prático e motivacional. Use dados reais do usuário.`,
        },
        {
          role: "user",
          content: `Dados do usuário: ${JSON.stringify(userData, null, 2)}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "personalized_plan",
          schema: {
            type: "object",
            properties: {
              analysis: {
                type: "object",
                properties: {
                  currentStatus: { type: "string" },
                  strengths: { type: "array", items: { type: "string" } },
                  improvements: { type: "array", items: { type: "string" } },
                  specialConsiderations: {
                    type: "array",
                    items: { type: "string" },
                  },
                },
                required: ["currentStatus", "strengths", "improvements"],
              },
              trainingPlan: {
                type: "object",
                properties: {
                  overview: { type: "string" },
                  weeklySchedule: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        day: { type: "string" },
                        type: { type: "string" },
                        exercises: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              name: { type: "string" },
                              sets: { type: "string" },
                              reps: { type: "string" },
                              rest: { type: "string" },
                              notes: { type: "string" },
                            },
                            required: ["name", "sets", "reps", "rest"],
                          },
                        },
                      },
                      required: ["day", "type", "exercises"],
                    },
                  },
                  progression: { type: "string" },
                },
                required: ["overview", "weeklySchedule", "progression"],
              },
              nutritionPlan: {
                type: "object",
                properties: {
                  dailyCalories: { type: "number" },
                  macros: {
                    type: "object",
                    properties: {
                      protein: { type: "string" },
                      carbs: { type: "string" },
                      fats: { type: "string" },
                    },
                    required: ["protein", "carbs", "fats"],
                  },
                  mealPlan: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        meal: { type: "string" },
                        options: { type: "array", items: { type: "string" } },
                        timing: { type: "string" },
                      },
                      required: ["meal", "options", "timing"],
                    },
                  },
                  supplements: { type: "array", items: { type: "string" } },
                  hydration: { type: "string" },
                },
                required: ["dailyCalories", "macros", "mealPlan", "hydration"],
              },
              goals: {
                type: "object",
                properties: {
                  weekly: { type: "array", items: { type: "string" } },
                  monthly: { type: "array", items: { type: "string" } },
                  tracking: { type: "array", items: { type: "string" } },
                },
                required: ["weekly", "monthly", "tracking"],
              },
              motivation: {
                type: "object",
                properties: {
                  personalMessage: { type: "string" },
                  tips: { type: "array", items: { type: "string" } },
                },
                required: ["personalMessage", "tips"],
              },
            },
            required: [
              "analysis",
              "trainingPlan",
              "nutritionPlan",
              "goals",
              "motivation",
            ],
          },
        },
      },
    });

    let plan;
    try {
      const rawContent = completion.choices[0].message.content || "{}";
      console.log("📝 Tamanho da resposta OpenAI:", rawContent.length);
      plan = JSON.parse(rawContent);
    } catch (jsonError: any) {
      console.error("❌ Erro ao parsear JSON da OpenAI:", jsonError.message);
      console.error(
        "📄 Primeiros 500 chars:",
        completion.choices[0].message.content?.substring(0, 500)
      );
      console.error(
        "📄 Últimos 500 chars:",
        completion.choices[0].message.content?.substring(-500)
      );

      // Tentar extrair JSON válido
      try {
        const content = completion.choices[0].message.content || "";
        const jsonStart = content.indexOf("{");
        const jsonEnd = content.lastIndexOf("}") + 1;
        if (jsonStart >= 0 && jsonEnd > jsonStart) {
          const cleanJson = content.substring(jsonStart, jsonEnd);
          plan = JSON.parse(cleanJson);
          console.log("✅ JSON extraído e parseado com sucesso!");
        } else {
          throw new Error("Não foi possível extrair JSON válido");
        }
      } catch (extractError) {
        console.error("❌ Falha ao extrair JSON:", extractError);
        return NextResponse.json(
          { error: "OpenAI retornou resposta inválida. Tente novamente." },
          { status: 500 }
        );
      }
    }
    console.log("✅ Plano gerado com sucesso!");

    // 4. Criar marcador de controle mensal simples
    console.log("💾 Criando marcador de controle mensal...");

    const markerData = {
      user_id: user.id,
      date: new Date().toISOString().split("T")[0],
      objetivo: "Plano personalizado gerado",
      observacoes: JSON.stringify({
        type: "monthly_plan",
        generated_at: new Date().toISOString(),
        plan_data: plan,
      }),
      bem_estar: 5,
    };

    console.log("📋 Dados do marcador:", markerData);

    const { data: planMarker, error: markerError } = await supabaseUser
      .from("user_evolutions")
      .insert(markerData)
      .select();

    if (markerError) {
      console.warn(
        "⚠️ Erro ao criar marcador de controle mensal:",
        markerError
      );
      console.warn("⚠️ Código do erro:", markerError.code);
      console.warn("⚠️ Detalhes do erro:", markerError.details);
    } else {
      console.log(
        "💾 Marcador de controle mensal criado:",
        planMarker?.[0]?.id
      );
    }

    return NextResponse.json({
      success: true,
      message: "Plano personalizado gerado com sucesso!",
      plan,
      planId: planMarker?.[0]?.id || null,
    });
  } catch (error: any) {
    console.error("❌ Erro ao gerar plano:", error);
    return NextResponse.json(
      { error: "Erro interno: " + error.message },
      { status: 500 }
    );
  }
}
