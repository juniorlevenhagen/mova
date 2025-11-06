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
      // Calcular IMC se tiver altura e peso
      let imc = 0;
      let imcText = "Não calculável";
      if (userData.altura > 0 && userData.peso > 0) {
        const alturaEmMetros = userData.altura / 100;
        imc = userData.peso / (alturaEmMetros * alturaEmMetros);
        imcText = imc.toFixed(2);
      }

      instruction = `Você é um nutricionista especialista de ALTO NÍVEL. Com base nos dados do usuário abaixo, gere um plano nutricional completo e personalizado.

DADOS DO USUÁRIO:
- Altura: ${userData.altura || "Não informado"} cm
- Peso atual: ${userData.peso || "Não informado"} kg
- Peso inicial: ${userData.pesoInicial || "Não informado"} kg
- IMC: ${imcText}
- Sexo: ${userData.sexo || "Não informado"}
- Frequência de treinos: ${userData.frequenciaTreinos || "Não informado"}
- Objetivo: ${userData.objetivo || "Não informado"}
- Nível de atividade: ${userData.nivelAtividade || "Não informado"}
${userData.birthDate ? `- Data de nascimento: ${userData.birthDate}` : ""}

INSTRUÇÕES PARA O PLANO NUTRICIONAL:

1. Calcule as calorias diárias recomendadas baseadas no objetivo do usuário (emagrecimento, hipertrofia, manutenção, etc.)

2. Defina a distribuição de macronutrientes (proteínas, carboidratos e gorduras) em gramas, adequada ao objetivo

3. Crie um plano alimentar completo com pelo menos 5-6 refeições por dia, incluindo:
   - Nome da refeição (ex: Café da manhã, Lanche da manhã, Almoço, etc.)
   - Horário sugerido
   - Alimentos específicos com quantidades EXATAS (ex: "1 banana média", "200ml leite", "40g whey protein", "100g frango grelhado")
   - Calorias por refeição

4. Inclua orientações de hidratação

5. Se relevante, sugira suplementos (opcional)

⚠️ IMPORTANTE: Sempre especifique quantidades EXATAS para cada alimento. Não use termos vagos como "um pouco" ou "quantidade moderada". Use medidas específicas como gramas, mililitros, unidades, etc.

Apresente o plano de forma clara, organizada e fácil de seguir.`;
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
