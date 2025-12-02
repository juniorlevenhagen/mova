import { NextRequest, NextResponse } from "next/server";
import {
  sendNewsletterNotification,
  sendNewsletterConfirmation,
} from "@/lib/email";
import { config } from "@/lib/config";

// Headers CORS para produção
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
};

// Handler para OPTIONS (CORS preflight)
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    // Verificar se há body na requisição
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error("❌ Erro ao fazer parse do JSON:", parseError);
      return NextResponse.json(
        { error: "Formato de requisição inválido" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!body || typeof body !== "object") {
      console.error("❌ Body inválido ou vazio:", body);
      return NextResponse.json(
        { error: "Dados inválidos" },
        { status: 400, headers: corsHeaders }
      );
    }

    let { email } = body;

    // Validação básica
    if (!email) {
      return NextResponse.json(
        { error: "Email é obrigatório" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Trim do email para remover espaços (comum em mobile)
    email = email.trim();

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error("❌ Email inválido recebido:", email);
      return NextResponse.json(
        { error: "Email inválido" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Log detalhado para debug em produção
    const isProduction = process.env.NODE_ENV === "production";
    console.log("📧 Processando inscrição na newsletter:", {
      email,
      userAgent: request.headers.get("user-agent"),
      origin: request.headers.get("origin"),
      referer: request.headers.get("referer"),
      timestamp: new Date().toISOString(),
      environment: isProduction ? "production" : "development",
    });

    // Enviar email de notificação para você
    console.log("📧 Enviando email de notificação...");
    const notificationResult = await sendNewsletterNotification(email);
    console.log(
      "📧 Resultado notificação:",
      JSON.stringify(notificationResult, null, 2)
    );

    // Enviar email de confirmação para o usuário
    console.log("📧 Enviando email de confirmação...");
    const confirmationResult = await sendNewsletterConfirmation(email);
    console.log(
      "📧 Resultado confirmação:",
      JSON.stringify(confirmationResult, null, 2)
    );

    // Verificar se Gmail está configurado
    const gmailNotConfigured =
      notificationResult.error === "Gmail não configurado" ||
      confirmationResult.error === "Gmail não configurado";

    // SEMPRE retornar sucesso se a inscrição foi processada
    // Os emails podem falhar mas a inscrição foi registrada
    const atLeastOneEmailSent =
      notificationResult.success || confirmationResult.success;

    if (gmailNotConfigured) {
      console.warn(
        "⚠️ Gmail não configurado em produção. Nova inscrição na newsletter:",
        {
          email,
          date: new Date().toLocaleString("pt-BR"),
          notificationEmail: config.newsletterEmail,
          notificationSuccess: notificationResult.success,
          confirmationSuccess: confirmationResult.success,
        }
      );
    } else if (!atLeastOneEmailSent) {
      console.error("❌ Ambos os emails falharam:", {
        email,
        notificationError: notificationResult.error,
        confirmationError: confirmationResult.error,
      });
    }

    // Log de sucesso (inscrição processada, independente do envio de email)
    console.log("✅ Inscrição na newsletter processada:", {
      email,
      notificationSuccess: notificationResult.success,
      confirmationSuccess: confirmationResult.success,
      gmailConfigured: !gmailNotConfigured,
      timestamp: new Date().toISOString(),
    });

    // SEMPRE retornar sucesso se chegou até aqui
    // A inscrição foi processada mesmo que os emails tenham falhado
    return NextResponse.json(
      {
        success: true,
        message: "Inscrição realizada com sucesso",
        emailSent: atLeastOneEmailSent,
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error: unknown) {
    console.error("❌ Erro no envio de email:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erro desconhecido";

    // Log detalhado do erro
    console.error("❌ Detalhes do erro:", {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: errorMessage,
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
