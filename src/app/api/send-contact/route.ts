import { NextRequest, NextResponse } from "next/server";
import { sendContactNotification, sendContactConfirmation } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body;

    // Validação básica
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "Todos os campos são obrigatórios" },
        { status: 400 }
      );
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }

    // Enviar email de notificação para você
    const notificationResult = await sendContactNotification({
      name,
      email,
      subject,
      message,
    });

    // Enviar email de confirmação para o usuário
    const confirmationResult = await sendContactConfirmation({
      name,
      email,
      subject,
      message,
    });

    // Se ambos falharam e não é modo dev, retorna erro
    if (!notificationResult.success && !confirmationResult.success) {
      // Se Gmail não estiver configurado, apenas loga e retorna sucesso
      if (
        notificationResult.error === "Gmail não configurado" &&
        confirmationResult.error === "Gmail não configurado"
      ) {
        console.log("📧 [DEV MODE] Nova mensagem de contato:", {
          name,
          email,
          subject,
          message,
          date: new Date().toLocaleString("pt-BR"),
        });
        return NextResponse.json(
          {
            success: true,
            message: "Mensagem recebida com sucesso (modo desenvolvimento)",
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

    return NextResponse.json(
      { success: true, message: "Email enviado com sucesso" },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Erro no envio de email:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
