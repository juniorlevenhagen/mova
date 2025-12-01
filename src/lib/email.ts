import nodemailer from "nodemailer";
import { config } from "./config";

/**
 * Cria um transporter para envio de emails via Gmail SMTP
 */
function createGmailTransporter() {
  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailAppPassword) {
    return null;
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: gmailUser,
      pass: gmailAppPassword, // Senha de app do Gmail (não a senha normal)
    },
  });
}

/**
 * Envia um email usando Gmail SMTP
 */
export async function sendEmail({
  to,
  subject,
  html,
  replyTo,
}: {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}) {
  const transporter = createGmailTransporter();

  if (!transporter) {
    console.log("📧 [DEV MODE] Email não enviado (Gmail não configurado):", {
      to,
      subject,
    });
    return { success: false, error: "Gmail não configurado" };
  }

  try {
    const info = await transporter.sendMail({
      from: `Mova+ <${process.env.GMAIL_USER}>`,
      to: Array.isArray(to) ? to.join(", ") : to,
      replyTo: replyTo || process.env.GMAIL_USER,
      subject,
      html,
    });

    console.log("✅ Email enviado com sucesso:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("❌ Erro ao enviar email:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Envia email de notificação para você sobre nova inscrição na newsletter
 */
export async function sendNewsletterNotification(email: string) {
  return sendEmail({
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
}

/**
 * Envia email de confirmação para o usuário que se inscreveu na newsletter
 */
export async function sendNewsletterConfirmation(email: string) {
  return sendEmail({
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
}

/**
 * Envia email de contato para você
 */
export async function sendContactNotification({
  name,
  email,
  subject,
  message,
}: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  return sendEmail({
    to: config.contactEmail,
    subject: `[Contato] ${subject}`,
    replyTo: email,
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
}

/**
 * Envia email de confirmação para o usuário que enviou contato
 */
export async function sendContactConfirmation({
  name,
  email,
  subject,
  message,
}: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  return sendEmail({
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
}

