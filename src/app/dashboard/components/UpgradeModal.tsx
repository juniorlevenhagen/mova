"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  isPremium?: boolean;
}

export function UpgradeModal({
  isOpen,
  onClose,
  isPremium = false,
}: UpgradeModalProps) {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    try {
      setLoading(true);

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
    } finally {
      setLoading(false);
    }
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
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // ✅ Modal diferente para usuários premium
  if (isPremium) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative">
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
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg
                className="h-6 w-6 text-green-600"
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

            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Plano Premium Ativo
            </h3>

            <p className="text-gray-600 mb-6">
              Você já é um usuário premium! Aproveite todos os benefícios do seu
              plano.
            </p>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="text-left">
                <h4 className="font-medium text-green-900 mb-2">
                  Seus benefícios ativos:
                </h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• 2 planos personalizados por mês</li>
                  <li>• Acompanhamento avançado de evolução</li>
                  <li>• Suporte prioritário</li>
                  <li>• Acesso a novas funcionalidades</li>
                </ul>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Modal original para usuários não premium
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative">
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
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
            <svg
              className="h-6 w-6 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Upgrade para Premium
          </h3>

          <p className="text-gray-600 mb-6">
            Desbloqueie todo o potencial do Mova+ com nosso plano premium
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-blue-900">
                  2 Planos Personalizados por Mês
                </h4>
                <p className="text-sm text-blue-700">
                  Gere novos planos conforme sua evolução
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg
                  className="w-5 h-5 text-green-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-green-900">
                  Acompanhamento Avançado
                </h4>
                <p className="text-sm text-green-700">
                  Métricas detalhadas e insights personalizados
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg
                  className="w-5 h-5 text-purple-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-purple-900">
                  Suporte Prioritário
                </h4>
                <p className="text-sm text-purple-700">
                  Respostas rápidas e atendimento especializado
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mb-6">
          <div className="text-3xl font-bold text-gray-900 mb-1">R$ 29,90</div>
          <div className="text-gray-600">por mês</div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Redirecionando..." : "Fazer Upgrade"}
          </button>
        </div>
      </div>
    </div>
  );
}
