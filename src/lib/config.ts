/**
 * Configurações centralizadas da aplicação
 */

// Email único para recebimento de todas as mensagens
const DEFAULT_EMAIL = "juniorlevenhagen@gmail.com";

export const config = {
  // Email de contato/suporte - todos os emails são enviados para o mesmo endereço
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || DEFAULT_EMAIL,
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || DEFAULT_EMAIL,

  // Email para newsletter
  newsletterEmail: process.env.NEXT_PUBLIC_NEWSLETTER_EMAIL || DEFAULT_EMAIL,

  // Email remetente (deve ser um domínio verificado no Resend)
  fromEmail: process.env.RESEND_FROM_EMAIL || "noreply@movamais.fit",

  // WhatsApp para suporte
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5511999999999", // Formato: código do país + DDD + número
  whatsappMessage:
    process.env.NEXT_PUBLIC_WHATSAPP_MESSAGE ||
    "Olá! Gostaria de saber mais sobre o Mova+.",
} as const;

/**
 * Configurações de validação de planos de treino
 */
export const TRAINING_PLAN_CONFIG = {
  /**
   * Bônus de séries por sessão para músculos primários em seu tipo de dia
   * Ex: ombro em Push pode ter até 20% mais séries que o limite padrão
   * Valor: 0.2 = 20% de bônus
   */
  PRIMARY_MUSCLE_SESSION_BONUS:
    parseFloat(process.env.PRIMARY_MUSCLE_SESSION_BONUS || "0.2") || 0.2,
} as const;
