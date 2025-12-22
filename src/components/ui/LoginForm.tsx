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

    // Verificar erros do OAuth
    const oauthError = searchParams?.get("error");
    if (oauthError) {
      if (oauthError === "oauth_error") {
        setError("Erro ao fazer login com Google. Tente novamente.");
      } else if (oauthError === "exchange_error") {
        setError("Erro ao processar autenticação. Tente novamente.");
      } else if (oauthError === "unexpected_error") {
        setError("Erro inesperado. Tente novamente.");
      }
      // Limpar o parâmetro da URL
      router.replace("/auth/login");
    }
  }, [searchParams, router]);

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

  const handleOAuthLogin = async (provider: "google" | "azure") => {
    setLoading(true);
    setError("");

    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            // Personalizar o nome que aparece na tela do Google
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (oauthError) {
        console.error(`Erro ao fazer login com ${provider}:`, oauthError);
        const providerName = provider === "google" ? "Google" : "Azure";
        setError(`Erro ao fazer login com ${providerName}. Tente novamente.`);
        setLoading(false);
      }
      // Se não houver erro, o usuário será redirecionado automaticamente
    } catch (error) {
      console.error(`Erro inesperado no login com ${provider}:`, error);
      setError("Erro inesperado. Tente novamente.");
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => handleOAuthLogin("google");
  const handleAzureLogin = () => handleOAuthLogin("azure");

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

      {/* Botões de Login OAuth */}
      <div className="space-y-3">
        {/* Google */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 border-2 border-gray-300 rounded-lg hover:border-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span className="font-medium text-gray-700">
            {loading ? "Carregando..." : "Continuar com Google"}
          </span>
        </button>

        {/* Azure */}
        <button
          type="button"
          onClick={handleAzureLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 border-2 border-gray-300 rounded-lg hover:border-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#0078D4">
            <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z" />
          </svg>
          <span className="font-medium text-gray-700">
            {loading ? "Carregando..." : "Continuar com Azure"}
          </span>
        </button>
      </div>

      {/* Divisor */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-gray-50 text-gray-700 font-medium">ou</span>
        </div>
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
