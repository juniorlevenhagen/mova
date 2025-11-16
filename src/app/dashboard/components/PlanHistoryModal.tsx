"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { PersonalizedPlanModal } from "./PersonalizedPlanModal";
import { PersonalizedPlan } from "@/types/personalized-plan";

interface PlanHistoryItem {
  id: string;
  planData: PersonalizedPlan;
  planType: string;
  generatedAt: string;
  expiresAt: string;
  isActive: boolean;
  summary: {
    hasTrainingPlan: boolean;
    hasNutritionPlan: boolean;
    hasAnalysis: boolean;
    objective: string | null;
  };
}

interface PlanHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile?: {
    altura: number;
    peso: number;
    pesoInicial: number;
    sexo: string;
    frequenciaTreinos: string;
    objetivo: string;
    birthDate: string | null;
    nivelAtividade: string;
  };
}

export function PlanHistoryModal({
  isOpen,
  onClose,
  userProfile,
}: PlanHistoryModalProps) {
  const [plans, setPlans] = useState<PlanHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PersonalizedPlan | null>(null);
  const [showPlanModal, setShowPlanModal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchPlanHistory();
    } else {
      // Limpar dados ao fechar
      setPlans([]);
      setError(null);
      setSelectedPlan(null);
    }
  }, [isOpen]);

  const fetchPlanHistory = async () => {
    setLoading(true);
    setError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setError("Não autenticado");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/user-plans-history", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao buscar histórico");
      }

      if (result.success) {
        setPlans(result.plans || []);
      } else {
        throw new Error("Erro ao buscar histórico de planos");
      }
    } catch (err) {
      console.error("❌ Erro ao buscar histórico:", err);
      setError(
        err instanceof Error ? err.message : "Erro ao carregar histórico"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleViewPlan = (plan: PlanHistoryItem) => {
    setSelectedPlan(plan.planData);
    setShowPlanModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">
              Histórico de Planos
            </h2>
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

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-800 text-sm">{error}</p>
                <button
                  onClick={fetchPlanHistory}
                  className="mt-2 text-red-600 hover:text-red-800 text-sm font-medium underline"
                >
                  Tentar novamente
                </button>
              </div>
            )}

            {!loading && !error && plans.length === 0 && (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p className="mt-4 text-gray-500">
                  Nenhum plano encontrado no histórico
                </p>
              </div>
            )}

            {!loading && !error && plans.length > 0 && (
              <div className="space-y-4">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`border rounded-lg p-4 transition-all hover:shadow-md ${
                      plan.isActive
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Plano {plan.planType === "complete" ? "Completo" : plan.planType}
                          </h3>
                          {plan.isActive && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Ativo
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-gray-600 mb-3">
                          Gerado em: {formatDate(plan.generatedAt)}
                        </p>

                        {plan.summary.objective && (
                          <p className="text-sm text-gray-700 mb-3">
                            <span className="font-medium">Objetivo:</span>{" "}
                            {plan.summary.objective}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-2 mb-3">
                          {plan.summary.hasTrainingPlan && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                              Treino
                            </span>
                          )}
                          {plan.summary.hasNutritionPlan && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800">
                              Nutrição
                            </span>
                          )}
                          {plan.summary.hasAnalysis && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              Análise
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleViewPlan(plan)}
                        className="ml-4 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 shadow-md hover:shadow-lg text-sm font-medium whitespace-nowrap"
                      >
                        Ver Plano
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 shadow-md hover:shadow-lg text-sm font-medium whitespace-nowrap"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>

      {/* Modal de visualização do plano */}
      {selectedPlan && (
        <PersonalizedPlanModal
          isOpen={showPlanModal}
          onClose={() => {
            setShowPlanModal(false);
            setSelectedPlan(null);
          }}
          plan={selectedPlan}
          userProfile={userProfile}
        />
      )}
    </>
  );
}

