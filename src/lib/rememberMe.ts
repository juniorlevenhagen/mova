/**
 * Utilitário para gerenciar funcionalidade "Lembrar de Mim"
 * Pode ser usado em qualquer formulário de autenticação
 */

const REMEMBER_ME_KEY = "rememberMe";
const REMEMBERED_EMAIL_KEY = "rememberedEmail";

/**
 * Salva a preferência de "Lembrar de Mim" e o email
 */
export function saveRememberMe(email: string, rememberMe: boolean) {
  if (rememberMe) {
    localStorage.setItem(REMEMBER_ME_KEY, "true");
    localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
  } else {
    localStorage.removeItem(REMEMBER_ME_KEY);
    localStorage.removeItem(REMEMBERED_EMAIL_KEY);
  }
}

/**
 * Restaura o email salvo se "Lembrar de Mim" estava ativo
 */
export function getRememberedEmail(): string | null {
  const rememberMe = localStorage.getItem(REMEMBER_ME_KEY);
  if (rememberMe === "true") {
    return localStorage.getItem(REMEMBERED_EMAIL_KEY);
  }
  return null;
}

/**
 * Verifica se "Lembrar de Mim" estava ativo
 */
export function wasRememberMeActive(): boolean {
  return localStorage.getItem(REMEMBER_ME_KEY) === "true";
}

/**
 * Limpa os dados de "Lembrar de Mim"
 */
export function clearRememberMe() {
  localStorage.removeItem(REMEMBER_ME_KEY);
  localStorage.removeItem(REMEMBERED_EMAIL_KEY);
}
