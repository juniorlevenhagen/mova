import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { config } from "@/lib/config";

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY não configurada");
  }
  return new Resend(apiKey);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // Validação básica
    if (!email) {
      return NextResponse.json(
        { error: "Email é obrigatório" },
        { status: 400 }
      );
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }

    const resend = getResend();

    // Email de notificação para você
    const notificationEmail = await resend.emails.send({
      from: `Mova+ <${config.fromEmail}>`,
      to: config.newsletterEmail,
      subject: "Nova inscrição na newsletter",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #000;">Nova inscrição na newsletter</h2>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Data:</strong> ${new Date().toLocaleString("pt-BR")}</p>
        </div>
      `,
    });

    // Email de confirmação para o usuário
    const confirmationEmail = await resend.emails.send({
      from: `Mova+ <${config.fromEmail}>`,
      to: email,
      subject: "Bem-vindo à newsletter do Mova+!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #000;">Bem-vindo à newsletter do Mova+!</h2>
          <p>Obrigado por se inscrever! Agora você receberá:</p>
          <ul>
            <li>Dicas exclusivas de fitness e nutrição</li>
            <li>Novidades sobre novos recursos</li>
            <li>Planos especiais e promoções</li>
            <li>Conteúdo exclusivo da nossa equipe</li>
          </ul>
          <p>Fique de olho na sua caixa de entrada!</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">Esta é uma mensagem automática. Por favor, não responda este email.</p>
        </div>
      `,
    });

    if (notificationEmail.error || confirmationEmail.error) {
      console.error(
        "Erro ao enviar email:",
        notificationEmail.error || confirmationEmail.error
      );
      return NextResponse.json(
        { error: "Erro ao enviar email" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Inscrição realizada com sucesso" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro no envio de email:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
