"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

export default function Step3Page() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [canRender, setCanRender] = useState(false);
  const [checkingTrial, setCheckingTrial] = useState(true);

  // Proteção da rota e verificação de trial
  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const step2Data = localStorage.getItem("registerStep2");
        const step1Data = localStorage.getItem("registerStep1");

        if (!step2Data || !step1Data) {
          router.replace("/register/step0");
          return;
        }

        // Verificar se usuário já tem trial ativo ou já usou trial
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.access_token) {
          // Verificar status do trial
          const response = await fetch("/api/check-trial-status", {
            method: "GET",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          });

          if (response.ok) {
            const trialStatus = await response.json();

            // Se já tem trial ativo ou já usou trial, redirecionar para dashboard
            if (trialStatus.hasActiveTrial || trialStatus.hasUsedTrial) {
              router.replace("/dashboard");
              return;
            }
          }
        }

        setCanRender(true);
      } catch (error) {
        console.error("Erro ao verificar status:", error);
        // Em caso de erro, permitir renderização (fallback)
        setCanRender(true);
      } finally {
        setCheckingTrial(false);
      }
    };

    checkUserStatus();
  }, [router]);

  const handleStartTrial = async () => {
    setLoading(true); // ✅ Ativa loading

    try {
      // Simular delay para mostrar o loading
      await new Promise((resolve) => setTimeout(resolve, 500));

      router.push("/dashboard");
    } catch (error) {
      console.error("Erro:", error);
    } finally {
      setLoading(false); // ✅ Desativa loading
    }
  };

  // Mostrar loading enquanto verifica trial
  if (checkingTrial) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f1e8]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <span className="text-gray-600">Verificando seu status...</span>
        </div>
      </div>
    );
  }

  if (!canRender) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f1e8]">
        <span className="text-gray-600">Carregando...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f1e8] flex items-center justify-center p-4 md:p-6 lg:p-8 relative">
      {/* Logo no canto superior esquerdo */}
      <div className="absolute top-4 left-4 md:top-6 md:left-6 z-20">
        <Image
          src="/images/logo_blue.webp"
          alt="Mova+ Logo"
          width={120}
          height={40}
          className="h-5 md:h-6 w-auto drop-shadow-lg"
        />
      </div>

      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl p-4 md:p-6 lg:p-8 mt-16 md:mt-0">
        {/* Indicador de progresso */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Mova+ Complete</h2>
          </div>
          <div className="flex items-center space-x-2">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step <= 3
                      ? "bg-gray-800 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {step}
                </div>
                {step < 3 && (
                  <div
                    className={`w-12 h-1 mx-2 ${
                      step <= 3 ? "bg-gray-800" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Resumo do plano */}
          <div className="space-y-4">
            <div className="text-center lg:text-left">
              <h3 className="text-2xl font-bold text-gray-800 mb-3">
                Mova+ Complete
              </h3>
              <p className="text-lg text-gray-600 mb-4">
                Seu plano personalizado está pronto!
              </p>
            </div>

            {/* Banner de teste gratuito */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-base font-semibold text-green-800">
                    7 dias de teste GRATUITO
                  </p>
                  <p className="text-xs text-green-700">
                    Comece hoje e cancele a qualquer momento
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-base font-semibold text-gray-800">
                O que você receberá:
              </h4>

              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-700">
                    Plano de treino personalizado
                  </span>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-700">
                    Plano alimentar completo
                  </span>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-700">
                    Acompanhamento com IA
                  </span>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-700">Suporte 24/7</span>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-700">
                    Acesso ilimitado
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-center">
                  <p className="text-xs text-gray-600">
                    Após 7 dias de teste gratuito
                  </p>
                  <p className="text-2xl font-bold text-gray-800">R$ 29,90</p>
                  <p className="text-xs text-gray-600">por mês</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Cancele a qualquer momento
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Área de pagamento */}
          <div className="space-y-4">
            <h4 className="text-base font-semibold text-gray-800">
              Informações de pagamento
            </h4>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
              <p className="text-xs text-blue-800">
                <strong>Importante:</strong> Seu cartão não será cobrado durante
                os 7 dias de teste. Após esse período, será cobrado R$ 29,90
                mensais. Você pode cancelar a qualquer momento.
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h5 className="font-semibold text-gray-800">
                    Pagamento Seguro
                  </h5>
                  <p className="text-sm text-gray-600">
                    Processado pela Stripe com criptografia de ponta
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                type="button"
                onClick={() => router.push("/register/step2")}
                className="flex-1 bg-transparent text-gray-600 py-2.5 px-4 rounded-lg font-medium hover:text-gray-800 hover:bg-gray-100 transition-colors border border-gray-300 text-sm md:text-base"
              >
                Voltar
              </button>
              <button
                onClick={handleStartTrial}
                disabled={loading}
                className="flex-1 bg-gray-800 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-gray-900 transition-colors text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Redirecionando..." : "Começar Teste Grátis"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
