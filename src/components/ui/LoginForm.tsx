"use client";

import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ShinyButton } from "@/components/ui/shiny-button";
import { PasswordInput } from "@/components/ui/PasswordInput";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import {
  saveRememberMe,
  getRememberedEmail,
  wasRememberMeActive,
} from "@/lib/rememberMe";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<HCaptcha>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  // Verificar se veio de reset de senha bem-sucedido e restaurar email
  useEffect(() => {
    if (searchParams?.get("passwordReset") === "success") {
      setSuccessMessage(
        "Senha redefinida com sucesso! Faça login com sua nova senha."
      );
    }
  }, [searchParams]);

  // Restaurar email salvo se "Lembrar de Mim" estava ativo
  // Este useEffect roda apenas uma vez quando o componente monta
  useEffect(() => {
    const rememberedEmail = getRememberedEmail();
    const isRememberMeActive = wasRememberMeActive();

    if (rememberedEmail && isRememberMeActive) {
      console.log("🔄 Restaurando email salvo:", rememberedEmail);
      setFormData((prev) => ({
        ...prev,
        email: rememberedEmail,
        rememberMe: true,
      }));
    }
  }, []); // Array vazio = roda apenas uma vez ao montar

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Verificar captcha antes de prosseguir
    if (!captchaToken) {
      setError("Por favor, complete a verificação de segurança");
      return;
    }

    setLoading(true);
    setError(""); // Limpar erros anteriores

    try {
      // Configurar persistência da sessão baseado em "Lembrar de Mim"
      // Se "Lembrar de Mim" estiver marcado, a sessão será persistida por mais tempo
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
        options: {
          captchaToken,
          // O Supabase já persiste a sessão por padrão usando cookies
          // Mas podemos salvar a preferência do usuário
        },
      });

      if (error) {
        // Tratar erros específicos do Supabase
        if (error.message.includes("Invalid login credentials")) {
          setError("Email ou senha incorretos. Verifique suas credenciais.");
        } else if (error.message.includes("Email not confirmed")) {
          setError("Por favor, confirme seu email antes de fazer login.");
        } else if (error.message.includes("Too many requests")) {
          setError("Muitas tentativas. Aguarde um momento e tente novamente.");
        } else if (error.message.includes("captcha")) {
          setError("Erro na verificação de segurança. Tente novamente.");
          // Resetar captcha para tentar novamente
          setCaptchaToken(null);
          captchaRef.current?.resetCaptcha();
        } else {
          setError(`Erro ao fazer login: ${error.message}`);
        }
        setLoading(false);
        return;
      }

      // ✅ Login bem-sucedido - agora salvar preferência de "Lembrar de Mim"
      saveRememberMe(formData.email, formData.rememberMe);
      console.log(
        "💾 Preferência 'Lembrar de Mim' salva:",
        formData.rememberMe ? "SIM" : "NÃO"
      );

      // Aguardar um pouco para garantir que a sessão foi salva
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Redirecionar para dashboard após login bem-sucedido
      router.push("/dashboard");
      router.refresh(); // Forçar refresh para atualizar a sessão
    } catch (error) {
      console.error("Erro no login:", error);
      setError("Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
    // Limpar erro quando o usuário começa a digitar
    if (error) setError("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Mensagem de sucesso */}
      {successMessage && (
        <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-green-600"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-800 font-medium">
                {successMessage}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Mensagem de erro */}
      {error && (
        <div className="bg-gray-100 border-2 border-black rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-black"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-black font-medium">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-bold text-black mb-2"
        >
          E-mail
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-black transition-colors ${
            error ? "border-black" : "border-gray-300"
          }`}
          placeholder="seu@email.com"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-bold text-black mb-2"
        >
          Senha
        </label>
        <PasswordInput
          id="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
          error={!!error}
          className={error ? "border-black" : "border-gray-300"}
          placeholder="Sua senha"
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="rememberMe"
            name="rememberMe"
            checked={formData.rememberMe}
            onChange={handleChange}
            className="rounded border-2 border-gray-300 text-black focus:ring-black"
          />
          <span className="ml-2 text-sm text-gray-700 font-medium">
            Lembrar de mim
          </span>
        </div>
        <Link
          href="/auth/forgot-password"
          className="text-sm text-black font-bold hover:underline"
        >
          Esqueceu a senha?
        </Link>
      </div>

      {/* Adicionar hCaptcha */}
      <div className="flex justify-center">
        <HCaptcha
          ref={captchaRef}
          sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY || ""}
          onVerify={setCaptchaToken}
          onExpire={() => setCaptchaToken(null)}
          onError={() => {
            setCaptchaToken(null);
            setError("Erro na verificação de segurança. Tente novamente.");
          }}
        />
      </div>

      <ShinyButton
        type="submit"
        disabled={loading || !captchaToken}
        className="w-full py-2.5 px-5 bg-black rounded-lg text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Entrando..." : "Entrar"}
      </ShinyButton>
    </form>
  );
}
