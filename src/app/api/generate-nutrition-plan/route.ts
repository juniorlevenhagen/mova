import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY não configurada");
  }
  return new OpenAI({ apiKey });
}

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

    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      max_tokens: 2048,
      messages: [
        {
          role: "system",
          content: `Você é um especialista em orientação alimentar e educação nutricional.

IMPORTANTE: Você DEVE retornar uma orientação alimentar completa e detalhada baseada nos dados do usuário. Esta é uma orientação educacional e organizacional, não uma prescrição nutricional individualizada. Lembre-se: não se trata de consulta ou tratamento nutricional.

A orientação alimentar DEVE incluir:
1. dailyCalories - número total de calorias diárias recomendadas
2. macros - distribuição de macronutrientes (protein, carbs, fats) em gramas
3. mealPlan - plano alimentar completo com pelo menos 5 refeições por dia
   - Cada refeição deve ter: meal (nome), timing (horário), options (array de alimentos)
   - Cada alimento deve ter: food (nome), quantity (quantidade SEMPRE em GRAMAS), calories (calorias)
4. hydration - orientações de hidratação

⚠️ REGRAS DE CÁLCULO (ESTRITO):
1. Calcule a BMR (Basal) usando Mifflin-St Jeor:
   - Homens: (10 × peso kg) + (6.25 × altura cm) - (5 × idade anos) + 5
   - Mulheres: (10 × peso kg) + (6.25 × altura cm) - (5 × idade anos) - 161
2. Calcule o TDEE usando os multiplicadores de atividade fornecidos.
3. Se o objetivo for EMAGRECIMENTO:
   - Aplique um déficit de 300 a 500 kcal sobre o TDEE.
   - 🚨 TRAVA DE SEGURANÇA: NUNCA prescreva menos calorias do que a BMR calculada. O metabolismo deve ser preservado.
   - Se o déficit de 500 kcal cair abaixo da BMR, use a BMR como limite mínimo de calorias.
4. Distribuição de Macros:
   - Proteína: 1.6g a 2.2g por kg de peso.
   - Gorduras: 0.7g a 1.0g por kg de peso.
   - Carboidratos: Preencha o restante das calorias.

⚠️ CRÍTICO: Use a unidade de medida apropriada para cada tipo de alimento:

📏 ALIMENTOS QUE DEVEM SER PESADOS (usar GRAMAS ou KG):
- TODOS os alimentos devem ser pesados, EXCETO ovos
- Arroz, feijão, lentilha, grão-de-bico e outros grãos/leguminosas
- Aveia, quinoa, chia e outros cereais
- Carnes, peixes, frangos (sempre em gramas)
- Legumes e verduras (brócolis, couve-flor, abobrinha, etc.)
- Tubérculos (batata, batata-doce, mandioca)
- Frutas (banana, maçã, laranja, pêra, etc.) - SEMPRE em gramas
- O campo "quantity" deve conter: número + "g" (ex: "150g")
- Exemplos CORRETOS: "200g de arroz cozido", "150g de frango grelhado", "120g de banana"

🥚 ÚNICO ALIMENTO QUE DEVE SER CONTADO EM UNIDADES:
- APENAS OVOS (ex: "2 unidades")

❌ NUNCA use: Xícaras, colheres, copos, ml ou "1 porção".

O objetivo do usuário é: ${userData.objective || "Não informado"}
Peso: ${userData.weight || "Não informado"} kg
Altura: ${userData.height || "Não informado"} cm
IMC: ${userData.imc || "Não informado"}
Idade: ${userData.age || "Não informada"} anos
Sexo: ${userData.gender || "Não informado"}
Nível de Atividade: ${
            userData.nivelAtividade || "Moderado"
          } (⚠️ Multiplicadores: Sedentário: 1.2, Moderado: 1.55, Atleta: 1.725, Atleta Alto Rendimento: 1.9)
Restrições alimentares: ${userData.dietaryRestrictions || "Nenhuma"}
Orçamento alimentar: ${userData.foodBudget || "moderado"}`,
        },
        {
          role: "user",
          content: `Gere uma orientação alimentar completa e segura seguindo as travas metabólicas.`,
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
