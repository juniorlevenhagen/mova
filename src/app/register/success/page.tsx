"use client";

import { useRouter } from "next/navigation";
import { LogoBlue } from "@/components/ui/LogoBlue";

export default function SuccessPage() {
  const router = useRouter();

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
            Seu período de teste gratuito de 7 dias foi ativado.
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
