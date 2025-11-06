"use client";

import { useState, useEffect } from "react";
import { typography, components, colors } from "@/lib/design-tokens";
import { PersonalizedPlan } from "@/types/personalized-plan";
import { supabase } from "@/lib/supabase";

interface PersonalizedPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: PersonalizedPlan | null;
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

// Funções auxiliares para extrair informações do texto da OpenAI
function extractCalories(text: string): string {
  const match = text.match(/(\d+)\s*(?:kcal|calorias|cal)/i);
  return match ? `${match[1]} kcal` : "";
}

function extractMacros(text: string): Array<{ name: string; value: string }> {
  const macros: Array<{ name: string; value: string }> = [];

  // Proteínas
  const proteinMatch = text.match(/prote[íi]nas?[:\s]+([^\n]+)/i);
  if (proteinMatch) {
    macros.push({ name: "Proteínas", value: proteinMatch[1].trim() });
  }

  // Carboidratos
  const carbsMatch = text.match(/carboidratos?[:\s]+([^\n]+)/i);
  if (carbsMatch) {
    macros.push({ name: "Carboidratos", value: carbsMatch[1].trim() });
  }

  // Gorduras
  const fatsMatch = text.match(/gorduras?[:\s]+([^\n]+)/i);
  if (fatsMatch) {
    macros.push({ name: "Gorduras", value: fatsMatch[1].trim() });
  }

  return macros;
}

function extractMeals(text: string): Array<{
  name: string;
  timing?: string;
  foods: Array<{ name: string; quantity?: string; calories?: string }>;
  totalCalories?: string;
}> {
  const meals: Array<{
    name: string;
    timing?: string;
    foods: Array<{ name: string; quantity?: string; calories?: string }>;
    totalCalories?: string;
  }> = [];

  // Padrões comuns de refeições
  const mealPatterns = [
    /(?:caf[ée]\s+da\s+manh[ãa]|desjejum|breakfast)/i,
    /(?:lanche\s+da\s+manh[ãa]|lanche\s+matinal)/i,
    /(?:almo[çc]o|lunch)/i,
    /(?:lanche\s+da\s+tarde|lanche\s+tarde)/i,
    /(?:jantar|dinner)/i,
    /(?:ceia|supper)/i,
  ];

  const lines = text.split("\n");
  let currentMeal: {
    name: string;
    timing?: string;
    foods: Array<{ name: string; quantity?: string; calories?: string }>;
    totalCalories?: string;
  } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Verificar se é uma nova refeição
    const mealMatch = mealPatterns.find((pattern) => pattern.test(line));
    if (mealMatch) {
      if (currentMeal) {
        meals.push(currentMeal);
      }
      currentMeal = {
        name: line,
        foods: [],
      };

      // Tentar extrair horário da próxima linha
      if (i + 1 < lines.length) {
        const timingMatch = lines[i + 1].match(/(\d{1,2}[:h]\d{2}|\d{1,2}h)/i);
        if (timingMatch) {
          currentMeal.timing = timingMatch[1];
        }
      }
      continue;
    }

    // Se estamos em uma refeição, tentar extrair alimentos
    if (currentMeal) {
      // Padrão: alimento (quantidade) - calorias
      const foodMatch = line.match(
        /[-•]\s*(.+?)(?:\s*\(([^)]+)\))?(?:\s*-\s*(\d+)\s*kcal)?/i
      );
      if (foodMatch) {
        currentMeal.foods.push({
          name: foodMatch[1].trim(),
          quantity: foodMatch[2]?.trim(),
          calories: foodMatch[3] ? `${foodMatch[3]} kcal` : undefined,
        });
      } else if (line && !line.match(/^(total|calorias|kcal)/i)) {
        // Se não tem padrão mas tem conteúdo, adicionar como alimento
        currentMeal.foods.push({ name: line });
      }

      // Tentar extrair total de calorias da refeição
      const totalMatch = line.match(/total[:\s]+(\d+)\s*kcal/i);
      if (totalMatch) {
        currentMeal.totalCalories = `${totalMatch[1]} kcal`;
      }
    }
  }

  if (currentMeal) {
    meals.push(currentMeal);
  }

  // Se não encontrou refeições estruturadas, criar uma refeição genérica com todo o texto
  if (meals.length === 0) {
    meals.push({
      name: "Plano Nutricional",
      foods: [{ name: text }],
    });
  }

  return meals;
}

