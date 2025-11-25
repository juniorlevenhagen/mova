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

    const resend = getResend();

    // Email para você (destinatário)
    const emailToYou = await resend.emails.send({
      from: `Mova+ <${config.fromEmail}>`,
      to: config.contactEmail,
      replyTo: email,
      subject: `[Contato] ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #000;">Nova mensagem de contato</h2>
          <p><strong>Nome:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Assunto:</strong> ${subject}</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p><strong>Mensagem:</strong></p>
          <p style="white-space: pre-wrap; background: #f5f5f5; padding: 15px; border-radius: 5px;">${message}</p>
        </div>
      `,
    });

    // Email de confirmação para o usuário
    const confirmationEmail = await resend.emails.send({
      from: `Mova+ <${config.fromEmail}>`,
      to: email,
      subject: "Recebemos sua mensagem - Mova+",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #000;">Olá, ${name}!</h2>
          <p>Recebemos sua mensagem e entraremos em contato em breve.</p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Assunto:</strong> ${subject}</p>
            <p><strong>Sua mensagem:</strong></p>
            <p style="white-space: pre-wrap;">${message}</p>
          </div>
          <p>Nossa equipe responderá em até 24 horas úteis.</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">Esta é uma mensagem automática. Por favor, não responda este email.</p>
        </div>
      `,
    });

    if (emailToYou.error || confirmationEmail.error) {
      console.error(
        "Erro ao enviar email:",
        emailToYou.error || confirmationEmail.error
      );
      return NextResponse.json(
        { error: "Erro ao enviar email" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Email enviado com sucesso" },
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
