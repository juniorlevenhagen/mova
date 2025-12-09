"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { PersonalizedPlanModal } from "./PersonalizedPlanModal";
import { PersonalizedPlan } from "@/types/personalized-plan";
import jsPDF from "jspdf";

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
  const [selectedPlan, setSelectedPlan] = useState<PersonalizedPlan | null>(
    null
  );
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

  // Extrair peso histórico do plan_data (metadata salva no momento da geração)
  const getHistoricalWeight = (planData: PersonalizedPlan): number | null => {
    // @ts-expect-error - metadata pode não estar tipado
    return planData?.metadata?.weightAtGeneration || null;
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

  const exportToPDF = async (plan: PlanHistoryItem) => {
    try {
      // Buscar informações adicionais do usuário
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data: userData } = await supabase
        .from("users")
        .select("full_name")
        .eq("id", user?.id)
        .maybeSingle();

      // Buscar avaliação mais recente
      const { data: evaluation } = await supabase
        .from("user_evaluations")
        .select("created_at")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Calcular idade
      let idade = "Não informado";
      if (userProfile?.birthDate) {
        const birthDate = new Date(userProfile.birthDate);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (
          monthDiff < 0 ||
          (monthDiff === 0 && today.getDate() < birthDate.getDate())
        ) {
          age--;
        }
        idade = `${age} anos`;
      }

      // Formatar data da avaliação
      let dataAvaliacao = "Não informado";
      if (evaluation?.created_at) {
        dataAvaliacao = new Date(evaluation.created_at).toLocaleDateString(
          "pt-BR",
          {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          }
        );
      }

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      let yPosition = margin;
      const lineHeight = 7;
      const maxWidth = pageWidth - 2 * margin;

      // Função auxiliar para adicionar texto com quebra de linha
      const addText = (
        text: string,
        fontSize: number = 10,
        isBold: boolean = false,
        color: string = "#000000"
      ) => {
        doc.setFontSize(fontSize);
        doc.setFont("helvetica", isBold ? "bold" : "normal");
        doc.setTextColor(color);

        // Quebrar texto em linhas que cabem na largura da página
        const words = text.split(" ");
        const lines: string[] = [];
        let currentLine = "";

        words.forEach((word) => {
          const testLine = currentLine + (currentLine ? " " : "") + word;
          const testWidth = doc.getTextWidth(testLine);

          if (testWidth > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        });
        if (currentLine) {
          lines.push(currentLine);
        }

        // Verificar se precisa de nova página
        if (yPosition + lines.length * lineHeight > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }

        // Adicionar linhas ao PDF
        lines.forEach((line: string) => {
          doc.text(line, margin, yPosition);
          yPosition += lineHeight;
        });
        yPosition += 2; // Espaço entre parágrafos
      };

      // Cabeçalho
      doc.setFillColor(59, 130, 246); // Azul
      doc.rect(0, 0, pageWidth, 50, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("Plano Personalizado", margin, 25);

      // Informações do usuário no cabeçalho
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      const userName =
        userData?.full_name || user?.user_metadata?.full_name || "Usuário";
      doc.text(`Nome: ${userName}`, margin, 35);
      doc.text(`Idade: ${idade}`, margin + 80, 35);
      doc.text(`Data da Avaliação: ${dataAvaliacao}`, margin, 42);
      const objetivo =
        plan.summary.objective || userProfile?.objetivo || "Não informado";
      doc.text(`Objetivo: ${objetivo}`, margin + 80, 42);

      yPosition = 60;
      doc.setTextColor(0, 0, 0);

      // Informações do plano
      addText(`Gerado em: ${formatDate(plan.generatedAt)}`, 10);
      addText(
        `Tipo: ${plan.planType === "complete" ? "Completo" : plan.planType}`,
        10
      );
      if (plan.isActive) {
        addText("Status: Ativo", 10, true, "#10b981");
      }
      yPosition += 5;

      // Análise
      if (plan.planData.analysis) {
        doc.setFillColor(59, 130, 246);
        doc.rect(margin, yPosition - 5, maxWidth, 8, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("ANÁLISE", margin + 5, yPosition);
        yPosition += 10;
        doc.setTextColor(0, 0, 0);

        if (plan.planData.analysis.currentStatus) {
          addText("Status Atual:", 11, true);
          addText(plan.planData.analysis.currentStatus, 10);
        }

        if (
          plan.planData.analysis.strengths &&
          plan.planData.analysis.strengths.length > 0
        ) {
          addText("Pontos Fortes:", 11, true);
          plan.planData.analysis.strengths.forEach((strength) => {
            addText(`• ${strength}`, 10);
          });
        }

        if (
          plan.planData.analysis.improvements &&
          plan.planData.analysis.improvements.length > 0
        ) {
          addText("Áreas de Melhoria:", 11, true);
          plan.planData.analysis.improvements.forEach((improvement) => {
            addText(`• ${improvement}`, 10);
          });
        }
        yPosition += 5;
      }

      // Plano de Treino
      if (plan.planData.trainingPlan) {
        doc.setFillColor(34, 197, 94);
        doc.rect(margin, yPosition - 5, maxWidth, 8, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("PLANO DE TREINO", margin + 5, yPosition);
        yPosition += 10;
        doc.setTextColor(0, 0, 0);

        if (plan.planData.trainingPlan.overview) {
          addText("Visão Geral:", 11, true);
          addText(plan.planData.trainingPlan.overview, 10);
        }

        if (
          plan.planData.trainingPlan.weeklySchedule &&
          plan.planData.trainingPlan.weeklySchedule.length > 0
        ) {
          addText("Cronograma Semanal:", 11, true);
          plan.planData.trainingPlan.weeklySchedule.forEach((day) => {
            addText(`${day.day} - ${day.type}`, 10, true);
            if (day.exercises && day.exercises.length > 0) {
              day.exercises.forEach((exercise) => {
                addText(
                  `  • ${exercise.name} - ${exercise.sets} séries x ${exercise.reps} reps`,
                  9
                );
                if (exercise.rest) {
                  addText(`    Descanso: ${exercise.rest}`, 9);
                }
              });
            }
            yPosition += 2;
          });
        }

        if (plan.planData.trainingPlan.progression) {
          addText("Progressão:", 11, true);
          addText(plan.planData.trainingPlan.progression, 10);
        }
        yPosition += 5;
      }

      // Plano Nutricional
      if (plan.planData.nutritionPlan) {
        doc.setFillColor(249, 115, 22);
        doc.rect(margin, yPosition - 5, maxWidth, 8, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("PLANO NUTRICIONAL", margin + 5, yPosition);
        yPosition += 10;
        doc.setTextColor(0, 0, 0);

        if (plan.planData.nutritionPlan.dailyCalories) {
          addText(
            `Calorias Diárias: ${plan.planData.nutritionPlan.dailyCalories} kcal`,
            11,
            true
          );
        }

        if (plan.planData.nutritionPlan.macros) {
          addText("Macronutrientes:", 11, true);
          if (plan.planData.nutritionPlan.macros.protein) {
            addText(
              `Proteínas: ${plan.planData.nutritionPlan.macros.protein}`,
              10
            );
          }
          if (plan.planData.nutritionPlan.macros.carbs) {
            addText(
              `Carboidratos: ${plan.planData.nutritionPlan.macros.carbs}`,
              10
            );
          }
          if (plan.planData.nutritionPlan.macros.fats) {
            addText(`Gorduras: ${plan.planData.nutritionPlan.macros.fats}`, 10);
          }
        }

        if (
          plan.planData.nutritionPlan.mealPlan &&
          plan.planData.nutritionPlan.mealPlan.length > 0
        ) {
          addText("Plano Alimentar:", 11, true);
          plan.planData.nutritionPlan.mealPlan.forEach((meal) => {
            addText(`${meal.meal} - ${meal.timing}`, 10, true);
            if (meal.options && meal.options.length > 0) {
              meal.options.forEach((option) => {
                const caloriesText = option.calories
                  ? ` (${option.calories} kcal)`
                  : "";
                addText(
                  `  • ${option.food} - ${option.quantity}${caloriesText}`,
                  9
                );
              });
            }
            yPosition += 2;
          });
        }

        if (plan.planData.nutritionPlan.hydration) {
          addText("Hidratação:", 11, true);
          addText(plan.planData.nutritionPlan.hydration, 10);
        }
        yPosition += 5;
      }

      // Metas
      if (plan.planData.goals) {
        doc.setFillColor(139, 92, 246);
        doc.rect(margin, yPosition - 5, maxWidth, 8, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("METAS E OBJETIVOS", margin + 5, yPosition);
        yPosition += 10;
        doc.setTextColor(0, 0, 0);

        if (
          plan.planData.goals.weekly &&
          plan.planData.goals.weekly.length > 0
        ) {
          addText("Metas Semanais:", 11, true);
          plan.planData.goals.weekly.forEach((goal) => {
            addText(`• ${goal}`, 10);
          });
        }

        if (
          plan.planData.goals.monthly &&
          plan.planData.goals.monthly.length > 0
        ) {
          addText("Metas Mensais:", 11, true);
          plan.planData.goals.monthly.forEach((goal) => {
            addText(`• ${goal}`, 10);
          });
        }
        yPosition += 5;
      }

      // Motivação
      if (plan.planData.motivation) {
        doc.setFillColor(236, 72, 153);
        doc.rect(margin, yPosition - 5, maxWidth, 8, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("MOTIVAÇÃO", margin + 5, yPosition);
        yPosition += 10;
        doc.setTextColor(0, 0, 0);

        if (plan.planData.motivation.personalMessage) {
          addText(plan.planData.motivation.personalMessage, 10, true);
        }

        if (
          plan.planData.motivation.tips &&
          plan.planData.motivation.tips.length > 0
        ) {
          addText("Dicas:", 11, true);
          plan.planData.motivation.tips.forEach((tip) => {
            addText(`• ${tip}`, 10);
          });
        }
      }

      // Rodapé
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Página ${i} de ${totalPages} - Mova+`,
          pageWidth - margin,
          pageHeight - 10,
          { align: "right" }
        );
      }

      // Salvar PDF
      const fileName = `Plano_${formatDate(plan.generatedAt).replace(/[\/\s:]/g, "_")}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Erro ao gerar PDF. Por favor, tente novamente.");
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

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="relative p-4 sm:p-6 border-b border-gray-200 pr-12 sm:pr-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              Histórico de Planos
            </h2>
            {/* Botão X no canto superior direito */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 sm:right-6 text-gray-400 hover:text-gray-600 transition-colors"
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
          </div>

          {/* Content */}
          <div
            className="flex-1 overflow-y-auto p-4 sm:p-6"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "#94a3b8 #f1f5f9",
            }}
          >
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
                    className={`border rounded-lg p-3 sm:p-4 transition-all hover:shadow-md ${
                      plan.isActive
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-3 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900 break-words">
                            Plano{" "}
                            {plan.planType === "complete"
                              ? "Completo"
                              : plan.planType}
                          </h3>
                          {plan.isActive && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 flex-shrink-0">
                              Ativo
                            </span>
                          )}
                        </div>

                        <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 break-words">
                          Gerado em: {formatDate(plan.generatedAt)}
                        </p>

                        {plan.summary.objective && (
                          <p className="text-xs sm:text-sm text-gray-700 mb-2 sm:mb-3 break-words">
                            <span className="font-medium">Objetivo:</span>{" "}
                            {plan.summary.objective}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-2 mb-2 sm:mb-3">
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

                      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:ml-4">
                        <button
                          onClick={() => handleViewPlan(plan)}
                          className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 shadow-md hover:shadow-lg text-xs sm:text-sm font-medium whitespace-nowrap w-full sm:w-auto"
                        >
                          Ver Plano
                        </button>
                        <button
                          onClick={() => exportToPDF(plan)}
                          className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-lg hover:from-gray-800 hover:to-gray-900 transition-all duration-200 shadow-md hover:shadow-lg text-xs sm:text-sm font-medium whitespace-nowrap flex items-center justify-center gap-2 w-full sm:w-auto"
                          title="Exportar para PDF"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          PDF
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-3 sm:p-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 shadow-md hover:shadow-lg text-xs sm:text-sm font-medium whitespace-nowrap w-full sm:w-auto"
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
          userProfile={
            userProfile
              ? {
                  ...userProfile,
                  // ✅ Usar peso histórico se disponível, senão usar peso atual
                  peso: getHistoricalWeight(selectedPlan) ?? userProfile.peso,
                }
              : undefined
          }
        />
      )}
    </>
  );
}
