/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { supabase } from "@/lib/supabase";
import { PersonalizedPlan } from "@/types/personalized-plan";

// Tipo auxiliar para mealPlan
type MealPlanItem = NonNullable<
  PersonalizedPlan["nutritionPlan"]
>["mealPlan"][number];
type MealOption = MealPlanItem["options"][number];
// Função para criar cliente OpenAI apenas quando necessário
function createOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  console.log("apiKey", apiKey);
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
                  muscleGroups: { type: "string" },
                },
                // ⚠️ OpenAI strict json_schema exige `required` contendo TODAS as chaves em `properties`
                required: [
                  "name",
                  "sets",
                  "reps",
                  "rest",
                  "notes",
                  "muscleGroups",
                ],
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
  aerobicTraining: {
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
            activity: { type: "string" },
            duration: { type: "string" },
            intensity: { type: "string" },
            heartRateZone: { type: "string" },
            notes: { type: "string" },
          },
          required: ["day", "activity", "duration", "intensity"],
        },
      },
      recommendations: { type: "string" },
      progression: { type: "string" },
    },
    required: ["overview", "weeklySchedule", "recommendations", "progression"],
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
  } catch (jsonError) {
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
    model: "gpt-4o-mini",
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

    if (!nutrition) {
      missingFields.push("nutritionPlan");
    } else {
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

      const mealPlan = nutrition!.mealPlan;
      if (!Array.isArray(mealPlan) || mealPlan.length === 0) {
        missingFields.push("nutritionPlan.mealPlan");
      } else {
        mealPlan.forEach((meal: MealPlanItem, idx: number) => {
          if (!meal.meal) {
            missingFields.push(`nutritionPlan.mealPlan[${idx}].meal`);
          }

          const options = meal.options ?? ([] as MealOption[]);
          if (!options.length) {
            missingFields.push(`nutritionPlan.mealPlan[${idx}].options`);
          } else {
            options.forEach((option: MealOption, optIdx: number) => {
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

  // trainingPlan pode ser gerado sob demanda (aba "Treino") para evitar truncamento por tokens.
  // Portanto, NÃO validamos trainingPlan como obrigatório aqui.
  if (planData.goals) {
    if (!planData.goals.weekly) missingFields.push("goals.weekly");
    if (!planData.goals.monthly) missingFields.push("goals.monthly");
    if (!planData.goals.tracking) missingFields.push("goals.tracking");
  }
  if (planData.motivation) {
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
      // Usuário novo - não pode gerar plano grátis, precisa comprar prompts
      canGenerate = false;
      trialMessage = "Você precisa comprar um pacote para gerar planos";
      availablePrompts = 0;
    } else {
      const plansGenerated = trialData.plans_generated || 0;
      availablePrompts = trialData.available_prompts || 0;
      const maxFreePlans = trialData.max_plans_allowed || 0;
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
                  ? "1 crédito unitário disponível (sem cooldown)"
                  : `${singlePrompts} créditos unitários disponíveis (sem cooldown)`;
              console.log(
                `✅ ${singlePrompts} crédito(s) unitário(s) disponível(is) - pode gerar sem cooldown`
              );
            } else {
              // Só tem prompts do pacote - precisa aguardar cooldown
              const hours = Math.floor(hoursRemaining);
              const minutes = Math.floor((hoursRemaining - hours) * 60);
              canGenerate = false;
              usePrompt = false;
              trialMessage = `Aguarde ${hours}h ${minutes}m para gerar um novo plano (cooldown do pacote). Você ainda tem ${packagePrompts} crédito(s) do pacote disponível(is).`;

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
                ? "1 crédito disponível"
                : `${availablePrompts} créditos disponíveis`;

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
                ? `1 crédito unitário disponível (sem cooldown). ${packagePrompts} crédito(s) do pacote também disponível(is).`
                : `${singlePrompts} créditos unitários disponíveis (sem cooldown). ${packagePrompts} crédito(s) do pacote também disponível(is).`;
          } else {
            trialMessage =
              availablePrompts === 1
                ? "1 crédito disponível"
                : `${availablePrompts} créditos disponíveis`;
          }

          if (packagePrompts === 0) {
            console.log(
              `✅ ${availablePrompts} crédito(s) unitário(s) - pode gerar sem cooldown`
            );
          } else {
            console.log("✅ Primeiro plano com crédito do pacote - pode gerar");
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
            errorCode: "NO_CREDITS",
            message:
              "Você atingiu o limite de planos gratuitos. Compre créditos para gerar novos planos personalizados!",
            trialMessage,
            actionRequired: "purchase_prompts",
            availablePrompts: 0,
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

    // ✅ 3. Buscar dados normalizados das tabelas para reutilização
    console.log("📊 Buscando dados normalizados para reutilização...");

    interface NormalizedDataInsights {
      aerobic?: {
        averageFrequency: number;
        averageDuration: number;
        preferredActivities: string[];
        lastProgression?: string | null;
        intensityTrend?: string;
      };
      nutrition?: {
        averageCalories: number;
        averageProtein: number;
        averageCarbs: number;
        averageFats: number;
        calorieTrend?: string;
      };
      training?: {
        commonExercises: string[];
        averageFrequency: number;
        lastProgression?: string | null;
      };
      analysis?: {
        commonStrengths: string[];
        commonImprovements: string[];
      };
    }

    const normalizedInsights: NormalizedDataInsights = {};

    // Buscar dados de treino aeróbico
    const { data: historicalAerobic } = await supabaseUser
      .from("plan_aerobic")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    if (historicalAerobic && historicalAerobic.length > 0) {
      console.log(
        `✅ Encontrados ${historicalAerobic.length} registro(s) de treino aeróbico`
      );

      const activities = new Map<string, number>();
      let totalFrequency = 0;
      let totalDuration = 0;
      let totalSessions = 0;

      historicalAerobic.forEach((plan) => {
        if (plan.weekly_schedule && Array.isArray(plan.weekly_schedule)) {
          plan.weekly_schedule.forEach((session: any) => {
            const activity = session.activity || "Não especificado";
            activities.set(activity, (activities.get(activity) || 0) + 1);

            // Extrair duração (ex: "30-40 minutos" -> média 35)
            const durationMatch = session.duration?.match(/(\d+)/g);
            if (durationMatch && durationMatch.length > 0) {
              const durations = durationMatch.map(Number);
              const avgDuration =
                durations.reduce((a: number, b: number) => a + b, 0) /
                durations.length;
              totalDuration += avgDuration;
              totalSessions++;
            }
          });
          totalFrequency += plan.weekly_schedule.length;
        }
      });

      normalizedInsights.aerobic = {
        averageFrequency: totalFrequency / historicalAerobic.length,
        averageDuration: totalSessions > 0 ? totalDuration / totalSessions : 0,
        preferredActivities: Array.from(activities.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([activity]) => activity),
        lastProgression: historicalAerobic[0]?.progression || null,
        intensityTrend: historicalAerobic.length >= 2 ? "analisar" : undefined,
      };
    }

    // Buscar dados nutricionais
    const { data: historicalNutrition } = await supabaseUser
      .from("plan_nutrition")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    if (historicalNutrition && historicalNutrition.length > 0) {
      console.log(
        `✅ Encontrados ${historicalNutrition.length} registro(s) nutricionais`
      );

      const calories = historicalNutrition
        .map((n) => n.daily_calories)
        .filter((c): c is number => typeof c === "number" && c > 0);
      const proteins = historicalNutrition
        .map((n) => n.protein_grams)
        .filter((p): p is number => typeof p === "number" && p > 0);
      const carbs = historicalNutrition
        .map((n) => n.carbs_grams)
        .filter((c): c is number => typeof c === "number" && c > 0);
      const fats = historicalNutrition
        .map((n) => n.fats_grams)
        .filter((f): f is number => typeof f === "number" && f > 0);

      const avgCalories =
        calories.length > 0
          ? calories.reduce((a, b) => a + b, 0) / calories.length
          : 0;
      const avgProtein =
        proteins.length > 0
          ? proteins.reduce((a, b) => a + b, 0) / proteins.length
          : 0;
      const avgCarbs =
        carbs.length > 0 ? carbs.reduce((a, b) => a + b, 0) / carbs.length : 0;
      const avgFats =
        fats.length > 0 ? fats.reduce((a, b) => a + b, 0) / fats.length : 0;

      normalizedInsights.nutrition = {
        averageCalories: Math.round(avgCalories),
        averageProtein: Math.round(avgProtein),
        averageCarbs: Math.round(avgCarbs),
        averageFats: Math.round(avgFats),
        calorieTrend:
          calories.length >= 2
            ? calories[0] > calories[calories.length - 1]
              ? "diminuindo"
              : "aumentando"
            : undefined,
      };
    }

    // Buscar dados de treino de força
    const { data: historicalTraining } = await supabaseUser
      .from("plan_trainings")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    if (historicalTraining && historicalTraining.length > 0) {
      console.log(
        `✅ Encontrados ${historicalTraining.length} registro(s) de treino de força`
      );

      const exercises = new Map<string, number>();
      let totalFrequency = 0;

      historicalTraining.forEach((plan) => {
        if (plan.exercises && Array.isArray(plan.exercises)) {
          plan.exercises.forEach((day: any) => {
            if (day.exercises && Array.isArray(day.exercises)) {
              day.exercises.forEach((exercise: any) => {
                const name = exercise.name || "Não especificado";
                exercises.set(name, (exercises.get(name) || 0) + 1);
              });
            }
          });
          totalFrequency += plan.exercises.length;
        }
      });

      normalizedInsights.training = {
        commonExercises: Array.from(exercises.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([exercise]) => exercise),
        averageFrequency: totalFrequency / historicalTraining.length,
        lastProgression: historicalTraining[0]?.progression || null,
      };
    }

    // Buscar dados de análise
    const { data: historicalAnalysis } = await supabaseUser
      .from("plan_analyses")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    if (historicalAnalysis && historicalAnalysis.length > 0) {
      console.log(
        `✅ Encontrados ${historicalAnalysis.length} registro(s) de análise`
      );

      const strengths = new Map<string, number>();
      const improvements = new Map<string, number>();

      historicalAnalysis.forEach((plan) => {
        if (plan.strengths && Array.isArray(plan.strengths)) {
          plan.strengths.forEach((strength: string) => {
            strengths.set(strength, (strengths.get(strength) || 0) + 1);
          });
        }
        if (plan.improvements && Array.isArray(plan.improvements)) {
          plan.improvements.forEach((improvement: string) => {
            improvements.set(
              improvement,
              (improvements.get(improvement) || 0) + 1
            );
          });
        }
      });

      normalizedInsights.analysis = {
        commonStrengths: Array.from(strengths.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([strength]) => strength),
        commonImprovements: Array.from(improvements.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([improvement]) => improvement),
      };
    }

    console.log("📊 Insights normalizados extraídos:", {
      hasAerobic: !!normalizedInsights.aerobic,
      hasNutrition: !!normalizedInsights.nutrition,
      hasTraining: !!normalizedInsights.training,
      hasAnalysis: !!normalizedInsights.analysis,
    });

    // 4. Preparar dados para OpenAI (incluindo histórico de planos e insights normalizados)
    // ✅ Garantir que estamos usando os dados mais recentes do perfil

    // ✅ INTERPRETAÇÃO INTELIGENTE DE OBJETIVOS (antes de criar userData)
    const imc =
      profile?.height && profile?.weight
        ? parseFloat(
            (profile.weight / Math.pow(profile.height / 100, 2)).toFixed(1)
          )
        : null;

    let interpretedObjective = profile?.objective || "Não informado";
    if (imc !== null) {
      const { interpretObjective, logObjectiveConversion } = await import(
        "@/lib/rules/objectiveInterpretation"
      );
      const conversion = interpretObjective({
        imc,
        nivelAtividade: profile?.nivel_atividade || "Moderado",
        objective: profile?.objective || "Não informado",
        weight: profile?.weight,
        height: profile?.height,
        age: profile?.age,
        gender: profile?.gender,
      });

      if (conversion.wasConverted) {
        interpretedObjective = conversion.interpretedObjective;
        logObjectiveConversion(conversion, {
          imc,
          nivelAtividade: profile?.nivel_atividade || "Moderado",
          objective: profile?.objective || "Não informado",
          weight: profile?.weight,
          height: profile?.height,
          age: profile?.age,
          gender: profile?.gender,
        });
      }
    }

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
      objective: interpretedObjective, // ✅ Usar objetivo interpretado
      trainingFrequency: profile?.training_frequency || "Não informado",
      trainingLocation: profile?.training_location || "Academia",
      trainingTime: profile?.training_time || null, // Tempo disponível por treino
      nivelAtividade: profile?.nivel_atividade || "Moderado", // ✅ Nível de atividade do perfil

      // Restrições
      hasPain: profile?.has_pain || false,
      dietaryRestrictions: profile?.dietary_restrictions || "Nenhuma",
      foodBudget: profile?.food_budget || "moderado",

      // Histórico de evolução
      latestEvolution: evolutions?.[0] || null,
      evolutionHistory: evolutions || [],

      // Atividades recentes
      recentActivities: activities || [],

      // Metas
      currentGoals: goals || [],

      // Cálculos - ✅ Usar IMC já calculado acima
      imc: imc !== null ? imc.toFixed(1) : null,
      weightChange:
        profile?.weight && profile?.initial_weight
          ? (profile.weight - profile.initial_weight).toFixed(1)
          : null,

      // ✅ Histórico de planos anteriores para efeito composto
      previousPlans: planHistory,
      planInsights: planInsights,

      // ✅ Insights normalizados das tabelas (para reutilização)
      normalizedInsights: normalizedInsights,
    };

    // 4. Gerar plano com OpenAI (usando histórico de planos anteriores)
    const openai = createOpenAIClient();

    // ✅ PROGRESSÃO DE CARDIO (antes de gerar plano)
    let cardioProgression = null;
    if (imc !== null && profile) {
      const { determineCardioProgression, logCardioProgression } = await import(
        "@/lib/rules/cardioProgression"
      );
      // Extrair frequência de cardio do userData se disponível (pode estar em aerobicTraining ou ser inferida)
      const cardioFreq = 0; // Será determinado pelo sistema baseado no objetivo
      cardioProgression = determineCardioProgression({
        nivelAtividade: profile.nivel_atividade || "Moderado",
        imc,
        cardioFrequency: cardioFreq,
        trainingFrequency:
          parseInt(String(profile.training_frequency || 0)) || 0,
      });
      logCardioProgression(
        cardioProgression,
        {
          nivelAtividade: profile.nivel_atividade || "Moderado",
          imc,
          cardioFrequency: cardioFreq,
          trainingFrequency:
            parseInt(String(profile.training_frequency || 0)) || 0,
        },
        cardioFreq
      );
    }

    // Função para gerar plano com retry se necessário
    const generatePlanWithRetry = async (attempt = 1, maxAttempts = 3) => {
      console.log(
        `🔄 Tentativa ${attempt}/${maxAttempts} de gerar plano completo...`
      );

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0,
        max_tokens: 4096,
        messages: [
          {
            role: "system",
            content: `Você é um personal trainer e nutricionista esportivo de elite. Sua missão é gerar um plano de saúde IMPECÁVEL.
Qualidade e precisão fisiológica são inegociáveis.

⚠️ Qualquer violação destas regras invalida o plano.

====================================================================
🔒 CLÁUSULA FAIL-FAST (CRÍTICO)
====================================================================
Se por qualquer motivo técnico ou de tempo você não conseguir cumprir RIGOROSAMENTE as regras de:
- Segurança nutricional e limites de proteína (máx 180g mulheres / 220g homens)
- Interpretação inteligente de objetivo (Recomposição para IMC ≥ 30)
- Volume mínimo por músculo grande
NÃO GERE O PLANO. É preferível falhar do que entregar uma estratégia que comprometa a saúde ou os resultados de elite do usuário.

====================================================================
1️⃣ INTERPRETAÇÃO INTELIGENTE DE OBJETIVO (REGRA CRÍTICA)
====================================================================
- Nunca interprete o objetivo literalmente sem avaliar o contexto fisiológico.
- Se IMC ≥ 30 E nível de atividade = Sedentário:
  * NÃO gerar plano com foco em "ganho de massa puro".
  * Converter automaticamente para: "Recomposição corporal com foco em força e preservação de massa magra".
  * Justificativa: Pessoas obesas precisam fortalecer a massa magra enquanto reduzem gordura, não apenas ganhar peso.

====================================================================
2️⃣ NUTRIÇÃO — LIMITES FISIOLÓGICOS OBRIGATÓRIOS
====================================================================
- Proteína: Basear sempre na massa magra estimada.
- Faixa válida: 1.6 a 2.2 g/kg de massa magra.
- Limite absoluto de segurança: Mulheres (máx 180g/dia) | Homens (máx 220g/dia).
- Proteína NUNCA deve exceder 75% das calorias totais.
- Se houver ajuste de proteína: Redistribuir calorias (60% Carbs, 40% Gorduras).

====================================================================
3️⃣ CARDIO — PROGRESSÃO AUTOMÁTICA PARA SEDENTÁRIOS
====================================================================
- Se nível = Sedentário:
  * IMC ≥ 35 → máx 2 sessões/semana, intensidade leve.
  * IMC 30-34.9 → máx 3 sessões/semana, intensidade leve.
  * IMC < 30 → máx 3 sessões/semana, intensidade leve.
- Progressão automática sugerida após 2-4 semanas.
- Total de estímulos semanais (Musculação + Cardio) ≤ 6 inicialmente.

====================================================================
4️⃣ VOLUME MÍNIMO POR GRUPO MUSCULAR (REGRA FUNDAMENTAL)
====================================================================
- Nunca subdimensionar músculos grandes (Peitoral, Costas, Quadríceps, Posterior, Glúteos).
- Atletas/Treinados: Mínimo 3 exercícios por músculo grande por sessão.
- Intermediários: 2-3 exercícios (3 preferencial).
- Iniciantes: 2 exercícios aceitável.
- Esta regra vale igualmente para homens e mulheres.

====================================================================
5️⃣ FREQUÊNCIA SEMANAL E DIVISÕES (IMPORTANTE)
====================================================================
- Se frequência = 5x/semana: Aceitável um grupo com menor frequência. Sugerir 6º dia se possível.
- Repetir treinos (A/B) é válido. Consistência > Criatividade aleatória.

====================================================================
6️⃣ CLASSIFICAÇÃO CORRETA DOS EXERCÍCIOS
====================================================================
- Nunca rotular exercícios de forma anatomicamente incorreta.
- ❌ Panturrilha ≠ Ombros.
- ✅ Remadas: Classificar como "costas" (mencionar deltoide posterior como secundário).
- ✅ Face Pull: "costas" ou "ombros" (foco deltoide posterior).

====================================================================
7️⃣ TOM E QUALIDADE FINAL
====================================================================
- Seja confiante, técnico e claro.
- Evite jargões desnecessários e promessas irreais.
- O objetivo é um plano fisiologicamente coerente, clínico e defensivo.

⚠️ INSTRUÇÃO DE QUALIDADE:
- Seja extremamente detalhado na análise estratégica.
- No plano nutricional, escolha alimentos que façam sentido para o objetivo e orçamento.
- Seja inspirador no campo motivation, use o nome do usuário e seus dados para criar uma conexão real.

⚠️ IMPORTANTE: O campo trainingPlan.weeklySchedule deve conter EXATAMENTE ${userData.trainingFrequency} dias de treino de musculação.
⚠️ **CRÍTICO: SEMPRE inclua o campo aerobicTraining em TODOS os planos!**

Use esta tabela para definir a estratégia correta:

| IMC | Objetivo | Estratégia Nutricional | Estratégia de Treino | Proteína |
|-----|----------|------------------------|---------------------|----------|
| < 18.5 | Ganhar Massa | Superávit moderado (TDEE + 200-400 kcal) | Força progressiva | 1.6-2.2g/kg |
| < 18.5 | Emagrecer | ⚠️ NÃO recomendado (já abaixo do peso) | Manutenção/Leve | 1.2-1.6g/kg |
| < 18.5 | Manter | Manutenção (TDEE) | Equilíbrio força/cardio | 1.2-1.6g/kg |
| < 18.5 | Condicionamento | Manutenção ou leve superávit | Endurance + força | 1.4-1.8g/kg |
| 18.5-24.9 | Ganhar Massa | Superávit leve (TDEE + 200-400 kcal) | Força progressiva | 1.6-2.2g/kg |
| 18.5-24.9 | Emagrecer | Déficit moderado a alto (TDEE - 400-600 kcal) | HIIT + força | 1.6-2.0g/kg |
| 18.5-24.9 | Definição | Déficit leve (TDEE - 250-350 kcal) | Força volume alto | 2.0-2.5g/kg |
| 18.5-24.9 | Manter | Manutenção (TDEE) | Equilíbrio força/cardio | 1.2-1.6g/kg |
| 18.5-24.9 | Condicionamento | Manutenção ou leve déficit | Endurance + força | 1.4-1.8g/kg |
| 25-29.9 | Ganhar Massa | 🔄 RECOMPOSIÇÃO: Déficit (TDEE - 300-500 kcal) | Força progressiva | 2.2-2.5g/kg |
| 25-29.9 | Emagrecer | Déficit moderado a alto (TDEE - 400-600 kcal) | HIIT + força | 1.6-2.0g/kg |
| 25-29.9 | Definição | Déficit leve (TDEE - 250-350 kcal) | Força volume alto | 2.0-2.5g/kg |
| 25-29.9 | Manter | Manutenção ou leve déficit (TDEE - 100-200 kcal) | Força + cardio | 1.4-1.8g/kg |
| 25-29.9 | Condicionamento | Déficit leve (TDEE - 200-300 kcal) | Endurance + força | 1.6-2.0g/kg |
| 30-34.9 | Ganhar Massa | 🔄 RECOMPOSIÇÃO: Déficit (TDEE - 20-25%) | Força progressiva | 2.2-2.5g/kg |
| 30-34.9 | Emagrecer | Déficit moderado a alto (TDEE - 400-600 kcal ou 20-25%) | HIIT + força | 1.6-2.0g/kg |
| 30-34.9 | Definição | Déficit leve (TDEE - 250-350 kcal) | Força volume alto | 2.0-2.5g/kg |
| 30-34.9 | Manter | Déficit leve (TDEE - 10-15%) | Força + cardio | 1.6-2.0g/kg |
| 30-34.9 | Condicionamento | Déficit moderado (TDEE - 20-25%) | Endurance + força | 1.6-2.0g/kg |
| ≥ 35 | Ganhar Massa | 🔄 RECOMPOSIÇÃO: Déficit (TDEE - 20-25%) | Força progressiva | 2.2-2.5g/kg |
| ≥ 35 | Emagrecer | Déficit conservador a moderado (TDEE - 400-600 kcal ou 20-25%) | Força + cardio moderado | 1.6-2.0g/kg |
| ≥ 35 | Definição | Déficit leve (TDEE - 250-350 kcal) | Força volume moderado | 2.0-2.5g/kg |
| ≥ 35 | Manter | Déficit leve (TDEE - 15-20%) | Força + cardio leve | 1.6-2.0g/kg |
| ≥ 35 | Condicionamento | Déficit conservador (TDEE - 20-25%) | Endurance + força | 1.6-2.0g/kg |

⚠️ **REGRAS CRÍTICAS:**
- IMC ≥ 25 + "Ganhar Massa" = SEMPRE usar RECOMPOSIÇÃO (déficit + força)
- IMC ≥ 30 = NUNCA usar superávit calórico
- IMC < 18.5 + "Emagrecer" = Avisar que não é recomendado
- Todos os cenários devem respeitar os limites mínimos de calorias, proteína e gorduras

### 🎯 ESTRATÉGIAS DETALHADAS POR OBJETIVO:

#### 🎯 EMAGRECIMENTO:
- Déficit calórico moderado a alto (TDEE - 400-600 kcal)
- **ATIVIDADE CARDIOVASCULAR OBRIGATÓRIA**: 3-5x por semana, moderada a intensa (30-60min)
- Treinos com volume moderado
- Treinos de alta intensidade (HIIT, cardio) + força para preservar massa
- **Cardio é etapa FUNDAMENTAL junto à alimentação** - essencial para déficit calórico e perda de gordura
- Foco em queima de gordura preservando massa magra
- Proteína elevada (1.6-2.0g/kg) para preservação muscular
- Metabolismo acelerado
- **PRESCRIÇÃO DE FORÇA BASEADA EM IMC:**
  - IMC < 30: 8-12 repetições, 3-4 séries
  - IMC 30-34.9: 12-18 repetições, 3-4 séries (priorizar segurança articular)
  - IMC ≥ 35: 15-20 repetições, 2-3 séries (máxima segurança, técnica perfeita)
  - ⚠️ NUNCA prescreva menos de 10 repetições para IMC ≥ 30
  - ⚠️ Para obesidade grau III (IMC ≥ 40): priorizar exercícios seguros, evitar sobrecarga articular

#### 🎯 DEFINIÇÃO (diferente de emagrecimento):
- Déficit calórico leve (TDEE - 250-350 kcal)
- Proteína mais alta (2.0-2.5g/kg) para preservação máxima de massa magra
- Treinos com volume ALTO e intensidade controlada
- **ATIVIDADE CARDIOVASCULAR**: leve a moderada, 2-3x por semana (30-45min)
- Foco em preservar/aumentar massa magra enquanto reduz gordura corporal
- Progressão de força mantida (não reduzir carga)
- **PRESCRIÇÃO DE FORÇA BASEADA EM IMC:**
  - IMC < 30: 8-12 repetições, 3-5 séries (volume alto)
  - IMC 30-34.9: 10-15 repetições, 3-4 séries (volume moderado-alto)
  - IMC ≥ 35: 12-18 repetições, 3-4 séries (volume moderado)
  - ⚠️ Volume semanal maior que emagrecimento para preservar massa

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
- **PRESCRIÇÃO DE FORÇA PARA RECOMPOSIÇÃO:**
  - IMC 25-29.9: 8-12 repetições, 3-4 séries ⚠️ NÃO use 6-8 reps
  - IMC 30-34.9: 10-15 repetições, 3-4 séries ⚠️ NÃO use menos de 10 reps
  - IMC ≥ 35: 12-18 repetições, 2-3 séries ⚠️ NUNCA use menos de 12 reps
  - Cargas moderadas (70-80% 1RM estimado), priorizar técnica sobre carga

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

2. **PLANO DE TREINO DE FORÇA/MUSCULAÇÃO ALINHADO AO OBJETIVO**
   ⚠️ CRÍTICO: A frequência informada pelo usuário (${userData.trainingFrequency}) se refere APENAS aos dias de musculação.
   - Cronograma semanal de FORÇA com EXATAMENTE ${userData.trainingFrequency} dias de treino de musculação
   - O weeklySchedule do trainingPlan deve conter ${userData.trainingFrequency} dias de treino de força
   - Exercícios selecionados para o objetivo
   - Séries, repetições e descanso otimizados BASEADOS NO IMC (ver diretrizes abaixo)
   - Progressão baseada no objetivo
   - ⚠️ NÃO inclua treino aeróbico no trainingPlan.weeklySchedule - o aeróbico é um campo separado (aerobicTraining)
   - Adaptações para local e limitações
   - **Para ganhar massa**: Cardio leve/moderado (2-3x/semana)
   - **Para emagrecer**: Cardio moderado/intenso (3-5x/semana) - etapa fundamental junto à alimentação

=====================================================================
### INTERPRETAÇÃO AUTOMÁTICA DO NÍVEL DE MUSCULAÇÃO (OBRIGATÓRIO)

⚠️ **CRÍTICO: Nível de Atividade ≠ Nível de Musculação**

**NÍVEL DE ATIVIDADE** (Sedentário, Moderado, Atleta, Alto Rendimento):
- Usado APENAS para calcular TDEE (gasto energético total)
- Reflete atividade física geral do usuário

**NÍVEL DE MUSCULAÇÃO** (Iniciante, Intermediário, Avançado):
- Usado APENAS para prescrição de exercícios, volume e complexidade
- Deve ser determinado automaticamente pelos critérios abaixo

**DEFINA AUTOMATICAMENTE O NÍVEL DE MUSCULAÇÃO:**

**INICIANTE:**
- nível de atividade = Sedentário ou Moderado
- OU frequência <= 3x/semana
- OU muito tempo parado (sem treino há mais de 3 meses)
- OU limitações/dor significativas
- OU primeira vez treinando musculação
- OU idade >= 60 anos (IDOSO - sempre iniciante/moderado mesmo com experiência)

**INTERMEDIÁRIO:**
- nível de atividade = Atleta
- OU frequência 4-5x/semana
- OU treina há pelo menos 6 meses consistentemente
- OU sem limitações significativas
- OU evolução corporal positiva recente

**AVANÇADO:**
- nível = Atleta Alto Rendimento
- OU frequência 6-7x/semana
- OU excelente evolução recente (ganho de massa/força consistente)
- OU histórico consistente de treino (2+ anos)
- OU domina técnica de exercícios compostos avançados

⚠️ **REGRA DE OURO:** Se o nível de atividade for "Atleta" mas o usuário for iniciante em musculação, use as diretrizes de INICIANTE para prescrição de exercícios.

=====================================================================
### CLASSIFICAÇÃO DOS GRUPOS MUSCULARES (OBRIGATÓRIO)

**MÚSCULOS GRANDES:**
- Peito
- Costas
- Quadríceps
- Posterior de coxa
- Glúteos
- Ombros (deltoide completo)

**MÚSCULOS PEQUENOS:**
- Bíceps
- Tríceps
- Panturrilha
- Abdômen

=====================================================================
### QUANTIDADE DE EXERCÍCIOS (OBRIGATÓRIO)

⚠️ **CRÍTICO: A IA NUNCA deve retornar apenas 1 exercício para músculo grande (exceto iniciantes/idosos/com limitações).**

**INICIANTE / IDOSO / COM LIMITAÇÕES:**
- ⚠️ **REGRA ESPECIAL:** IGNORE qualquer regra de quantidade por grupo muscular
- Use APENAS o volume total: 4-6 exercícios por treino
- 1 exercício por grupo grande é suficiente
- 0-1 exercícios para grupos pequenos (opcional)
- Full body permitido

**INTERMEDIÁRIO:**
- Grandes: 3-4 exercícios por grupo
- Pequenos: 2-3 exercícios por grupo
- Total por treino: 6-10 exercícios (respeitando tempo disponível)
- Volume semanal obrigatório:
  - Músculos grandes (peito, costas, pernas): 12-16 séries por semana
  - Músculos médios (ombros): 10-14 séries por semana
  - Músculos pequenos (bíceps, tríceps, panturrilha, abdômen): 8-12 séries por semana

**AVANÇADO:**
- Grandes: 4-6 exercícios por grupo
- Pequenos: 3-4 exercícios por grupo
- Total por treino: 10-16 exercícios (respeitando tempo disponível)
- Frequência ideal: 2x/semana por grupo muscular
- Volume semanal obrigatório:
  - Grandes: 14-22 séries semanais
  - Pequenos: 10-16 séries semanais

**ADAPTAÇÃO POR TEMPO DISPONÍVEL:**
- 30-40 min → treinos compactos (6-8 exercícios totais)
- 45-60 min → treinos completos (8-12 exercícios totais)
- 60-90 min → alto volume (12-16 exercícios totais)

⚠️ **PRIORIDADE:** Se houver conflito entre tempo disponível e nível de musculação, priorize o nível de musculação para segurança, mas ajuste o número de exercícios dentro dos limites do tempo.

=====================================================================
### SINERGIAS E COMBINAÇÕES (OBRIGATÓRIO)

**PERMITIDO:**
- Peito + tríceps (sinergia natural)
- Costas + bíceps (sinergia natural)
- Pernas completas ou divididas (quadríceps + posterior + glúteos)
- Ombro separado OU com costas (Pull)
- Abdômen pode ser treinado em qualquer dia

**EVITAR:**
- Peito + ombro no mesmo dia (deltoide anterior já é muito ativado em supino)
- Ombro no dia seguinte de peito (sobrecarga do deltoide anterior)
- Overlap excessivo de tríceps/bíceps (evitar treinar ambos em dias consecutivos se volume alto)

**DIVISÕES RECOMENDADAS POR FREQUÊNCIA:**
- 2x/semana: Full Body ou Upper/Lower
- 3x/semana: Full Body ou Upper/Lower + 1 dia
- 4x/semana: Upper/Lower 2x ou Push/Pull/Legs + 1 dia
- 5x/semana: Push/Pull/Legs + Upper/Lower ou PPL + 2 dias
- 6-7x/semana: PPL 2x ou divisões especializadas

=====================================================================
### SELEÇÃO DE EXERCÍCIOS (OBRIGATÓRIO)

**SEMPRE incluir diversidade entre:**
- Multiarticulares (agachamento, supino, remada, desenvolvimento)
- Isoladores (rosca direta, tríceps pulley, extensora, flexora)
- Máquina (leg press, cadeira extensora, puxada alta)
- Peso livre (agachamento livre, supino com barra, remada curvada)

**ESCOLHA ADEQUADA AO LOCAL:**
- **Casa**: halteres, elásticos, peso corporal, kettlebells
- **Academia**: máquinas, compostos, alta variedade, barras e halteres
- **Ambos**: misto (priorizar academia quando disponível)
- **Ar livre**: funcional + calistenia + corrida

**NUNCA prescrever:**
- Exercícios que requerem equipamentos não disponíveis
- Movimentos de alto risco sem progressão adequada
- Exercícios que causam dor (verificar limitações do usuário)

**🚨 EXERCÍCIOS RESTRITOS POR NÍVEL DE MUSCULAÇÃO (CRÍTICO):**

**❌ NUNCA prescrever para INICIANTES, IDOSOS (60+) ou INTERMEDIÁRIOS:**
- Pike Push-up / Flexão Pike (Risco excessivo para ombros e tontura)
- Burpee (Alto impacto e complexidade cardíaca/articular)
- Salto / Pulo / Jump Squat (Risco de impacto articular)
- Mergulho entre bancos / Dips entre bancos (apenas AVANÇADO)
- Paralelas / Dips em paralelas (apenas AVANÇADO)
- Muscle-up (apenas AVANÇADO)
- Handstand push-up / Parada de mão (apenas AVANÇADO)
- Exercícios calistênicos avançados que requerem controle corporal superior
- Drop sets, rest-pause, cluster sets (técnicas avançadas - apenas AVANÇADO)

**✅ EXERCÍCIOS SEGUROS PARA INICIANTES/INTERMEDIÁRIOS (tríceps):**
- Tríceps testa / Francês
- Tríceps na polia / Pulley
- Tríceps corda
- Extensão de tríceps com halteres
- Tríceps coice / Kickback
- Fundo assistido (máquina ou assistido por elástico - apenas intermediário)

**⚠️ REGRA IMPORTANTE:**
Para nível INICIANTE ou INTERMEDIÁRIO, use APENAS exercícios isolados e controlados para tríceps. Exercícios de peso corporal avançados como dips devem ser PRESERVADOS para nível AVANÇADO.

=====================================================================
### ESTRUTURA E ORDEM DOS EXERCÍCIOS (OBRIGATÓRIO - REGRA #1 PRIORITÁRIA)

🚨🚨🚨 **REGRA ABSOLUTA - REPETIÇÃO DE TREINOS DO MESMO TIPO - NÃO PODE SER IGNORADA 🚨🚨🚨**

⚠️⚠️⚠️ **ESTA É A REGRA MAIS IMPORTANTE - LEIA COM ATENÇÃO ⚠️⚠️⚠️**

Quando o plano contém múltiplos dias do MESMO tipo de treino (ex: Push A e Push D, Pull B e Pull E):

**❌ PROIBIDO ABSOLUTAMENTE:**
- Variar exercícios entre dias do mesmo tipo
- Mudar equipamentos (barra → halteres) entre dias repetidos
- Alterar ângulos (reto → inclinado) entre dias repetidos
- Mudar séries, reps ou descanso entre dias repetidos

**✅ OBRIGATÓRIO:**
- **SEMPRE use EXATAMENTE os MESMOS exercícios, séries, repetições e descanso em ambos os dias**
- **COPIE E COLE os exercícios do primeiro dia para o segundo dia do mesmo tipo**

**📋 EXEMPLO CONCRETO OBRIGATÓRIO:**

Se você gerar Push A com:
1. Supino reto com barra (4 séries, 6-10 reps, 90-120s)
2. Supino inclinado com halteres (3 séries, 8-12 reps, 60-90s)
3. Crucifixo (3 séries, 12-15 reps, 60-90s)
4. Tríceps testa (3 séries, 8-12 reps, 60-90s)
5. Tríceps na polia (3 séries, 10-12 reps, 60-90s)

Então Push D DEVE ter EXATAMENTE:
1. Supino reto com barra (4 séries, 6-10 reps, 90-120s) ← MESMO
2. Supino inclinado com halteres (3 séries, 8-12 reps, 60-90s) ← MESMO
3. Crucifixo (3 séries, 12-15 reps, 60-90s) ← MESMO
4. Tríceps testa (3 séries, 8-12 reps, 60-90s) ← MESMO
5. Tríceps na polia (3 séries, 10-12 reps, 60-90s) ← MESMO

**❌ ERRADO (NÃO FAÇA ISSO):**
Push D com "Supino reto com halteres" ou "Supino inclinado com barra" ou qualquer variação.

**⚠️ CONSEQUÊNCIA:** Se você violar esta regra, o plano será REJEITADO automaticamente e você terá que gerar novamente, gastando mais tokens. Gere corretamente desde o início!

**💡 LEMBRE-SE:** A variação de exercícios só deve ocorrer entre tipos DIFERENTES de treino (Push vs Pull vs Legs), NUNCA entre dias do mesmo tipo.

⚠️ **CRÍTICO - ORDEM DE EXECUÇÃO DOS EXERCÍCIOS:**

A ordem dos exercícios DEVE seguir esta estrutura RÍGIDA:

**1. PRIMEIRO: TODOS os exercícios do grupo muscular GRANDE (principal do dia)**
   - Push: TODOS os exercícios de PEITO primeiro
   - Pull: TODOS os exercícios de COSTAS primeiro
   - Legs: TODOS os exercícios de QUADRÍCEPS primeiro (ou compostos de perna)

**2. DEPOIS: TODOS os exercícios do grupo muscular PEQUENO (secundário)**
   - Push: DEPOIS de todos os exercícios de peito, coloque TODOS os exercícios de TRÍCEPS
   - Pull: DEPOIS de todos os exercícios de costas, coloque TODOS os exercícios de BÍCEPS
   - Legs: DEPOIS dos compostos, coloque isoladores (extensora, flexora, panturrilha)

**3. NUNCA alternar grupos musculares:**
   - ❌ ERRADO: Peito → Tríceps → Tríceps → Tríceps → Peito
   - ✅ CORRETO: Peito → Peito → Peito → Tríceps → Tríceps → Tríceps

**4. Dentro de cada grupo, ordem:**
   - Compostos ANTES de isoladores
   - Exercícios mais pesados/complexos ANTES de mais leves/simples

**EXEMPLOS CORRETOS:**

**Push Day:**
1. Supino reto com barra (Peito - composto)
2. Supino inclinado com halteres (Peito - composto)
3. Crossover com cabos (Peito - isolado)
4. Tríceps testa com barra EZ (Tríceps - isolado)
5. Tríceps na polia alta (Tríceps - isolado)

**Pull Day:**
1. Puxada na barra fixa (Costas - composto)
2. Remada curvada com barra (Costas - composto)
3. Remada unilateral com halteres (Costas - composto)
4. Rosca direta com barra (Bíceps - isolado)
5. Rosca martelo com halteres (Bíceps - isolado)

**Legs Day:**
1. Agachamento com barra (Quadríceps - composto)
2. Leg press (Quadríceps - composto)
3. Cadeira extensora (Quadríceps - isolado)
4. Mesa flexora (Posterior - isolado)
5. Elevação de panturrilha (Panturrilha - isolado)

=====================================================================
### PROGRESSÃO (OBRIGATÓRIO)

**SEMPRE aplicar progressão estruturada:**

**REGRA PADRÃO DE PROGRESSÃO:**

**EXERCÍCIOS COMPOSTOS (multiarticulares):**
- Quando atingir o topo da faixa de repetições em TODAS as séries, aumente a carga em 2-5%
- Exemplo: Se alvo é 8-12 reps e fez 12 reps em todas as séries com 50kg, próxima série = 52.5kg (5% de aumento)
- Após aumentar carga, volte ao início da faixa (ex: 8 reps) e suba novamente até o topo

**EXERCÍCIOS ISOLADOS:**
- Quando atingir o topo da faixa de repetições em TODAS as séries, aumente a carga em 1-2%
- Exemplo: Se alvo é 8-12 reps e fez 12 reps em todas as séries com 10kg, próxima série = 10.5kg ou 11kg
- Após aumentar carga, volte ao início da faixa e suba novamente

⚠️ **CRÍTICO:** NÃO utilize progressão por reps extras (adicionar 13-14 reps antes de aumentar peso). A progressão deve ser SEMPRE por aumento de carga após atingir o topo da faixa em todas as séries. A IA pode definir progressão por reps extras apenas como variação especial e estratégica, mas não como regra padrão.

**MANUTENÇÃO DE EXERCÍCIOS:**
- Manter exercícios por 4-6 semanas antes de trocar
- Trocar apenas se: estagnação, lesão, ou necessidade de variação estratégica

**PROGRESSÃO SEMANAL:**
- Semana 1-2: Adaptação (focar em técnica)
- Semana 3-4: Progressão de carga (2-5% compostos, 1-2% isolados)
- Semana 5-6: Consolidação (manter carga, melhorar execução)
- Após 6 semanas: Reavaliar e ajustar se necessário

### 🏋️ PRESCRIÇÃO DE TREINO DE FORÇA BASEADA EM NÍVEL DE MUSCULAÇÃO E IMC:

⚠️ **CRÍTICO: Use o NÍVEL DE MUSCULAÇÃO (determinado automaticamente acima) para prescrição de exercícios, NÃO o nível de atividade!**

⚠️ **O nível de atividade é usado APENAS para calcular TDEE. O nível de musculação é usado para prescrição de treino.**

#### 📊 DIRETRIZES POR NÍVEL DE MUSCULAÇÃO:

**INICIANTE (inclui IDOSOS 60+ anos):**
- ⚠️ Foco em exercícios BÁSICOS e EFICIENTES
- Priorizar exercícios MULTIARTICULARES (agachamento, supino, remada, desenvolvimento)
- Volume moderado: 2-3 séries por exercício
- Repetições: 8-15 (foco em técnica e adaptação)
- Exercícios simples e seguros (evitar movimentos complexos)
- Descanso: 60-90 segundos entre séries (idosos: 90-120 segundos)
- Progressão gradual e conservadora
- ⚠️ NUNCA prescrever exercícios avançados ou isolados complexos
- ⚠️ NUNCA prescrever técnicas avançadas (drop sets, rest-pause, etc.)
- ⚠️ NUNCA prescrever: Mergulho entre bancos, Paralelas/Dips, Muscle-up, Handstand push-up
- Total de exercícios: 4-6 por treino (regra especial: ignorar quantidade por grupo)
- ⚠️ Para IDOSOS (60+): volume reduzido, mais segurança articular, maior tempo de descanso
- Exemplos adequados: Agachamento livre, Supino reto, Remada curvada, Desenvolvimento com halteres
- **Tríceps (INICIANTE)**: Tríceps testa, Tríceps na polia, Tríceps corda, Extensão com halteres, Tríceps coice (NÃO usar Mergulho/Dips)

**INTERMEDIÁRIO:**
- Exercícios BÁSICOS a INTERMEDIÁRIOS
- Priorizar exercícios MULTIARTICULARES com alguns isolados estratégicos
- Volume moderado: 3-4 séries por exercício
- Repetições: 8-12 (hipertrofia/força)
- Exercícios seguros com progressão moderada
- Descanso: 60-120 segundos entre séries
- Pode incluir alguns exercícios isolados complementares
- Pode usar técnicas avançadas com moderação (apenas se domina técnica)
- ⚠️ NUNCA prescrever: Mergulho entre bancos, Paralelas/Dips, Muscle-up, Handstand push-up
- Total de exercícios: 6-10 por treino
- Exemplos adequados: Agachamento, Supino, Remada, Desenvolvimento, Rosca direta, Tríceps pulley
- **Tríceps (INTERMEDIÁRIO)**: Tríceps testa, Tríceps na polia, Tríceps corda, Tríceps francês, Fundo assistido (máquina) - NÃO usar Mergulho/Dips livres

**AVANÇADO:**
- Exercícios INTERMEDIÁRIOS a AVANÇADOS
- Maior QUANTIDADE de exercícios (10-16 exercícios por treino, respeitando tempo)
- Maior VOLUME: 3-5 séries por exercício (4-6 para grupos prioritários)
- Repetições variadas: 6-12 (força/hipertrofia) ou conforme IMC
- Exercícios COMPOSTOS e avançados são adequados (incluindo Mergulho entre bancos, Dips em paralelas, Muscle-up)
- Maior FADIGA MUSCULAR (volume total maior)
- Descanso: 90-180 segundos entre séries (120-240 para compostos pesados)
- Pode incluir técnicas avançadas (drop set, rest-pause, supersets, etc.)
- Exercícios isolados para hipertrofia específica
- Volume semanal obrigatório: 14-22 séries para grupos grandes, 10-16 para pequenos
- Exemplos adequados: Agachamento frontal, Supino inclinado, Remada curvada, Desenvolvimento militar, Elevação lateral, Rosca scott, Tríceps francês, Mergulho entre bancos, Dips em paralelas

⚠️ **REGRAS CRÍTICAS:**
- Iniciante: NUNCA prescrever mais de 6 exercícios por treino, máximo 3 séries por exercício
- Iniciante: NUNCA prescrever técnicas avançadas ou exercícios complexos
- Intermediário: 6-10 exercícios por treino, 3-4 séries por exercício
- Avançado: mínimo 10 exercícios por treino (se tempo permitir), mínimo 3 séries por exercício
- Avançado: Volume total deve ser significativamente maior que iniciante/intermediário
- SEMPRE considerar o objetivo do usuário (emagrecimento, ganho de massa, etc.) junto com o nível de musculação

#### 📊 PRESCRIÇÃO DE TREINO DE FORÇA BASEADA EM IMC (ACSM/ESSA):

⚠️ **CRÍTICO: A prescrição de repetições e séries DEVE ser ajustada baseada no IMC para segurança e eficácia!**

#### 📊 DIRETRIZES DE REPETIÇÕES POR IMC:

**IMC < 25 (Peso Normal/Abaixo do Peso):**
- Ganhar Massa: 6-10 repetições (força/hipertrofia)
- Emagrecer: 8-12 repetições (hipertrofia/endurance)
- Manutenção: 8-15 repetições (endurance/força)
- Séries: 3-4 por exercício
- Descanso: 60-120 segundos

**IMC 25-29.9 (Sobrepeso):**
- Ganhar Massa (Recomposição): 8-12 repetições ⚠️ NÃO use 6-8 reps
- Emagrecer: 10-15 repetições (priorizar endurance e queima calórica)
- Manutenção: 10-15 repetições
- Séries: 3-4 por exercício
- Descanso: 60-90 segundos
- ⚠️ Priorizar técnica sobre carga

**IMC 30-34.9 (Obesidade Grau I):**
- Ganhar Massa (Recomposição): 10-15 repetições ⚠️ NÃO use menos de 10 reps
- Emagrecer: 12-18 repetições (endurance, segurança articular)
- Manutenção: 12-15 repetições
- Séries: 3-4 por exercício (começar com 3)
- Descanso: 60-90 segundos
- ⚠️ CRÍTICO: Focar em técnica perfeita, cargas moderadas, evitar sobrecarga articular

**IMC ≥ 35 (Obesidade Grau II e III):**
- Ganhar Massa (Recomposição): 12-18 repetições ⚠️ NUNCA use menos de 12 reps
- Emagrecer: 15-20 repetições (endurance, segurança máxima)
- Manutenção: 12-18 repetições
- Séries: 2-3 por exercício (começar com 2, progredir para 3)
- Descanso: 60-90 segundos (pode ser maior se necessário)
- ⚠️ CRÍTICO: 
  - Priorizar exercícios seguros (máquinas, movimentos controlados)
  - Evitar exercícios de alto impacto ou sobrecarga articular excessiva
  - Focar em técnica perfeita antes de aumentar carga
  - Adaptar exercícios para limitações de mobilidade
  - Progressão muito gradual (aumentar carga apenas quando técnica estiver perfeita)

#### 🎯 REGRAS ESPECÍFICAS POR OBJETIVO + IMC + NÍVEL DE MUSCULAÇÃO:

**Para EMAGRECIMENTO com IMC ≥ 30:**
- ⚠️ NUNCA prescreva menos de 10 repetições
- Faixa ideal: 12-18 repetições (estudos mostram 9-12 reps eficazes, mas para obesos grau II/III, 12-18 é mais seguro)
- Objetivo: Endurance muscular + queima calórica + preservação de massa magra
- Cargas moderadas (60-70% 1RM estimado)
- **Ajuste por nível de musculação:**
  - Iniciante: 4-6 exercícios, 2-3 séries cada, exercícios básicos multiarticulares
  - Intermediário: 6-8 exercícios, 3-4 séries cada, pode incluir alguns isolados
  - Avançado: 8-12 exercícios, 3-4 séries cada, maior variedade e volume

**Para RECOMPOSIÇÃO (IMC ≥ 25 + Ganhar Massa):**
- ⚠️ NUNCA prescreva 6-8 repetições (isso é para força máxima, não adequado para recomposição)
- Faixa ideal: 8-12 repetições (IMC 25-29.9) ou 10-15 repetições (IMC ≥ 30)
- Objetivo: Hipertrofia + perda de gordura simultânea
- Cargas moderadas a altas (70-80% 1RM estimado)
- **Ajuste por nível de musculação:**
  - Iniciante: 4-6 exercícios, 3 séries cada, foco em multiarticulares
  - Intermediário: 6-10 exercícios, 3-4 séries cada, multiarticulares + isolados estratégicos
  - Avançado: 10-16 exercícios, 3-5 séries cada, volume alto com variedade

**Para GANHAR MASSA com IMC < 25:**
- Faixa: 6-10 repetições (força/hipertrofia)
- Cargas altas (75-85% 1RM estimado)
- **Ajuste por nível de musculação:**
  - Iniciante: 4-6 exercícios, 3 séries cada, exercícios básicos eficientes
  - Intermediário: 6-10 exercícios, 3-4 séries cada, exercícios compostos e isolados
  - Avançado: 10-16 exercícios, 4-6 séries cada, máximo volume e fadiga muscular

#### ⚠️ VALIDAÇÃO OBRIGATÓRIA ANTES DE RETORNAR:

Antes de retornar o plano de treino, SEMPRE verifique:
1. ✅ Para IMC ≥ 30: repetições estão entre 10-20? (NUNCA menos de 10)
2. ✅ Para IMC ≥ 35: repetições estão entre 12-20? (NUNCA menos de 12)
3. ✅ Para emagrecimento + IMC ≥ 30: repetições estão entre 12-18?
4. ✅ Exercícios são seguros para o IMC do usuário? (evitar sobrecarga articular excessiva)
5. ✅ Descanso está adequado? (60-90s para obesos, pode ser maior se necessário)
6. ✅ **Nível de musculação está sendo respeitado?**
   - Iniciante: máximo 6 exercícios por treino, máximo 3 séries por exercício?
   - Iniciante: exercícios são básicos e multiarticulares? NUNCA técnicas avançadas?
   - Intermediário: 6-10 exercícios por treino, 3-4 séries por exercício?
   - Avançado: mínimo 10 exercícios por treino (se tempo permitir), mínimo 3 séries por exercício?
   - Avançado: volume total é significativamente maior que iniciante/intermediário?
   - Avançado: exercícios incluem compostos avançados e isolados?
   - Avançado: volume semanal está dentro das faixas obrigatórias (14-22 séries grandes, 10-16 pequenos)?
7. ✅ **Objetivo + Nível de musculação estão alinhados?**
   - Iniciante com objetivo de ganhar massa: exercícios básicos eficientes, não avançados
   - Avançado com objetivo de ganhar massa: exercícios avançados, alto volume, técnicas avançadas
8. ✅ **Tempo disponível está sendo respeitado?**
   - 30-40 min: máximo 8 exercícios?
   - 45-60 min: 8-12 exercícios?
   - 60-90 min: 12-16 exercícios?
9. ✅ **Quantidade de exercícios por grupo muscular está adequada?**
   - Iniciante: 1-2 exercícios para grupos grandes, 1 para pequenos?
   - Intermediário: 3-4 exercícios para grupos grandes, 2-3 para pequenos?
   - Avançado: 4-6 exercícios para grupos grandes, 3-4 para pequenos?
10. ✅ **Diversidade de exercícios está presente?**
    - Inclui multiarticulares E isolados?
    - Inclui máquinas E peso livre (quando local permite)?
11. ✅ **Progressão está definida?**
    - Compostos: 2-5% de aumento?
    - Isolados: 1-2% de aumento?
    - Ou adicionar 1-2 reps antes de aumentar carga?

**Se qualquer validação falhar, ajuste o plano antes de retornar!**

3. **PLANO ALIMENTAR ESTRATÉGICO DETALHADO**
   - Calorias diárias calculadas para o objetivo
   - Macronutrientes específicos (proteínas, carbos, gorduras)
   - Quantidades EXATAS para cada alimento SEMPRE em GRAMAS (ex: "150g de frango grelhado", "200g de arroz cozido", "100g de batata doce cozida")
   - ⚠️ CRÍTICO: NUNCA use xícaras, colheres ou outras medidas. SEMPRE use GRAMAS (g)
   - ⚠️ CRÍTICO: Informações nutricionais devem ser de alimentos JÁ PREPARADOS (cozido, grelhado, assado, etc.)
     - Exemplo: "150g de frango grelhado" (não "frango cru")
     - Exemplo: "200g de arroz cozido" (não "arroz cru")
     - Exemplo: "100g de batata doce cozida" (não "batata doce crua")
   - Calorias por porção de cada alimento (baseadas no alimento preparado)
   - Timing das refeições otimizado
   - Exemplo de refeições semanais com porções calculadas
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

## 🏃‍♂️ TREINO AERÓBICO/CARDIOVASCULAR (OBRIGATÓRIO - CAMPO SEPARADO aerobicTraining):

⚠️ **REGRA CRÍTICA: SEMPRE inclua o campo aerobicTraining em TODOS os planos!** 

Treino aeróbico é FUNDAMENTAL para saúde cardiovascular, controle de gordura, condicionamento e performance.

### 📌 PRINCÍPIOS CIENTÍFICOS PARA CARDIO

1. Calcule a FC máxima aproximada usando a fórmula baseada em evidência:
   - FCmáx = 208 – (0,7 × idade).
   - Se a idade não estiver disponível, use uma estimativa padrão (ex.: 190–200 bpm) e deixe claro nas notas.

2. Utilize zonas de treino baseadas em % da FCmáx:
   - Z1: 50–60% FCmáx (recuperação, muito leve).
   - Z2: 60–70% FCmáx (melhor para perda de gordura e base aeróbica).
   - Z3: 70–80% FCmáx (condicionamento geral, moderado a vigoroso).
   - Z4: 80–90% FCmáx (VO2máx e limiar anaeróbio, intenso).
   - Z5: 90–100% FCmáx (treinos intervalados muito intensos – SIT/HIIT pesado).

3. Escolha o protocolo ideal segundo o OBJETIVO do usuário:
   - Emagrecimento:
     • Priorizar treinos contínuos em Z2 (base aeróbica, 30–60min).
     • HIIT leve (Z3–Z4) apenas se o aluno NÃO for iniciante e não tiver limitações importantes.
   - Perda de gordura preservando massa:
     • Combinar musculação com Z2 e Z3 (cardio moderado), 2–4 sessões/semana.
   - Condicionamento físico geral:
     • Usar protocolos intervalados (ex.: 4×4 min em Z4 com recuperações em Z2–Z3).
     • Incluir progressivamente treinos em Z3, Z4 e alguns blocos em Z5 (apenas quando adequado).
   - Saúde geral:
     • 2–4 sessões/semana em Z2 e Z3, 20–45min por sessão.
   - Performance (apenas avançados):
     • Combinar Z4 + Z5 + SIT (sprints muito intensos) com volume bem controlado.

4. PARA CADA SESSÃO DE CARDIO no weeklySchedule, SEMPRE indique:
   - Zona de treino em % da FCmáx (ex.: “Z2 – 60–70% FCmáx”).
   - BPM alvo aproximado (ex.: “FC alvo ≈ 130–145 bpm”). Use a fórmula FCmáx = 208 – (0,7 × idade).
   - Tipo de treino: contínuo, intervalado, HIIT ou SIT.
   - Duração total da sessão.
   - Frequência semanal prevista (ex.: “3x/semana” – pode aparecer no overview ou recommendations).

5. NUNCA prescreva HIIT pesado ou SIT para iniciantes:
   - Iniciantes: foco em Z1–Z2 (talvez Z3 leve) com treinos contínuos, 20–40min.
   - Intermediários: podem usar intervalados moderados (Z2–Z3 e Z3–Z4).
   - Avançados: podem usar Z4 e Z5, HIIT e SIT, sempre com volume e recuperação adequados.

6. SEMPRE combine o cardio com o treino de musculação do mesmo plano:
   - Especifique quando o cardio deve ser feito (ex.: “após treino de força”, “em dias alternados”).
   - Evite sobrecarregar o aluno em dias de treinos muito pesados de pernas.

### ✅ ESTRUTURA OBRIGATÓRIA DO CAMPO aerobicTraining

SEMPRE retorne o campo aerobicTraining com a seguinte estrutura (respeitando o schema JSON):

O campo deve conter:
- overview: descrição geral da importância do treino aeróbico e um resumo do protocolo escolhido.
- weeklySchedule: array com objetos contendo day, activity, duration, intensity, heartRateZone (opcional), notes (opcional).
- recommendations: recomendações específicas (incluindo objetivo, orientações de aplicação e resumo em bloco JSON de cardio).
- progression: como progredir o treino ao longo das semanas.

NO FINAL DO CAMPO recommendations, inclua SEMPRE um bloco JSON de resumo no seguinte formato (como texto, mas JSON válido):

{
  "cardio": {
    "objetivo": "<descrever objetivo principal do cardio (ex.: emagrecimento, condicionamento, saúde geral, performance)>",
    "protocolo": "<descrever o protocolo principal (ex.: contínuo em Z2 40min 4x/sem, HIIT 4x4 em Z4, etc.)>",
    "bpm_alvo": "<faixa de FC alvo em bpm com base na FCmáx calculada (ex.: 130-145 bpm em Z2)>",
    "frequencia": "<frequência semanal do cardio (ex.: 3x/semana, 4x/semana)>",
    "descricao": "<resumo em 1-3 frases explicando como o aluno deve aplicar esse cardio junto com a musculação>"
  }
}

⚠️ IMPORTANTE:
- Esse bloco deve estar DENTRO do campo recommendations (como texto), não como campo novo fora de aerobicTraining.
- O JSON deve ser bem formatado para que o sistema possa extraí-lo facilmente se necessário.

Exemplo de estrutura esperada:
- Dia: Segunda-feira, Atividade: Caminhada rápida, Duração: 30-40min, Intensidade: Moderada (65-75% FCmáx)
- Dia: Quarta-feira, Atividade: Ciclismo, Duração: 30-45min, Intensidade: Moderada (65-75% FCmáx)
- Dia: Sábado, Atividade: Caminhada, Duração: 40-60min, Intensidade: Leve a moderada (60-70% FCmáx)

### ✅ REGRAS OBRIGATÓRIAS:

1. **SEMPRE inclua o campo aerobicTraining separado do trainingPlan**
   ⚠️ CRÍTICO: O treino aeróbico é INDEPENDENTE do treino de musculação. Pode ser feito no mesmo dia que a musculação quando apropriado.
   
2. **PROGRESSÃO AUTOMÁTICA DE CARDIO PARA SEDENTÁRIOS (REGRA CRÍTICA)**
   ⚠️ REGRA DE OURO: Se nível de atividade = "Sedentário":
   - IMC ≥ 35: Iniciar com MÁXIMO 2 sessões/semana, intensidade LEVE (Z1-Z2)
   - IMC 30-34.9: Iniciar com MÁXIMO 3 sessões/semana, intensidade LEVE (Z1-Z2)
   - IMC < 30: Iniciar com MÁXIMO 3 sessões/semana, intensidade LEVE (Z1-Z2)
   - Progressão automática após 2-4 semanas (conforme IMC)
   - Total de estímulos semanais (musculação + cardio) não deve exceder 6 inicialmente
   - ⚠️ NUNCA inicie sedentário com 4+ sessões de cardio, mesmo que o usuário informe essa frequência
   - ⚠️ Objetivo: Evitar fadiga, risco articular e abandono
   
3. **Mínimo 2-3 sessões por semana** (seguindo diretrizes OMS: mínimo 150min/semana moderado)
   ⚠️ IMPORTANTE: A frequência de aeróbico é independente da frequência de musculação informada pelo usuário.
   ⚠️ EXCEÇÃO: Para sedentários, respeitar progressão automática acima (início conservador)
   
3. **Especifique: dia, atividade, duração, intensidade, zona de FC (quando possível)**
   ⚠️ PODE SER NO MESMO DIA: Quando apropriado, você pode agendar treino aeróbico no mesmo dia que treino de musculação.
   Exemplo: Segunda-feira pode ter "Treino de Força (Peito/Tríceps)" E "Caminhada 30min" no mesmo dia.
   
4. **Ajuste baseado no objetivo:**
   - Ganhar massa: 2-3x/semana, leve a moderado (30-45min) - pode ser no mesmo dia após musculação
   - Emagrecer: 3-5x/semana, moderado a intenso (30-60min) - ESSENCIAL! Pode ser no mesmo dia ou separado
   - Manutenção: 2-4x/semana, moderado (30-45min) - pode ser no mesmo dia ou separado
   - Condicionamento: 4-6x/semana, moderado a intenso (45-60min) - pode ser no mesmo dia ou separado
   
5. **Inclua variedade**: caminhada, corrida, ciclismo, natação, elíptico, HIIT, escada, etc.
   
6. **⚠️ CRÍTICO - Considere o local de treino do usuário ao sugerir atividades:**
   - Se local = "casa": NÃO sugira natação, elíptico de academia, escada de academia
   - Se local = "casa": Sugira caminhada, corrida, ciclismo, HIIT em casa, polichinelo, burpee, step
   - Se local = "academia": Pode sugerir elíptico, esteira, escada, bicicleta ergométrica, natação (se houver piscina)
   - Se local = "ar_livre": Sugira caminhada, corrida, ciclismo, corrida na praia
   - Se local = "ambos": Pode sugerir qualquer atividade, mas priorize as mais acessíveis
   - **NUNCA sugira atividades que requerem equipamentos ou locais que o usuário não tem acesso**
   
7. **Siga diretrizes OMS/ACSM** para frequência e intensidade mínimas
   
8. **⚠️ REGRA DE OURO:**
   - A frequência de treinos informada (${userData.trainingFrequency}) = dias de MUSCULAÇÃO apenas
   - O treino aeróbico é INDEPENDENTE e pode ser agendado nos mesmos dias da musculação quando apropriado
   - Exemplo: Se usuário treina 5x/semana de musculação, você pode agendar aeróbico em 3-4 desses mesmos dias (após musculação) ou em dias separados

### 📝 EXEMPLOS POR OBJETIVO:

**Para Ganhar Massa (2-3x/semana, leve a moderado):**
- Segunda: 30min caminhada rápida ou elíptico (60-70% FCmáx)
- Quarta: 30-40min ciclismo leve (60-70% FCmáx)
- Sábado: 40min caminhada ao ar livre (60-65% FCmáx)

**Para Emagrecer (3-5x/semana, moderado a intenso - ESSENCIAL!):**
- Segunda: 30min HIIT ou corrida (75-85% FCmáx)
- Terça: 45min ciclismo moderado (65-75% FCmáx)
- Quinta: 30min HIIT ou escada (75-85% FCmáx)
- Sábado: 60min caminhada ou corrida moderada (65-75% FCmáx)

⚠️ **NUNCA omita o campo aerobicTraining!** É tão ou mais importante que o treino de força para saúde cardiovascular e resultados.

## REGRAS NUTRICIONAIS ESPECÍFICAS:
- ⚠️ CRÍTICO: SEMPRE especifique quantidades EXATAS APENAS em GRAMAS (g)
  - NUNCA use xícaras, colheres, unidades ou outras medidas
  - Exemplos corretos: "150g de frango grelhado", "200g de arroz cozido", "100g de batata doce cozida"
  - Exemplos INCORRETOS: "1 xícara de arroz", "2 colheres de azeite", "1 unidade de banana"
- ⚠️ CRÍTICO: Informações nutricionais (calorias, macros) devem ser de alimentos JÁ PREPARADOS quando o preparo altera significativamente os valores nutricionais:
  - Frango: "frango grelhado" ou "frango cozido" (não "frango cru")
  - Arroz: "arroz cozido" (não "arroz cru")
  - Batata: "batata doce cozida" ou "batata assada" (não "batata crua")
  - Peixe: "salmão grelhado" ou "tilápia grelhada" (não "peixe cru")
  - Ovos: "ovo cozido" ou "ovo mexido" (não "ovo cru")
  - Sempre especifique o método de preparo no nome do alimento quando necessário
  - Alimentos que podem ser consumidos crus sem alteração nutricional significativa (como aveia, frutas, vegetais crus) não precisam especificar preparo
- Calcule calorias por porção de cada alimento baseado no alimento PREPARADO
- ⚠️ CRÍTICO: Use a TABELA DE DECISÃO acima para definir estratégia baseada em IMC + Objetivo
- ⚠️ CRÍTICO - Considere o ORÇAMENTO ALIMENTAR do usuário ao sugerir alimentos:
  - **Econômico**: Use apenas frango, ovos, iogurte comum, atum enlatado, feijão, arroz, batata, banana, maçã. NUNCA sugira salmão, iogurte grego, queijos caros, frutas exóticas.
  - **Moderado**: Pode incluir ocasionalmente iogurte grego, peixes mais baratos (tilápia, sardinha), mas priorize frango, ovos, alimentos básicos. Evite salmão e alimentos muito caros.
  - **Premium**: Pode usar salmão, iogurte grego, queijos especiais, frutas exóticas, alimentos orgânicos. Priorize qualidade e variedade.
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
   - Moderado: TMB × 1.55
   - Atleta: TMB × 1.725
   - Atleta Alto Rendimento: TMB × 1.9

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

=====================================================================
### FORMATO DE RESPOSTA (OBRIGATÓRIO)

⚠️ **CRÍTICO: SEMPRE responder em JSON limpo e válido:**

{
  "analysis": { ... },
  "trainingPlan": { ... },
  "aerobicTraining": { ... },
  "nutritionPlan": { ... },
  "goals": { ... },
  "motivation": "..."
}

**REGRAS ABSOLUTAS:**
- ✅ NUNCA alterar nomes de campos (analysis, trainingPlan, aerobicTraining, nutritionPlan, goals, motivation)
- ✅ NUNCA quebrar o JSON (sempre válido e bem formatado)
- ✅ NUNCA gerar treinos curtos demais (respeitar quantidade mínima de exercícios por nível)
- ✅ NUNCA ignorar dados do usuário (usar TODOS os dados fornecidos)
- ✅ SEMPRE incluir todos os campos obrigatórios
- ✅ SEMPRE validar antes de retornar (usar checklist de validação acima)

**ESTRUTURA OBRIGATÓRIA:**
- analysis: deve conter currentStatus, strengths, improvements, specialConsiderations (opcional)
- trainingPlan: deve conter overview, weeklySchedule (com EXATAMENTE ${userData.trainingFrequency} dias), progression
- aerobicTraining: deve conter overview, weeklySchedule, recommendations, progression
- nutritionPlan: deve conter dailyCalories, macros, mealPlan, hydration
- goals: deve conter weekly, monthly, tracking
- motivation: deve conter personalMessage, tips

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
- Frequência de MUSCULAÇÃO: ${userData.trainingFrequency} (⚠️ IMPORTANTE: Esta frequência se refere APENAS aos dias de treino de força/musculação)
- Tempo disponível por treino: ${userData.trainingTime || "Não informado"} (use este tempo para ajustar número de exercícios, séries e se o cardio será feito no mesmo dia)
- Nível de Atividade: ${userData.nivelAtividade || "Moderado"} (⚠️ IMPORTANTE: Use este nível para calcular TDEE e ajustar intensidade do treino)
- Local: ${userData.trainingLocation}
  ⚠️ IMPORTANTE: Considere este local ao sugerir atividades aeróbicas:
  ${
    userData.trainingLocation === "casa"
      ? "- Local: CASA - Sugira apenas atividades que podem ser feitas em casa (caminhada, corrida, ciclismo, HIIT em casa, polichinelo, burpee). NÃO sugira natação, elíptico de academia ou escada de academia."
      : userData.trainingLocation === "academia"
        ? "- Local: ACADEMIA - Pode sugerir elíptico, esteira, escada, bicicleta ergométrica. Natação apenas se houver piscina disponível."
        : userData.trainingLocation === "ar_livre"
          ? "- Local: AR LIVRE - Sugira caminhada, corrida, ciclismo, corrida na praia. NÃO sugira equipamentos de academia."
          : userData.trainingLocation === "ambos"
            ? "- Local: CASA E ACADEMIA - Pode sugerir qualquer atividade, mas priorize as mais acessíveis."
            : "- Local: Não especificado - Priorize atividades acessíveis como caminhada, corrida e ciclismo."
  }

⚠️ RESTRIÇÕES:
- Dores: ${userData.hasPain ? "Sim" : "Não"}
- Restrições alimentares: ${userData.dietaryRestrictions || "Nenhuma"}

💰 ORÇAMENTO ALIMENTAR: ${userData.foodBudget || "moderado"}
  ${
    userData.foodBudget === "economico"
      ? "- ORÇAMENTO ECONÔMICO: Use apenas alimentos acessíveis e baratos. Exemplos: frango, ovos, iogurte comum, atum enlatado, feijão, arroz, batata, banana, maçã. NUNCA sugira salmão, iogurte grego, queijos caros, frutas exóticas ou alimentos premium."
      : userData.foodBudget === "moderado"
        ? "- ORÇAMENTO MODERADO: Use alimentos de preço médio. Pode incluir ocasionalmente iogurte grego, peixes mais baratos (tilápia, sardinha), mas priorize frango, ovos, alimentos básicos. Evite salmão e alimentos muito caros."
        : "- ORÇAMENTO PREMIUM: Pode usar alimentos mais caros como salmão, iogurte grego, queijos especiais, frutas exóticas, alimentos orgânicos. Priorize qualidade e variedade."
  }

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

${
  userData.normalizedInsights?.aerobic
    ? `
🏃‍♂️ HISTÓRICO DE TREINOS AERÓBICOS (DADOS NORMALIZADOS):
- Frequência média histórica: ${userData.normalizedInsights.aerobic.averageFrequency.toFixed(
        1
      )}x por semana
- Duração média: ${userData.normalizedInsights.aerobic.averageDuration.toFixed(
        0
      )} minutos por sessão
- Atividades preferidas do usuário: ${
        userData.normalizedInsights.aerobic.preferredActivities.join(", ") ||
        "Nenhuma preferência identificada"
      }
${
  userData.normalizedInsights.aerobic.lastProgression
    ? `- Última estratégia de progressão: ${userData.normalizedInsights.aerobic.lastProgression}`
    : ""
}

💡 RECOMENDAÇÃO: Use esses dados para criar um plano PROGRESSIVO. Se o usuário já fazia ${userData.normalizedInsights.aerobic.averageFrequency.toFixed(
        1
      )}x/semana, considere aumentar gradualmente (se o objetivo permitir) ou manter se já está adequado. Priorize as atividades que o usuário já demonstrou preferência: ${
        userData.normalizedInsights.aerobic.preferredActivities
          .slice(0, 2)
          .join(" e ") || "atividades variadas"
      }.
`
    : ""
}

${
  userData.normalizedInsights?.nutrition
    ? `
🍎 HISTÓRICO NUTRICIONAL (DADOS NORMALIZADOS):
- Calorias médias históricas: ${
        userData.normalizedInsights.nutrition.averageCalories
      } kcal/dia
- Proteína média: ${userData.normalizedInsights.nutrition.averageProtein}g/dia
- Carboidratos médios: ${
        userData.normalizedInsights.nutrition.averageCarbs
      }g/dia
- Gorduras médias: ${userData.normalizedInsights.nutrition.averageFats}g/dia
${
  userData.normalizedInsights.nutrition.calorieTrend
    ? `- Tendência calórica: ${userData.normalizedInsights.nutrition.calorieTrend}`
    : ""
}

💡 RECOMENDAÇÃO: Use esses dados como referência, mas SEMPRE ajuste baseado no peso atual (${
        userData.weight
      } kg) e objetivo atual (${userData.objective}). Se as calorias estavam ${
        userData.normalizedInsights.nutrition.calorieTrend || "estáveis"
      }, considere ajustar conforme o progresso do usuário.
`
    : ""
}

${
  userData.normalizedInsights?.training
    ? `
💪 HISTÓRICO DE TREINOS DE FORÇA (DADOS NORMALIZADOS):
- Frequência média: ${userData.normalizedInsights.training.averageFrequency.toFixed(
        1
      )} dias por semana
- Exercícios mais utilizados: ${
        userData.normalizedInsights.training.commonExercises.join(", ") ||
        "Nenhum padrão identificado"
      }
${
  userData.normalizedInsights.training.lastProgression
    ? `- Última estratégia de progressão: ${userData.normalizedInsights.training.lastProgression}`
    : ""
}

💡 RECOMENDAÇÃO: Considere incluir os exercícios que o usuário já está familiarizado (${
        userData.normalizedInsights.training.commonExercises
          .slice(0, 3)
          .join(", ") || "exercícios variados"
      }) e adicionar variações ou novos exercícios para progressão. Mantenha ou aumente a frequência baseado no objetivo.
`
    : ""
}

${
  userData.normalizedInsights?.analysis
    ? `
📊 ANÁLISE HISTÓRICA (DADOS NORMALIZADOS):
- Pontos fortes recorrentes: ${
        userData.normalizedInsights.analysis.commonStrengths.join(", ") ||
        "Nenhum padrão identificado"
      }
- Áreas de melhoria recorrentes: ${
        userData.normalizedInsights.analysis.commonImprovements.join(", ") ||
        "Nenhum padrão identificado"
      }

💡 RECOMENDAÇÃO: Use esses padrões para reforçar os pontos fortes e focar nas áreas que precisam de mais atenção. Se certas melhorias aparecem repetidamente, considere estratégias mais específicas para essas áreas.
`
    : ""
}

### 🎨 VARIAÇÃO DINÂMICA E PREVENÇÃO DE MONOTONIA:

⚠️ **CRÍTICO: Evite repetir exatamente os mesmos exercícios e alimentos dos planos anteriores!**

⚠️ **IMPORTANTE:** Esta variação se aplica ENTRE PLANOS DIFERENTES (novo plano vs planos anteriores), NÃO entre dias do mesmo plano. Dentro do mesmo plano, quando o mesmo tipo de treino aparece múltiplas vezes (ex: Push A e Push D), use OS MESMOS exercícios (ver seção "ESTRUTURA E ORDEM DOS EXERCÍCIOS").

O usuário precisa de **VARIAÇÃO** para evitar:
- Efeitos platô (adaptação do corpo)
- Desânimo e monotonia
- Perda de motivação

#### 📋 DIRETRIZES PARA VARIAÇÃO DE EXERCÍCIOS:

**Exercícios já utilizados (identificados no histórico):**
${
  userData.normalizedInsights?.training?.commonExercises &&
  userData.normalizedInsights.training.commonExercises.length > 0
    ? `- ${userData.normalizedInsights.training.commonExercises.join(", ")}`
    : "- Nenhum exercício identificado no histórico (primeiro plano ou histórico insuficiente)"
}

**ESTRATÉGIA DE VARIAÇÃO:**
1. **Substituições Inteligentes**: Se o usuário já fez "Supino Plano", considere:
   - Variação: Supino Inclinado, Supino Declinado, Supino com Halteres, Supino na Máquina
   - Exercício equivalente: Flexão de Braço (se treino em casa), Paralelas
   - **Mantenha o mesmo grupo muscular e padrão de movimento, mas varie o estímulo**

2. **Alternância Livre vs Máquina**: 
   - Se o histórico mostra muitos exercícios com máquinas → adicione exercícios livres (peso livre, halteres)
   - Se o histórico mostra muitos exercícios livres → adicione exercícios em máquinas (mais controle, menos risco)
   - **Exemplo**: Se fez "Leg Press" (máquina), considere "Agachamento Livre" ou "Agachamento com Halteres"

3. **Variações de Grip/Posição**:
   - Rosca Direta → Rosca Martelo, Rosca Alternada, Rosca Concentrada
   - Agachamento → Agachamento Sumô, Agachamento Búlgaro, Agachamento Frontal
   - **Mantém o mesmo exercício base, mas muda o estímulo**

4. **Progressão com Novidades**:
   - Se o usuário já domina exercícios básicos → adicione exercícios mais complexos ou compostos
   - **Exemplo**: Se fez "Remada Curvada", considere "Remada Unilateral", "Remada T", "Puxada Frontal"
   - **Sempre dentro dos parâmetros de segurança para o IMC do usuário**

5. **Regra 70/30**:
   - **70%**: Exercícios familiares ou variações próximas (para manter progressão e confiança)
   - **30%**: Exercícios novos ou variações mais diferentes (para novidade e evitar platô)
   - **NUNCA**: Inventar exercícios malucos ou não testados

#### 🍎 DIRETRIZES PARA VARIAÇÃO DE ALIMENTOS:

**⚠️ IMPORTANTE**: Analise os planos anteriores (dados em previousPlans acima) para identificar alimentos que já foram utilizados nos mealPlan dos planos anteriores. Evite repetir exatamente os mesmos alimentos.

**ESTRATÉGIA DE VARIAÇÃO NUTRICIONAL:**
1. **Substituições Nutricionalmente Similares**:
   - Se o histórico mostra muito "Frango grelhado" → Varie com: Peito de peru, Peixe (salmão, tilápia, atum), Carne magra, Ovos
   - Se o histórico mostra muito "Arroz branco" → Varie com: Arroz integral, Batata doce, Batata inglesa, Quinoa, Aveia
   - Se o histórico mostra muito "Brócolis" → Varie com: Espinafre, Couve, Abobrinha, Vagem, Aspargos
   - **Mantenha os mesmos macronutrientes, mas varie o alimento**

2. **Novidades Controladas**:
   - Adicione 1-2 alimentos novos por refeição (não mais que isso)
   - **Sempre dentro dos parâmetros nutricionais** (mesmas calorias, macros similares)
   - **Exemplo**: Se sempre comeu "Iogurte grego", considere "Queijo cottage", "Ricota", "Kefir"

3. **Preparações Diferentes**:
   - Mesmo alimento, preparação diferente: Frango grelhado → Frango assado → Frango desfiado → Frango ao molho
   - **Mantém a base nutricional, mas muda o sabor e textura**

4. **Respeitando Restrições**:
   - Se o usuário tem restrições alimentares: ${
     userData.dietaryRestrictions || "Nenhuma"
   }
   - **NUNCA** sugira alimentos que violem essas restrições
   - **SEMPRE** mantenha os limites de segurança nutricional (calorias mínimas, proteína, gorduras)

#### ⚠️ REGRAS CRÍTICAS PARA VARIAÇÃO:

1. ✅ **VARIE, mas dentro dos parâmetros**: Não invente coisas malucas ou não testadas
2. ✅ **MANTENHA progressão**: Variação não significa regressão - sempre evolua
3. ✅ **RESPEITE segurança**: Para IMC ≥ 30, priorize exercícios seguros mesmo nas variações
4. ✅ **CONSIDERE histórico**: Use os dados normalizados acima para identificar o que já foi usado
5. ✅ **BALANCEIE familiaridade e novidade**: 70% familiar, 30% novo (regra geral)
6. ✅ **NUNCA repita exatamente**: Se o usuário já fez "Supino Plano" nos últimos 2-3 planos, use uma variação
7. ✅ **MANTENHA objetivos**: Variação não significa mudar o objetivo - sempre alinhado ao objetivo do usuário

#### 📊 EXEMPLO PRÁTICO DE VARIAÇÃO:

**Se o histórico mostra:**
- Exercícios: Supino Plano, Agachamento, Remada Curvada, Rosca Direta
- Alimentos: Frango grelhado, Arroz branco, Brócolis, Iogurte grego

**NOVO PLANO DEVE INCLUIR:**
- **Variações de exercícios**: Supino Inclinado (ou Supino com Halteres), Agachamento Frontal (ou Agachamento Sumô), Remada Unilateral (ou Puxada Frontal), Rosca Martelo (ou Rosca Alternada)
- **Novos exercícios** (30%): Desenvolvimento com Halteres, Elevação Lateral, Tríceps Francês
- **Variações de alimentos**: Peito de peru (ou Salmão), Arroz integral (ou Batata doce), Espinafre (ou Couve), Queijo cottage (ou Ricota)
- **Novos alimentos** (30%): Quinoa, Abacate, Castanhas

**SEMPRE mantendo**: Mesmos grupos musculares, mesmos macronutrientes, mesma progressão, mesma segurança.

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
- aerobicTraining (OBRIGATÓRIO - ver diretrizes acima sobre treino aeróbico)

⚠️ IMPORTANTE: O campo trainingPlan (musculação) será gerado separadamente quando o usuário abrir a aba "Treino" no dashboard.
Para reduzir risco de truncamento/limite de tokens, NÃO inclua o campo trainingPlan nesta resposta.

Campos altamente recomendados (INCLUA SEMPRE QUE POSSÍVEL):
- nutritionPlan (recomendado) - incluir dailyCalories, macros, mealPlan, hydration
- goals (recomendado) - incluir weekly, monthly, tracking
- motivation (recomendado - MUITO IMPORTANTE!) - incluir personalMessage e tips

⚠️ CRÍTICO: O campo aerobicTraining é OBRIGATÓRIO! Treino aeróbico é essencial para saúde cardiovascular e deve ser tratado com a mesma importância que treino de força. SEMPRE inclua este campo seguindo as diretrizes OMS/ACSM.

⚠️ IMPORTANTE: O campo motivation é especialmente importante para manter o usuário motivado. Sempre inclua uma mensagem personalizada e dicas motivacionais baseadas no objetivo do usuário!

💪 GRUPOS MUSCULARES NOS EXERCÍCIOS:
- Para cada exercício no trainingPlan.weeklySchedule, inclua o campo "muscleGroups" (opcional mas recomendado)
- Este campo deve listar os grupos musculares principais trabalhados pelo exercício
- Para exercícios compostos (ex: agachamento), liste todos os grupos com mais ênfase, separados por vírgula
- Exemplos:
  * "Supino Inclinado com Halteres" → muscleGroups: "peitoral"
  * "Rosca Martelo" → muscleGroups: "bíceps, antebraço"
  * "Agachamento" → muscleGroups: "quadríceps, glúteos, posterior de coxa"
  * "Terra" → muscleGroups: "costas, posterior de coxa, glúteos, trapézio"
- Use termos em português: peitoral, bíceps, tríceps, ombros, costas, quadríceps, posterior de coxa, glúteos, panturrilhas, abdômen, antebraço, trapézio

O plano será aceito mesmo sem os campos recomendados, mas você DEVE tentar incluí-los sempre, especialmente motivation!`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "personalized_plan",
            schema: {
              type: "object",
              additionalProperties: false,
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
                aerobicTraining: {
                  type: "object",
                  properties: {
                    overview: { type: "string" },
                    weeklySchedule: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          day: { type: "string" },
                          activity: { type: "string" },
                          duration: { type: "string" },
                          intensity: { type: "string" },
                          heartRateZone: { type: "string" },
                          notes: { type: "string" },
                        },
                        required: ["day", "activity", "duration", "intensity"],
                      },
                    },
                    recommendations: { type: "string" },
                    progression: { type: "string" },
                  },
                  required: [
                    "overview",
                    "weeklySchedule",
                    "recommendations",
                    "progression",
                  ],
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
              required: ["analysis"],
            },
          },
        },
      });

      let plan;
      try {
        const rawContent = completion.choices[0].message.content || "{}";

        plan = JSON.parse(rawContent);
      } catch (jsonError) {
        console.error(
          "❌ Erro ao parsear JSON da OpenAI:",
          jsonError instanceof Error ? jsonError.message : String(jsonError)
        );
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

        // trainingPlan pode ser gerado sob demanda (aba "Treino") para evitar truncamento por tokens.
        // Portanto, NÃO tratamos trainingPlan como obrigatório na geração inicial do plano.

        if (!planData.nutritionPlan) missingFields.push("nutritionPlan");
        else {
          const nutrition =
            planData.nutritionPlan as PersonalizedPlan["nutritionPlan"];
          if (!nutrition) {
            missingFields.push("nutritionPlan");
          } else {
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
            const mealPlan = nutrition!.mealPlan;
            if (!Array.isArray(mealPlan) || mealPlan.length === 0) {
              missingFields.push("nutritionPlan.mealPlan");
            } else {
              mealPlan.forEach((meal: MealPlanItem, idx: number) => {
                if (!meal.meal)
                  missingFields.push(`nutritionPlan.mealPlan[${idx}].meal`);
                const options = meal.options ?? ([] as MealOption[]);
                if (!options.length) {
                  missingFields.push(`nutritionPlan.mealPlan[${idx}].options`);
                } else {
                  options.forEach((option: MealOption, optIdx: number) => {
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
          weight,
          pesoInicial: userData.initialWeight || weight,
          height: userData.height || 0,
          imc: imc.toFixed(2),
          sexo: userData.gender || "Não informado",
          trainingFrequency: userData.trainingFrequency || "Não informado",
          nivelAtividade: userData.nivelAtividade || "Moderado",
          trainingLocation: userData.trainingLocation || "Academia",
          trainingTime: userData.trainingTime || null,
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
          nivelAtividade: userData.nivelAtividade || "Moderado", // Valor padrão
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
      // ✅ VALIDAÇÃO NUTRICIONAL COM LIMITES FISIOLÓGICOS
      if (profile && imc !== null) {
        const { validateAndCorrectNutrition, logNutritionCorrection } =
          await import("@/lib/rules/nutritionValidation");

        // Obter valores originais antes da validação para a métrica
        const proteinStr =
          (plan.nutritionPlan as unknown as { macros?: { protein?: string } })
            .macros?.protein || "0";
        const proteinMatch = String(proteinStr).match(/(\d+)/);
        const originalProtein = proteinMatch ? parseInt(proteinMatch[1]) : 0;

        const validated = validateAndCorrectNutrition(
          plan.nutritionPlan as unknown as Parameters<
            typeof validateAndCorrectNutrition
          >[0],
          {
            weight: profile.weight || 0,
            height: profile.height || 0,
            age: profile.age || 0,
            gender: profile.gender || "Não informado",
            imc,
            nivelAtividade: profile.nivel_atividade,
          }
        );

        if (validated.wasAdjusted) {
          console.log("🔧 Plano nutricional ajustado:", validated.adjustments);

          // Extrair valor corrigido para a métrica
          const correctedProteinStr = validated.plan.macros.protein;
          const correctedProteinMatch =
            String(correctedProteinStr).match(/(\d+)/);
          const correctedProtein = correctedProteinMatch
            ? parseInt(correctedProteinMatch[1])
            : 0;

          // Estimar massa magra para a métrica (re-usando a lógica interna ou apenas passando o valor)
          // Como a função logNutritionCorrection pede a leanMass, e ela é interna a validateAndCorrectNutrition,
          // idealmente validateAndCorrectNutrition deveria retornar a leanMass usada.
          // Por simplicidade aqui, vamos extrair se possível ou deixar logNutritionCorrection calcular.
          // Ajustei logNutritionCorrection para calcular internamente se necessário, mas vou passar o que temos.

          logNutritionCorrection(
            validated,
            {
              weight: profile.weight || 0,
              height: profile.height || 0,
              age: profile.age || 0,
              gender: profile.gender || "Não informado",
              imc,
              nivelAtividade: profile.nivel_atividade,
            },
            originalProtein,
            correctedProtein,
            validated.leanMass
          );

          // Merge explícito para garantir que mealPlan e hydration não sumam
          plan.nutritionPlan = {
            ...plan.nutritionPlan,
            ...validated.plan,
          };
        }

        if (validated.warnings.length > 0) {
          console.warn("⚠️ Avisos nutricionais:", validated.warnings);
        }
      }
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

    // ✅ VALIDAÇÃO E CORREÇÃO DO TRAINING PLAN (se existir)
    if (plan.trainingPlan) {
      const { isTrainingPlanUsable, correctSameTypeDaysExercises } =
        await import("@/lib/validators/trainingPlanValidator");

      // 🔧 CORREÇÃO AUTOMÁTICA: Garantir que dias do mesmo tipo tenham os mesmos exercícios
      // 🔒 Passar activityLevel para validar limites semanais antes de duplicar
      const { plan: correctedTrainingPlan, wasCorrected } =
        correctSameTypeDaysExercises(
          plan.trainingPlan,
          profile?.nivel_atividade
        );

      if (wasCorrected) {
        console.log(
          "🔧 TrainingPlan corrigido automaticamente: dias do mesmo tipo agora têm exercícios idênticos"
        );
        plan.trainingPlan = correctedTrainingPlan;

        // Registrar métrica de correção com contexto completo
        if (imc !== null && profile) {
          const { recordPlanCorrection } = await import(
            "@/lib/metrics/planCorrectionMetrics"
          );
          // Contar quantos dias foram corrigidos
          const daysByType = new Map<string, number>();
          for (const day of correctedTrainingPlan.weeklySchedule) {
            const dayType = (day.type || "").toLowerCase();
            daysByType.set(dayType, (daysByType.get(dayType) || 0) + 1);
          }
          const correctedDays = Array.from(daysByType.entries())
            .filter(([, count]) => count > 1)
            .map(([type, count]) => ({ type, count }));

          if (correctedDays.length > 0) {
            const firstCorrection = correctedDays[0];
            const firstDay = correctedTrainingPlan.weeklySchedule.find(
              (d) => (d.type || "").toLowerCase() === firstCorrection.type
            );
            recordPlanCorrection(
              {
                reason: "same_type_days_exercises",
                data: {
                  dayType: firstCorrection.type,
                  firstDay: firstDay?.day || "N/A",
                  correctedDay: "Múltiplos dias corrigidos",
                  exerciseCount: firstDay?.exercises.length || 0,
                },
              },
              {
                imc,
                gender: profile.gender || "Não informado",
                activityLevel: profile.nivel_atividade || "Moderado",
                age: profile.age || 0,
              }
            ).catch(() => {});
          }
        }
      }

      // Funções auxiliares para parsing
      const parseTrainingDays = (freq: string | null | undefined): number => {
        if (!freq) return 3;
        const digits = String(freq).replace(/\D/g, "");
        const n = parseInt(digits, 10);
        if (!n || n < 1 || n > 7) return 3;
        return n;
      };

      const trainingDays = parseTrainingDays(
        profile?.training_frequency || "3x por semana"
      );
      const availableTimeMinutes = 120;

      const isTrainingValid = isTrainingPlanUsable(
        plan.trainingPlan,
        trainingDays,
        profile?.nivel_atividade,
        availableTimeMinutes,
        imc !== null && profile
          ? {
              imc,
              gender: profile.gender || "Não informado",
              age: profile.age || 0,
              objective: profile.objective || undefined, // Incluir objetivo para validação de déficit
            }
          : profile
            ? {
                objective: profile.objective || undefined,
              }
            : undefined
      );

      if (!isTrainingValid) {
        console.error(
          "❌ TrainingPlan inválido! Rejeitando plano completo para forçar regeneração."
        );
        return NextResponse.json(
          {
            error: "TRAINING_PLAN_INVALID",
            message:
              "O plano de treino gerado não atende às regras de validação. Por favor, tente gerar novamente.",
          },
          { status: 500 }
        );
      }
      console.log("✅ TrainingPlan validado com sucesso!");
    }

    // ✅ Adicionar metadata do peso no momento da geração ao plan_data
    // Isso permite exibir o peso histórico correto quando o plano for visualizado depois
    const planWithMetadata = {
      ...plan,
      metadata: {
        weightAtGeneration: profile?.weight || null, // Peso no momento da geração
        heightAtGeneration: profile?.height || null, // Altura no momento da geração
        generatedAt: new Date().toISOString(),
      },
    };

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
        plan_data: planWithMetadata, // ✅ Salvar com metadata do peso
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

    // ✅ Ingestão automática em tabelas normalizadas (idempotente)
    try {
      const planId = savedPlan?.id;
      if (planId) {
        // plan_analyses
        if (plan?.analysis) {
          const { data: existsAnalysis } = await supabaseUser
            .from("plan_analyses")
            .select("id")
            .eq("plan_id", planId)
            .maybeSingle();
          if (!existsAnalysis) {
            const strengths = Array.isArray(plan.analysis.strengths)
              ? plan.analysis.strengths
              : [];
            const improvements = Array.isArray(plan.analysis.improvements)
              ? plan.analysis.improvements
              : [];
            const special = Array.isArray(plan.analysis.specialConsiderations)
              ? plan.analysis.specialConsiderations
              : [];
            const { error: insertAnalysisError } = await supabaseUser
              .from("plan_analyses")
              .insert({
                plan_id: planId,
                user_id: user.id,
                current_status: plan.analysis.currentStatus ?? null,
                strengths,
                improvements,
                special_considerations: special,
              });
            if (insertAnalysisError) {
              console.warn(
                "⚠️ Falha ao inserir plan_analyses:",
                insertAnalysisError
              );
            }
          }
        }

        // plan_trainings
        if (plan?.trainingPlan) {
          const { data: existsTraining } = await supabaseUser
            .from("plan_trainings")
            .select("id")
            .eq("plan_id", planId)
            .maybeSingle();
          if (!existsTraining) {
            const { error: insertTrainingError } = await supabaseUser
              .from("plan_trainings")
              .insert({
                plan_id: planId,
                user_id: user.id,
                overview: plan.trainingPlan.overview ?? null,
                progression: plan.trainingPlan.progression ?? null,
                exercises: plan.trainingPlan.weeklySchedule ?? null,
              });
            if (insertTrainingError) {
              console.warn(
                "⚠️ Falha ao inserir plan_trainings:",
                insertTrainingError
              );
            }
          }
        }

        // plan_nutrition
        if (plan?.nutritionPlan) {
          const { data: existsNutrition } = await supabaseUser
            .from("plan_nutrition")
            .select("id")
            .eq("plan_id", planId)
            .maybeSingle();
          if (!existsNutrition) {
            const toNumber = (val: any): number | null => {
              if (val === null || val === undefined) return null;
              if (typeof val === "number") return val;
              if (typeof val === "string") {
                const num = Number(
                  val.replace(/[^\d.,-]/g, "").replace(",", ".")
                );
                return Number.isFinite(num) ? num : null;
              }
              return null;
            };
            const dailyCalories = toNumber(plan.nutritionPlan.dailyCalories);
            const protein = toNumber(plan.nutritionPlan.macros?.protein);
            const carbs = toNumber(plan.nutritionPlan.macros?.carbs);
            const fats = toNumber(plan.nutritionPlan.macros?.fats);
            const { error: insertNutritionError } = await supabaseUser
              .from("plan_nutrition")
              .insert({
                plan_id: planId,
                user_id: user.id,
                daily_calories: dailyCalories,
                protein_grams: protein,
                carbs_grams: carbs,
                fats_grams: fats,
                meal_plan: plan.nutritionPlan.mealPlan ?? null,
              });
            if (insertNutritionError) {
              console.warn(
                "⚠️ Falha ao inserir plan_nutrition:",
                insertNutritionError
              );
            }
          }
        }

        // plan_aerobic
        if (plan?.aerobicTraining) {
          const { data: existsAerobic } = await supabaseUser
            .from("plan_aerobic")
            .select("id")
            .eq("plan_id", planId)
            .maybeSingle();
          if (!existsAerobic) {
            const { error: insertAerobicError } = await supabaseUser
              .from("plan_aerobic")
              .insert({
                plan_id: planId,
                user_id: user.id,
                overview: plan.aerobicTraining.overview ?? null,
                weekly_schedule: plan.aerobicTraining.weeklySchedule ?? null,
                recommendations: plan.aerobicTraining.recommendations ?? null,
                progression: plan.aerobicTraining.progression ?? null,
              });
            if (insertAerobicError) {
              console.warn(
                "⚠️ Falha ao inserir plan_aerobic:",
                insertAerobicError
              );
            } else {
              console.log("✅ Treino aeróbico inserido em plan_aerobic");
            }
          }
        }
      }
    } catch (ingestionError) {
      console.warn(
        "⚠️ Erro na ingestão automática de dados normalizados:",
        ingestionError
      );
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
          max_plans_allowed: 0, // Usuários precisam comprar prompts para gerar planos
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
      plan: planWithMetadata, // ✅ Retornar plano com metadata (peso histórico)
      planId: savedPlan?.id || planMarker?.[0]?.id || null,
      isExisting: !isNewPlan, // false se é plano novo, true se é plano existente
      generatedAt: generatedAt,
      daysUntilNext: null,
      nextPlanAvailable: null,
    });
  } catch (error) {
    console.error("❌ Erro ao gerar plano:", error);

    // ✅ Detectar erro de cota da OpenAI
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isQuotaError =
      errorMessage.includes("quota") ||
      errorMessage.includes("limit") ||
      errorMessage.includes("429") ||
      (error &&
        typeof error === "object" &&
        "status" in error &&
        error.status === 429);

    if (isQuotaError) {
      return NextResponse.json(
        {
          error: "OPENAI_QUOTA_EXCEEDED",
          message:
            "O sistema está temporariamente indisponível devido a limites de processamento. Por favor, tente novamente em alguns instantes ou entre em contato com o suporte.",
          details: errorMessage,
        },
        { status: 503 } // Service Unavailable (mais apropriado que 429 interno do app)
      );
    }

    return NextResponse.json(
      {
        error: "Erro interno: " + errorMessage,
      },
      { status: 500 }
    );
  }
}
