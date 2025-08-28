"use client";

import { useState } from "react";

interface PersonalizedPlan {
  analysis: {
    currentStatus: string;
    strengths: string[];
    improvements: string[];
    specialConsiderations?: string[];
  };
  trainingPlan: {
    overview: string;
    weeklySchedule: Array<{
      day: string;
      type: string;
      exercises: Array<{
        name: string;
        sets: string;
        reps: string;
        rest: string;
        notes?: string;
      }>;
    }>;
    progression: string;
  };
  nutritionPlan: {
    dailyCalories: number;
    macros: {
      protein: string;
      carbs: string;
      fats: string;
    };
    mealPlan: Array<{
      meal: string;
      options: string[];
      timing: string;
    }>;
    supplements?: string[];
    hydration: string;
  };
  goals: {
    weekly: string[];
    monthly: string[];
    tracking: string[];
  };
  motivation: {
    personalMessage: string;
    tips: string[];
  };
}

interface PersonalizedPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: PersonalizedPlan | null;
}

export function PersonalizedPlanModal({
  isOpen,
  onClose,
  plan,
}: PersonalizedPlanModalProps) {
  const [activeTab, setActiveTab] = useState<
    "analysis" | "training" | "nutrition" | "goals"
  >("analysis");

  if (!isOpen || !plan) return null;

  const tabs = [
    { id: "analysis", label: "📊 Análise", icon: "📊" },
    { id: "training", label: "💪 Treino", icon: "💪" },
    { id: "nutrition", label: "🥗 Dieta", icon: "🥗" },
    { id: "goals", label: "🎯 Metas", icon: "🎯" },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full max-h-[90vh]">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-white">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">🎯 Seu Plano Personalizado</h3>
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
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "bg-white text-blue-600"
                      : "bg-blue-500 text-white hover:bg-blue-400"
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
            {activeTab === "analysis" && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">
                    📊 Status Atual
                  </h4>
                  <p className="text-blue-800">{plan.analysis.currentStatus}</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-900 mb-3">
                      ✅ Pontos Fortes
                    </h4>
                    <ul className="space-y-2">
                      {plan.analysis.strengths.map((strength, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-green-600 mr-2">•</span>
                          <span className="text-green-800">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <h4 className="font-semibold text-orange-900 mb-3">
                      🎯 Áreas de Melhoria
                    </h4>
                    <ul className="space-y-2">
                      {plan.analysis.improvements.map((improvement, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-orange-600 mr-2">•</span>
                          <span className="text-orange-800">{improvement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {plan.analysis.specialConsiderations &&
                  plan.analysis.specialConsiderations.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="font-semibold text-yellow-900 mb-3">
                        ⚠️ Considerações Especiais
                      </h4>
                      <ul className="space-y-2">
                        {plan.analysis.specialConsiderations.map(
                          (consideration, index) => (
                            <li key={index} className="flex items-start">
                              <span className="text-yellow-600 mr-2">•</span>
                              <span className="text-yellow-800">
                                {consideration}
                              </span>
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-900 mb-2">
                    💬 Mensagem Personalizada
                  </h4>
                  <p className="text-purple-800">
                    {plan.motivation.personalMessage}
                  </p>

                  <h5 className="font-semibold text-purple-900 mt-4 mb-2">
                    💡 Dicas
                  </h5>
                  <ul className="space-y-1">
                    {plan.motivation.tips.map((tip, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-purple-600 mr-2">•</span>
                        <span className="text-purple-800">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Treino */}
            {activeTab === "training" && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">
                    💪 Visão Geral do Treino
                  </h4>
                  <p className="text-blue-800">{plan.trainingPlan.overview}</p>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">
                    📅 Cronograma Semanal
                  </h4>
                  {plan.trainingPlan.weeklySchedule.map((day, dayIndex) => (
                    <div
                      key={dayIndex}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-center mb-3">
                        <h5 className="font-semibold text-lg text-gray-900">
                          {day.day}
                        </h5>
                        <span className="ml-3 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          {day.type}
                        </span>
                      </div>

                      <div className="space-y-3">
                        {day.exercises.map((exercise, exerciseIndex) => (
                          <div
                            key={exerciseIndex}
                            className="bg-gray-50 border border-gray-100 rounded p-3"
                          >
                            <div className="flex flex-wrap items-center gap-4">
                              <h6 className="font-medium text-gray-900 flex-1">
                                {exercise.name}
                              </h6>
                              <span className="text-sm text-gray-600">
                                📊 {exercise.sets}
                              </span>
                              <span className="text-sm text-gray-600">
                                🔢 {exercise.reps}
                              </span>
                              <span className="text-sm text-gray-600">
                                ⏱️ {exercise.rest}
                              </span>
                            </div>
                            {exercise.notes && (
                              <p className="text-sm text-gray-600 mt-2">
                                💡 {exercise.notes}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-2">
                    📈 Progressão
                  </h4>
                  <p className="text-green-800">
                    {plan.trainingPlan.progression}
                  </p>
                </div>
              </div>
            )}

            {/* Nutrição */}
            {activeTab === "nutrition" && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-900 mb-3">
                      🔥 Calorias Diárias
                    </h4>
                    <p className="text-2xl font-bold text-green-800">
                      {plan.nutritionPlan.dailyCalories} kcal
                    </p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-3">
                      📊 Macronutrientes
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-blue-800">🥩 Proteínas:</span>
                        <span className="font-medium text-blue-900">
                          {plan.nutritionPlan.macros.protein}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-800">🍞 Carboidratos:</span>
                        <span className="font-medium text-blue-900">
                          {plan.nutritionPlan.macros.carbs}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-800">🥑 Gorduras:</span>
                        <span className="font-medium text-blue-900">
                          {plan.nutritionPlan.macros.fats}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">
                    🍽️ Plano Alimentar
                  </h4>
                  <div className="space-y-4">
                    {plan.nutritionPlan.mealPlan.map((meal, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-semibold text-gray-900">
                            {meal.meal}
                          </h5>
                          <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                            {meal.timing}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {meal.options.map((option, optionIndex) => (
                            <div key={optionIndex} className="flex items-start">
                              <span className="text-green-600 mr-2">•</span>
                              <span className="text-gray-800">{option}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {plan.nutritionPlan.supplements &&
                    plan.nutritionPlan.supplements.length > 0 && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <h4 className="font-semibold text-purple-900 mb-3">
                          💊 Suplementação
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

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-3">
                      💧 Hidratação
                    </h4>
                    <p className="text-blue-800">
                      {plan.nutritionPlan.hydration}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Metas */}
            {activeTab === "goals" && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-900 mb-3">
                      📅 Metas Semanais
                    </h4>
                    <ul className="space-y-2">
                      {plan.goals.weekly.map((goal, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-green-600 mr-2">•</span>
                          <span className="text-green-800">{goal}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-3">
                      📆 Metas Mensais
                    </h4>
                    <ul className="space-y-2">
                      {plan.goals.monthly.map((goal, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-blue-600 mr-2">•</span>
                          <span className="text-blue-800">{goal}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-900 mb-3">
                    📊 Indicadores de Progresso
                  </h4>
                  <ul className="space-y-2">
                    {plan.goals.tracking.map((indicator, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-purple-600 mr-2">•</span>
                        <span className="text-purple-800">{indicator}</span>
                      </li>
                    ))}
                  </ul>
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
