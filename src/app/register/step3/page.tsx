"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { ShinyButton } from "@/components/ui/shiny-button";

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

      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl p-6 md:p-8 lg:p-10 mt-16 md:mt-0">
        {/* Indicador de progresso */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-gray-800">Mova+ Complete</h2>
          </div>
          <div className="flex items-center space-x-3">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-medium ${
                    step <= 3
                      ? "bg-gray-800 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {step}
                </div>
                {step < 3 && (
                  <div
                    className={`w-14 h-1 mx-3 ${
                      step <= 3 ? "bg-gray-800" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-xl mx-auto">
          {/* Resumo do plano */}
          <div className="space-y-8">
            <div className="text-center">
              <h3 className="text-3xl font-bold text-gray-800 mb-4">
                Mova+ Complete
              </h3>
              <p className="text-lg text-gray-600 mb-8">
                Seu plano personalizado está pronto!
              </p>
            </div>

            {/* Banner de teste gratuito */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-5 mb-8">
              <div className="flex items-center justify-center space-x-4">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-white"
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
                <div className="text-center">
                  <p className="text-xl font-semibold text-green-800">
                    7 dias de teste GRATUITO
                  </p>
                  <p className="text-sm text-green-700">
                    Comece hoje e cancele a qualquer momento
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-2xl font-semibold text-gray-800 text-center">
                O que você receberá:
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
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

                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
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

                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
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

                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
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

                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
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
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-8">
              <button
                type="button"
                onClick={() => router.push("/register/step2")}
                className="flex-1 bg-transparent text-gray-600 py-3 px-6 rounded-lg font-medium hover:text-gray-800 hover:bg-gray-100 transition-colors border border-gray-300 text-sm md:text-base"
              >
                Voltar
              </button>
              <ShinyButton
                onClick={handleStartTrial}
                disabled={loading}
                className="flex-1 py-3 px-6 bg-black rounded-lg text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Redirecionando..." : "Começar Teste Grátis"}
              </ShinyButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
