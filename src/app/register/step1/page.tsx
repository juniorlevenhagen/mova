"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
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
    if (!captchaToken) {
      setError("Por favor, complete a verificação de segurança");
      return;
    }

    setLoading(true);
    setError(""); // Limpar erros anteriores

    try {
      // 1. Criar usuário no Supabase Auth (com retry logic)
      let authData, authError;
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          const result = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
            options: {
              captchaToken, // Adicionar token do captcha
              data: {
                full_name: data.name,
              },
            },
          });

          authData = result.data;
          authError = result.error;

          // Se não houve erro de conectividade, sair do loop
          if (!authError || !authError.message.includes("500")) {
            break;
          }

          retryCount++;
          if (retryCount < maxRetries) {
            console.log(
              `🔄 Tentativa ${retryCount + 1}/${maxRetries} em 2 segundos...`
            );
            await new Promise((resolve) => setTimeout(resolve, 2000));
          }
        } catch (networkError) {
          console.error(
            `❌ Erro de rede na tentativa ${retryCount + 1}:`,
            networkError
          );
          retryCount++;
          if (retryCount < maxRetries) {
            console.log(
              `🔄 Tentativa ${retryCount + 1}/${maxRetries} em 2 segundos...`
            );
            await new Promise((resolve) => setTimeout(resolve, 2000));
          } else {
            authError = {
              message: "Erro de conectividade com o servidor. Tente novamente.",
            };
          }
        }
      }

      if (authError) {
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
    <div className="min-h-screen bg-[#f5f1e8] flex items-center justify-center p-4 relative">
      <LogoBlue />

      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        {/* Indicador de progresso */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800">
              Cadastro simples
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step === 1
                      ? "bg-gray-800 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {step}
                </div>
                {step < 3 && (
                  <div
                    className={`w-12 h-1 mx-2 ${
                      step === 1 ? "bg-gray-800" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Mensagem de erro */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
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
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Nome completo *
            </label>
            <input
              {...register("name")}
              type="text"
              id="name"
              name="name"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-colors ${
                errors.name ? "border-red-300" : "border-gray-300"
              }`}
              placeholder="Seu nome completo"
            />
            <FormError error={errors.name?.message} />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              E-mail *
            </label>
            <input
              {...register("email")}
              type="email"
              id="email"
              name="email"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-colors ${
                errors.email ? "border-red-300" : "border-gray-300"
              }`}
              placeholder="seu@email.com"
            />
            <FormError error={errors.email?.message} />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Senha *
            </label>
            <input
              {...register("password")}
              type="password"
              id="password"
              name="password"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-colors ${
                errors.password ? "border-red-300" : "border-gray-300"
              }`}
              placeholder="Mínimo 8 caracteres"
            />
            <FormError error={errors.password?.message} />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Confirmar senha *
            </label>
            <input
              {...register("confirmPassword")}
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-colors ${
                errors.confirmPassword ? "border-red-300" : "border-gray-300"
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
              className="mt-1 rounded border-gray-300 text-gray-800 focus:ring-gray-800"
            />
            <label htmlFor="acceptTerms" className="ml-2 text-sm text-gray-600">
              Aceito os{" "}
              <a href="#" className="text-gray-800 hover:underline">
                termos de uso
              </a>{" "}
              e{" "}
              <a href="#" className="text-gray-800 hover:underline">
                política de privacidade
              </a>
            </label>
          </div>

          {/* Adicionar hCaptcha */}
          <div className="flex justify-center">
            <HCaptcha
              ref={captchaRef}
              sitekey="d2a4e6d6-43ea-4bf4-8218-3f1cc672e172"
              onVerify={setCaptchaToken}
              onExpire={() => setCaptchaToken(null)}
              onError={() => setCaptchaToken(null)}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !isValid || !captchaToken}
            className="w-full bg-gray-800 text-white py-2.5 px-6 rounded-lg font-semibold text-base md:text-lg hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Criando conta..." : "Continuar Personalização"}
          </button>
        </form>
      </div>
    </div>
  );
}
