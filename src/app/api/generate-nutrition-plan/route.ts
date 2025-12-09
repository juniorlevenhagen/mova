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

⚠️ CRÍTICO: Use a unidade de medida apropriada para cada tipo de alimento:

📏 ALIMENTOS QUE DEVEM SER PESADOS (usar GRAMAS ou KG):
- TODOS os alimentos devem ser pesados, EXCETO ovos
- Arroz, feijão, lentilha, grão-de-bico e outros grãos/leguminosas
- Aveia, quinoa, chia e outros cereais
- Massas (macarrão, etc.)
- Carnes, peixes, frangos (sempre em gramas)
- Legumes e verduras (brócolis, couve-flor, abobrinha, etc.)
- Tubérculos (batata, batata-doce, mandioca)
- Frutas (banana, maçã, laranja, pêra, etc.) - SEMPRE em gramas
- Laticínios (queijo, iogurte, leite, etc.)
- O campo "quantity" deve conter: número + "g" (ex: "150g") ou número + "kg" (ex: "1.5kg" para >= 1000g)
- Exemplos CORRETOS: "200g de arroz cozido", "150g de frango grelhado", "100g de aveia", "80g de feijão cozido", "120g de banana", "150g de maçã"

🥚 ÚNICO ALIMENTO QUE DEVE SER CONTADO EM UNIDADES:
- APENAS OVOS devem ser contados em unidades (não podem ser pesados facilmente)
- O campo "quantity" deve conter: número + "unidade" ou "unidades" (ex: "2 unidades", "1 unidade")
- Exemplos CORRETOS: "2 unidades de ovos", "1 unidade de ovo"

❌ NUNCA use:
- Xícaras, colheres, copos, ml (medidas volumétricas)
- "1 porção", "1 peito", "1 fatia" (use peso ou unidade específica)
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
Idade: ${userData.age || "Não informada"} anos
Sexo: ${userData.gender || "Não informado"}
Nível de Atividade: ${
              userData.nivelAtividade || "Moderado"
            } (⚠️ IMPORTANTE: Use este nível para calcular TDEE - Sedentário: 1.2, Moderado: 1.55, Atleta: 1.725, Atleta Alto Rendimento: 1.9)
Frequência de treino: ${userData.trainingFrequency || "Não informado"}
Restrições alimentares: ${userData.dietaryRestrictions || "Nenhuma"}
Orçamento alimentar: ${
              userData.foodBudget || "moderado"
            } (⚠️ IMPORTANTE: ajuste a escolha de alimentos:
- "economico": priorize frango, ovos, iogurte comum, atum enlatado, feijão, arroz, batata, banana, maçã. Evite salmão, iogurte grego, queijos caros, frutas exóticas.
- "moderado": pode usar ocasionalmente iogurte grego e peixes mais baratos (tilápia, sardinha), mas priorize alimentos básicos.
- "premium": pode incluir salmão, iogurte grego, queijos especiais e alimentos mais caros, priorizando qualidade e variedade.)
Tempo disponível por treino: ${
              userData.trainingTime || "Não informado"
            } (use este tempo para ajustar horários e tamanho das refeições em torno do treino, se fizer sentido)

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
