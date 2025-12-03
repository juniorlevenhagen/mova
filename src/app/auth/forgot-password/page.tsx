"use client";

import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { ShinyButton } from "@/components/ui/shiny-button";
import HCaptcha from "@hcaptcha/react-hcaptcha";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<HCaptcha>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Verificar captcha antes de prosseguir
    if (!captchaToken) {
      setError("Por favor, complete a verificação de segurança");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      // Solicitar reset de senha via Supabase
      // IMPORTANTE: A URL deve ser a URL completa e estar configurada no Supabase
      const redirectUrl = `${window.location.origin}/auth/reset-password`;
      console.log("Solicitando reset com redirectTo:", redirectUrl);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
        captchaToken,
      });

      if (error) {
        // Tratar erros específicos
        if (error.message.includes("captcha")) {
          setError("Erro na verificação de segurança. Tente novamente.");
          setCaptchaToken(null);
          captchaRef.current?.resetCaptcha();
          setLoading(false);
          return;
        }
        // Não revelar se o email existe ou não por segurança
        // Sempre mostrar mensagem de sucesso para outros erros
        console.error("Erro ao solicitar reset:", error);
      }

      // Sempre mostrar sucesso (por segurança, não revelar se email existe)
      setSuccess(true);
    } catch (error) {
      console.error("Erro inesperado:", error);
      setError("Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-[22px] border-2 border-black shadow-2xl p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-zalando-medium text-black mb-2">
          Recuperar Senha
        </h1>
        <p className="text-gray-700">
          Digite seu email e enviaremos um link para redefinir sua senha
        </p>
      </div>

      {success ? (
        <div className="space-y-6">
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
                  Se o email {email} estiver cadastrado, você receberá um link
                  para redefinir sua senha em alguns instantes.
                </p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/auth/login"
              className="text-black font-bold hover:underline"
            >
              Voltar para o login
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black transition-colors"
              placeholder="seu@email.com"
            />
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
            className="w-full py-3 px-4 bg-black rounded-lg text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Enviando..." : "Enviar link de recuperação"}
          </ShinyButton>

          <div className="text-center">
            <Link
              href="/auth/login"
              className="text-sm text-black font-bold hover:underline"
            >
              Voltar para o login
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
