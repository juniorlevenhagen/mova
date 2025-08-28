import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const envCheck = {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY
        ? "✅ Configurada"
        : "❌ Não configurada",
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL
        ? "✅ Configurada"
        : "❌ Não configurada",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        ? "✅ Configurada"
        : "❌ Não configurada",
      NODE_ENV: process.env.NODE_ENV || "Não definido",
    };

    return NextResponse.json({
      success: true,
      message: "Verificação de variáveis de ambiente",
      environment: envCheck,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao verificar variáveis de ambiente",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

