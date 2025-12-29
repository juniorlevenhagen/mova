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
        // Verificar se usuário está autenticado
        const {
          data: { session },
        } = await supabase.auth.getSession();

        // Se usuário está autenticado, verificar se tem perfil completo
        if (session?.user) {
          const { data: profile } = await supabase
            .from("user_profiles")
            .select("user_id")
            .eq("user_id", session.user.id)
            .maybeSingle();

          // Se não tem perfil, redirecionar para step2
          if (!profile) {
            router.replace("/register/step2");
            return;
          }

          // Se tem perfil, verificar trial e permitir acesso
          if (session?.access_token) {
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

          // Usuário autenticado com perfil - permitir acesso
          setCanRender(true);
          return;
        }

        // Fluxo normal de registro - verificar localStorage
        const step2Data = localStorage.getItem("registerStep2");
        const step1Data = localStorage.getItem("registerStep1");

        if (!step2Data || !step1Data) {
          router.replace("/register/step0");
          return;
        }

        // Verificar se usuário já tem trial ativo ou já usou trial (fluxo normal)
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white via-white to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <span className="text-black/80 font-zalando">
            Verificando seu status...
          </span>
        </div>
      </div>
    );
  }

  if (!canRender) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white via-white to-gray-100">
        <span className="text-black/80 font-zalando">Carregando...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-white to-gray-100 flex items-center justify-center p-4 md:p-6 lg:p-8 relative">
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

      <div className="w-full max-w-3xl bg-white rounded-[22px] border-2 border-black shadow-xl p-6 md:p-8 lg:p-10 mt-16 md:mt-0">
        {/* Indicador de progresso */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-zalando-medium text-black">
              Mova+ Complete
            </h2>
          </div>
          <div className="flex items-center space-x-3">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-zalando-medium ${
                    step <= 3
                      ? "bg-black text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {step}
                </div>
                {step < 3 && (
                  <div
                    className={`w-14 h-1 mx-3 ${
                      step <= 3 ? "bg-black" : "bg-gray-200"
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
              <h3 className="text-3xl font-zalando-medium text-black mb-4">
                Mova+ Complete
              </h3>
              <p className="text-lg text-black/80 mb-8 font-zalando">
                Seu plano personalizado está pronto!
              </p>
            </div>

            {/* Banner de teste gratuito */}
            <div className="space-y-6">
              <h4 className="text-2xl font-zalando-medium text-black text-center">
                O que você receberá:
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
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
                  <span className="text-sm text-black/80 font-zalando">
                    Plano de treino personalizado
                  </span>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
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
                  <span className="text-sm text-black/80 font-zalando">
                    Plano alimentar completo
                  </span>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
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
                  <span className="text-sm text-black/80 font-zalando">
                    Acompanhamento com IA
                  </span>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
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
                  <span className="text-sm text-black/80 font-zalando">
                    Suporte 24/7
                  </span>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
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
                  <span className="text-sm text-black/80 font-zalando">
                    Acesso ilimitado
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-8">
              <button
                type="button"
                onClick={() => router.push("/register/step2")}
                className="flex-1 bg-white text-black py-3 px-6 rounded-lg font-zalando-medium hover:bg-gray-50 transition-colors border-2 border-black text-sm md:text-base"
              >
                Voltar
              </button>
              <ShinyButton
                onClick={handleStartTrial}
                disabled={loading}
                className="flex-1 py-3 px-6 bg-black rounded-lg text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed border-2 border-black"
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
