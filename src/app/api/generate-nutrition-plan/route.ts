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
            timing: { type: "string" },
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
   - Cada alimento deve ter: food (nome), quantity (quantidade SEMPRE em GRAMAS), calories (calorias)
4. hydration - orientações de hidratação
5. supplements (opcional) - suplementos recomendados

⚠️ CRÍTICO: Sempre inclua quantidades específicas para cada alimento APENAS em GRAMAS (g):
- ⚠️ NUNCA use xícaras, colheres, unidades, ml ou outras medidas
- ⚠️ SEMPRE use GRAMAS (g) para todos os alimentos
- Exemplos CORRETOS:
  - "150g de frango grelhado" (não "frango" ou "1 unidade")
  - "200g de arroz cozido" (não "1 xícara de arroz" ou "arroz cru")
  - "100g de batata doce cozida" (não "1 batata média" ou "batata crua")
  - "120g de banana" (não "1 banana média")
  - "250g de leite" (não "200ml leite")
  - "40g de whey protein" (correto - já está em gramas)
- ⚠️ CRÍTICO: Informações nutricionais (calorias, macros) devem ser de alimentos JÁ PREPARADOS quando o preparo altera significativamente os valores nutricionais:
  - Sempre especifique o método de preparo no nome do alimento quando necessário (grelhado, cozido, assado, etc.)
  - Exemplo: "150g de frango grelhado" (calorias do frango grelhado, não cru)
  - Exemplo: "200g de arroz cozido" (calorias do arroz cozido, não cru)
  - Exemplo: "100g de batata doce cozida" (calorias da batata cozida, não crua)
  - Alimentos que podem ser consumidos crus sem alteração nutricional significativa (como aveia, frutas, vegetais crus, iogurte) não precisam especificar preparo

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
