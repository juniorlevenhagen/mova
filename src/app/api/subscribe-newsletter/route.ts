import { NextRequest, NextResponse } from "next/server";
import {
  sendNewsletterNotification,
  sendNewsletterConfirmation,
} from "@/lib/email";
import { config } from "@/lib/config";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { email } = body;

    // Validação básica
    if (!email) {
      return NextResponse.json(
        { error: "Email é obrigatório" },
        { status: 400 }
      );
    }

    // Trim do email para remover espaços (comum em mobile)
    email = email.trim();

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error("❌ Email inválido recebido:", email);
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }

    console.log("📧 Processando inscrição na newsletter:", {
      email,
      userAgent: request.headers.get("user-agent"),
      timestamp: new Date().toISOString(),
    });

    // Enviar email de notificação para você
    console.log("📧 Enviando email de notificação...");
    const notificationResult = await sendNewsletterNotification(email);
    console.log("📧 Resultado notificação:", notificationResult);

    // Enviar email de confirmação para o usuário
    console.log("📧 Enviando email de confirmação...");
    const confirmationResult = await sendNewsletterConfirmation(email);
    console.log("📧 Resultado confirmação:", confirmationResult);

    // Se ambos falharam e não é modo dev, retorna erro
    if (!notificationResult.success && !confirmationResult.success) {
      // Se Gmail não estiver configurado, apenas loga e retorna sucesso
      if (
        notificationResult.error === "Gmail não configurado" &&
        confirmationResult.error === "Gmail não configurado"
      ) {
        console.log("📧 [DEV MODE] Nova inscrição na newsletter:", {
          email,
          date: new Date().toLocaleString("pt-BR"),
          notificationEmail: config.newsletterEmail,
        });
        return NextResponse.json(
          {
            success: true,
            message: "Inscrição realizada com sucesso (modo desenvolvimento)",
          },
          { status: 200 }
        );
      }

      return NextResponse.json(
        {
          error: "Erro ao enviar email",
          details: notificationResult.error || confirmationResult.error,
        },
        { status: 500 }
      );
    }

    // Log de sucesso
    console.log("✅ Inscrição na newsletter processada com sucesso:", {
      email,
      notificationSuccess: notificationResult.success,
      confirmationSuccess: confirmationResult.success,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      { success: true, message: "Inscrição realizada com sucesso" },
      { status: 200 }
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
      { status: 500 }
    );
  }
}