function extractHydration(text: string): string | null {
  const hydrationMatch = text.match(
    /hidrata[çc][ãa]o[:\s]+([^\n]+(?:\n[^\n]+)*)/i
  );
  return hydrationMatch ? hydrationMatch[1].trim() : null;
}

function extractSupplements(text: string): string[] {
  const supplements: string[] = [];
  const supplementMatch = text.match(
    /suplementos?[:\s]+([^\n]+(?:\n[^\n]+)*)/i
  );

  if (supplementMatch) {
    const supplementText = supplementMatch[1];
    const lines = supplementText.split("\n");
    lines.forEach((line) => {
      const cleanLine = line.replace(/^[-•]\s*/, "").trim();
      if (cleanLine) {
        supplements.push(cleanLine);
      }
    });
  }

  return supplements;
}

export function PersonalizedPlanModal({
  isOpen,
  onClose,
  plan,
  userProfile,
}: PersonalizedPlanModalProps) {
  const [activeTab, setActiveTab] = useState<
    "analysis" | "training" | "diet" | "nutrition" | "goals" | "motivation"
  >("analysis");
  const [openAIMessage, setOpenAIMessage] = useState<string>("");
  const [isLoadingOpenAI, setIsLoadingOpenAI] = useState<boolean>(false);

  // Campos opcionais do plano
  const hasOptionalFields = {
    nutritionPlan: !!plan?.nutritionPlan,
    goals: !!plan?.goals,
    motivation: !!plan?.motivation,
  };

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

  // Chamar OpenAI quando a aba Dieta for aberta
  useEffect(() => {
    if (activeTab === "diet" && !openAIMessage && !isLoadingOpenAI) {
      // Primeiro, tentar carregar dieta salva
      const loadSavedDiet = async () => {
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (!session) return null;

          const response = await fetch("/api/save-diet", {
            method: "GET",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.dietPlan) {
              return data.dietPlan;
            }
          }
          return null;
        } catch (error) {
          console.error("Erro ao carregar dieta salva:", error);
          return null;
        }
      };

      // Carregar dieta salva primeiro
      loadSavedDiet().then((savedDiet) => {
        if (savedDiet) {
          // Se existe dieta salva, usar ela
          setOpenAIMessage(savedDiet);
        } else {
          // Se não existe, gerar nova
          setIsLoadingOpenAI(true);

          // Preparar dados do usuário para enviar à API
          const userDataForAPI = userProfile
            ? {
                altura: userProfile.altura || 0,
                peso: userProfile.peso || userProfile.pesoInicial || 0,
                pesoInicial: userProfile.pesoInicial || 0,
                sexo: userProfile.sexo || "Não informado",
                frequenciaTreinos:
                  userProfile.frequenciaTreinos || "Não informado",
                objetivo: userProfile.objetivo || "Não informado",
                nivelAtividade: userProfile.nivelAtividade || "Moderado",
                birthDate: userProfile.birthDate || null,
              }
            : null;

          fetch("/api/test-openai", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ userData: userDataForAPI }),
          })
            .then((res) => res.json())
            .then(async (data) => {
              if (data.success && data.message) {
                setOpenAIMessage(data.message);

                // Salvar dieta no banco de dados
                try {
                  const {
                    data: { session },
                  } = await supabase.auth.getSession();
                  if (session) {
                    await fetch("/api/save-diet", {
                      method: "POST",
                      headers: {
                        Authorization: `Bearer ${session.access_token}`,
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        dietPlan: data.message,
                      }),
                    });
                  }
                } catch (saveError) {
                  console.error("Erro ao salvar dieta:", saveError);
                }
              } else {
                setOpenAIMessage("Erro ao conectar com OpenAI");
              }
              setIsLoadingOpenAI(false);
            })
            .catch((error) => {
              console.error("Erro ao chamar OpenAI:", error);
              setOpenAIMessage("Erro ao conectar com OpenAI");
              setIsLoadingOpenAI(false);
            });
        }
      });
    }
  }, [activeTab, openAIMessage, isLoadingOpenAI, userProfile]);

  if (!isOpen || !plan) return null;

  // Verificações de segurança para evitar erros
  // Temporariamente não validamos campos obrigatórios para testes
  // const missingFields: string[] = [];
  // if (!plan.analysis) missingFields.push("analysis");
  // if (!plan.trainingPlan) missingFields.push("trainingPlan");

  console.log("📊 Campos opcionais presentes:", hasOptionalFields);

  // Temporariamente desabilitado para testes
  // if (missingFields.length > 0) {
  //   console.error("❌ Plano incompleto. Campos faltando:", missingFields);
  //   console.error("📄 Plano completo:", JSON.stringify(plan, null, 2));
  //   return (
  //     <div className="fixed inset-0 z-50 overflow-y-auto">
  //       ... código do erro comentado ...
  //     </div>
  //   );
  // }

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
                {isLoadingOpenAI ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className={`${colors.text.secondary}`}>
                      Gerando plano nutricional personalizado...
                    </p>
                  </div>
                ) : openAIMessage ? (
                  <div className="space-y-6">
                    {/* Resumo de Calorias e Macronutrientes */}
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
                          {extractCalories(openAIMessage) || "Calculando..."}
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
                          {extractMacros(openAIMessage).map((macro, index) => (
                            <div key={index} className="flex justify-between">
                              <span className={`${colors.status.info.text}`}>
                                {macro.name}:
                              </span>
                              <span
                                className={`font-medium ${colors.status.info.text}`}
                              >
                                {macro.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Plano Alimentar */}
                    <div>
                      <h4
                        className={`${typography.heading.h4} ${colors.text.primary} mb-4`}
                      >
                        Plano Alimentar Diário
                      </h4>
                      <div className="space-y-4">
                        {extractMeals(openAIMessage).map((meal, index) => (
                          <div
                            key={index}
                            className="border border-gray-200 rounded-lg p-4"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <h5 className="font-semibold text-gray-900 text-lg">
                                {meal.name}
                              </h5>
                              {meal.timing && (
                                <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                                  {meal.timing}
                                </span>
                              )}
                            </div>
                            <div className="space-y-2">
                              {meal.foods.map((food, foodIndex) => (
                                <div
                                  key={foodIndex}
                                  className="flex items-start bg-gray-50 border border-gray-100 rounded p-2"
                                >
                                  <span className="text-green-600 mr-2 mt-1">
                                    •
                                  </span>
                                  <div className="flex-1">
                                    <span className="text-gray-900">
                                      {food.name}
                                    </span>
                                    {food.quantity && (
                                      <span className="text-gray-600 ml-2">
                                        ({food.quantity})
                                      </span>
                                    )}
                                    {food.calories && (
                                      <span className="text-gray-500 text-sm ml-2">
                                        - {food.calories} kcal
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                            {meal.totalCalories && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <span className="text-sm font-medium text-gray-700">
                                  Total da refeição: {meal.totalCalories} kcal
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Hidratação */}
                    {extractHydration(openAIMessage) && (
                      <div
                        className={`${colors.status.info.bg} ${colors.status.info.border} border rounded-lg p-4`}
                      >
                        <h4
                          className={`${typography.heading.h4} ${colors.status.info.text} mb-2`}
                        >
                          Hidratação
                        </h4>
                        <p className={`${colors.status.info.text}`}>
                          {extractHydration(openAIMessage)}
                        </p>
                      </div>
                    )}

                    {/* Suplementos */}
                    {extractSupplements(openAIMessage).length > 0 && (
                      <div
                        className={`${colors.status.warning.bg} ${colors.status.warning.border} border rounded-lg p-4`}
                      >
                        <h4
                          className={`${typography.heading.h4} ${colors.status.warning.text} mb-2`}
                        >
                          Suplementos Recomendados
                        </h4>
                        <ul className="space-y-1">
                          {extractSupplements(openAIMessage).map(
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

                    {/* Texto completo (fallback) */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h4
                        className={`${typography.heading.h4} ${colors.text.primary} mb-3`}
                      >
                        Detalhes Completos
                      </h4>
                      <div
                        className={`${colors.text.secondary} whitespace-pre-wrap`}
                      >
                        {openAIMessage}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className={`${colors.text.secondary}`}>
                      Clique na aba Dieta para gerar seu plano nutricional
                      personalizado.
                    </p>
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
