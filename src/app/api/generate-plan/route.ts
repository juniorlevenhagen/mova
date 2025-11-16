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
    temperature: 0.3, // ✅ Aumentar temperatura para mais variação nos planos
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

    // Perfil do usuário - ✅ Buscar sempre os dados mais recentes
    const { data: profile, error: profileError } = await supabaseUser
      .from("user_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("❌ Erro ao buscar perfil:", profileError);
      return NextResponse.json(
        { error: "Perfil do usuário não encontrado" },
        { status: 404 }
      );
    }

    // ✅ Log dos dados do perfil para debug
    console.log("📊 Dados do perfil atualizados:", {
      weight: profile?.weight,
      height: profile?.height,
      objective: profile?.objective,
      trainingFrequency: profile?.training_frequency,
      timestamp: new Date().toISOString(),
    });

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
    let availablePrompts = 0; // Declarar no escopo global para usar depois

    if (!trialData) {
      // Usuário novo - pode gerar 1 plano grátis
      canGenerate = true;
      trialMessage = "Plano grátis disponível";
      availablePrompts = 0;
    } else {
      const plansGenerated = trialData.plans_generated || 0;
      availablePrompts = trialData.available_prompts || 0;
      const maxFreePlans = trialData.max_plans_allowed || 1;
      const freePlansRemaining = Math.max(0, maxFreePlans - plansGenerated);

      if (availablePrompts > 0) {
        // ✅ Verificar cooldown APENAS para prompts do pacote de 3
        // Prompts unitários não têm cooldown - podem ser usados imediatamente
        const packagePrompts = trialData.package_prompts || 0;
        const singlePrompts = availablePrompts - packagePrompts; // Prompts unitários
        const lastPlanGeneratedAt = trialData.last_plan_generated_at;
        const promptCooldownHours = 24; // Configurável: horas de espera entre gerar planos com prompts do pacote

        // ✅ Se tem prompts do pacote E gerou plano recentemente, verificar cooldown
        if (packagePrompts > 0 && lastPlanGeneratedAt) {
          const lastPlanDate = new Date(lastPlanGeneratedAt);
          const now = new Date();
          const hoursSinceLastPlan =
            (now.getTime() - lastPlanDate.getTime()) / (1000 * 60 * 60);
          const hoursRemaining = promptCooldownHours - hoursSinceLastPlan;

          if (hoursSinceLastPlan < promptCooldownHours) {
            // ✅ Ainda está em cooldown do pacote - mas pode usar prompts unitários se tiver
            if (singlePrompts > 0) {
              // Tem prompts unitários disponíveis - pode usar sem cooldown
              canGenerate = true;
              usePrompt = true;
              trialMessage =
                singlePrompts === 1
                  ? "1 prompt unitário disponível (sem cooldown)"
                  : `${singlePrompts} prompts unitários disponíveis (sem cooldown)`;
              console.log(
                `✅ ${singlePrompts} prompt(s) unitário(s) disponível(is) - pode gerar sem cooldown`
              );
            } else {
              // Só tem prompts do pacote - precisa aguardar cooldown
              const hours = Math.floor(hoursRemaining);
              const minutes = Math.floor((hoursRemaining - hours) * 60);
              canGenerate = false;
              usePrompt = false;
              trialMessage = `Aguarde ${hours}h ${minutes}m para gerar um novo plano (cooldown do pacote). Você ainda tem ${packagePrompts} prompt(s) do pacote disponível(is).`;

              console.log(
                `⏳ Cooldown do pacote ativo: ${hoursSinceLastPlan.toFixed(
                  1
                )}h desde último plano. Aguarde ${hoursRemaining.toFixed(1)}h`
              );
            }
          } else {
            // Cooldown passou, pode gerar
            canGenerate = true;
            usePrompt = true;
            trialMessage =
              availablePrompts === 1
                ? "1 prompt disponível"
                : `${availablePrompts} prompts disponíveis`;

            console.log(
              `✅ Cooldown do pacote passou. Pode gerar novo plano (${hoursSinceLastPlan.toFixed(
                1
              )}h desde último)`
            );
          }
        } else {
          // ✅ Não tem prompts do pacote OU nunca gerou plano antes - pode gerar (sem cooldown)
          canGenerate = true;
          usePrompt = true;

          if (singlePrompts > 0 && packagePrompts > 0) {
            trialMessage =
              singlePrompts === 1
                ? `1 prompt unitário disponível (sem cooldown). ${packagePrompts} prompt(s) do pacote também disponível(is).`
                : `${singlePrompts} prompts unitários disponíveis (sem cooldown). ${packagePrompts} prompt(s) do pacote também disponível(is).`;
          } else {
            trialMessage =
              availablePrompts === 1
                ? "1 prompt disponível"
                : `${availablePrompts} prompts disponíveis`;
          }

          if (packagePrompts === 0) {
            console.log(
              `✅ ${availablePrompts} prompt(s) unitário(s) - pode gerar sem cooldown`
            );
          } else {
            console.log("✅ Primeiro plano com prompt do pacote - pode gerar");
          }
        }
      } else if (freePlansRemaining > 0) {
        canGenerate = true;
        trialMessage = "Plano grátis disponível";
      } else {
        canGenerate = false;
        trialMessage = "Plano grátis já utilizado";
      }
    }

    if (!canGenerate) {
      // ✅ Verificar se é erro de cooldown ou limite de trial
      const isCooldownActive =
        availablePrompts > 0 && trialData?.last_plan_generated_at;

      if (isCooldownActive) {
        const lastPlanDate = new Date(trialData.last_plan_generated_at!);
        const now = new Date();
        const hoursSinceLastPlan =
          (now.getTime() - lastPlanDate.getTime()) / (1000 * 60 * 60);
        const promptCooldownHours = 24;
        const hoursRemaining = promptCooldownHours - hoursSinceLastPlan;

        return NextResponse.json(
          {
            error: "COOLDOWN_ACTIVE",
            message: trialMessage,
            hoursRemaining: Math.max(0, hoursRemaining),
            nextPlanAvailable: new Date(
              now.getTime() + hoursRemaining * 60 * 60 * 1000
            ).toISOString(),
            availablePrompts: availablePrompts,
            trialMessage,
          },
          { status: 429 } // Too Many Requests
        );
      } else {
        return NextResponse.json(
          {
            error: "TRIAL_LIMIT_REACHED",
            message:
              "Você atingiu o limite de planos gratuitos. Compre prompts para gerar novos planos personalizados!",
            trialMessage,
          },
          { status: 403 }
        );
      }
    }

    // 🔒 VERIFICAR SE JÁ EXISTE PLANO VÁLIDO (apenas para usuários grátis SEM prompts)
    // ✅ IMPORTANTE: Se houver prompts disponíveis, SEMPRE gerar novo plano, ignorando plano existente
    // availablePrompts já foi declarado acima no escopo global

    if (availablePrompts > 0) {
      console.log(
        `✅ ${availablePrompts} prompt(s) disponível(is) - gerando novo plano (ignorando plano existente)`
      );
      // Pular verificação de plano existente e ir direto para geração
    } else {
      // Apenas verificar plano existente se NÃO houver prompts disponíveis
      console.log(
        "🔄 Usuário sem prompts - verificando plano existente em user_evolutions"
      );
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
    }
    // Fim da verificação de plano grátis/prompts

    // ✅ 2. Buscar planos anteriores para criar efeito composto
    console.log("📚 Buscando planos anteriores do usuário para análise...");
    const { data: previousPlans, error: previousPlansError } =
      await supabaseUser
        .from("user_plans")
        .select("id, plan_data, plan_type, generated_at, expires_at, is_active")
        .eq("user_id", user.id)
        .order("generated_at", { ascending: false })
        .limit(5); // Últimos 5 planos

    interface PlanHistoryItem {
      id: string;
      generatedAt: string;
      planType: string;
      isActive: boolean;
      hasTrainingPlan: boolean;
      hasNutritionPlan: boolean;
      goals: any;
      analysis: any;
      objectiveFromPlan: string | null;
    }

    interface PlanInsights {
      hasPreviousPlan: boolean;
      lastPlanGeneratedAt?: string;
      previousObjective?: string | null;
      previousTrainingFocus?: string | null;
      previousNutritionCalories?: number | null;
      previousGoals?: any;
      totalPlansGenerated: number;
    }

    let planHistory: PlanHistoryItem[] = [];
    let planInsights: PlanInsights | null = null;

    if (!previousPlansError && previousPlans && previousPlans.length > 0) {
      console.log(
        `✅ Encontrados ${previousPlans.length} plano(s) anterior(es)`
      );

      // Processar planos anteriores para extrair insights
      planHistory = previousPlans.map((prevPlan) => {
        const planData = prevPlan.plan_data || {};
        return {
          id: prevPlan.id,
          generatedAt: prevPlan.generated_at,
          planType: prevPlan.plan_type,
          isActive: prevPlan.is_active,
          hasTrainingPlan: !!planData.trainingPlan,
          hasNutritionPlan: !!planData.nutritionPlan,
          goals: planData.goals || null,
          analysis: planData.analysis || null,
          // Extrair informações úteis
          objectiveFromPlan:
            planData.analysis?.objective ||
            planData.goals?.monthly?.[0]?.description ||
            null,
        };
      });

      // Criar insights composto dos planos anteriores
      const activePlan = previousPlans.find((p) => p.is_active);
      if (activePlan && activePlan.plan_data) {
        const activePlanData = activePlan.plan_data;
        planInsights = {
          hasPreviousPlan: true,
          lastPlanGeneratedAt: activePlan.generated_at,
          previousObjective:
            activePlanData.analysis?.objective ||
            activePlanData.goals?.monthly?.[0]?.description ||
            null,
          previousTrainingFocus: activePlanData.trainingPlan?.focus || null,
          previousNutritionCalories:
            activePlanData.nutritionPlan?.dailyCalories || null,
          previousGoals: activePlanData.goals || null,
          totalPlansGenerated: previousPlans.length,
        };

        console.log("📊 Insights dos planos anteriores:", {
          hasPreviousPlan: true,
          lastPlanGeneratedAt: planInsights.lastPlanGeneratedAt,
          totalPlans: planInsights.totalPlansGenerated,
        });
      }
    } else {
      console.log(
        "📝 Nenhum plano anterior encontrado - este será o primeiro plano"
      );
      planInsights = {
        hasPreviousPlan: false,
        totalPlansGenerated: 0,
      };
    }

    // 3. Preparar dados para OpenAI (incluindo histórico de planos)
    // ✅ Garantir que estamos usando os dados mais recentes do perfil
    const userData = {
      // Dados básicos
      name:
        user.user_metadata?.full_name || user.email?.split("@")[0] || "Usuário",
      age: profile?.age || null,
      gender: profile?.gender || "Não informado",
      height: profile?.height || 0,
      weight: profile?.weight || 0, // ✅ Peso atualizado do banco
      initialWeight: profile?.initial_weight || profile?.weight || 0,

      // Objetivos e preferências
      objective: profile?.objective || "Não informado",
      trainingFrequency: profile?.training_frequency || "Não informado",
      trainingLocation: profile?.training_location || "Academia",

      // Restrições
      hasPain: profile?.has_pain || false,
      dietaryRestrictions: profile?.dietary_restrictions || "Nenhuma",

      // Histórico de evolução
      latestEvolution: evolutions?.[0] || null,
      evolutionHistory: evolutions || [],

      // Atividades recentes
      recentActivities: activities || [],

      // Metas
      currentGoals: goals || [],

      // Cálculos - ✅ Recalcular com dados atualizados
      imc:
        profile?.height && profile?.weight
          ? (profile.weight / Math.pow(profile.height / 100, 2)).toFixed(1)
          : null,
      weightChange:
        profile?.weight && profile?.initial_weight
          ? (profile.weight - profile.initial_weight).toFixed(1)
          : null,

      // ✅ Histórico de planos anteriores para efeito composto
      previousPlans: planHistory,
      planInsights: planInsights,
    };

    // 4. Gerar plano com OpenAI (usando histórico de planos anteriores)
    const openai = createOpenAIClient();

    // Função para gerar plano com retry se necessário
    const generatePlanWithRetry = async (attempt = 1, maxAttempts = 3) => {
      console.log(
        `🔄 Tentativa ${attempt}/${maxAttempts} de gerar plano completo...`
      );
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        temperature: 0.3, // ✅ Aumentar temperatura para mais variação nos planos
        max_tokens: 4096, // ✅ Aumentar tokens para planos mais completos
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

## ANÁLISE ESTRATÉGICA BASEADA NO OBJETIVO E IMC:

⚠️ REGRA CRÍTICA: SEMPRE considere o IMC antes de definir a estratégia nutricional!

### 📊 CLASSIFICAÇÃO DO IMC:
- Abaixo do peso: IMC < 18.5
- Normal: IMC 18.5 - 24.9
- Sobrepeso: IMC 25 - 29.9
- Obesidade Grau I: IMC 30 - 34.9
- Obesidade Grau II: IMC 35 - 39.9
- Obesidade Grau III (Grave): IMC ≥ 40

### 📋 TABELA DE DECISÃO: IMC + OBJETIVO = ESTRATÉGIA

Use esta tabela para definir a estratégia correta:

| IMC | Objetivo | Estratégia Nutricional | Estratégia de Treino | Proteína |
|-----|----------|------------------------|---------------------|----------|
| < 18.5 | Ganhar Massa | Superávit moderado (TDEE + 200-400 kcal) | Força progressiva | 1.6-2.2g/kg |
| < 18.5 | Emagrecer | ⚠️ NÃO recomendado (já abaixo do peso) | Manutenção/Leve | 1.2-1.6g/kg |
| < 18.5 | Manter | Manutenção (TDEE) | Equilíbrio força/cardio | 1.2-1.6g/kg |
| < 18.5 | Condicionamento | Manutenção ou leve superávit | Endurance + força | 1.4-1.8g/kg |
| 18.5-24.9 | Ganhar Massa | Superávit leve (TDEE + 200-400 kcal) | Força progressiva | 1.6-2.2g/kg |
| 18.5-24.9 | Emagrecer | Déficit moderado (TDEE - 300-500 kcal) | HIIT + força | 1.6-2.0g/kg |
| 18.5-24.9 | Manter | Manutenção (TDEE) | Equilíbrio força/cardio | 1.2-1.6g/kg |
| 18.5-24.9 | Condicionamento | Manutenção ou leve déficit | Endurance + força | 1.4-1.8g/kg |
| 25-29.9 | Ganhar Massa | 🔄 RECOMPOSIÇÃO: Déficit (TDEE - 300-500 kcal) | Força progressiva | 2.2-2.5g/kg |
| 25-29.9 | Emagrecer | Déficit moderado (TDEE - 300-500 kcal) | HIIT + força | 1.6-2.0g/kg |
| 25-29.9 | Manter | Manutenção ou leve déficit (TDEE - 100-200 kcal) | Força + cardio | 1.4-1.8g/kg |
| 25-29.9 | Condicionamento | Déficit leve (TDEE - 200-300 kcal) | Endurance + força | 1.6-2.0g/kg |
| 30-34.9 | Ganhar Massa | 🔄 RECOMPOSIÇÃO: Déficit (TDEE - 20-25%) | Força progressiva | 2.2-2.5g/kg |
| 30-34.9 | Emagrecer | Déficit moderado (TDEE - 20-25%) | HIIT + força | 1.6-2.0g/kg |
| 30-34.9 | Manter | Déficit leve (TDEE - 10-15%) | Força + cardio | 1.6-2.0g/kg |
| 30-34.9 | Condicionamento | Déficit moderado (TDEE - 20-25%) | Endurance + força | 1.6-2.0g/kg |
| ≥ 35 | Ganhar Massa | 🔄 RECOMPOSIÇÃO: Déficit (TDEE - 20-25%) | Força progressiva | 2.2-2.5g/kg |
| ≥ 35 | Emagrecer | Déficit conservador (TDEE - 20-25%) | Força + cardio moderado | 1.6-2.0g/kg |
| ≥ 35 | Manter | Déficit leve (TDEE - 15-20%) | Força + cardio leve | 1.6-2.0g/kg |
| ≥ 35 | Condicionamento | Déficit conservador (TDEE - 20-25%) | Endurance + força | 1.6-2.0g/kg |

⚠️ **REGRAS CRÍTICAS:**
- IMC ≥ 25 + "Ganhar Massa" = SEMPRE usar RECOMPOSIÇÃO (déficit + força)
- IMC ≥ 30 = NUNCA usar superávit calórico
- IMC < 18.5 + "Emagrecer" = Avisar que não é recomendado
- Todos os cenários devem respeitar os limites mínimos de calorias, proteína e gorduras

### 🎯 ESTRATÉGIAS DETALHADAS POR OBJETIVO:

#### 🎯 EMAGRECIMENTO:
- Déficit calórico controlado (respeitando limites de segurança)
- **ATIVIDADE CARDIOVASCULAR OBRIGATÓRIA**: 3-5x por semana, moderada a intensa (30-60min)
- Treinos de alta intensidade (HIIT, cardio) + força para preservar massa
- **Cardio é etapa FUNDAMENTAL junto à alimentação** - essencial para déficit calórico e perda de gordura
- Foco em queima de gordura preservando massa magra
- Proteína elevada (1.6-2.0g/kg) para preservação muscular
- Metabolismo acelerado

#### 💪 GANHAR MASSA MUSCULAR:
- **IMC < 25**: Superávit calórico moderado (TDEE + 200-400 kcal)
- **IMC ≥ 25**: RECOMPOSIÇÃO - Déficit calórico (TDEE - 300-500 kcal ou 20-25%)
- Treinos de força progressiva
- **ATIVIDADE CARDIOVASCULAR OBRIGATÓRIA**: 2-3x por semana, LEVE a MODERADA (30-45min)
- **Cardio leve/moderado é essencial** para saúde cardiovascular e recuperação, sem interferir no ganho de massa
- Foco em grupos musculares específicos
- Recuperação adequada
- Proteína elevada (1.6-2.5g/kg dependendo do IMC)

#### 🔄 RECOMPOSIÇÃO CORPORAL (IMC ≥ 25 + Objetivo de Ganhar Massa):
⚠️ ATENÇÃO: Se o usuário tem IMC ≥ 25 MAS o objetivo é "ganhar massa muscular":
- NÃO use superávit calórico! Isso é PERIGOSO e contraproducente
- Use DÉFICIT CALÓRICO MODERADO baseado no TDEE:
  * IMC 25-34.9: TDEE - 300-500 kcal
  * IMC ≥ 35: TDEE - 20-25% (mais conservador)
- Foco em treino de FORÇA para preservar/aumentar massa magra
- Alta ingestão de PROTEÍNA (2.2-2.5g/kg de peso)
- Redução moderada de carboidratos e gorduras
- Objetivo: Perder GORDURA enquanto mantém/ganha MÚSCULO

#### ⚖️ MANUTENÇÃO:
- Calorias próximas ao TDEE (manutenção ou leve déficit de 100-200 kcal)
- Equilíbrio entre treino de força e cardio
- Foco em qualidade de vida e saúde
- Proteína adequada (1.2-1.6g/kg)
- Nutrição balanceada

#### 🏃‍♂️ RESISTÊNCIA/CONDICIONAMENTO:
- Calorias: manutenção ou leve déficit (dependendo do IMC)
- Treinos de endurance + força
- Foco em capacidade cardiovascular
- Progressão gradual de intensidade
- Nutrição para performance (carboidratos adequados)
- Proteína: 1.4-1.8g/kg

#### 🧘‍♀️ SAÚDE E BEM-ESTAR:
- Equilíbrio entre treino e recuperação
- Nutrição balanceada (respeitando limites de segurança)
- Foco em qualidade de vida
- Proteína adequada (1.2-1.6g/kg)

## ESTRUTURA DO PLANO:

1. **ANÁLISE PERSONALIZADA PRIORIZANDO O OBJETIVO**
   - Status atual em relação ao objetivo
   - Estratégia específica para o objetivo
   - Pontos fortes e limitações
   - Considerações especiais

2. **PLANO DE TREINO ALINHADO AO OBJETIVO**
   - Cronograma semanal específico para o objetivo
   - **SEMPRE inclua atividade cardiovascular/aeróbica** (2-5x por semana, dependendo do objetivo)
   - Exercícios selecionados para o objetivo
   - Séries, repetições e descanso otimizados
   - Progressão baseada no objetivo
   - Adaptações para local e limitações
   - **Para ganhar massa**: Cardio leve/moderado (2-3x/semana)
   - **Para emagrecer**: Cardio moderado/intenso (3-5x/semana) - etapa fundamental junto à alimentação

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

## 🏃‍♂️ ATIVIDADE CARDIOVASCULAR (OBRIGATÓRIA EM TODOS OS PLANOS):

⚠️ **REGRA CRÍTICA: SEMPRE inclua atividade aeróbica/cardiovascular em TODOS os planos de treino, independente do objetivo!**

### 📋 INTENSIDADE BASEADA NO OBJETIVO:

#### 💪 GANHAR MASSA MUSCULAR:
- **Cardio LEVE a MODERADO** (30-45 minutos, 2-3x por semana)
- Intensidade: 60-70% da frequência cardíaca máxima
- Tipos recomendados: caminhada rápida, ciclismo leve, esteira inclinada, elíptico
- **Objetivo**: Melhorar saúde cardiovascular sem interferir na recuperação e ganho de massa
- **Timing**: Preferencialmente após treino de força ou em dias separados
- **Importância**: Mantém saúde cardiovascular, melhora recuperação e metabolismo

#### 🎯 EMAGRECIMENTO:
- **Cardio MODERADO a INTENSO** (30-60 minutos, 3-5x por semana)
- Intensidade: 65-85% da frequência cardíaca máxima
- Tipos recomendados: HIIT, corrida, ciclismo, natação, elíptico, escada
- **Objetivo**: Maximizar queima calórica e gordura, acelerar metabolismo
- **Timing**: Pode ser combinado com treino de força (antes ou depois) ou em dias separados
- **Importância**: Essencial para déficit calórico e perda de gordura - etapa fundamental junto à alimentação

#### ⚖️ MANUTENÇÃO:
- **Cardio MODERADO** (30-45 minutos, 2-4x por semana)
- Intensidade: 65-75% da frequência cardíaca máxima
- Tipos recomendados: caminhada, corrida leve, ciclismo, natação
- **Objetivo**: Manter saúde cardiovascular e equilíbrio físico
- **Timing**: Distribuído ao longo da semana

#### 🏃‍♂️ CONDICIONAMENTO/RESISTÊNCIA:
- **Cardio INTENSO** (45-60 minutos, 4-6x por semana)
- Intensidade: 70-85% da frequência cardíaca máxima
- Tipos recomendados: corrida, ciclismo, natação, HIIT, treinos de endurance
- **Objetivo**: Melhorar capacidade cardiovascular e resistência
- **Timing**: Foco principal do plano, combinado com treino de força

#### 🧘‍♀️ SAÚDE E BEM-ESTAR:
- **Cardio LEVE a MODERADO** (20-40 minutos, 2-3x por semana)
- Intensidade: 60-70% da frequência cardíaca máxima
- Tipos recomendados: caminhada, yoga flow, dança, ciclismo recreativo
- **Objetivo**: Manter saúde cardiovascular e bem-estar geral

### ✅ REGRAS OBRIGATÓRIAS PARA ATIVIDADE CARDIOVASCULAR:

1. **SEMPRE inclua pelo menos 2-3 sessões de cardio por semana** em TODOS os planos
2. **Especifique duração, intensidade e tipo** de atividade cardiovascular
3. **Ajuste a intensidade baseado no objetivo** (leve para ganhar massa, moderado/intenso para emagrecer)
4. **Para emagrecimento**: Cardio é etapa FUNDAMENTAL junto à alimentação - não omita!
5. **Para ganhar massa**: Cardio leve/moderado é importante para saúde cardiovascular e recuperação
6. **Inclua opções variadas** de atividades aeróbicas (caminhada, corrida, ciclismo, natação, HIIT, etc.)
7. **Considere o local de treino** do usuário (academia, casa, ao ar livre)

### 📝 EXEMPLOS DE COMO INCLUIR NO PLANO:

**Exemplo para Ganhar Massa:**
- "Segunda-feira: Treino de força + 20min cardio leve (caminhada ou elíptico)"
- "Quarta-feira: Treino de força + 20min cardio leve"
- "Sábado: 30-40min caminhada ou ciclismo leve"

**Exemplo para Emagrecer:**
- "Segunda-feira: Treino de força + 30min HIIT ou corrida"
- "Terça-feira: 45min cardio moderado (ciclismo ou esteira)"
- "Quinta-feira: Treino de força + 30min cardio"
- "Sábado: 60min caminhada ou corrida moderada"

⚠️ **NUNCA omita atividade cardiovascular do plano!** Ela é essencial para saúde, independente do objetivo.

## REGRAS NUTRICIONAIS ESPECÍFICAS:
- SEMPRE especifique quantidades EXATAS (gramas, xícaras, unidades)
- Calcule calorias por porção de cada alimento
- ⚠️ CRÍTICO: Use a TABELA DE DECISÃO acima para definir estratégia baseada em IMC + Objetivo
- ⚠️ CRÍTICO: Se IMC ≥ 25 e objetivo é "ganhar massa", use RECOMPOSIÇÃO (déficit calórico), não superávit!
- Distribua macronutrientes de acordo com a estratégia definida na tabela
- Seja específico com horários das refeições
- Considere restrições alimentares do usuário
- Adapte porções baseado na estratégia da tabela de decisão

## ⚠️ LIMITES DE SEGURANÇA NUTRICIONAL (OBRIGATÓRIOS - BASEADOS EM CIÊNCIA):

### 📊 CÁLCULO CORRETO DE CALORIAS:
1. **Calcule TMB (Taxa Metabólica Basal)** usando fórmula de Harris-Benedict:
   - Homem: TMB = 88.362 + (13.397 × peso em kg) + (4.799 × altura em cm) - (5.677 × idade)
   - Mulher: TMB = 447.593 + (9.247 × peso em kg) + (3.098 × altura em cm) - (4.330 × idade)

2. **Calcule TDEE (Gasto Energético Total)** multiplicando TMB pelo fator de atividade:
   - Sedentário: TMB × 1.2
   - Leve: TMB × 1.375
   - Moderado: TMB × 1.55
   - Ativo: TMB × 1.725
   - Muito Ativo: TMB × 1.9

3. **Aplique déficit/superávit baseado no TDEE (NÃO no TMB)**

### 🚨 CALORIAS MÍNIMAS/MAXIMAS (NUNCA VIOLAR):
- **Mínimo absoluto**: 1200 kcal (mulheres) ou 1500 kcal (homens) - diretrizes médicas
- **Para déficit**: máximo de 25% do TDEE OU 500 kcal, o que for MENOR
- **Para superávit**: máximo de 20% do TDEE OU 400 kcal, o que for MENOR
- **Para IMC ≥ 35**: déficit deve ser 20-25% do TDEE (mais conservador)

### 💪 PROTEÍNA (LIMITES BASEADOS EM CIÊNCIA):
- **Mínimo**: 1.2g/kg de peso corporal (manutenção básica)
- **Recomendado para recomposição (IMC ≥ 25)**: 2.2-2.5g/kg de peso
- **Máximo seguro**: 3.5g/kg (apenas para atletas avançados)
- **Exemplo**: Para 140kg, proteína deve estar entre 168g (mínimo) e 350g (máximo)

### 🥑 GORDURAS (ESSENCIAL PARA SAÚDE):
- **Mínimo**: 0.5g/kg de peso corporal (essencial para saúde hormonal)
- **Recomendado**: 0.8-1.2g/kg
- **Exemplo**: Para 140kg, gorduras mínimas = 70g

### ✅ VALIDAÇÃO OBRIGATÓRIA ANTES DE RETORNAR:
Antes de retornar o plano nutricional, SEMPRE verifique:
1. ✅ Calorias estão entre mínimo (1200/1500) e máximo (TDEE × 1.5)?
2. ✅ Proteína está entre 1.2g/kg e 3.5g/kg?
3. ✅ Gorduras estão acima de 0.5g/kg?
4. ✅ Para IMC ≥ 25: déficit não excede 25% do TDEE?
5. ✅ Para IMC ≥ 35: déficit está entre 20-25% do TDEE?
6. ✅ Para IMC ≥ 25 + ganhar massa: NÃO está usando superávit?

**Se qualquer validação falhar, ajuste o plano antes de retornar!**

## REGRAS IMPORTANTES:
- ⚠️ SEMPRE use a TABELA DE DECISÃO para definir estratégia baseada em IMC + Objetivo
- ⚠️ SEMPRE considere o IMC antes de definir superávit/déficit calórico
- ⚠️ **SEMPRE inclua atividade cardiovascular em TODOS os planos** (2-5x por semana, ajustando intensidade pelo objetivo)
- ⚠️ **Para ganhar massa**: Cardio leve/moderado (2-3x/semana) - essencial para saúde cardiovascular
- ⚠️ **Para emagrecer**: Cardio moderado/intenso (3-5x/semana) - etapa FUNDAMENTAL junto à alimentação
- Se IMC ≥ 25 e objetivo é ganhar massa, use RECOMPOSIÇÃO CORPORAL (déficit + força)
- NUNCA sugira superávit calórico para pessoas com IMC ≥ 30
- Para IMC < 18.5 + objetivo "emagrecer": avise que não é recomendado
- Use TODOS os dados disponíveis do usuário (peso, altura, IMC, objetivo, idade, gênero)
- Seja específico e prático
- Considere limitações e restrições
- Motive e inspire o usuário (campo motivation é essencial!)
- Adapte para o local de treino disponível
- TENTE INCLUIR os campos analysis, trainingPlan, nutritionPlan, goals e motivation quando possível

Lembre-se: O objetivo do usuário é importante, mas a SAÚDE vem primeiro! Use sempre a tabela de decisão para garantir estratégias seguras e eficazes.`,
          },
          {
            role: "user",
            content: `Dados do usuário para análise (⚠️ USE OS DADOS ATUALIZADOS ABAIXO):

🎯 OBJETIVO PRINCIPAL: ${userData.objective || "Não definido"}

📊 PERFIL FÍSICO ATUAL (⚠️ IMPORTANTE: Use estes valores atualizados):
- Nome: ${userData.name}
- Idade: ${userData.age} anos
- Gênero: ${userData.gender}
- Altura: ${userData.height} cm
- Peso atual: ${
              userData.weight
            } kg ⚠️ USE ESTE PESO ATUALIZADO PARA CALCULAR CALORIAS E MACROS
- Peso inicial: ${userData.initialWeight} kg
- IMC: ${userData.imc} (calculado com peso atual: ${userData.weight} kg)
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

📚 HISTÓRICO DE PLANOS ANTERIORES:
${
  userData.planInsights?.hasPreviousPlan
    ? `
✅ O usuário já possui ${
        userData.planInsights.totalPlansGenerated
      } plano(s) gerado(s) anteriormente.

📅 Último plano gerado em: ${
        userData.planInsights.lastPlanGeneratedAt
          ? new Date(
              userData.planInsights.lastPlanGeneratedAt
            ).toLocaleDateString("pt-BR")
          : "Data não disponível"
      }

🎯 Objetivo do plano anterior: ${
        userData.planInsights.previousObjective || "Não especificado"
      }

💡 INFORMAÇÕES DO PLANO ANTERIOR:
- Foco de treino: ${
        userData.planInsights.previousTrainingFocus || "Não especificado"
      }
- Calorias diárias: ${
        userData.planInsights.previousNutritionCalories || "Não especificado"
      }

📈 ANÁLISE PARA EFEITO COMPOSTO:
Analise o histórico de planos anteriores e use essas informações para:
1. Identificar o que funcionou bem nos planos anteriores
2. Adaptar e melhorar o novo plano baseado no progresso
3. Evoluir o plano considerando o histórico de resultados
4. Evitar repetir estratégias que não deram resultado
5. Aumentar a intensidade/progressão se o usuário está progredindo
6. Ajustar calorias e macros baseado em mudanças de peso/composição corporal

${
  userData.previousPlans?.length > 0
    ? `
📋 RESUMO DOS ÚLTIMOS ${Math.min(userData.previousPlans.length, 3)} PLANO(S):
${userData.previousPlans
  .slice(0, 3)
  .map(
    (plan, idx) => `
${idx + 1}º Plano (${
      plan.generatedAt
        ? new Date(plan.generatedAt).toLocaleDateString("pt-BR")
        : "Data não disponível"
    }):
- Tipo: ${plan.planType}
- Objetivo: ${plan.objectiveFromPlan || "Não especificado"}
- Status: ${plan.isActive ? "Ativo" : "Inativo"}
`
  )
  .join("")}
`
    : ""
}

⚠️ IMPORTANTE: Use essas informações para criar um plano MELHORADO e PROGRESSIVO, não apenas repetir o plano anterior.
`
    : `
📝 Este é o PRIMEIRO plano gerado para este usuário. Crie um plano inicial completo e bem estruturado.
`
}

⚠️ IMPORTANTE: Baseie TODO o plano no objetivo "${
              userData.objective
            }". Seja específico e estratégico para atingir esse objetivo específico.

