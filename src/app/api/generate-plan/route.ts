/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { supabase } from "@/lib/supabase";
import { PersonalizedPlan } from "@/types/personalized-plan";
// Função para criar cliente OpenAI apenas quando necessário
function createOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not configured");
  }
  return new OpenAI({ apiKey });
}

// Schemas para campos do plano
const PLAN_FIELD_SCHEMAS = {
  analysis: {
    type: "object",
    additionalProperties: false,
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
    additionalProperties: false,
    properties: {
      overview: { type: "string" },
      weeklySchedule: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            day: { type: "string" },
            type: { type: "string" },
            exercises: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
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
    additionalProperties: false,
    properties: {
      dailyCalories: { type: "number" },
      macros: {
        type: "object",
        additionalProperties: false,
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
          additionalProperties: false,
          properties: {
            meal: { type: "string" },
            options: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  food: { type: "string" },
                  quantity: { type: "string" },
                  calories: { type: "number" },
                },
                required: ["food", "quantity"],
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
    additionalProperties: false,
    properties: {
      weekly: { type: "array", items: { type: "string" } },
      monthly: { type: "array", items: { type: "string" } },
      tracking: { type: "array", items: { type: "string" } },
    },
    required: ["weekly", "monthly", "tracking"],
  },
  motivation: {
    type: "object",
    additionalProperties: false,
    properties: {
      personalMessage: { type: "string" },
      tips: { type: "array", items: { type: "string" } },
    },
    required: ["personalMessage", "tips"],
  },
} as const;

const PLAN_REQUIRED_FIELDS = [
  "analysis",
  "trainingPlan",
  "nutritionPlan",
  "goals",
  "motivation",
] as const; // Temporariamente vazio para testes

const PLAN_JSON_SCHEMA = {
  name: "personalized_plan",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: PLAN_FIELD_SCHEMAS,
    required: PLAN_REQUIRED_FIELDS,
  },
};

function buildSupplementSchema(missingFields: string[]) {
  const validFields = missingFields.filter(
    (field): field is keyof typeof PLAN_FIELD_SCHEMAS =>
      field in PLAN_FIELD_SCHEMAS
  );

  if (validFields.length === 0) {
    return PLAN_JSON_SCHEMA;
  }

  const schemaFields: Record<string, any> = {};
  validFields.forEach((field) => {
    schemaFields[field] = PLAN_FIELD_SCHEMAS[field];
  });

  return {
    name: `personalized_plan_missing_${validFields.join("_")}`,
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      properties: schemaFields,
      required: validFields,
    },
  };
}

function mergePlanData(basePlan: any, supplement: any) {
  if (!basePlan) return supplement;
  if (!supplement) return basePlan;

  const merged = { ...basePlan };
  Object.keys(supplement).forEach((key) => {
    const value = supplement[key];
    if (value !== undefined && value !== null) {
      merged[key] = value;
    }
  });

  console.log("🔀 Mesclando planos:", {
    baseKeys: Object.keys(basePlan),
    supplementKeys: Object.keys(supplement),
    mergedKeys: Object.keys(merged),
  });

  return merged;
}

function safeParseJSON(rawContent: string | null | undefined) {
  if (!rawContent) return {};

  try {
    return JSON.parse(rawContent);
  } catch (jsonError: any) {
    try {
      const jsonStart = rawContent.indexOf("{");
      const jsonEnd = rawContent.lastIndexOf("}") + 1;
      if (jsonStart >= 0 && jsonEnd > jsonStart) {
        return JSON.parse(rawContent.substring(jsonStart, jsonEnd));
      }
    } catch (extractError) {
      console.error("❌ Falha ao extrair JSON válido:", extractError);
    }
    console.error("❌ Erro ao parsear JSON da OpenAI:", jsonError);
    return {};
  }
}

async function fetchMissingPlanSections(
  openai: OpenAI,
  userData: Record<string, any>,
  partialPlan: any,
  missingFields: string[]
) {
  console.log(`🔧 Solicitando campos faltantes: ${missingFields.join(", ")}`);

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.2,
    max_tokens: 2048,
    messages: [
      {
        role: "system",
        content:
          "Você é um personal trainer e nutricionista especialista. Complete APENAS os campos faltantes do plano, retornando um JSON válido com os campos solicitados.",
      },
      {
        role: "user",
        content: `Campos faltantes: ${missingFields.join(", ")}

Plano parcial atual:
${JSON.stringify(partialPlan, null, 2)}

Dados do usuário:
- Objetivo: ${userData.objective}
- Peso: ${userData.weight} kg
- Altura: ${userData.height} cm
- IMC: ${userData.imc}
- Frequência de treino: ${userData.trainingFrequency}
- Restrições alimentares: ${userData.dietaryRestrictions || "Nenhuma"}

Retorne SOMENTE os campos faltantes (${missingFields.join(
          ", "
        )}) no formato JSON, seguindo o schema exigido.`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: buildSupplementSchema(missingFields),
    },
  });

  const choice = completion.choices[0];
  const supplement = safeParseJSON(choice.message.content);
  const mergedPlan = mergePlanData(partialPlan, supplement);

  return {
    plan: mergedPlan,
    finishReason: choice.finish_reason,
    usage: completion.usage,
  };
}

