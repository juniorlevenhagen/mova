/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { supabase } from "@/lib/supabase";

// Função para criar cliente OpenAI apenas quando necessário
function createOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not configured");
  }
  return new OpenAI({ apiKey });
}

// GET: Verificar se já existe um plano
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

    // Buscar plano existente nos últimos 30 dias
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const supabaseUser = supabase;
    const { data: monthlyPlanResults } = await supabaseUser
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

    if (monthlyPlanCheck) {
      // Tentar extrair plano das observações
      let existingPlan = null;
      try {
        const planData = JSON.parse(monthlyPlanCheck.observacoes);
        if (planData.type === "monthly_plan" && planData.plan_data) {
          existingPlan = planData.plan_data;
        }
      } catch {
        console.warn(
          "⚠️ Marcador antigo detectado - não contém dados do plano"
        );
      }

      const planGeneratedAt = new Date(monthlyPlanCheck.date);
      const nextPlanDate = new Date(planGeneratedAt);
      nextPlanDate.setDate(nextPlanDate.getDate() + 30);

      const daysUntilNext = Math.ceil(
        (nextPlanDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      return NextResponse.json({
        planStatus: {
          isExisting: true,
          generatedAt: monthlyPlanCheck.date,
          daysUntilNext,
          nextPlanAvailable: nextPlanDate.toISOString().split("T")[0],
        },
        plan: existingPlan,
      });
    } else {
      return NextResponse.json({
        planStatus: {
          isExisting: false,
        },
      });
    }
  } catch (error) {
    console.error("❌ Erro ao verificar plano:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
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

    // Perfil do usuário
    const { data: profile, error: profileError } = await supabaseUser
      .from("user_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json(
        { error: "Perfil do usuário não encontrado" },
        { status: 404 }
      );
    }

    // Evoluções do usuário (últimas 10)
    const { data: evolutions } = await supabaseUser
      .from("user_evolutions")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(10);

    // Atividades recentes (últimas 20)
    const { data: activities } = await supabaseUser
      .from("user_activities")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(20);

    // Metas do usuário
    const { data: goals } = await supabaseUser
      .from("user_goals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    // 🔒 VERIFICAR STATUS DO TRIAL
    const { data: trialData, error: trialError } = await supabaseUser
      .from("user_trials")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle(); // Usar maybeSingle() em vez de single()

    if (trialError) {
      return NextResponse.json(
        { error: "Erro ao verificar status do trial" },
        { status: 500 }
      );
    }

    // Lógica de verificação do trial
    let canGenerate = true;
    let trialMessage = "";

    if (!trialData) {
      // Usuário novo - pode gerar 1 plano grátis
      canGenerate = true;
      trialMessage = "Plano grátis";
    } else {
      const isPremium = trialData.upgraded_to_premium;
      const plansGenerated = trialData.plans_generated || 0;

      if (isPremium) {
        // Usuário premium - 2 planos por mês
        const maxPlansPerMonth = trialData.premium_max_plans_per_cycle || 2;
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const lastPlanDate = trialData.last_plan_generated_at
          ? new Date(trialData.last_plan_generated_at)
          : null;

        const isNewMonth =
          !lastPlanDate ||
          lastPlanDate.getMonth() !== currentMonth ||
          lastPlanDate.getFullYear() !== currentYear;

        const plansRemaining = isNewMonth
          ? maxPlansPerMonth
          : Math.max(0, maxPlansPerMonth - plansGenerated);

        canGenerate = plansRemaining > 0;
        trialMessage = `Premium: ${plansRemaining} de ${maxPlansPerMonth} planos restantes`;
      } else {
        // Usuário grátis - 1 plano total
        const maxPlans = 1; // Usuários grátis só podem gerar 1 plano
        const plansRemaining = Math.max(0, maxPlans - plansGenerated);

        canGenerate = plansRemaining > 0;
        trialMessage =
          plansRemaining > 0 ? "Plano grátis" : "Plano grátis já utilizado";
      }
    }

    if (!canGenerate) {
      return NextResponse.json(
        {
          error: "TRIAL_LIMIT_REACHED",
          message:
            "Você atingiu o limite de planos. Faça upgrade para continuar gerando planos personalizados!",
          trialMessage,
        },
        { status: 403 }
      );
    }

    // 🔒 VERIFICAR SE JÁ EXISTE PLANO VÁLIDO NO MÊS ATUAL
    const currentDate = new Date();

    // CONTROLE: Verificar se já há plano gerado nos últimos 30 dias

    const thirtyDaysAgo = new Date(
      currentDate.getTime() - 30 * 24 * 60 * 60 * 1000
    );

    const { data: monthlyPlanResults } = await supabaseUser
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

    if (monthlyPlanCheck) {
      // Tentar extrair plano das observações
      let existingPlan = null;
      try {
        const planData = JSON.parse(monthlyPlanCheck.observacoes);
        if (planData.type === "monthly_plan" && planData.plan_data) {
          existingPlan = planData.plan_data;
        }
      } catch {
        console.warn(
          "⚠️ Marcador antigo detectado - não contém dados do plano"
        );
        // Marcador antigo - deletar para permitir novo
        await supabaseUser
          .from("user_evolutions")
          .delete()
          .eq("id", monthlyPlanCheck.id);
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
        (nextPlanDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
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

    // 2. Preparar dados para OpenAI
    const userData = {
      // Dados básicos
      name:
        user.user_metadata?.full_name || user.email?.split("@")[0] || "Usuário",
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

    // 3. Gerar plano com OpenAI
    const openai = createOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Você é um personal trainer e nutricionista especialista de ALTO NÍVEL.

IMPORTANTE: O OBJETIVO PRINCIPAL DO USUÁRIO É SUA PRIORIDADE ABSOLUTA. Todo o plano deve ser construído especificamente para atingir esse objetivo.

## ANÁLISE ESTRATÉGICA BASEADA NO OBJETIVO:

### 🎯 EMAGRECIMENTO:
- Déficit calórico controlado
- Treinos de alta intensidade (HIIT, cardio)
- Foco em queima de gordura
- Preservação de massa magra
- Metabolismo acelerado

### 💪 HIPERTROFIA (AUMENTO DE MASSA):
- Superávit calórico moderado
- Treinos de força progressiva
- Foco em grupos musculares específicos
- Recuperação adequada
- Proteína elevada

### 🏃‍♂️ RESISTÊNCIA/CONDICIONAMENTO:
- Treinos de endurance
- Foco em capacidade cardiovascular
- Progressão gradual de intensidade
- Nutrição para performance

### 🧘‍♀️ SAÚDE E BEM-ESTAR:
- Equilíbrio entre treino e recuperação
- Nutrição balanceada
- Foco em qualidade de vida

## ESTRUTURA DO PLANO:

1. **ANÁLISE PERSONALIZADA PRIORIZANDO O OBJETIVO**
   - Status atual em relação ao objetivo
   - Estratégia específica para o objetivo
   - Pontos fortes e limitações
   - Considerações especiais

2. **PLANO DE TREINO ALINHADO AO OBJETIVO**
   - Cronograma semanal específico para o objetivo
   - Exercícios selecionados para o objetivo
   - Séries, repetições e descanso otimizados
   - Progressão baseada no objetivo
   - Adaptações para local e limitações

3. **PLANO ALIMENTAR ESTRATÉGICO DETALHADO**
   - Calorias diárias calculadas para o objetivo
   - Macronutrientes específicos (proteínas, carbos, gorduras)
   - Quantidades EXATAS para cada alimento (ex: "100g de frango", "1 xícara de arroz")
   - Calorias por porção de cada alimento
   - Timing das refeições otimizado
   - Cardápio semanal com porções calculadas
   - Suplementação estratégica baseada no objetivo
   - Adaptações para restrições alimentares
   - Hidratação personalizada

## REGRAS NUTRICIONAIS ESPECÍFICAS:
- SEMPRE especifique quantidades EXATAS (gramas, xícaras, unidades)
- Calcule calorias por porção de cada alimento
- Distribua macronutrientes de acordo com o objetivo
- Seja específico com horários das refeições
- Considere restrições alimentares do usuário
- Adapte porções para o objetivo (emagrecimento = porções menores, hipertrofia = porções maiores)

## REGRAS IMPORTANTES:
- SEMPRE priorize o objetivo principal
- Use TODOS os dados disponíveis do usuário
- Seja específico e prático
- Considere limitações e restrições
- Motive e inspire o usuário
- Adapte para o local de treino disponível

Lembre-se: O objetivo do usuário é sua bússola. Tudo deve apontar para lá!`,
        },
        {
          role: "user",
          content: `Dados do usuário para análise:

🎯 OBJETIVO PRINCIPAL: ${userData.objective || "Não definido"}

📊 PERFIL FÍSICO:
- Nome: ${userData.name}
- Idade: ${userData.age} anos
- Gênero: ${userData.gender}
- Altura: ${userData.height} cm
- Peso atual: ${userData.weight} kg
- Peso inicial: ${userData.initialWeight} kg
- IMC: ${userData.imc}
- Variação de peso: ${userData.weightChange} kg

🏋️ PREFERÊNCIAS DE TREINO:
- Frequência: ${userData.trainingFrequency}
- Local: ${userData.trainingLocation}

⚠️ RESTRIÇÕES:
- Dores: ${userData.hasPain ? "Sim" : "Não"}
- Restrições alimentares: ${userData.dietaryRestrictions || "Nenhuma"}

📈 HISTÓRICO DE EVOLUÇÃO:
${
  userData.evolutionHistory?.length > 0
    ? `- ${userData.evolutionHistory.length} evoluções registradas`
    : "- Nenhuma evolução registrada"
}
${
  userData.latestEvolution
    ? `- Última evolução: ${userData.latestEvolution.date}`
    : ""
}

🎯 METAS ATUAIS:
${
  userData.currentGoals?.length > 0
    ? userData.currentGoals.map((goal) => `- ${goal.description}`).join("\n")
    : "- Nenhuma meta definida"
}

💪 ATIVIDADES RECENTES:
${
  userData.recentActivities?.length > 0
    ? `- ${userData.recentActivities.length} atividades registradas`
    : "- Nenhuma atividade registrada"
}

IMPORTANTE: Baseie TODO o plano no objetivo "${
            userData.objective
          }". Seja específico e estratégico para atingir esse objetivo específico.`,
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
                        options: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              food: { type: "string" },
                              quantity: { type: "string" }, // ✅ ESSENCIAL
                              calories: { type: "number" }, // ✅ ESSENCIAL
                            },
                            required: ["food", "quantity"], // ✅ OBRIGATÓRIO
                          },
                        },
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

    // 4. Criar marcador de controle mensal simples

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
    }

    // 🔄 ATUALIZAR TRIAL APÓS GERAR PLANO COM SUCESSO
    const trialUpdateTime = new Date().toISOString();

    console.log("🔄 Atualizando trial para usuário:", user.id);
    console.log("📊 Trial atual:", trialData);

    if (!trialData) {
      // Criar novo trial para usuário
      console.log("➕ Criando novo trial");
      const { error: insertError } = await supabaseUser
        .from("user_trials")
        .insert({
          user_id: user.id,
          plans_generated: 1,
          last_plan_generated_at: trialUpdateTime,
          trial_start_date: trialUpdateTime,
          trial_end_date: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
          ).toISOString(), // 7 dias
          is_active: true,
          upgraded_to_premium: false,
          max_plans_allowed: 1, // Usuários grátis só podem gerar 1 plano
        });

      if (insertError) {
        console.error("❌ Erro ao criar trial:", insertError);
      } else {
        console.log("✅ Trial criado com sucesso");
      }
    } else {
      // Atualizar trial existente
      const newPlansGenerated = (trialData.plans_generated || 0) + 1;
      console.log("📈 Atualizando trial - planos gerados:", newPlansGenerated);

      const { error: updateError } = await supabaseUser
        .from("user_trials")
        .update({
          plans_generated: newPlansGenerated,
          last_plan_generated_at: trialUpdateTime,
        })
        .eq("user_id", user.id);

      if (updateError) {
        console.error("❌ Erro ao atualizar trial:", updateError);
      } else {
        console.log("✅ Trial atualizado com sucesso");
      }
    }

    const generatedAt = new Date().toISOString();
    const nextPlanDate = new Date();
    nextPlanDate.setDate(nextPlanDate.getDate() + 30);

    return NextResponse.json({
      success: true,
      message: "Plano personalizado gerado com sucesso!",
      plan,
      planId: planMarker?.[0]?.id || null,
      isExisting: true,
      generatedAt: generatedAt,
      daysUntilNext: 30,
      nextPlanAvailable: nextPlanDate.toISOString().split("T")[0],
    });
  } catch (error: any) {
    console.error("❌ Erro ao gerar plano:", error);
    return NextResponse.json(
      { error: "Erro interno: " + error.message },
      { status: 500 }
    );
  }
}
