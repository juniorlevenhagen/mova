import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import type {
  NutritionPlan,
  Meal,
  MealOption,
} from "@/lib/rules/nutritionValidation";

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
    const { userData } = body;

    if (!userData) {
      return NextResponse.json(
        { error: "Dados do usuário são obrigatórios" },
        { status: 400 }
      );
    }

    console.log("🍎 Gerando plano nutricional...");

    const openai = getOpenAIClient();
    const { validateAndCorrectNutrition } = await import(
      "@/lib/rules/nutritionValidation"
    );
    let nutritionPlanData: { nutritionPlan: NutritionPlan } | null = null;
    let attempts = 0;
    const maxAttempts = 3;

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
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

⚠️ REGRAS DE CONSISTÊNCIA MATEMÁTICA (CRÍTICO):
1. A soma das calorias de TODAS as opções em TODAS as refeições deve ser EXATAMENTE IGUAL ao valor declarado em 'dailyCalories'.
2. A distribuição de macronutrientes deve ser consistente com o total calórico (1g Prot = 4kcal, 1g Carb = 4kcal, 1g Gord = 9kcal).
3. Cada refeição individual deve ter um valor calórico que, somado às outras refeições, totalize o 'dailyCalories'.
4. Não pode haver "calorias fantasmas": se o plano diz 1800 kcal, o usuário deve conseguir somar 1800 kcal lendo os alimentos de um dia completo.
5. Quantidades Realistas: Nunca use quantidades absurdas (ex: 1g de banana). Use pesos reais de mercado (ex: 100g a 150g de frutas, 100g a 200g de arroz/feijão).
6. Verificação Interna: Antes de responder, faça o cálculo: (Soma das calorias de cada alimento da refeição 1) + (Soma da refeição 2) ... deve ser igual ao 'dailyCalories'. Se houver discrepância de até 1 kcal, ajuste em algum alimento.

⚠️ REGRAS DE CÁLCULO (ESTRITO):
1. Calcule a BMR (Basal) usando Mifflin-St Jeor:
   - Homens: (10 × peso kg) + (6.25 × altura cm) - (5 × idade anos) + 5
   - Mulheres: (10 × peso kg) + (6.25 × altura cm) - (5 × idade anos) - 161
2. Calcule o TDEE usando os multiplicadores de atividade fornecidos.
3. Se o objetivo for EMAGRECIMENTO:
   - Aplique um déficit de 300 a 500 kcal sobre o TDEE.
   - 🚨 TRAVA DE SEGURANÇA (METABOLISMO): NUNCA prescreva menos calorias do que a BMR calculada. O metabolismo deve ser preservado.
   - 🚨 LIMITE MÍNIMO PRÁTICO: Para um perfil de 90kg, 170cm e 40 anos, a BMR é aproximadamente 1600 kcal e o TDEE é ~2480 kcal. Portanto, o plano NUNCA deve estar abaixo de 1800-1900 kcal. 1500 kcal é ERRO DE CÁLCULO e é insuficiente para este peso.
   - Se o déficit de 500 kcal cair abaixo da BMR, use a BMR como limite mínimo absoluto.
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
    ];

    while (attempts < maxAttempts) {
      attempts++;
      console.log(`🤖 Tentativa de geração ${attempts}/${maxAttempts}...`);

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.2,
        max_tokens: 2048,
        messages,
        response_format: {
          type: "json_schema",
          json_schema: buildNutritionSchema(),
        },
      });

      const choice = completion.choices[0];
      const parsedData = safeParseJSON(choice.message.content);

      if (!parsedData.nutritionPlan) {
        console.log("⚠️ Falha no parse do plano. Tentando novamente...");
        continue;
      }

      // 🔧 VALIDAÇÃO E CORREÇÃO PROGRAMÁTICA
      const validated = validateAndCorrectNutrition(parsedData.nutritionPlan, {
        weight: userData.weight || 0,
        height: userData.height || 0,
        age: userData.age || 0,
        gender: userData.gender || "Não informado",
        imc: parseFloat(userData.imc) || 0,
        nivelAtividade: userData.nivelAtividade,
      });

      // Se o plano for consistente matematicamente, aceitamos
      if (validated.isConsistent) {
        console.log("✅ Plano consistente gerado na tentativa", attempts);
        nutritionPlanData = {
          ...parsedData,
          nutritionPlan: {
            ...parsedData.nutritionPlan,
            ...validated.plan,
          },
        };
        break;
      } else {
        console.log("⚠️ Plano inconsistente detectado:", validated.warnings);

        // Alimentamos a resposta incorreta e o feedback de erro de volta à IA para a próxima tentativa
        messages.push({
          role: "assistant",
          content: choice.message.content || "",
        });

        const totalCalories = parsedData.nutritionPlan.mealPlan.reduce(
          (sum: number, m: Meal) =>
            sum +
            (m.options?.reduce(
              (s: number, o: MealOption) => s + (o.calories || 0),
              0
            ) || 0),
          0
        );

        messages.push({
          role: "user",
          content: `O plano alimentar gerado possui as seguintes inconsistências e avisos de validação:
${validated.warnings.map((w: string) => `- ${w}`).join("\n")}

Por favor, corrija o plano seguindo estritamente estas diretrizes:
1. Certifique-se de que a soma das calorias de todas as opções em todas as refeições seja EXATAMENTE IGUAL a ${validated.plan.dailyCalories} kcal (sua meta atual). A soma atual de calorias deu ${totalCalories} kcal.
2. Adicione uma 5ª refeição (como um lanche da manhã, lanche pós-treino ou ceia) ou aumente as quantidades dos alimentos existentes para fechar a conta calórica exata de ${validated.plan.dailyCalories} kcal. Nunca deixe faltar calorias.
3. Certifique-se de que a soma dos macronutrientes dos alimentos reflita de forma coerente a meta estipulada de Proteínas: ${validated.plan.macros.protein}, Carboidratos: ${validated.plan.macros.carbs} e Gorduras: ${validated.plan.macros.fats}.

Por favor, gere uma nova versão corrigida.`,
        });

        // Se for a última tentativa, aceitamos com o ajuste programático de calorias/macros
        // embora a lista de alimentos ainda possa ter pequenas discrepâncias.
        if (attempts === maxAttempts) {
          console.log(
            "🛑 Limite de tentativas atingido. Aceitando melhor versão disponível."
          );
          nutritionPlanData = {
            ...parsedData,
            nutritionPlan: {
              ...parsedData.nutritionPlan,
              ...validated.plan,
            },
          };
        }
      }
    }

    if (!nutritionPlanData || !nutritionPlanData.nutritionPlan) {
      return NextResponse.json(
        { error: "Erro ao gerar plano nutricional após múltiplas tentativas" },
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
