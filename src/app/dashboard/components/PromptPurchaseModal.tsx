"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { PixPaymentModal } from "./PixPaymentModal";

interface PromptPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PromptPurchaseModal({
  isOpen,
  onClose,
}: PromptPurchaseModalProps) {
  const [loading, setLoading] = useState<string | null>(null); // 'single' | 'triple' | 'pro' | null
  const [selectedType, setSelectedType] = useState<
    "single" | "triple" | "pro" | null
  >(null);
  const [showPaymentMethod, setShowPaymentMethod] = useState(false);
  const [showPixModal, setShowPixModal] = useState(false);

  const handlePurchase = async (type: "single" | "triple" | "pro") => {
    setSelectedType(type);
    setShowPaymentMethod(true);
  };

  const handlePaymentMethod = async (method: "card" | "pix") => {
    if (method === "card") {
      await handleCardPayment();
    } else {
      setShowPixModal(true);
      setShowPaymentMethod(false);
    }
  };

  const handleCardPayment = async () => {
    if (!selectedType) return;

    try {
      setLoading(selectedType);

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
          type:
            selectedType === "single"
              ? "prompt_single"
              : selectedType === "triple"
                ? "prompt_triple"
                : "prompt_pro_5",
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMessage = data.error || "Erro ao criar sessão de checkout";
        console.error("Erro na resposta da API:", errorMessage, data);
        throw new Error(errorMessage);
      }

      if (!data.url) {
        console.error("URL não encontrada na resposta:", data);
        throw new Error("URL de checkout não disponível");
      }

      // Redirecionar para Stripe Checkout
      window.location.href = data.url;
    } catch (error) {
      console.error("Erro ao iniciar checkout:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido";
      alert(`Erro ao processar pagamento: ${errorMessage}. Tente novamente.`);
      setLoading(null);
      setShowPaymentMethod(false);
      setSelectedType(null);
    }
  };

  const handlePixSuccess = () => {
    // Recarregar a página ou atualizar estado
    window.location.reload();
  };

  const handleBack = () => {
    setShowPaymentMethod(false);
    setSelectedType(null);
  };

  useEffect(() => {
    if (isOpen) {
      // Salvar a posição atual do scroll
      const scrollY = window.scrollY;

      // Bloquear scroll do body
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";

      return () => {
        // Restaurar scroll do body
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        document.body.style.overflow = "";
        window.scrollTo(0, scrollY);
        // Resetar estado ao fechar
        setShowPaymentMethod(false);
        setSelectedType(null);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Modal de seleção de método de pagamento
  if (showPaymentMethod && selectedType) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative">
          <button
            onClick={handleBack}
            className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Voltar"
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

          <h3 className="text-2xl font-semibold text-gray-900 mb-6">
            Escolha a forma de pagamento
          </h3>

          <div className="space-y-4">
            <button
              onClick={() => handlePaymentMethod("card")}
              disabled={loading !== null}
              className="w-full px-6 py-4 border-2 border-gray-200 rounded-lg hover:border-black transition-all duration-200 flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">
                    Cartão de Crédito/Débito
                  </p>
                  <p className="text-sm text-gray-600">Aprovação instantânea</p>
                </div>
              </div>
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>

            <button
              onClick={() => handlePaymentMethod("pix")}
              disabled={loading !== null}
              className="w-full px-6 py-4 border-2 border-gray-200 rounded-lg hover:border-black transition-all duration-200 flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">PIX</p>
                  <p className="text-sm text-gray-600">Aprovação instantânea</p>
                </div>
              </div>
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={handleBack}
              className="text-gray-600 hover:text-gray-800 text-sm font-medium transition-colors"
            >
              Voltar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-6xl w-full p-6 md:p-8 max-h-[90vh] overflow-y-auto relative">
        <div className="mb-4 md:mb-6 pr-8">
          <h3 className="text-xl md:text-2xl font-semibold text-gray-900">
            Comprar Créditos
          </h3>
        </div>
        {/* Botão X no canto superior direito */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Fechar"
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

        <p className="text-gray-600 mb-4 md:mb-6 text-center text-sm md:text-base">
          Escolha quantos créditos você precisa para gerar seus planos
          personalizados
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6">
          {/* Plano Básico - 1 Prompt */}
          <div className="rounded-xl border-2 border-gray-200 p-4 md:p-6 hover:border-black transition-colors duration-200 flex flex-col">
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

            <h3 className="text-lg md:text-xl font-bold text-black mb-3 md:mb-4">
              Plano Básico
            </h3>

            <div className="mb-3 md:mb-4">
              <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                <span className="text-xs md:text-sm text-gray-400 line-through">
                  R$ 99,90
                </span>
                <span className="bg-black text-white px-2 py-1 rounded text-xs font-bold">
                  50% OFF
                </span>
              </div>
              <div className="flex items-baseline flex-wrap">
                <span className="text-3xl md:text-4xl font-bold text-black">
                  R$ 49,90
                </span>
                <span className="text-gray-600 text-xs md:text-sm ml-2">
                  por crédito
                </span>
              </div>
            </div>

            <div className="border-t border-gray-200 my-4"></div>

            <ul className="space-y-1.5 md:space-y-2 mb-4 md:mb-6 flex-grow">
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
                <span className="text-gray-700 font-medium text-sm md:text-base">
                  1 crédito para gerar plano personalizado
                </span>
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
                <span className="text-gray-700 text-sm md:text-base">
                  Acesso ao dashboard completo
                </span>
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
                <span className="text-gray-700 text-sm md:text-base">
                  Acompanhamento de evolução
                </span>
              </li>
            </ul>

            <button
              onClick={() => handlePurchase("single")}
              disabled={loading !== null}
              className="w-full px-3 md:px-4 py-2.5 md:py-3 bg-black text-white rounded-lg text-sm md:text-base font-medium hover:bg-gray-900 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed mt-auto"
            >
              {loading === "single" ? "Processando..." : "Comprar 1 Crédito"}
            </button>
          </div>

          {/* Pacote Premium - 3 Prompts */}
          <div className="rounded-xl border-2 border-gray-200 p-4 md:p-6 hover:border-black transition-colors duration-200 flex flex-col">
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

            <h3 className="text-lg md:text-xl font-bold text-black mb-3 md:mb-4">
              Pacote Premium
            </h3>

            <div className="mb-3 md:mb-4">
              <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                <span className="text-xs md:text-sm text-gray-400 line-through">
                  R$ 299,70
                </span>
                <span className="bg-black text-white px-2 py-1 rounded text-xs font-bold">
                  60% OFF
                </span>
              </div>
              <div className="flex items-baseline flex-wrap">
                <span className="text-3xl md:text-4xl font-bold text-black">
                  R$ 119,90
                </span>
                <span className="text-gray-600 text-xs md:text-sm ml-2">
                  pacote
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Economia de R$ 29,80 (R$ 39,97 por crédito)
              </p>
            </div>

            <div className="border-t border-gray-300 my-4"></div>

            <ul className="space-y-1.5 md:space-y-2 mb-4 md:mb-6 flex-grow">
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
                <span className="text-gray-700 font-medium text-sm md:text-base">
                  3 créditos para gerar planos personalizados
                </span>
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
                <span className="text-gray-700 text-sm md:text-base">
                  Acesso ao dashboard completo
                </span>
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
                <span className="text-gray-700 text-sm md:text-base">
                  Acompanhamento de evolução
                </span>
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
                <span className="text-gray-700">
                  Intervalo de 24h entre gerações
                </span>
              </li>
            </ul>

            <button
              onClick={() => handlePurchase("triple")}
              disabled={loading !== null}
              className="w-full px-3 md:px-4 py-2.5 md:py-3 bg-black text-white rounded-lg text-sm md:text-base font-medium hover:bg-gray-900 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed mt-auto"
            >
              {loading === "triple"
                ? "Processando..."
                : "Comprar Pacote Premium"}
            </button>
          </div>

          {/* Pacote Pro - 5 Prompts */}
          <div className="rounded-xl border-2 border-black p-4 md:p-6 bg-gray-50 relative flex flex-col">
            {/* Badge Mais Popular */}
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-black text-white px-3 md:px-4 py-1 rounded-full text-xs font-bold">
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

            <h3 className="text-xl font-bold text-black mb-4">Pacote Pro</h3>

            <div className="mb-4">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-sm text-gray-400 line-through">
                  R$ 499,50
                </span>
                <span className="bg-black text-white px-2 py-1 rounded text-xs font-bold">
                  64% OFF
                </span>
              </div>
              <div className="flex items-baseline">
                <span className="text-4xl font-bold text-black">R$ 179,90</span>
                <span className="text-gray-600 text-sm ml-2">pacote</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Economia de R$ 69,60 (R$ 35,98 por crédito)
              </p>
            </div>

            <div className="border-t border-gray-300 my-4"></div>

            <ul className="space-y-1.5 md:space-y-2 mb-4 md:mb-6 flex-grow">
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
                <span className="text-gray-700 font-medium text-sm md:text-base">
                  5 créditos para gerar planos personalizados
                </span>
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
                <span className="text-gray-700 text-sm md:text-base">
                  Acesso ao dashboard completo
                </span>
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
                <span className="text-gray-700 text-sm md:text-base">
                  Acompanhamento de evolução
                </span>
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
                <span className="text-gray-700 font-medium text-sm md:text-base">
                  Use quando quiser (sem cooldown)
                </span>
              </li>
            </ul>

            <button
              onClick={() => handlePurchase("pro")}
              disabled={loading !== null}
              className="w-full px-3 md:px-4 py-2.5 md:py-3 bg-black text-white rounded-lg text-sm md:text-base font-medium hover:bg-gray-900 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed mt-auto"
            >
              {loading === "pro" ? "Processando..." : "Comprar Pacote Pro"}
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
      {showPixModal && selectedType && (
        <PixPaymentModal
          isOpen={showPixModal}
          onClose={() => {
            setShowPixModal(false);
            onClose();
          }}
          purchaseType={selectedType}
          onPaymentSuccess={handlePixSuccess}
        />
      )}
    </div>
  );
}
