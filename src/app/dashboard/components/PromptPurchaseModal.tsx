"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface PromptPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PromptPurchaseModal({
  isOpen,
  onClose,
}: PromptPurchaseModalProps) {
  const [loading, setLoading] = useState<string | null>(null); // 'single' | 'triple' | null

  const handlePurchase = async (type: "single" | "triple") => {
    try {
      setLoading(type);

      // Obter token de autenticação
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Usuário não autenticado");
      }

      // Criar sessão de checkout
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          type: type === "single" ? "prompt_single" : "prompt_triple",
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao criar sessão de checkout");
      }

      const { url } = await response.json();

      // Redirecionar para Stripe Checkout
      window.location.href = url;
    } catch (error) {
      console.error("Erro ao iniciar checkout:", error);
      alert("Erro ao processar pagamento. Tente novamente.");
      setLoading(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-semibold text-gray-900">
            Comprar Prompts
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="w-6 h-6"
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
          </button>
        </div>

        <p className="text-gray-600 mb-6 text-center">
          Escolha quantos prompts você precisa para gerar seus planos
          personalizados
        </p>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Plano Básico - 1 Prompt */}
          <div className="rounded-xl border-2 border-gray-200 p-6 hover:border-black transition-colors duration-200 flex flex-col">
            <div className="flex justify-end mb-4">
              <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center">
                <svg
                  className="w-7 h-7 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
                </svg>
              </div>
            </div>

            <h3 className="text-xl font-bold text-black mb-4">
              Plano Básico
            </h3>

            <div className="mb-4">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-sm text-gray-400 line-through">
                  R$ 35,90
                </span>
                <span className="bg-black text-white px-2 py-1 rounded text-xs font-bold">
                  50% OFF
                </span>
              </div>
              <div className="flex items-baseline">
                <span className="text-4xl font-bold text-black">R$ 17,99</span>
                <span className="text-gray-600 text-sm ml-2">por prompt</span>
              </div>
            </div>

            <div className="border-t border-gray-200 my-4"></div>

            <ul className="space-y-2 mb-6 flex-grow">
              <li className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-black flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-gray-700">1 prompt para gerar plano personalizado</span>
              </li>
              <li className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-black flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-gray-700">Acesso ao dashboard completo</span>
              </li>
              <li className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-black flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-gray-700">Acompanhamento de evolução</span>
              </li>
            </ul>

            <button
              onClick={() => handlePurchase("single")}
              disabled={loading !== null}
              className="w-full px-4 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-auto"
            >
              {loading === "single" ? "Processando..." : "Comprar 1 Prompt"}
            </button>
          </div>

          {/* Pacote Premium - 3 Prompts */}
          <div className="rounded-xl border-2 border-black p-6 bg-gray-50 relative flex flex-col">
            {/* Badge Mais Popular */}
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-black text-white px-4 py-1 rounded-full text-xs font-bold">
                Mais Popular
              </span>
            </div>

            <div className="flex justify-end mb-4">
              <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center">
                <svg
                  className="w-7 h-7 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
                </svg>
              </div>
            </div>

            <h3 className="text-xl font-bold text-black mb-4">
              Pacote Premium
            </h3>

            <div className="mb-4">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-sm text-gray-400 line-through">
                  R$ 79,90
                </span>
                <span className="bg-black text-white px-2 py-1 rounded text-xs font-bold">
                  50% OFF
                </span>
              </div>
              <div className="flex items-baseline">
                <span className="text-4xl font-bold text-black">R$ 39,99</span>
                <span className="text-gray-600 text-sm ml-2">pacote</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Economia de R$ 13,98 (R$ 13,33 por prompt)
              </p>
            </div>

            <div className="border-t border-gray-300 my-4"></div>

            <ul className="space-y-2 mb-6 flex-grow">
              <li className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-black flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-gray-700 font-medium">3 prompts para gerar planos personalizados</span>
              </li>
              <li className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-black flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-gray-700">Acesso ao dashboard completo</span>
              </li>
              <li className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-black flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-gray-700">Acompanhamento de evolução</span>
              </li>
              <li className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-black flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-gray-700">Suporte prioritário</span>
              </li>
            </ul>

            <button
              onClick={() => handlePurchase("triple")}
              disabled={loading !== null}
              className="w-full px-4 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-auto"
            >
              {loading === "triple" ? "Processando..." : "Comprar Pacote (3 Prompts)"}
            </button>
          </div>
        </div>

        <div className="text-center mt-6">
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800 text-sm font-medium transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

