import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openaiApiKey = process.env.OPENAI_API_KEY!;

const openai = new OpenAI({
  apiKey: openaiApiKey,
});

const ANALYSIS_SCHEMA = {
  name: "analysis_plan",
  strict: true,
  schema: {
    type: "object",
    properties: {
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
    },
    required: ["analysis"],
    additionalProperties: false,
  },
};

const TRAINING_SCHEMA = {
  name: "training_plan",
  strict: true,
  schema: {
    type: "object",
    properties: {
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
    },
    required: ["trainingPlan"],
    additionalProperties: false,
  },
};

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
    const { userData, fieldType, existingPlan } = body;

    if (!userData || !fieldType) {
      return NextResponse.json(
        { error: "Dados do usuário e tipo de campo são obrigatórios" },
        { status: 400 }
      );
    }

    if (fieldType !== "analysis" && fieldType !== "trainingPlan") {
      return NextResponse.json(
        { error: "Tipo de campo inválido. Use 'analysis' ou 'trainingPlan'" },
        { status: 400 }
      );
    }

    console.log(`🔧 Gerando ${fieldType}...`);

    const schema =
      fieldType === "analysis" ? ANALYSIS_SCHEMA : TRAINING_SCHEMA;

    let systemPrompt = "";
    let userPrompt = "";

    if (fieldType === "analysis") {
      systemPrompt = `Você é um personal trainer e nutricionista especialista de ALTO NÍVEL.

IMPORTANTE: Você DEVE retornar uma análise completa e detalhada do status atual do usuário baseada nos dados fornecidos.

A análise DEVE incluir:
1. currentStatus - descrição completa do status atual do usuário em relação ao objetivo
2. strengths - array com pelo menos 3 pontos fortes do usuário
3. improvements - array com pelo menos 3 áreas de melhoria
4. specialConsiderations (opcional) - considerações especiais ou limitações

Seja específico, detalhado e personalizado para o usuário.`;

      userPrompt = `Gere uma análise completa para este usuário:

Dados do usuário:
- Objetivo: ${userData.objective || "Não informado"}
- Peso atual: ${userData.weight || "Não informado"} kg
- Peso inicial: ${userData.pesoInicial || userData.weight || "Não informado"} kg
- Altura: ${userData.height || "Não informado"} cm
- IMC: ${userData.imc || "Não calculado"}
- Sexo: ${userData.sexo || "Não informado"}
- Frequência de treino: ${userData.trainingFrequency || "Não informado"}
- Nível de atividade: ${userData.nivelAtividade || "Moderado"}
${userData.dietaryRestrictions ? `- Restrições alimentares: ${userData.dietaryRestrictions}` : ""}

${existingPlan ? `Plano parcial existente:\n${JSON.stringify(existingPlan, null, 2)}` : ""}

Gere uma análise completa, detalhada e personalizada.`;
    } else {
      systemPrompt = `Você é um personal trainer especialista de ALTO NÍVEL.

IMPORTANTE: Você DEVE retornar um plano de treino completo e detalhado baseado nos dados do usuário e objetivo.

O plano de treino DEVE incluir:
1. overview - visão geral do plano de treino e estratégia
2. weeklySchedule - cronograma semanal completo com pelo menos 5 dias de treino
   - Cada dia deve ter: day (nome do dia), type (tipo de treino), exercises (array de exercícios)
   - Cada exercício deve ter: name, sets, reps, rest, notes (opcional)
3. progression - estratégia de progressão ao longo do tempo

Seja específico, detalhado e adaptado ao objetivo do usuário.`;

      userPrompt = `Gere um plano de treino completo para este usuário:

Dados do usuário:
- Objetivo: ${userData.objective || "Não informado"}
- Peso atual: ${userData.weight || "Não informado"} kg
- Altura: ${userData.height || "Não informado"} cm
- IMC: ${userData.imc || "Não calculado"}
- Sexo: ${userData.sexo || "Não informado"}
- Frequência de treino: ${userData.trainingFrequency || "Não informado"}
- Nível de atividade: ${userData.nivelAtividade || "Moderado"}
- Local de treino: ${userData.trainingLocation || "Academia"}
${userData.injuries ? `- Lesões/limitações: ${userData.injuries}` : ""}

${existingPlan ? `Plano parcial existente:\n${JSON.stringify(existingPlan, null, 2)}` : ""}

Gere um plano de treino completo, detalhado e personalizado para atingir o objetivo do usuário.`;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      max_tokens: 2048,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: schema,
      },
    });

    const choice = completion.choices[0];
    const result = safeParseJSON(choice.message.content);

    console.log(`✅ ${fieldType} gerado:`, {
      hasField: !!result[fieldType],
      finishReason: choice.finish_reason,
    });

    if (!result[fieldType]) {
      return NextResponse.json(
        { error: `Erro ao gerar ${fieldType}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      [fieldType]: result[fieldType],
    });
  } catch (error: unknown) {
    console.error(`❌ Erro ao gerar campo:`, error);
    const errorMessage =
      error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json(
      { error: "Erro interno: " + errorMessage },
      { status: 500 }
    );
  }
}