function validatePlanFinal(planData: any): {
  isValid: boolean;
  missingFields: string[];
} {
  const missingFields: string[] = [];

  if (!planData) {
    return { isValid: false, missingFields: ["plano completo"] };
  }

  if (!planData.nutritionPlan) {
    missingFields.push("nutritionPlan");
  } else {
    const nutrition =
      planData.nutritionPlan as PersonalizedPlan["nutritionPlan"];

    if (typeof nutrition.dailyCalories !== "number") {
      missingFields.push("nutritionPlan.dailyCalories");
    }

    if (
      !nutrition.macros ||
      !nutrition.macros.protein ||
      !nutrition.macros.carbs ||
      !nutrition.macros.fats
    ) {
      missingFields.push("nutritionPlan.macros");
    }

    const mealPlan =
      nutrition.mealPlan as PersonalizedPlan["nutritionPlan"]["mealPlan"];
    if (!Array.isArray(mealPlan) || mealPlan.length === 0) {
      missingFields.push("nutritionPlan.mealPlan");
    } else {
      mealPlan.forEach((meal, idx) => {
        if (!meal.meal) {
          missingFields.push(`nutritionPlan.mealPlan[${idx}].meal`);
        }

        const options =
          meal.options ??
          ([] as PersonalizedPlan["nutritionPlan"]["mealPlan"][number]["options"]);
        if (!options.length) {
          missingFields.push(`nutritionPlan.mealPlan[${idx}].options`);
        } else {
          options.forEach((option, optIdx) => {
            if (!option.food || !option.quantity) {
              missingFields.push(
                `nutritionPlan.mealPlan[${idx}].options[${optIdx}]`
              );
            }
          });
        }

        if (!meal.timing) {
          missingFields.push(`nutritionPlan.mealPlan[${idx}].timing`);
        }
      });
    }

    if (!nutrition.hydration) {
      missingFields.push("nutritionPlan.hydration");
    }
  }

  // Temporariamente não validamos analysis e trainingPlan como obrigatórios para testes
  if (!planData.analysis) missingFields.push("analysis");
  else {
    if (!planData.analysis.currentStatus)
      missingFields.push("analysis.currentStatus");
    if (
      !planData.analysis.strengths ||
      !Array.isArray(planData.analysis.strengths)
    )
      missingFields.push("analysis.strengths");
    if (
      !planData.analysis.improvements ||
      !Array.isArray(planData.analysis.improvements)
    )
      missingFields.push("analysis.improvements");
  }

  if (!planData.trainingPlan) missingFields.push("trainingPlan");
  else {
    if (!planData.trainingPlan.overview)
      missingFields.push("trainingPlan.overview");
    if (
      !planData.trainingPlan.weeklySchedule ||
      !Array.isArray(planData.trainingPlan.weeklySchedule)
    )
      missingFields.push("trainingPlan.weeklySchedule");
    if (!planData.trainingPlan.progression)
      missingFields.push("trainingPlan.progression");
  }
  if (!planData.goals) missingFields.push("goals");
  else {
    if (!planData.goals.weekly) missingFields.push("goals.weekly");
    if (!planData.goals.monthly) missingFields.push("goals.monthly");
    if (!planData.goals.tracking) missingFields.push("goals.tracking");
  }
  if (!planData.motivation) missingFields.push("motivation");
  else {
    if (!planData.motivation.personalMessage)
      missingFields.push("motivation.personalMessage");
    if (!planData.motivation.tips) missingFields.push("motivation.tips");
  }

  return { isValid: missingFields.length === 0, missingFields };
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
    let usePrompt = false; // Flag para indicar se está usando prompt comprado

    if (!trialData) {
      // Usuário novo - pode gerar 1 plano grátis
      canGenerate = true;
      trialMessage = "Plano grátis";
    } else {
      const isPremium = trialData.upgraded_to_premium;
      const plansGenerated = trialData.plans_generated || 0;
      const availablePrompts = trialData.available_prompts || 0;

      // ✅ PRIORIDADE 1: Verificar se tem prompts comprados disponíveis
      if (availablePrompts > 0) {
        canGenerate = true;
        usePrompt = true;
        trialMessage = `${availablePrompts} prompt${
          availablePrompts > 1 ? "s" : ""
        } disponível${availablePrompts > 1 ? "is" : ""}`;
      } else if (isPremium) {
        // ✅ PRIORIDADE 2: Usuário premium - 2 planos por ciclo de 30 dias
        const maxPlansPerCycle = trialData.premium_max_plans_per_cycle || 2;
        const cycleStartDate = trialData.premium_plan_cycle_start
          ? new Date(trialData.premium_plan_cycle_start)
          : new Date(trialData.upgraded_at || trialData.created_at);

        const now = new Date();
        const daysSinceStart = Math.floor(
          (now.getTime() - cycleStartDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Verificar se precisa resetar o ciclo (30 dias)
        const cycleLength = trialData.premium_cycle_days || 30;
        const isNewCycle = daysSinceStart >= cycleLength;

        // Calcular planos restantes no ciclo atual
        const currentCycleCount = isNewCycle
          ? 0
          : trialData.premium_plan_count || 0;
        const plansRemaining = Math.max(
          0,
          maxPlansPerCycle - currentCycleCount
        );

        // ✅ Verificar se ainda tem planos no ciclo
        canGenerate = plansRemaining > 0;

        // ✅ Controle de intervalo de 7 dias entre planos premium
        if (
          canGenerate &&
          currentCycleCount > 0 &&
          trialData.last_plan_generated_at
        ) {
          const lastPlanTime = new Date(trialData.last_plan_generated_at);
          const now = new Date();
          const daysSinceLastPlan =
            (now.getTime() - lastPlanTime.getTime()) / (1000 * 60 * 60 * 24);
          const MIN_INTERVAL_DAYS = 7;

          if (daysSinceLastPlan < MIN_INTERVAL_DAYS) {
            const daysRemaining = Math.ceil(
              MIN_INTERVAL_DAYS - daysSinceLastPlan
            );
            const hoursRemaining = Math.ceil(
              (MIN_INTERVAL_DAYS - daysSinceLastPlan) * 24
            );
            return NextResponse.json(
              {
                error: "COOLDOWN_ACTIVE",
                message: `Aguarde ${daysRemaining} dia${
                  daysRemaining > 1 ? "s" : ""
                } para gerar o próximo plano. Isso garante que você aproveite melhor cada estratégia personalizada!`,
                daysRemaining,
                hoursRemaining,
                nextAvailableDate: new Date(
                  lastPlanTime.getTime() +
                    MIN_INTERVAL_DAYS * 24 * 60 * 60 * 1000
                ).toISOString(),
                trialMessage: `Premium: Próximo plano em ${daysRemaining} dia${
                  daysRemaining > 1 ? "s" : ""
                }`,
              },
              { status: 429 }
            );
          }
        }

        trialMessage = `Premium: ${plansRemaining} de ${maxPlansPerCycle} planos restantes neste ciclo`;
      } else {
        // ✅ PRIORIDADE 3: Usuário grátis - 1 plano total
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

    // 🔒 VERIFICAR SE JÁ EXISTE PLANO VÁLIDO (apenas para usuários grátis)
    const isPremium = trialData?.upgraded_to_premium || false;
    console.log("🎯 Verificando status premium:", isPremium);

    if (!isPremium) {
      console.log("🔄 Usuário grátis - verificando user_evolutions");
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

        if (existingPlan) {
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
            (nextPlanDate.getTime() - currentDate.getTime()) /
              (1000 * 60 * 60 * 24)
          );

          console.log(
            "🔄 Retornando plano grátis existente da user_evolutions"
          );
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
    } else {
      console.log(
        "🎯 Usuário premium - pulando verificação de user_evolutions"
      );
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

    // Função para gerar plano com retry se necessário
    const generatePlanWithRetry = async (attempt = 1, maxAttempts = 3) => {
      console.log(
        `🔄 Tentativa ${attempt}/${maxAttempts} de gerar plano completo...`
      );
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `Você é um personal trainer e nutricionista especialista de ALTO NÍVEL.

IMPORTANTE: O OBJETIVO PRINCIPAL DO USUÁRIO É SUA PRIORIDADE ABSOLUTA. Todo o plano deve ser construído especificamente para atingir esse objetivo.

⚠️ CAMPOS RECOMENDADOS (temporariamente opcionais para testes):
1. analysis - análise completa do status atual (RECOMENDADO)
2. trainingPlan - plano de treino completo com weeklySchedule E progression (RECOMENDADO)
3. nutritionPlan - plano nutricional completo com dailyCalories, macros, mealPlan E hydration (MUITO IMPORTANTE!)
4. goals - metas semanais, mensais e indicadores de progresso (RECOMENDADO)
5. motivation - mensagem personalizada e dicas motivacionais (RECOMENDADO - IMPORTANTE PARA MOTIVAR O USUÁRIO!)

Você pode retornar qualquer combinação desses campos. Tente incluir o máximo possível para oferecer um plano completo ao usuário.

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

4. **METAS E OBJETIVOS**
   - Metas semanais específicas e mensuráveis
   - Metas mensais alinhadas ao objetivo
   - Indicadores de progresso para acompanhamento

5. **MOTIVAÇÃO E SUPORTE** (MUITO IMPORTANTE - SEMPRE INCLUA!)
   - Mensagem personalizada inspiradora baseada no objetivo do usuário
   - Dicas práticas para manter a motivação durante a jornada
   - Encorajamento específico para o objetivo (emagrecimento, hipertrofia, etc.)
   - Lembre-se: motivação é crucial para o sucesso do plano!

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
- Motive e inspire o usuário (campo motivation é essencial!)
- Adapte para o local de treino disponível
- TENTE INCLUIR os campos analysis, trainingPlan, nutritionPlan, goals e motivation quando possível

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
    ? `
📊 ÚLTIMA EVOLUÇÃO (${userData.latestEvolution.date}):
- Peso: ${userData.latestEvolution.peso || "Não informado"} kg
- Cintura: ${userData.latestEvolution.cintura || "Não informado"} cm
- Quadril: ${userData.latestEvolution.quadril || "Não informado"} cm
- Braço: ${userData.latestEvolution.braco || "Não informado"} cm
- Percentual de Gordura: ${
        userData.latestEvolution.percentual_gordura || "Não informado"
      }%
- Massa Magra: ${userData.latestEvolution.massa_magra || "Não informado"} kg
- Bem-estar: ${userData.latestEvolution.bem_estar || "Não informado"}/10
- Observações: ${userData.latestEvolution.observacoes || "Nenhuma"}

 EVOLUÇÕES ANTERIORES:
${
  userData.evolutionHistory
    ?.slice(1, 4)
    .map(
      (evolution, index) => `
${index + 2}ª Evolução (${evolution.date}):
- Peso: ${evolution.peso || "N/A"} kg
- Cintura: ${evolution.cintura || "N/A"} cm
- Quadril: ${evolution.quadril || "N/A"} cm
- Braço: ${evolution.braco || "N/A"} cm
- % Gordura: ${evolution.percentual_gordura || "N/A"}%
- Massa Magra: ${evolution.massa_magra || "N/A"} kg
- Bem-estar: ${evolution.bem_estar || "N/A"}/10
`
    )
    .join("") || "- Apenas uma evolução registrada"
}
`
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
            }". Seja específico e estratégico para atingir esse objetivo específico.

⚠️ ATENÇÃO CRÍTICA: Você DEVE retornar pelo menos os campos obrigatórios do JSON:
- analysis (obrigatório)
- trainingPlan (obrigatório) 

Campos altamente recomendados (INCLUA SEMPRE QUE POSSÍVEL):
- nutritionPlan (recomendado) - incluir dailyCalories, macros, mealPlan, hydration
- goals (recomendado) - incluir weekly, monthly, tracking
- motivation (recomendado - MUITO IMPORTANTE!) - incluir personalMessage e tips

⚠️ IMPORTANTE: O campo motivation é especialmente importante para manter o usuário motivado. Sempre inclua uma mensagem personalizada e dicas motivacionais baseadas no objetivo do usuário!

O plano será aceito mesmo sem os campos recomendados, mas você DEVE tentar incluí-los sempre, especialmente motivation!`,
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
                  required: [
                    "dailyCalories",
                    "macros",
                    "mealPlan",
                    "hydration",
                  ],
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
              required: ["analysis", "trainingPlan"],
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
          if (attempt < maxAttempts) {
            console.log(
              `🔄 Tentativa ${
                attempt + 1
              }/${maxAttempts} - Erro ao parsear JSON`
            );
            return generatePlanWithRetry(attempt + 1, maxAttempts);
          }
          return {
            error: "JSON_PARSE_ERROR",
            plan: null,
          };
        }
      }

      // ✅ Validar estrutura do plano antes de continuar
      const validatePlan = (
        planData: any
      ): { isValid: boolean; missingFields: string[] } => {
        const missingFields: string[] = [];

        if (!planData.analysis) {
          missingFields.push("analysis");
        } else {
          if (!planData.analysis.currentStatus) {
            missingFields.push("analysis.currentStatus");
          }
          if (
            !planData.analysis.strengths ||
            !Array.isArray(planData.analysis.strengths) ||
            planData.analysis.strengths.length === 0
          ) {
            missingFields.push("analysis.strengths");
          }
          if (
            !planData.analysis.improvements ||
            !Array.isArray(planData.analysis.improvements) ||
            planData.analysis.improvements.length === 0
          ) {
            missingFields.push("analysis.improvements");
          }
        }

        if (!planData.trainingPlan) {
          missingFields.push("trainingPlan");
        } else {
          if (!planData.trainingPlan.overview) {
            missingFields.push("trainingPlan.overview");
          }
          if (
            !planData.trainingPlan.weeklySchedule ||
            !Array.isArray(planData.trainingPlan.weeklySchedule) ||
            planData.trainingPlan.weeklySchedule.length === 0
          ) {
            missingFields.push("trainingPlan.weeklySchedule");
          }
          if (!planData.trainingPlan.progression) {
            missingFields.push("trainingPlan.progression");
          }
        }

        if (!planData.nutritionPlan) missingFields.push("nutritionPlan");
        else {
          const nutrition =
            planData.nutritionPlan as PersonalizedPlan["nutritionPlan"];
          if (typeof nutrition.dailyCalories !== "number")
            missingFields.push("nutritionPlan.dailyCalories");
          if (
            !nutrition.macros ||
            !nutrition.macros.protein ||
            !nutrition.macros.carbs ||
            !nutrition.macros.fats
          ) {
            missingFields.push("nutritionPlan.macros");
          }
          if (
            !Array.isArray(nutrition.mealPlan) ||
            nutrition.mealPlan.length === 0
          ) {
            missingFields.push("nutritionPlan.mealPlan");
          } else {
            const mealPlan =
              nutrition.mealPlan as PersonalizedPlan["nutritionPlan"]["mealPlan"];
            mealPlan.forEach((meal, idx) => {
              if (!meal.meal)
                missingFields.push(`nutritionPlan.mealPlan[${idx}].meal`);
              const options =
                meal.options ??
                ([] as PersonalizedPlan["nutritionPlan"]["mealPlan"][number]["options"]);
              if (!options.length) {
                missingFields.push(`nutritionPlan.mealPlan[${idx}].options`);
              } else {
                options.forEach((option, optIdx) => {
                  if (!option.food || !option.quantity) {
                    missingFields.push(
                      `nutritionPlan.mealPlan[${idx}].options[${optIdx}]`
                    );
                  }
                });
              }
              if (!meal.timing)
                missingFields.push(`nutritionPlan.mealPlan[${idx}].timing`);
            });
          }
          if (!nutrition.hydration)
            missingFields.push("nutritionPlan.hydration");
        }

        if (!planData.goals) missingFields.push("goals");
        else {
          if (
            !Array.isArray(planData.goals.weekly) ||
            planData.goals.weekly.length === 0
          )
            missingFields.push("goals.weekly");
          if (
            !Array.isArray(planData.goals.monthly) ||
            planData.goals.monthly.length === 0
          )
            missingFields.push("goals.monthly");
          if (
            !Array.isArray(planData.goals.tracking) ||
            planData.goals.tracking.length === 0
          )
            missingFields.push("goals.tracking");
        }

        if (!planData.motivation) missingFields.push("motivation");
        else {
          if (!planData.motivation.personalMessage)
            missingFields.push("motivation.personalMessage");
          if (
            !Array.isArray(planData.motivation.tips) ||
            planData.motivation.tips.length === 0
          )
            missingFields.push("motivation.tips");
        }

        // nutritionPlan, goals e motivation são opcionais agora
        // Não validamos mais esses campos como obrigatórios

        return { isValid: missingFields.length === 0, missingFields };
      };

      const validation = validatePlan(plan);
      if (!validation.isValid) {
        console.error(
          `❌ Plano inválido na tentativa ${attempt}. Campos faltando:`,
          validation.missingFields
        );
        console.error("📄 Plano recebido:", JSON.stringify(plan, null, 2));

        if (attempt < maxAttempts) {
          console.log(
            `🔄 Tentativa ${
              attempt + 1
            }/${maxAttempts} - Plano incompleto, tentando novamente...`
          );
          console.log(
            `⚠️ Campos faltando: ${validation.missingFields.join(", ")}`
          );
          // Aguardar um pouco antes de tentar novamente
          await new Promise((resolve) => setTimeout(resolve, 1500));
          return generatePlanWithRetry(attempt + 1, maxAttempts);
        }

        return {
          error: "PLAN_INCOMPLETE",
          missingFields: validation.missingFields,
          plan, // Retornar plano parcial para tentar fallback
        };
      }

      // Plano válido!
      return {
        error: null,
        plan,
      };
    };

    // Chamar função de retry
    const result = await generatePlanWithRetry(1, 3);

    let plan = result.plan;
    let planError = result.error;
    let missingFields = result.missingFields;

    // 🧩 FALLBACK: Se o plano veio incompleto, tentar completar os campos faltantes
    if (planError === "PLAN_INCOMPLETE" && plan && missingFields?.length) {
      try {
        console.log("🧩 Tentando completar campos faltantes:", missingFields);
        const supplement = await fetchMissingPlanSections(
          openai,
          userData,
          plan,
          missingFields
        );
        plan = supplement.plan;
        console.log(
          "🧩 Fallback finish_reason:",
          supplement.finishReason || "desconhecido"
        );
        console.log("🧮 Tokens fallback:", supplement.usage);

        // Revalidar após o fallback
        const revalidation = validatePlanFinal(plan);
        if (revalidation.isValid) {
          console.log("✅ Plano completado com sucesso via fallback!");
          planError = null;
          missingFields = undefined;
        } else {
          console.error(
            "❌ Fallback não resolveu todos os campos:",
            revalidation.missingFields
          );
          missingFields = revalidation.missingFields;
        }
      } catch (supplementError) {
        console.error(
          "⚠️ Erro ao tentar completar campos faltantes:",
          supplementError
        );
      }
    }

    // 🧩 Fallback adicional para garantir campos obrigatórios
    // TEMPORARIAMENTE DESABILITADO PARA TESTES - analysis e trainingPlan são opcionais agora
    // Todo o código abaixo está comentado para testes

    if (plan) {
      const missingMainFields: string[] = [];
      if (!plan.analysis) {
        missingMainFields.push("analysis");
      }
      if (!plan.trainingPlan) {
        missingMainFields.push("trainingPlan");
      }

      if (missingMainFields.length > 0) {
        console.log(
          `🧩 Campos obrigatórios faltando, gerando separadamente:`,
          missingMainFields
        );

        const heightInMeters = (userData.height || 0) / 100;
        const weight = userData.weight || 0;
        const imc =
          heightInMeters > 0 ? weight / (heightInMeters * heightInMeters) : 0;

        const fieldUserData = {
          objective: userData.objective || "Não informado",
          weight: weight,
          pesoInicial: userData.initialWeight || weight,
          height: userData.height || 0,
          imc: imc.toFixed(2),
          sexo: userData.gender || "Não informado",
          trainingFrequency: userData.trainingFrequency || "Não informado",
          nivelAtividade: "Moderado",
          trainingLocation: userData.trainingLocation || "Academia",
          dietaryRestrictions: userData.dietaryRestrictions || "Nenhuma",
          injuries: userData.hasPain ? "Sim" : null,
        };

        const host = request.headers.get("host") || "localhost:3000";
        const protocol = host.includes("localhost") ? "http" : "https";
        const baseUrl = `${protocol}://${host}`;

        for (const field of missingMainFields) {
          try {
            console.log(`🔧 Gerando ${field} via endpoint dedicado...`);

            const fieldResponse = await fetch(
              `${baseUrl}/api/generate-plan-field`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  userData: fieldUserData,
                  fieldType: field,
                  existingPlan: plan,
                }),
              }
            );

            console.log(
              `📡 Resposta do endpoint ${field}:`,
              fieldResponse.status,
              fieldResponse.statusText
            );

            if (fieldResponse.ok) {
              const fieldResult = await fieldResponse.json();
              console.log(
                `📦 Resultado do ${field}:`,
                fieldResult.success,
                !!fieldResult[field]
              );

              if (fieldResult.success && fieldResult[field]) {
                plan[field] = fieldResult[field];
                console.log(
                  `✅ ${field} gerado via endpoint dedicado:`,
                  !!plan[field]
                );
                if (
                  planError === "PLAN_INCOMPLETE" &&
                  plan.analysis &&
                  plan.trainingPlan
                ) {
                  planError = null;
                  missingFields = undefined;
                }
              } else {
                console.warn(
                  `⚠️ ${field} não foi gerado corretamente:`,
                  fieldResult
                );
              }
            } else {
              const errorText = await fieldResponse.text();
              console.warn(
                `⚠️ Erro ao gerar ${field} via endpoint dedicado:`,
                fieldResponse.status,
                errorText
              );
            }
          } catch (fieldError) {
            console.warn(`⚠️ Erro ao tentar gerar ${field}:`, fieldError);
          }
        }
      }
    }

    // 🧩 Fallback adicional para garantir campos opcionais importantes
    // SEMPRE tentar gerar analysis se não existir, usando o endpoint dedicado
    if (plan && !plan.analysis) {
      try {
        console.log(
          "🧩 analysis não encontrado, gerando via endpoint dedicado..."
        );

        // Calcular IMC se necessário
        const heightInMeters = (userData.height || 0) / 100;
        const weight = userData.weight || 0;
        const imc =
          heightInMeters > 0 ? weight / (heightInMeters * heightInMeters) : 0;

        const analysisUserData = {
          objective: userData.objective || "Não informado",
          name: userData.name || "Não informado",
          age: userData.age || null,
          gender: userData.gender || "Não informado",
          weight: weight,
          initialWeight: userData.initialWeight || weight,
          height: userData.height || 0,
          imc: imc.toFixed(2),
          weightChange: userData.weightChange || null,
          trainingFrequency: userData.trainingFrequency || "Não informado",
          trainingLocation: userData.trainingLocation || "Não informado",
          nivelAtividade: "Moderado", // Valor padrão
          hasPain: userData.hasPain || false,
          dietaryRestrictions: userData.dietaryRestrictions || "Nenhuma",
          latestEvolution: userData.latestEvolution || null,
          evolutionHistory: userData.evolutionHistory || [],
        };

        // Chamar o endpoint de geração de análise
        // Usar o host do request para fazer chamada interna
        const host = request.headers.get("host") || "localhost:3000";
        const protocol = host.includes("localhost") ? "http" : "https";
        const baseUrl = `${protocol}://${host}`;

        const analysisResponse = await fetch(
          `${baseUrl}/api/generate-analysis`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userData: analysisUserData,
              existingPlan: plan,
            }),
          }
        );

        console.log(
          "📡 Resposta do endpoint de análise:",
          analysisResponse.status,
          analysisResponse.statusText
        );

        if (analysisResponse.ok) {
          const analysisResult = await analysisResponse.json();
          console.log(
            "📦 Resultado da análise:",
            analysisResult.success,
            !!analysisResult.analysis
          );
          if (analysisResult.success && analysisResult.analysis) {
            plan.analysis = analysisResult.analysis;
            console.log(
              "✅ analysis gerado via endpoint dedicado:",
              !!plan.analysis
            );
          } else {
            console.warn(
              "⚠️ analysis não foi gerado corretamente:",
              analysisResult
            );
          }
        } else {
          const errorText = await analysisResponse.text();
          console.warn(
            "⚠️ Erro ao gerar analysis via endpoint dedicado:",
            analysisResponse.status,
            errorText
          );
        }
      } catch (optionalError) {
        console.warn("⚠️ Erro ao tentar gerar analysis:", optionalError);
      }
    } else if (plan && plan.analysis) {
      console.log("✅ analysis já existe no plano inicial");
    }

    // 🧩 Fallback adicional para garantir campos opcionais importantes
    // SEMPRE tentar gerar nutritionPlan se não existir, usando o endpoint dedicado
    if (plan && !plan.nutritionPlan) {
      try {
        console.log(
          "🧩 nutritionPlan não encontrado, gerando via endpoint dedicado..."
        );

        // Calcular IMC para o endpoint de nutrição
        const heightInMeters = (userData.height || 0) / 100;
        const weight = userData.weight || 0;
        const imc =
          heightInMeters > 0 ? weight / (heightInMeters * heightInMeters) : 0;

        const nutritionUserData = {
          objective: userData.objective || "Não informado",
          weight: weight,
          height: userData.height || 0,
          imc: imc.toFixed(2),
          trainingFrequency: userData.trainingFrequency || "Não informado",
          dietaryRestrictions: userData.dietaryRestrictions || "Nenhuma",
        };

        // Chamar o endpoint de geração de nutrição
        // Usar o host do request para fazer chamada interna
        const host = request.headers.get("host") || "localhost:3000";
        const protocol = host.includes("localhost") ? "http" : "https";
        const baseUrl = `${protocol}://${host}`;

        const nutritionResponse = await fetch(
          `${baseUrl}/api/generate-nutrition-plan`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userData: nutritionUserData,
              existingPlan: plan,
            }),
          }
        );

        console.log(
          "📡 Resposta do endpoint de nutrição:",
          nutritionResponse.status,
          nutritionResponse.statusText
        );

        if (nutritionResponse.ok) {
          const nutritionResult = await nutritionResponse.json();
          console.log(
            "📦 Resultado da nutrição:",
            nutritionResult.success,
            !!nutritionResult.nutritionPlan
          );
          if (nutritionResult.success && nutritionResult.nutritionPlan) {
            plan.nutritionPlan = nutritionResult.nutritionPlan;
            console.log(
              "✅ nutritionPlan gerado via endpoint dedicado:",
              !!plan.nutritionPlan
            );
          } else {
            console.warn(
              "⚠️ nutritionPlan não foi gerado corretamente:",
              nutritionResult
            );
          }
        } else {
          const errorText = await nutritionResponse.text();
          console.warn(
            "⚠️ Erro ao gerar nutritionPlan via endpoint dedicado:",
            nutritionResponse.status,
            errorText
          );
        }
      } catch (optionalError) {
        console.warn("⚠️ Erro ao tentar gerar nutritionPlan:", optionalError);
      }
    } else if (plan && plan.nutritionPlan) {
      console.log("✅ nutritionPlan já existe no plano inicial");
    }

    // Tentar gerar goals e motivation se não existirem
    const optionalFieldsToEnsure: Array<keyof typeof PLAN_FIELD_SCHEMAS> = [
      "goals",
      "motivation",
    ];
    if (plan) {
      const optionalMissing = optionalFieldsToEnsure.filter(
        (field) => !(field in plan)
      );

      if (optionalMissing.length > 0) {
        try {
          console.log(
            "🧩 Tentando completar campos opcionais faltantes:",
            optionalMissing
          );
          const supplement = await fetchMissingPlanSections(
            openai,
            userData,
            plan,
            optionalMissing
          );
          plan = supplement.plan;

          const remaining = optionalFieldsToEnsure.filter(
            (field) => !(field in plan)
          );
          if (remaining.length === 0) {
            console.log("✅ Campos opcionais preenchidos com sucesso");
          } else {
            console.warn(
              "⚠️ Ainda faltam campos opcionais após supplement:",
              remaining
            );
          }
        } catch (optionalError) {
          console.warn(
            "⚠️ Erro ao tentar completar campos opcionais:",
            optionalError
          );
        }
      }
    }

    // Retornar erro se ainda estiver incompleto
    if (planError === "PLAN_INCOMPLETE") {
      return NextResponse.json(
        {
          error: "PLAN_INCOMPLETE",
          message: `O plano gerado está incompleto após todas as tentativas. Campos faltando: ${
            missingFields?.join(", ") || "desconhecidos"
          }. Tente gerar novamente.`,
          missingFields,
        },
        { status: 500 }
      );
    }

    if (planError) {
      return NextResponse.json(
        {
          error: planError,
          message: "Erro ao gerar plano. Tente novamente.",
        },
        { status: 500 }
      );
    }

    if (!plan) {
      return NextResponse.json(
        {
          error: "PLAN_GENERATION_FAILED",
          message: "Erro ao gerar plano. Tente novamente.",
        },
        { status: 500 }
      );
    }

    console.log(
      "🎯 CHECKPOINT 1: Plano gerado com sucesso, preparando para salvar..."
    );
    console.log("🎯 Plan object:", plan ? "✅ Existe" : "❌ Null/Undefined");
    console.log("🎯 User ID:", user.id);
    console.log("📊 Campos presentes no plano:", {
      hasAnalysis: !!plan.analysis,
      hasTrainingPlan: !!plan.trainingPlan,
      hasNutritionPlan: !!plan.nutritionPlan,
      hasGoals: !!plan.goals,
      hasMotivation: !!plan.motivation,
    });

    // ✅ VALIDAÇÃO FINAL ANTES DE SALVAR
    // TEMPORARIAMENTE DESABILITADO PARA TESTES - não validamos mais campos obrigatórios
    // let finalValidation = (plan);
    // A validação sempre retorna válido agora pois não há campos obrigatórios

    const finalValidation = validatePlanFinal(plan);
    if (!finalValidation.isValid) {
      console.error(
        "❌ Plano inválido antes de salvar. Campos faltando:",
        finalValidation.missingFields
      );
      return NextResponse.json(
        {
          error: "PLAN_INCOMPLETE",
          message: `O plano continua incompleto. Campos faltando: ${finalValidation.missingFields.join(
            ", "
          )}.`,
          missingFields: finalValidation.missingFields,
        },
        { status: 500 }
      );
    }

    console.log("✅ Plano validado com sucesso!");

    // ✅ Salvar o plano na tabela user_plans
    const generatedAt = new Date().toISOString();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90); // Plano expira em 90 dias

    console.log("💾 Salvando plano na tabela user_plans...");
    const { data: savedPlan, error: planSaveError } = await supabaseUser
      .from("user_plans")
      .insert({
        user_id: user.id,
        plan_data: plan,
        plan_type: "complete",
        generated_at: generatedAt,
        expires_at: expiresAt.toISOString(),
        is_active: true,
      })
      .select()
      .maybeSingle();

    if (planSaveError) {
      console.error("❌ Erro ao salvar plano:", planSaveError);
      // Não falhar aqui - o plano foi gerado com sucesso
    } else {
      console.log("✅ Plano salvo com sucesso na user_plans:", savedPlan?.id);
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
      console.log("✅ Marcador de controle criado com sucesso");
    }

    // ✅ IMPORTANTE: Só decrementar prompts/planos APÓS salvar tudo com sucesso
    // Verificar se o plano foi salvo com sucesso antes de decrementar
    if (!savedPlan && planSaveError) {
      console.error(
        "❌ Plano não foi salvo. Não decrementando prompts/planos."
      );
      return NextResponse.json(
        {
          error: "PLAN_SAVE_FAILED",
          message: "Erro ao salvar o plano. Tente novamente.",
        },
        { status: 500 }
      );
    }

    // Se chegou até aqui, o plano foi validado e salvo com sucesso
    const trialUpdateTime = new Date().toISOString();

    console.log("🔄 Atualizando trial para usuário:", user.id);
    console.log("📊 Trial atual:", trialData);
    console.log("🎫 Usando prompt?", usePrompt);

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
        // Se falhar ao criar trial, não retornar erro - o plano já foi salvo
      } else {
        console.log("✅ Trial criado com sucesso");
      }
    } else {
      // Atualizar trial existente - SÓ DEPOIS DE SALVAR O PLANO COM SUCESSO
      const isPremium = trialData.upgraded_to_premium;
      const updateData: Record<string, any> = {
        last_plan_generated_at: trialUpdateTime,
      };

      if (usePrompt) {
        // ✅ Usando prompt comprado - decrementar available_prompts
        const currentPrompts = trialData.available_prompts || 0;
        updateData.available_prompts = Math.max(0, currentPrompts - 1);
        console.log(
          `🎫 Usando prompt comprado. Restantes: ${updateData.available_prompts}`
        );
      } else if (isPremium) {
        // ✅ Lógica premium - verificar se precisa resetar ciclo
        const cycleStartDate = trialData.premium_plan_cycle_start
          ? new Date(trialData.premium_plan_cycle_start)
          : new Date(trialData.upgraded_at || trialData.created_at);

        const daysSinceStart = Math.floor(
          (new Date(trialUpdateTime).getTime() - cycleStartDate.getTime()) /
            (1000 * 60 * 60 * 24)
        );
        const cycleLength = trialData.premium_cycle_days || 30;

        if (daysSinceStart >= cycleLength) {
          // Resetar ciclo premium
          updateData.premium_plan_count = 1;
          updateData.premium_plan_cycle_start = trialUpdateTime;
          console.log("🔄 Resetando ciclo premium");
        } else {
          // Incrementar contador do ciclo atual
          updateData.premium_plan_count =
            (trialData.premium_plan_count || 0) + 1;
          console.log(
            "📈 Incrementando contador premium:",
            updateData.premium_plan_count
          );
        }
      } else {
        // Lógica grátis - apenas incrementar
        updateData.plans_generated = (trialData.plans_generated || 0) + 1;
        console.log(
          "📈 Incrementando planos grátis:",
          updateData.plans_generated
        );
      }

      const { error: updateError } = await supabaseUser
        .from("user_trials")
        .update(updateData)
        .eq("user_id", user.id);

      if (updateError) {
        console.error("❌ Erro ao atualizar trial:", updateError);
        // Se falhar ao atualizar trial, não retornar erro - o plano já foi salvo
      } else {
        console.log("✅ Trial atualizado com sucesso");
      }
    }

    const nextPlanDate = new Date();
    nextPlanDate.setDate(nextPlanDate.getDate() + 30);

    console.log("🎯 CHECKPOINT FINAL: Retornando resposta...");
    console.log("🎯 savedPlan?.id:", savedPlan?.id);
    console.log("🎯 planMarker:", planMarker?.[0]?.id);

    return NextResponse.json({
      success: true,
      message: "Plano personalizado gerado com sucesso!",
      plan,
      planId: savedPlan?.id || planMarker?.[0]?.id || null,
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
