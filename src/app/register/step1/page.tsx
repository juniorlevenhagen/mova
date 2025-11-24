"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogoBlue } from "@/components/ui/LogoBlue";
import { supabase } from "@/lib/supabase";
import { useStep1Form } from "@/hooks/useFormValidation";
import { FormError } from "@/components/ui/FormError";
import { Step1Data } from "@/lib/validation";
import HCaptcha from "@hcaptcha/react-hcaptcha";

export default function Step1Page() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<HCaptcha>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useStep1Form();

  const onSubmit = async (data: Step1Data) => {
    // Remover logs
    // console.log("🔍 Debug captcha:", { ... });

    if (!captchaToken) {
      setError("Por favor, complete a verificação de segurança");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Remover logs
      // console.log("🚀 Iniciando signUp com captcha token:", ...);

      let authData, authError;
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          // Remover logs
          // console.log(`🔄 Tentativa ${retryCount + 1}/${maxRetries} de signUp`);

          const result = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
            options: {
              captchaToken,
              data: {
                full_name: data.name,
              },
            },
          });

          // Remover logs
          // console.log("📊 Resultado do signUp:", { ... });

          authData = result.data;
          authError = result.error;

          if (!authError || !authError.message.includes("500")) {
            break;
          }

          retryCount++;
          if (retryCount < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, 2000));
          }
        } catch (networkError) {
          // Manter apenas erro crítico
          console.error("Erro de rede:", networkError);
          retryCount++;
          if (retryCount < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, 2000));
          } else {
            authError = {
              message: "Erro de conectividade com o servidor. Tente novamente.",
            };
          }
        }
      }

      if (authError) {
        // Remover logs detalhados
        // console.error("❌ Erro de autenticação:", authError);

        // Tratar erros específicos do Supabase
        if (authError.message.includes("User already registered")) {
          setError(
            "Este email já está cadastrado. Tente fazer login ou use outro email."
          );
        } else if (authError.message.includes("Password should be at least")) {
          setError("A senha deve ter pelo menos 6 caracteres.");
        } else if (authError.message.includes("Invalid email")) {
          setError("Por favor, insira um email válido.");
        } else if (authError.message.includes("Email rate limit exceeded")) {
          setError("Muitas tentativas. Aguarde um momento e tente novamente.");
        } else if (authError.message.includes("captcha protection")) {
          // Remover logs
          // console.error("🚨 Erro de captcha:", authError.message);
          setError("Erro de verificação de segurança. Tente novamente.");
        } else if (
          authError.message.includes("500") ||
          authError.message.includes("Internal Server Error")
        ) {
          setError(
            "⚠️ Servidor temporariamente indisponível. Tente novamente em alguns minutos."
          );
        } else if (authError.message.includes("conectividade")) {
          setError(
            "⚠️ Problema de conexão. Verifique sua internet e tente novamente."
          );
        } else {
          setError(`Erro ao criar conta: ${authError.message}`);
        }
        return;
      }

      // 2. Verificar se temos dados do usuário
      if (!authData?.user?.id) {
        setError("Erro ao obter dados do usuário após criação da conta.");
        return;
      }

      // 3. Salvar dados adicionais na tabela users usando função segura

      // Usar função RPC para inserção segura
      const { data: insertResult, error: userError } = await supabase.rpc(
        "insert_user_safe",
        {
          user_id: authData.user.id,
          user_email: data.email,
          user_full_name: data.name,
        }
      );

      if (userError) {
        console.error("❌ Erro detalhado ao salvar dados do usuário:", {
          message: userError.message,
          details: userError.details,
          hint: userError.hint,
          code: userError.code,
        });

        // Mensagens de erro mais específicas
        if (
          userError.message.includes("permission denied") ||
          userError.message.includes("RLS")
        ) {
          setError(
            "Erro de permissão no banco de dados. Entre em contato com o suporte."
          );
        } else if (userError.message.includes("does not exist")) {
          setError(
            "Tabela de usuários não encontrada. Entre em contato com o suporte."
          );
        } else if (userError.message.includes("duplicate key")) {
          setError("Este usuário já existe. Tente fazer login.");
        } else if (
          userError.message.includes("406") ||
          userError.message.includes("Not Acceptable") ||
          userError.message.includes("PGRST116")
        ) {
          setError(
            "Erro de configuração do banco de dados. Tente novamente em alguns instantes."
          );
        } else if (
          userError.message.includes("function") ||
          userError.message.includes("insert_user_safe")
        ) {
          setError(
            "Erro na configuração do sistema. Tente novamente ou entre em contato com o suporte."
          );
        } else {
          setError(
            `Conta criada, mas houve um problema ao salvar seus dados: ${userError.message}`
          );
        }
        return;
      }

      // Verificar se a função RPC retornou sucesso
      if (insertResult && insertResult.length > 0 && !insertResult[0].success) {
        console.error("❌ Função RPC retornou erro:", insertResult[0]);
        setError(
          `Erro ao salvar dados: ${
            insertResult[0].error || "Erro desconhecido"
          }`
        );
        return;
      }

      // 4. Salvar dados temporários no localStorage para os próximos steps
      localStorage.setItem("registerStep1", JSON.stringify(data));

      router.push("/register/step2");
    } catch (error) {
      console.error("Erro no cadastro:", error);
      setError("Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-white to-gray-100 flex items-center justify-center p-4 relative">
      <LogoBlue />

      <div className="w-full max-w-md bg-white rounded-[22px] border-2 border-black shadow-xl p-8">
        {/* Indicador de progresso */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-zalando-medium text-black">
              Cadastro simples
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-zalando-medium ${
                    step === 1
                      ? "bg-black text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {step}
                </div>
                {step < 3 && (
                  <div
                    className={`w-12 h-1 mx-2 ${
                      step === 1 ? "bg-black" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Mensagem de erro */}
        {error && (
          <div className="mb-6 bg-red-50 border-2 border-red-500 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-600"
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
                <p className="text-sm text-red-800 font-zalando">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-zalando-medium text-black mb-2"
            >
              Nome completo *
            </label>
            <input
              {...register("name")}
              type="text"
              id="name"
              name="name"
              className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-colors font-zalando ${
                errors.name ? "border-red-500" : "border-black"
              }`}
              placeholder="Seu nome completo"
            />
            <FormError error={errors.name?.message} />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-zalando-medium text-black mb-2"
            >
              E-mail *
            </label>
            <input
              {...register("email")}
              type="email"
              id="email"
              name="email"
              className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-colors font-zalando ${
                errors.email ? "border-red-500" : "border-black"
              }`}
              placeholder="seu@email.com"
            />
            <FormError error={errors.email?.message} />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-zalando-medium text-black mb-2"
            >
              Senha *
            </label>
            <input
              {...register("password")}
              type="password"
              id="password"
              name="password"
              className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-colors font-zalando ${
                errors.password ? "border-red-500" : "border-black"
              }`}
              placeholder="Mínimo 8 caracteres"
            />
            <FormError error={errors.password?.message} />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-zalando-medium text-black mb-2"
            >
              Confirmar senha *
            </label>
            <input
              {...register("confirmPassword")}
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-colors font-zalando ${
                errors.confirmPassword ? "border-red-500" : "border-black"
              }`}
              placeholder="Digite a senha novamente"
            />
            <FormError error={errors.confirmPassword?.message} />
          </div>

          <div className="flex items-start">
            <input
              type="checkbox"
              id="acceptTerms"
              name="acceptTerms"
              checked={true} // This will be handled by Zod
              onChange={() => {}} // This will be handled by Zod
              required
              className="mt-1 rounded border-2 border-black text-black focus:ring-black"
            />
            <label
              htmlFor="acceptTerms"
              className="ml-2 text-sm text-black/80 font-zalando"
            >
              Aceito os{" "}
              <Link
                href="/termos-de-uso"
                className="text-black hover:underline font-zalando-medium"
              >
                termos de uso
              </Link>{" "}
              e{" "}
              <Link
                href="/politica-de-privacidade"
                className="text-black hover:underline font-zalando-medium"
              >
                política de privacidade
              </Link>
            </label>
          </div>

          {/* Adicionar hCaptcha */}
          <div className="flex justify-center">
            <HCaptcha
              ref={captchaRef}
              sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY!}
              onVerify={setCaptchaToken}
              onExpire={() => setCaptchaToken(null)}
              onError={() => setCaptchaToken(null)}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !isValid || !captchaToken}
            className="w-full bg-black text-white py-2.5 px-6 rounded-lg font-zalando-medium text-base md:text-lg hover:bg-black/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-2 border-black"
          >
            {loading ? "Criando conta..." : "Continuar Personalização"}
          </button>
        </form>
      </div>
    </div>
  );
}
