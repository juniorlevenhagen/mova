import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET() {
  try {
    console.log("Teste OpenAI iniciado");

    // Verificar se a chave está configurada
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Chave da OpenAI não configurada" },
        { status: 500 }
      );
    }

    console.log("Chave da OpenAI encontrada");

    // Teste simples com OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Você é um assistente útil.",
        },
        {
          role: "user",
          content: "Responda apenas com 'Teste funcionando!'",
        },
      ],
      temperature: 0.1,
    });

    const response = completion.choices[0].message.content;
    console.log("Resposta da OpenAI:", response);

    return NextResponse.json({
      success: true,
      message: "OpenAI funcionando!",
      response: response,
    });
  } catch (error) {
    console.error("Erro no teste OpenAI:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json(
      { error: "Erro no teste OpenAI: " + errorMessage },
      { status: 500 }
    );
  }
}
