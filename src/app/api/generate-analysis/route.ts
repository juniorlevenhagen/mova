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

    console.log("🔍 Gerando análise personalizada...");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      max_tokens: 2048,
      messages: [
        {
          role: "system",
          content: `Você é um personal trainer e nutricionista especialista de ALTO NÍVEL.

IMPORTANTE: Você DEVE retornar uma análise completa e detalhada do status atual do usuário baseada nos dados fornecidos.

A análise DEVE incluir:
1. currentStatus - descrição completa e detalhada do status atual do usuário em relação ao objetivo principal
   - Avalie o estado físico atual (peso, IMC, composição corporal)
   - Compare com o objetivo estabelecido
   - Identifique o progresso já alcançado (se houver histórico)
   - Mencione pontos críticos que precisam de atenção

2. strengths - array com pelo menos 3 pontos fortes do usuário
   - Identifique vantagens físicas, comportamentais ou de estilo de vida
   - Seja específico e positivo
   - Exemplos: "Sem dores ou restrições alimentares", "Acesso à academia 5 vezes por semana", "Motivação inicial alta"

3. improvements - array com pelo menos 3 áreas de melhoria
   - Identifique aspectos que precisam ser trabalhados para atingir o objetivo
   - Seja construtivo e específico
   - Exemplos: "Aumentar consumo calórico para ganho de massa", "Focar em exercícios de força progressiva", "Monitorar bem-estar"

4. specialConsiderations (opcional) - considerações especiais ou limitações
   - Restrições alimentares
   - Lesões ou dores
   - Fatores que podem impactar o plano
   - Adaptações necessárias

Seja específico, detalhado e personalizado para o usuário. Use todos os dados disponíveis para criar uma análise precisa e útil.`,
        },
        {
          role: "user",
          content: `Gere uma análise completa e detalhada para este usuário:

Dados do usuário:
- Objetivo principal: ${userData.objective || "Não informado"}
- Nome: ${userData.name || "Não informado"}
- Idade: ${userData.age || "Não informado"} anos
- Gênero: ${userData.gender || "Não informado"}
- Peso atual: ${userData.weight || "Não informado"} kg
- Peso inicial: ${userData.initialWeight || userData.weight || "Não informado"} kg
- Altura: ${userData.height || "Não informado"} cm
- IMC: ${userData.imc || "Não calculado"}
- Variação de peso: ${userData.weightChange || "Não calculado"} kg
- Frequência de treino: ${userData.trainingFrequency || "Não informado"}
- Local de treino: ${userData.trainingLocation || "Não informado"}
- Nível de atividade: ${userData.nivelAtividade || "Moderado"}
${userData.hasPain ? `- Dores/Lesões: Sim` : `- Dores/Lesões: Não`}
${userData.dietaryRestrictions ? `- Restrições alimentares: ${userData.dietaryRestrictions}` : `- Restrições alimentares: Nenhuma`}

${userData.latestEvolution ? `
📊 ÚLTIMA EVOLUÇÃO REGISTRADA:
- Data: ${userData.latestEvolution.date || "Não informado"}
- Peso: ${userData.latestEvolution.peso || "Não informado"} kg
- Cintura: ${userData.latestEvolution.cintura || "Não informado"} cm
- Quadril: ${userData.latestEvolution.quadril || "Não informado"} cm
- Braço: ${userData.latestEvolution.braco || "Não informado"} cm
- Percentual de Gordura: ${userData.latestEvolution.percentual_gordura || "Não informado"}%
- Massa Magra: ${userData.latestEvolution.massa_magra || "Não informado"} kg
- Bem-estar: ${userData.latestEvolution.bem_estar || "Não informado"}/10
- Observações: ${userData.latestEvolution.observacoes || "Nenhuma"}
` : ""}

${userData.evolutionHistory && userData.evolutionHistory.length > 1 ? `
📈 HISTÓRICO DE EVOLUÇÃO:
- Total de evoluções registradas: ${userData.evolutionHistory.length}
- Use este histórico para identificar tendências e progresso ao longo do tempo
` : ""}

${existingPlan ? `
Plano parcial existente (para contexto):
${JSON.stringify(existingPlan, null, 2)}
` : ""}

Gere uma análise completa, detalhada e personalizada que ajude o usuário a entender seu estado atual e o que precisa fazer para atingir seu objetivo.`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: ANALYSIS_SCHEMA,
      },
    });

    const choice = completion.choices[0];
    const analysisData = safeParseJSON(choice.message.content);

    console.log("✅ Análise gerada:", {
      hasAnalysis: !!analysisData.analysis,
      finishReason: choice.finish_reason,
    });

    if (!analysisData.analysis) {
      return NextResponse.json(
        { error: "Erro ao gerar análise" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      analysis: analysisData.analysis,
    });
  } catch (error: unknown) {
    console.error("❌ Erro ao gerar análise:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json(
      { error: "Erro interno: " + errorMessage },
      { status: 500 }
    );
  }
}