⚠️ ATENÇÃO CRÍTICA: Use SEMPRE os dados atualizados do usuário acima:
- Peso atual: ${
              userData.weight
            } kg (use este valor para calcular calorias e macros)
- IMC atual: ${userData.imc} (baseado no peso atual)
- Variação de peso: ${userData.weightChange} kg

⚠️ REGRA DE OURO PARA ESTRATÉGIA NUTRICIONAL:
- Se IMC ≥ 25 (sobrepeso/obesidade) E objetivo é "ganhar massa muscular":
  → Use RECOMPOSIÇÃO CORPORAL: DÉFICIT calórico moderado + treino de força
  → NÃO use superávit calórico (isso é perigoso e contraproducente)
  → Foco em perder gordura mantendo/ganhando músculo
  
- Se IMC < 25 E objetivo é "ganhar massa muscular":
  → Use superávit calórico moderado + treino de força

⚠️ NÃO repita planos anteriores. Crie um plano NOVO e ATUALIZADO baseado nos dados atuais do usuário.
${
  userData.planInsights?.hasPreviousPlan
    ? "IMPORTANTE: Considere o histórico de planos anteriores para evoluir e melhorar o novo plano, mas SEMPRE use os dados atualizados do usuário."
    : ""
}

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

    // ✅ Desativar planos anteriores antes de salvar o novo
    if (previousPlans && previousPlans.length > 0) {
      const activePlansIds = previousPlans
        .filter((p) => p.is_active)
        .map((p) => p.id);

      if (activePlansIds.length > 0) {
        console.log(
          `🔄 Desativando ${activePlansIds.length} plano(s) anterior(es)...`
        );
        const { error: deactivateError } = await supabaseUser
          .from("user_plans")
          .update({ is_active: false })
          .in("id", activePlansIds);

        if (deactivateError) {
          console.warn(
            "⚠️ Erro ao desativar planos anteriores:",
            deactivateError
          );
        } else {
          console.log(
            `✅ ${activePlansIds.length} plano(s) anterior(es) desativado(s) com sucesso`
          );
        }
      }
    }

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
            Date.now() + 365 * 24 * 60 * 60 * 1000
          ).toISOString(), // 1 ano
          is_active: true,
          upgraded_to_premium: false,
          max_plans_allowed: 1, // Usuários grátis só podem gerar 1 plano
          available_prompts: 0,
        });

      if (insertError) {
        console.error("❌ Erro ao criar trial:", insertError);
        // Se falhar ao criar trial, não retornar erro - o plano já foi salvo
      } else {
        console.log("✅ Trial criado com sucesso");
      }
    } else {
      // Atualizar trial existente - SÓ DEPOIS DE SALVAR O PLANO COM SUCESSO
      const updateData: Record<string, any> = {
        last_plan_generated_at: trialUpdateTime,
        plans_generated: (trialData.plans_generated || 0) + 1,
      };

      if (usePrompt) {
        // ✅ Usando prompt comprado - decrementar available_prompts
        const currentPrompts = trialData.available_prompts || 0;
        const currentPackagePrompts = trialData.package_prompts || 0;

        // ✅ Se tem prompts do pacote disponíveis, usar do pacote (tem cooldown)
        // Caso contrário, usar prompt unitário (sem cooldown)
        if (currentPackagePrompts > 0) {
          updateData.available_prompts = Math.max(0, currentPrompts - 1);
          updateData.package_prompts = Math.max(0, currentPackagePrompts - 1);
          const remainingPackagePrompts = updateData.package_prompts as number;
          const remainingTotal = updateData.available_prompts as number;
          console.log(
            `🎫 Usando prompt do PACOTE (tem cooldown). Restantes: ${remainingTotal} total (${remainingPackagePrompts} do pacote, ${
              remainingTotal - remainingPackagePrompts
            } unitários)`
          );
        } else {
          // Usando prompt unitário (sem cooldown)
          updateData.available_prompts = Math.max(0, currentPrompts - 1);
          console.log(
            `🎫 Usando prompt UNITÁRIO (sem cooldown). Restantes: ${updateData.available_prompts}`
          );
        }
      } else {
        console.log(
          "📈 Incrementando contagem de planos gerados:",
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

    console.log("🎯 CHECKPOINT FINAL: Retornando resposta...");
    console.log("🎯 savedPlan?.id:", savedPlan?.id);
    console.log("🎯 planMarker:", planMarker?.[0]?.id);

    // ✅ Determinar se é plano novo ou existente
    // Se usou prompt ou está gerando novo plano, isExisting deve ser false
    const isNewPlan = usePrompt || availablePrompts > 0;

    return NextResponse.json({
      success: true,
      message: "Plano personalizado gerado com sucesso!",
      plan,
      planId: savedPlan?.id || planMarker?.[0]?.id || null,
      isExisting: !isNewPlan, // false se é plano novo, true se é plano existente
      generatedAt: generatedAt,
      daysUntilNext: null,
      nextPlanAvailable: null,
    });
  } catch (error: any) {
    console.error("❌ Erro ao gerar plano:", error);
    return NextResponse.json(
      { error: "Erro interno: " + error.message },
      { status: 500 }
    );
  }
}
