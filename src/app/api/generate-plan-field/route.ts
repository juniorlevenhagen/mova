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

    const schema = fieldType === "analysis" ? ANALYSIS_SCHEMA : TRAINING_SCHEMA;

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

⚠️ REGRA CRÍTICA: O treino aeróbico é OBRIGATÓRIO mas deve ser um campo SEPARADO do trainingPlan!

O plano de treino DE FORÇA/MUSCULAÇÃO DEVE incluir:
1. overview - visão geral do plano de treino e estratégia
2. weeklySchedule - cronograma semanal de TREINO DE FORÇA/MUSCULAÇÃO
   ⚠️ IMPORTANTE: A frequência informada pelo usuário (${userData.trainingFrequency || "não informado"}) se refere APENAS aos dias de musculação.
   - O weeklySchedule deve conter EXATAMENTE o número de dias de musculação informado pelo usuário
   - Cada dia deve ter: day (nome do dia), type (tipo de treino), exercises (array de exercícios)
   - Cada exercício deve ter: name, sets, reps, rest, notes (opcional)
   - ⚠️ NÃO inclua treino aeróbico no weeklySchedule - o aeróbico é um campo separado (aerobicTraining)
   - ⚠️ CRÍTICO: Ajuste a quantidade de exercícios e séries baseado no NÍVEL DE ATIVIDADE:
     * Sedentário/Moderado: máximo 4-5 exercícios por treino, máximo 3 séries por exercício, exercícios básicos multiarticulares
     * Atleta: 5-7 exercícios por treino, 3-5 séries por exercício, exercícios intermediários a avançados
     * Alto Rendimento: 6-8 exercícios por treino, 4-6 séries por exercício, exercícios avançados e técnicas avançadas
3. progression - estratégia de progressão ao longo do tempo

### ATIVIDADE CARDIOVASCULAR OBRIGATÓRIA (CAMPO SEPARADO):
- **Para ganhar massa**: Cardio LEVE a MODERADO (2-3x por semana, 30-45min) - caminhada, ciclismo leve, elíptico
- **Para emagrecer**: Cardio MODERADO a INTENSO (3-5x por semana, 30-60min) - HIIT, corrida, ciclismo, natação
- **Para manter**: Cardio MODERADO (2-4x por semana, 30-45min)
- **Para condicionamento**: Cardio INTENSO (4-6x por semana, 45-60min)

⚠️ NUNCA omita atividade cardiovascular do plano! Ela é essencial para saúde, independente do objetivo.

### 🏋️ PRESCRIÇÃO BASEADA EM NÍVEL DE ATIVIDADE:

⚠️ **CRÍTICO: A prescrição de treino DEVE considerar o nível de atividade do usuário!**

**SEDENTÁRIO:**
- ⚠️ Foco em exercícios BÁSICOS e EFICIENTES
- Priorizar exercícios MULTIARTICULARES (agachamento, supino, remada, desenvolvimento)
- Volume moderado: 2-3 séries por exercício
- Máximo 4-5 exercícios por treino
- Exercícios simples e seguros (evitar movimentos complexos)
- ⚠️ NUNCA prescrever exercícios avançados ou isolados complexos

**MODERADO:**
- Exercícios BÁSICOS a INTERMEDIÁRIOS
- Priorizar exercícios MULTIARTICULARES com alguns isolados estratégicos
- Volume moderado: 3 séries por exercício
- Máximo 4-5 exercícios por treino
- Pode incluir alguns exercícios isolados complementares

**ATLETA:**
- Exercícios INTERMEDIÁRIOS a AVANÇADOS
- Maior QUANTIDADE: 5-7 exercícios por treino
- Maior VOLUME: 3-5 séries por exercício
- Exercícios COMPOSTOS e avançados são adequados
- Maior FADIGA MUSCULAR (volume total maior)
- Pode incluir técnicas avançadas

**ATLETA ALTO RENDIMENTO:**
- Exercícios AVANÇADOS e ESPECIALIZADOS
- MÁXIMA QUANTIDADE: 6-8 exercícios por treino
- MÁXIMO VOLUME: 4-6 séries por exercício
- Exercícios COMPOSTOS complexos e isolados avançados
- MÁXIMA FADIGA MUSCULAR (volume total muito alto)
- Técnicas avançadas são esperadas (supersets, drop sets, etc.)

⚠️ **REGRAS CRÍTICAS:**
- Sedentário/Moderado: NUNCA prescrever mais de 4-5 exercícios por treino
- Sedentário/Moderado: NUNCA prescrever mais de 3 séries por exercício
- Atleta/Alto Rendimento: NUNCA prescrever menos de 5 exercícios por treino
- SEMPRE considerar o objetivo do usuário junto com o nível de atividade

Seja específico, detalhado e adaptado ao objetivo e nível de atividade do usuário.`;

      userPrompt = `Gere um plano de treino completo para este usuário:

Dados do usuário:
- Objetivo: ${userData.objective || "Não informado"}
- Peso atual: ${userData.weight || "Não informado"} kg
- Altura: ${userData.height || "Não informado"} cm
- IMC: ${userData.imc || "Não calculado"}
- Sexo: ${userData.sexo || "Não informado"}
- Frequência de MUSCULAÇÃO: ${userData.trainingFrequency || "Não informado"} (⚠️ Esta frequência se refere APENAS aos dias de treino de força/musculação)
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
