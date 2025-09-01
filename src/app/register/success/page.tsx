"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LogoBlue } from "@/components/ui/LogoBlue";
import { supabase } from "@/lib/supabase";

export default function SuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (sessionId) {
      // Tentar fazer login automático com os dados do localStorage
      const step1Data = localStorage.getItem("registerStep1");
      if (step1Data) {
        const { email, password } = JSON.parse(step1Data);

        const autoLogin = async () => {
          try {
            const { error } = await supabase.auth.signInWithPassword({
              email,
              password,
            });

            if (error) {
              console.error("Erro no login automático:", error);
              setError("Erro no login automático");
              setLoading(false);
            } else {
              // Limpar dados temporários
              localStorage.removeItem("registerStep1");
              localStorage.removeItem("registerStep2");
              localStorage.removeItem("registerStep3");

              // Redirecionar para dashboard
              router.push("/dashboard");
            }
          } catch (err) {
            console.error("Erro no login automático:", err);
            setError("Erro no login automático");
            setLoading(false);
          }
        };

        autoLogin();
      } else {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [router, searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f1e8] flex items-center justify-center p-4">
        <div className="absolute top-4 left-4 md:top-6 md:left-6">
          <LogoBlue />
        </div>

        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 md:p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="animate-spin h-8 w-8 text-blue-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-800 mb-2">
              Fazendo login automático...
            </h1>
            <p className="text-gray-600">Redirecionando para o dashboard</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f5f1e8] flex items-center justify-center p-4">
        <div className="absolute top-4 left-4 md:top-6 md:left-6">
          <LogoBlue />
        </div>

        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 md:p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-800 mb-2">
              Erro no login automático
            </h1>
            <p className="text-gray-600 mb-6">Faça login manualmente</p>
          </div>

          <button
            onClick={() => router.push("/auth/login")}
            className="w-full bg-gray-800 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-900 transition-colors"
          >
            Fazer Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f1e8] flex items-center justify-center p-4">
      <div className="absolute top-4 left-4 md:top-6 md:left-6">
        <LogoBlue />
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 md:p-8 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Conta criada com sucesso!
          </h1>
          <p className="text-gray-600 mb-6">
            Seu período de teste gratuito de 7 dias foi ativado
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-800 mb-2">
              O que você receberá:
            </h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Plano de treino personalizado</li>
              <li>• Plano alimentar completo</li>
              <li>• Acompanhamento com IA</li>
              <li>• Suporte 24/7</li>
            </ul>
          </div>

          <button
            onClick={() => router.push("/auth/login")}
            className="w-full bg-gray-800 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-900 transition-colors"
          >
            Fazer Login
          </button>

          <button
            onClick={() => router.push("/")}
            className="w-full bg-transparent text-gray-600 py-2 px-6 rounded-lg font-medium hover:text-gray-800 hover:bg-gray-100 transition-colors border border-gray-300"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    </div>
  );
}
