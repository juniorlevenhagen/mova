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
} as const;
