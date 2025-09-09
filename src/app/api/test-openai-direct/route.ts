import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

function createOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not configured");
  }
  return new OpenAI({ apiKey });
}

export async function GET(request: NextRequest) {
  try {
    console.log("🧪 TESTE DIRETO DA OPENAI");
    console.log("🔍 API Key presente:", !!process.env.OPENAI_API_KEY);
    console.log(
      "🔍 API Key primeiros chars:",
      process.env.OPENAI_API_KEY?.substring(0, 10)
    );

    const openai = createOpenAIClient();
    console.log("🔍 Cliente OpenAI criado:", !!openai);

    console.log("🎯 Fazendo chamada simples...");
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: "Responda apenas com 'OK' se estiver funcionando",
        },
      ],
      max_tokens: 10,
    });

    console.log("✅ Resposta recebida:", completion);
    console.log("✅ Content:", completion.choices[0]?.message?.content);

    return NextResponse.json({
      success: true,
      response: completion.choices[0]?.message?.content,
      model: "gpt-3.5-turbo",
    });
  } catch (error: any) {
    console.error("❌ Erro na OpenAI:", error);
    console.error("❌ Tipo:", typeof error);
    console.error("❌ Message:", error?.message);
    console.error("❌ Response:", error?.response?.data);
    console.error("❌ Status:", error?.response?.status);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Erro desconhecido",
        details: {
          type: typeof error,
          status: error?.response?.status,
          data: error?.response?.data,
        },
      },
      { status: 500 }
    );
  }
}
