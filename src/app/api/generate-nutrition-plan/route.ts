import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openaiApiKey = process.env.OPENAI_API_KEY!;

const openai = new OpenAI({
  apiKey: openaiApiKey,
});

const PLAN_FIELD_SCHEMAS = {
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
        additionalProperties: false,
      },
      mealPlan: {
        type: "array",
        items: {
          type: "object",
          properties: {
            meal: { type: "string" },
            timing: { type: "string" },
            options: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  food: { type: "string" },
                  quantity: { type: "string" },
                  calories: { type: "number" },
                },
                required: ["food", "quantity", "calories"],
              },
            },
          },
          required: ["meal", "timing", "options"],
        },
      },
      hydration: { type: "string" },
    },
    required: ["dailyCalories", "macros", "mealPlan", "hydration"],
    additionalProperties: false,
  },
};

function buildNutritionSchema() {
  return {
    name: "nutrition_plan",
    strict: true,
    schema: {
      type: "object",
      properties: {
        nutritionPlan: PLAN_FIELD_SCHEMAS.nutritionPlan,
      },
      required: ["nutritionPlan"],
      additionalProperties: false,
    },
  };
}

function safeParseJSON(rawContent: string | null | undefined) {
  if (!rawContent) return {};

  try {
    return JSON.parse(rawContent);
  } catch (error) {
    console.error("❌ Erro ao fazer parse do JSON:", error);
    return {};
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userData, existingPlan } = body;

    if (!userData) {
      return NextResponse.json(
        { error: "Dados do usuário são obrigatórios" },
        { status: 400 }
      );
    }

    console.log("🍎 Gerando plano nutricional...");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      max_tokens: 2048,
      messages: [
        {
          role: "system",
          content: `Você é um nutricionista especialista de ALTO NÍVEL.

IMPORTANTE: Você DEVE retornar um plano nutricional completo e detalhado baseado nos dados do usuário.

O plano nutricional DEVE incluir:
1. dailyCalories - número total de calorias diárias recomendadas
2. macros - distribuição de macronutrientes (protein, carbs, fats) em gramas
3. mealPlan - plano alimentar completo com pelo menos 5 refeições por dia
   - Cada refeição deve ter: meal (nome), timing (horário), options (array de alimentos)
   - Cada alimento deve ter: food (nome), quantity (quantidade específica, ex: "1 banana média", "200ml leite", "40g whey"), calories (calorias)
4. hydration - orientações de hidratação
5. supplements (opcional) - suplementos recomendados

⚠️ CRÍTICO: Sempre inclua quantidades específicas para cada alimento. Exemplos:
- "1 banana média" (não apenas "banana")
- "200ml leite" (não apenas "leite")
- "40g whey protein" (não apenas "whey")
- "100g frango grelhado" (não apenas "frango")

O objetivo do usuário é: ${userData.objective || "Não informado"}
Peso: ${userData.weight || "Não informado"} kg
Altura: ${userData.height || "Não informado"} cm
IMC: ${userData.imc || "Não informado"}
Frequência de treino: ${userData.trainingFrequency || "Não informado"}
Restrições alimentares: ${userData.dietaryRestrictions || "Nenhuma"}

${
  existingPlan
    ? `Plano de treino existente:\n${JSON.stringify(
        existingPlan.trainingPlan,
        null,
        2
      )}`
    : ""
}`,
        },
        {
          role: "user",
          content: `Gere um plano nutricional completo e personalizado para este usuário. O plano deve ser específico, detalhado e incluir quantidades exatas para cada alimento.`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: buildNutritionSchema(),
      },
    });

    const choice = completion.choices[0];
    const nutritionPlanData = safeParseJSON(choice.message.content);

    console.log("✅ Plano nutricional gerado:", {
      hasNutritionPlan: !!nutritionPlanData.nutritionPlan,
      finishReason: choice.finish_reason,
    });

    if (!nutritionPlanData.nutritionPlan) {
      return NextResponse.json(
        { error: "Erro ao gerar plano nutricional" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      nutritionPlan: nutritionPlanData.nutritionPlan,
    });
  } catch (error: unknown) {
    console.error("❌ Erro ao gerar plano nutricional:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json(
      { error: "Erro interno: " + errorMessage },
      { status: 500 }
    );
  }
}
