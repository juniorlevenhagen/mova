"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LogoBlue } from "@/components/ui/LogoBlue";
import { supabase } from "@/lib/supabase";

function SuccessPageContent() {
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
                className="h-8 w-8 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-800 mb-2">
              Erro no login automático
            </h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.push("/auth/login")}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Fazer login manualmente
            </button>
          </div>
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
              className="h-8 w-8 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-800 mb-2">
            Conta criada com sucesso!
          </h1>
          <p className="text-gray-600 mb-6">
            Sua conta foi criada e você já pode começar a usar o Mova+.
          </p>
          <button
            onClick={() => router.push("/auth/login")}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Fazer login
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
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
              Carregando...
            </h1>
            <p className="text-gray-600">Aguarde um momento</p>
          </div>
        </div>
      </div>
    }>
      <SuccessPageContent />
    </Suspense>
  );
}
