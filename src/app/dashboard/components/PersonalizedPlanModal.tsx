"use client";

import { useState, useEffect, useCallback } from "react";
import { typography, components, colors } from "@/lib/design-tokens";
import { PersonalizedPlan } from "@/types/personalized-plan";

interface PersonalizedPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: PersonalizedPlan | null;
  profileData?: {
    altura: number;
    peso: number;
    objetivo: string;
    frequenciaTreinos: string;
    birthDate?: string | null;
    nivelAtividade?: string;
  };
}

export function PersonalizedPlanModal({
  isOpen,
  onClose,
  plan,
  profileData,
}: PersonalizedPlanModalProps) {
  const [activeTab, setActiveTab] = useState<
    "analysis" | "training" | "diet" | "nutrition" | "goals" | "motivation"
  >("analysis");
  const [generatedNutritionPlan, setGeneratedNutritionPlan] = useState<
    PersonalizedPlan["nutritionPlan"] | null
  >(null);
  const [isGeneratingNutrition, setIsGeneratingNutrition] = useState(false);
  const [nutritionError, setNutritionError] = useState<string | null>(null);

  // Campos opcionais do plano (incluindo o gerado dinamicamente)
  const hasOptionalFields = {
    nutritionPlan: !!plan?.nutritionPlan || !!generatedNutritionPlan,
    goals: !!plan?.goals,
    motivation: !!plan?.motivation,
  };

  // Nutrition plan a ser exibido (do plano original ou gerado)
  const displayNutritionPlan = plan?.nutritionPlan || generatedNutritionPlan;

  console.log("📊 Campos opcionais presentes:", hasOptionalFields);
  console.log(
    "🔍 Plan object keys:",
    plan ? Object.keys(plan) : "plan is null"
  );
  console.log("🔍 nutritionPlan exists?", !!plan?.nutritionPlan);
  if (plan?.nutritionPlan) {
    console.log("🔍 nutritionPlan structure:", {
      hasDailyCalories: !!plan.nutritionPlan.dailyCalories,
      hasMacros: !!plan.nutritionPlan.macros,
      hasMealPlan: !!plan.nutritionPlan.mealPlan,
      hasHydration: !!plan.nutritionPlan.hydration,
    });
  }

  // Gerar plano nutricional quando a aba Dieta for aberta e não houver nutritionPlan
  const generateNutritionPlan = useCallback(async () => {
    if (!profileData) {
      setNutritionError("Dados do perfil não disponíveis");
      return;
    }

    setIsGeneratingNutrition(true);
    setNutritionError(null);

    try {
      // Calcular IMC
      const heightInMeters = (profileData.altura || 0) / 100;
      const weight = profileData.peso || 0;
      const imc =
        heightInMeters > 0 ? weight / (heightInMeters * heightInMeters) : 0;

      const userData = {
        objective: profileData.objetivo || "Não informado",
        weight: weight,
        height: profileData.altura || 0,
        imc: imc.toFixed(2),
        trainingFrequency: profileData.frequenciaTreinos || "Não informado",
        dietaryRestrictions: "Nenhuma", // Pode ser expandido depois
      };

      const response = await fetch("/api/generate-nutrition-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userData,
          existingPlan: plan,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao gerar plano nutricional");
      }

      const result = await response.json();

      if (result.success && result.nutritionPlan) {
        setGeneratedNutritionPlan(result.nutritionPlan);
        console.log("✅ Plano nutricional gerado com sucesso!");
      } else {
        throw new Error("Plano nutricional não foi gerado");
      }
    } catch (error: unknown) {
      console.error("❌ Erro ao gerar plano nutricional:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erro ao gerar plano nutricional. Tente novamente.";
      setNutritionError(errorMessage);
    } finally {
      setIsGeneratingNutrition(false);
    }
  }, [profileData, plan]);

  useEffect(() => {
    if (
      activeTab === "diet" &&
      !plan?.nutritionPlan &&
      !generatedNutritionPlan &&
      !isGeneratingNutrition &&
      profileData
    ) {
      generateNutritionPlan();
    }
  }, [
    activeTab,
    plan?.nutritionPlan,
    generatedNutritionPlan,
    isGeneratingNutrition,
    profileData,
    generateNutritionPlan,
  ]);

  // Resetar activeTab se a tab atual não existir mais
  useEffect(() => {
    if (!isOpen || !plan) return;

    const availableTabs = [
      "analysis",
      "training",
      "diet", // Sempre disponível
      ...(hasOptionalFields.nutritionPlan ? ["nutrition"] : []),
      ...(hasOptionalFields.goals ? ["goals"] : []),
      ...(hasOptionalFields.motivation ? ["motivation"] : []),
    ];
    if (!availableTabs.includes(activeTab)) {
      setActiveTab("analysis");
    }
  }, [
    isOpen,
    plan,
    hasOptionalFields.nutritionPlan,
    hasOptionalFields.goals,
    hasOptionalFields.motivation,
    activeTab,
  ]);

  if (!isOpen || !plan) return null;

  // Verificações de segurança para evitar erros
  // Apenas analysis e trainingPlan são obrigatórios agora
  const missingFields: string[] = [];
  if (!plan.analysis) missingFields.push("analysis");
  if (!plan.trainingPlan) missingFields.push("trainingPlan");

  console.log("📊 Campos opcionais presentes:", hasOptionalFields);

  if (missingFields.length > 0) {
    console.error("❌ Plano incompleto. Campos faltando:", missingFields);
    console.error("📄 Plano completo:", JSON.stringify(plan, null, 2));

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
          <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.93L13.732 4.242a2 2 0 00-3.464 0L3.34 16.07c-.77 1.263.192 2.93 1.732 2.93z"
                  />
                </svg>
              </div>
              <div className="mt-3 sm:mt-5">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Erro no Plano
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    O plano gerado está incompleto. Campos faltando:{" "}
                    {missingFields.join(", ")}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Tente gerar um novo plano. Se o problema persistir, entre em
                    contato com o suporte.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-5 sm:mt-6">
              <button
                type="button"
                className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
                onClick={onClose}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "analysis", label: "Análise" },
    { id: "training", label: "Treino" },
    { id: "diet", label: "Dieta" },
    ...(hasOptionalFields.nutritionPlan
      ? [{ id: "nutrition", label: "Plano Nutricional (IA)" }]
      : []),
    ...(hasOptionalFields.goals ? [{ id: "goals", label: "Metas" }] : []),
    ...(hasOptionalFields.motivation
      ? [{ id: "motivation", label: "Motivação" }]
      : []),
  ];

  // Garantir que activeTab seja válido (se a tab atual não existir, usar "analysis")
  const validActiveTab = tabs.some((tab) => tab.id === activeTab)
    ? activeTab
    : "analysis";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

        <div
          className={`${components.card.base} inline-block align-bottom text-left overflow-hidden transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full max-h-[90vh]`}
        >
          {/* Header */}
          <div className="bg-gray-800 px-6 py-4 text-white">
            <div className="flex items-center justify-between">
              <h3 className={`${typography.heading.h2} text-white`}>
                Seu Plano Personalizado
              </h3>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors"
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

            {/* Tabs */}
            <div className="flex space-x-1 mt-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() =>
                    setActiveTab(
                      tab.id as
                        | "analysis"
                        | "training"
                        | "diet"
                        | "nutrition"
                        | "goals"
                        | "motivation"
                    )
                  }
                  className={`${components.button.base} ${
                    components.button.sizes.sm
                  } ${
                    validActiveTab === tab.id
                      ? "bg-white text-gray-800"
                      : "bg-gray-700 text-white hover:bg-gray-600"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[70vh] overflow-y-auto">
            {/* Análise */}
            {validActiveTab === "analysis" && (
              <div className="space-y-6">
                <div
                  className={`${colors.status.info.bg} ${colors.status.info.border} border rounded-lg p-4`}
                >
                  <h4
                    className={`${typography.heading.h4} ${colors.status.info.text} mb-2`}
                  >
                    Status Atual
                  </h4>
                  <p className={`${colors.status.info.text}`}>
                    {plan.analysis?.currentStatus || "Status não disponível"}
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div
                    className={`${colors.status.success.bg} ${colors.status.success.border} border rounded-lg p-4`}
                  >
                    <h4
                      className={`${typography.heading.h4} ${colors.status.success.text} mb-3`}
                    >
                      Pontos Fortes
                    </h4>
                    <ul className="space-y-2">
                      {(plan.analysis?.strengths || []).map(
                        (strength, index) => (
                          <li key={index} className="flex items-start">
                            <span
                              className={`${colors.status.success.accent} mr-2`}
                            >
                              •
                            </span>
                            <span className={`${colors.status.success.text}`}>
                              {strength}
                            </span>
                          </li>
                        )
                      )}
                    </ul>
                  </div>

                  <div
                    className={`${colors.status.warning.bg} ${colors.status.warning.border} border rounded-lg p-4`}
                  >
                    <h4
                      className={`${typography.heading.h4} ${colors.status.warning.text} mb-3`}
                    >
                      Áreas de Melhoria
                    </h4>
                    <ul className="space-y-2">
                      {(plan.analysis?.improvements || []).map(
                        (improvement, index) => (
                          <li key={index} className="flex items-start">
                            <span
                              className={`${colors.status.warning.accent} mr-2`}
                            >
                              •
                            </span>
                            <span className={`${colors.status.warning.text}`}>
                              {improvement}
                            </span>
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                </div>

                {plan.analysis?.specialConsiderations &&
                  plan.analysis.specialConsiderations.length > 0 && (
                    <div
                      className={`${colors.status.warning.bg} ${colors.status.warning.border} border rounded-lg p-4`}
                    >
                      <h4
                        className={`${typography.heading.h4} ${colors.status.warning.text} mb-3`}
                      >
                        Considerações Especiais
                      </h4>
                      <ul className="space-y-2">
                        {plan.analysis.specialConsiderations.map(
                          (consideration, index) => (
                            <li key={index} className="flex items-start">
                              <span
                                className={`${colors.status.warning.accent} mr-2`}
                              >
                                •
                              </span>
                              <span className={`${colors.status.warning.text}`}>
                                {consideration}
                              </span>
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}
              </div>
            )}

            {/* Treino */}
            {validActiveTab === "training" && (
              <div className="space-y-6">
                <div
                  className={`${colors.status.info.bg} ${colors.status.info.border} border rounded-lg p-4`}
                >
                  <h4
                    className={`${typography.heading.h4} ${colors.status.info.text} mb-2`}
                  >
                    Visão Geral do Treino
                  </h4>
                  <p className={`${colors.status.info.text}`}>
                    {plan.trainingPlan?.overview ||
                      "Visão geral não disponível"}
                  </p>
                </div>

                <div className="space-y-4">
                  <h4
                    className={`${typography.heading.h4} ${colors.text.primary}`}
                  >
                    Cronograma Semanal
                  </h4>
                  {(plan.trainingPlan?.weeklySchedule || []).map(
                    (day, dayIndex) => (
                      <div
                        key={dayIndex}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-center mb-3">
                          <h5 className="font-semibold text-lg text-gray-900">
                            {day?.day || "Dia não especificado"}
                          </h5>
                          <span className="ml-3 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                            {day?.type || "Tipo não especificado"}
                          </span>
                        </div>

                        <div className="space-y-3">
                          {(day.exercises || []).map(
                            (exercise, exerciseIndex) => (
                              <div
                                key={exerciseIndex}
                                className="bg-gray-50 border border-gray-100 rounded p-3"
                              >
                                <div className="flex flex-wrap items-center gap-4">
                                  <h6 className="font-medium text-gray-900 flex-1">
                                    {exercise?.name ||
                                      "Exercício não especificado"}
                                  </h6>
                                  <span className="text-sm text-gray-600">
                                    Séries: {exercise?.sets || "N/A"}
                                  </span>
                                  <span className="text-sm text-gray-600">
                                    Reps: {exercise?.reps || "N/A"}
                                  </span>
                                  <span className="text-sm text-gray-600">
                                    Descanso: {exercise?.rest || "N/A"}
                                  </span>
                                </div>
                                {exercise.notes && (
                                  <p className="text-sm text-gray-600 mt-2">
                                    Nota: {exercise.notes}
                                  </p>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )
                  )}
                </div>

                <div
                  className={`${colors.status.success.bg} ${colors.status.success.border} border rounded-lg p-4`}
                >
                  <h4
                    className={`${typography.heading.h4} ${colors.status.success.text} mb-2`}
                  >
                    Progressão
                  </h4>
                  <p className={`${colors.status.success.text}`}>
                    {plan.trainingPlan?.progression ||
                      "Progressão não disponível"}
                  </p>
                </div>
              </div>
            )}

            {/* Dieta */}
            {validActiveTab === "diet" && (
              <div className="space-y-6">
                {isGeneratingNutrition ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-4"></div>
                      <p className="text-blue-800">
                        Gerando plano nutricional personalizado...
                      </p>
                    </div>
                  </div>
                ) : nutritionError ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <h4 className="text-xl font-semibold text-red-900 mb-4">
                      ⚠️ Erro ao Gerar Plano Nutricional
                    </h4>
                    <p className="text-red-800 mb-4">{nutritionError}</p>
                    <button
                      onClick={generateNutritionPlan}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Tentar Novamente
                    </button>
                  </div>
                ) : displayNutritionPlan ? (
                  <>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div
                        className={`${colors.status.success.bg} ${colors.status.success.border} border rounded-lg p-4`}
                      >
                        <h4
                          className={`${typography.heading.h4} ${colors.status.success.text} mb-3`}
                        >
                          Calorias Diárias
                        </h4>
                        <p
                          className={`text-2xl font-bold ${colors.status.success.text}`}
                        >
                          {displayNutritionPlan?.dailyCalories || 0} kcal
                        </p>
                      </div>

                      <div
                        className={`${colors.status.info.bg} ${colors.status.info.border} border rounded-lg p-4`}
                      >
                        <h4
                          className={`${typography.heading.h4} ${colors.status.info.text} mb-3`}
                        >
                          Macronutrientes
                        </h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className={`${colors.status.info.text}`}>
                              Proteínas:
                            </span>
                            <span
                              className={`font-medium ${colors.status.info.text}`}
                            >
                              {displayNutritionPlan?.macros?.protein || "N/A"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className={`${colors.status.info.text}`}>
                              Carboidratos:
                            </span>
                            <span
                              className={`font-medium ${colors.status.info.text}`}
                            >
                              {displayNutritionPlan?.macros?.carbs || "N/A"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className={`${colors.status.info.text}`}>
                              Gorduras:
                            </span>
                            <span
                              className={`font-medium ${colors.status.info.text}`}
                            >
                              {displayNutritionPlan?.macros?.fats || "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4
                        className={`${typography.heading.h4} ${colors.text.primary} mb-4`}
                      >
                        Plano Alimentar
                      </h4>
                      <div className="space-y-4">
                        {(displayNutritionPlan?.mealPlan || []).map(
                          (meal, index) => (
                            <div
                              key={index}
                              className="border border-gray-200 rounded-lg p-4"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <h5 className="font-semibold text-gray-900">
                                  {meal?.meal || "Refeição não especificada"}
                                </h5>
                                <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                  {meal?.timing || "Horário não especificado"}
                                </span>
                              </div>
                              <div className="space-y-2">
                                {(meal.options || []).map(
                                  (option, optionIndex) => (
                                    <div
                                      key={optionIndex}
                                      className="flex items-start"
                                    >
                                      <span className="text-green-600 mr-2">
                                        •
                                      </span>
                                      <span className="text-gray-900">
                                        {option?.food ||
                                          "Alimento não especificado"}{" "}
                                        -{" "}
                                        {option?.quantity ||
                                          "Quantidade não especificada"}{" "}
                                        ({option?.calories || 0} kcal)
                                      </span>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    {displayNutritionPlan?.hydration && (
                      <div
                        className={`${colors.status.info.bg} ${colors.status.info.border} border rounded-lg p-4`}
                      >
                        <h4
                          className={`${typography.heading.h4} ${colors.status.info.text} mb-2`}
                        >
                          Hidratação
                        </h4>
                        <p className={`${colors.status.info.text}`}>
                          {displayNutritionPlan.hydration}
                        </p>
                      </div>
                    )}

                    {displayNutritionPlan?.supplements &&
                      displayNutritionPlan.supplements.length > 0 && (
                        <div
                          className={`${colors.status.warning.bg} ${colors.status.warning.border} border rounded-lg p-4`}
                        >
                          <h4
                            className={`${typography.heading.h4} ${colors.status.warning.text} mb-2`}
                          >
                            Suplementos Recomendados
                          </h4>
                          <ul className="space-y-1">
                            {displayNutritionPlan.supplements.map(
                              (supplement, index) => (
                                <li
                                  key={index}
                                  className={`${colors.status.warning.text}`}
                                >
                                  • {supplement}
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}
                  </>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <h4 className="text-xl font-semibold text-yellow-900 mb-4">
                      ⚠️ Plano Nutricional em Geração
                    </h4>
                    <p className="text-yellow-800 mb-4">
                      O plano nutricional personalizado está sendo gerado pela
                      inteligência artificial. Por favor, aguarde alguns
                      instantes ou tente gerar um novo plano.
                    </p>
                    <p className="text-sm text-yellow-700">
                      O plano nutricional incluirá:
                    </p>
                    <ul className="list-disc list-inside text-sm text-yellow-700 mt-2 space-y-1">
                      <li>Calorias diárias recomendadas</li>
                      <li>Distribuição de macronutrientes</li>
                      <li>Plano alimentar detalhado com quantidades</li>
                      <li>Orientações de hidratação</li>
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Dieta (IA) */}
            {validActiveTab === "nutrition" && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div
                    className={`${colors.status.success.bg} ${colors.status.success.border} border rounded-lg p-4`}
                  >
                    <h4
                      className={`${typography.heading.h4} ${colors.status.success.text} mb-3`}
                    >
                      Calorias Diárias
                    </h4>
                    <p
                      className={`text-2xl font-bold ${colors.status.success.text}`}
                    >
                      {plan.nutritionPlan?.dailyCalories || 0} kcal
                    </p>
                  </div>

                  <div
                    className={`${colors.status.info.bg} ${colors.status.info.border} border rounded-lg p-4`}
                  >
                    <h4
                      className={`${typography.heading.h4} ${colors.status.info.text} mb-3`}
                    >
                      Macronutrientes
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className={`${colors.status.info.text}`}>
                          Proteínas:
                        </span>
                        <span
                          className={`font-medium ${colors.status.info.text}`}
                        >
                          {plan.nutritionPlan?.macros?.protein || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={`${colors.status.info.text}`}>
                          Carboidratos:
                        </span>
                        <span
                          className={`font-medium ${colors.status.info.text}`}
                        >
                          {plan.nutritionPlan?.macros?.carbs || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={`${colors.status.info.text}`}>
                          Gorduras:
                        </span>
                        <span
                          className={`font-medium ${colors.status.info.text}`}
                        >
                          {plan.nutritionPlan?.macros?.fats || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4
                    className={`${typography.heading.h4} ${colors.text.primary} mb-4`}
                  >
                    Plano Alimentar
                  </h4>
                  <div className="space-y-4">
                    {(plan.nutritionPlan?.mealPlan || []).map((meal, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-semibold text-gray-900">
                            {meal?.meal || "Refeição não especificada"}
                          </h5>
                          <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                            {meal?.timing || "Horário não especificado"}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {(meal.options || []).map((option, optionIndex) => (
                            <div key={optionIndex} className="flex items-start">
                              <span className="text-green-600 mr-2">•</span>
                              <span className="text-gray-900">
                                {option?.food || "Alimento não especificado"} -{" "}
                                {option?.quantity ||
                                  "Quantidade não especificada"}{" "}
                                ({option?.calories || 0} kcal)
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {plan.nutritionPlan?.supplements &&
                    plan.nutritionPlan.supplements.length > 0 && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <h4
                          className={`${typography.heading.h4} ${colors.status.info.text} mb-3`}
                        >
                          Suplementação
                        </h4>
                        <ul className="space-y-1">
                          {plan.nutritionPlan.supplements.map(
                            (supplement, index) => (
                              <li key={index} className="flex items-start">
                                <span className="text-purple-600 mr-2">•</span>
                                <span className="text-purple-800">
                                  {supplement}
                                </span>
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}

                  <div
                    className={`${colors.status.info.bg} ${colors.status.info.border} border rounded-lg p-4`}
                  >
                    <h4
                      className={`${typography.heading.h4} ${colors.status.info.text} mb-3`}
                    >
                      Hidratação
                    </h4>
                    <p className={`${colors.status.info.text}`}>
                      {plan.nutritionPlan?.hydration ||
                        "Recomendação de hidratação não disponível"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Metas */}
            {validActiveTab === "goals" && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4
                      className={`${typography.heading.h4} ${colors.status.success.text} mb-3`}
                    >
                      Metas Semanais
                    </h4>
                    <ul className="space-y-2">
                      {(plan.goals?.weekly || []).map((goal, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-green-600 mr-2">•</span>
                          <span className="text-green-800">{goal}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4
                      className={`${typography.heading.h4} ${colors.status.info.text} mb-3`}
                    >
                      Metas Mensais
                    </h4>
                    <ul className="space-y-2">
                      {(plan.goals?.monthly || []).map((goal, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-blue-600 mr-2">•</span>
                          <span className="text-blue-800">{goal}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div
                  className={`${colors.status.info.bg} ${colors.status.info.border} border rounded-lg p-4`}
                >
                  <h4
                    className={`${typography.heading.h4} ${colors.status.info.text} mb-3`}
                  >
                    Indicadores de Progresso
                  </h4>
                  <ul className="space-y-2">
                    {(plan.goals?.tracking || []).map((indicator, index) => (
                      <li key={index} className="flex items-start">
                        <span className={`${colors.status.info.accent} mr-2`}>
                          •
                        </span>
                        <span className={`${colors.status.info.text}`}>
                          {indicator}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Motivação */}
            {validActiveTab === "motivation" && (
              <div className="space-y-6">
                <div
                  className={`${colors.status.info.bg} ${colors.status.info.border} border rounded-lg p-4`}
                >
                  <h4
                    className={`${typography.heading.h4} ${colors.status.info.text} mb-2`}
                  >
                    Mensagem Personalizada
                  </h4>
                  <p className={`${colors.status.info.text}`}>
                    {plan.motivation?.personalMessage ||
                      "Mensagem não disponível"}
                  </p>

                  {plan.motivation?.tips && plan.motivation.tips.length > 0 && (
                    <>
                      <h5
                        className={`${typography.heading.h4} ${colors.status.info.text} mt-4 mb-2`}
                      >
                        Dicas Motivacionais
                      </h5>
                      <ul className="space-y-2">
                        {plan.motivation.tips.map((tip, index) => (
                          <li key={index} className="flex items-start">
                            <span
                              className={`${colors.status.info.accent} mr-2`}
                            >
                              •
                            </span>
                            <span className={`${colors.status.info.text}`}>
                              {tip}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              ✅ Entendi, vamos começar!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
