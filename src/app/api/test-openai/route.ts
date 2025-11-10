import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openaiApiKey = process.env.OPENAI_API_KEY!;

const openai = new OpenAI({
  apiKey: openaiApiKey,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userData } = body;

    console.log("🤖 Testando conexão com OpenAI...");
    console.log("📊 Dados do usuário recebidos:", userData);

    // Preparar instrução com dados do usuário
    let instruction = "Responda apenas: Oi, sou a openAI,";

    if (userData) {
      instruction = `Você é um assistente nutricional. Com base nos seguintes dados do usuário, apresente uma mensagem de boas-vindas personalizada e resuma os dados iniciais do usuário de forma clara e organizada:

Dados do usuário:
- Altura: ${userData.altura || "Não informado"} cm
- Peso atual: ${userData.peso || "Não informado"} kg
- Peso inicial: ${userData.pesoInicial || "Não informado"} kg
- Sexo: ${userData.sexo || "Não informado"}
- Frequência de treinos: ${userData.frequenciaTreinos || "Não informado"}
- Objetivo: ${userData.objetivo || "Não informado"}
- Nível de atividade: ${userData.nivelAtividade || "Não informado"}
${userData.birthDate ? `- Data de nascimento: ${userData.birthDate}` : ""}

Apresente os dados de forma clara e organizada, como se estivesse apresentando um resumo do perfil do usuário.`;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: instruction,
        },
      ],
    });

    const response = completion.choices[0]?.message?.content || "";

    console.log("✅ Resposta da OpenAI:", response);

    return NextResponse.json({
      success: true,
      message: response,
    });
  } catch (error: unknown) {
    console.error("❌ Erro ao testar OpenAI:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json(
      { error: "Erro interno: " + errorMessage },
      { status: 500 }
    );
  }
}
