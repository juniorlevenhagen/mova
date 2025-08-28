import { useState } from "react";
import { supabase } from "@/lib/supabase";

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

export function usePlanGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [plan, setPlan] = useState<PersonalizedPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [planStatus, setPlanStatus] = useState<{
    isExisting: boolean;
    generatedAt?: string;
    daysUntilNext?: number;
    nextPlanAvailable?: string;
  } | null>(null);

  const generatePlan = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      console.log("🎯 Iniciando geração de plano personalizado...");

      // Obter token de autorização
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Usuário não autenticado");
      }

      const response = await fetch("/api/generate-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao gerar plano");
      }

      const result = await response.json();

      if (result.success) {
        setPlan(result.plan);
        setPlanStatus({
          isExisting: result.isExisting || false,
          generatedAt: result.generatedAt,
          daysUntilNext: result.daysUntilNext,
          nextPlanAvailable: result.nextPlanAvailable,
        });

        // ✅ Parar loading IMEDIATAMENTE após atualizar estado
        setIsGenerating(false);

        console.log("✅ Plano carregado com sucesso!");
        console.log("🔄 Estado atualizado: isGenerating=false, planStatus=", {
          isExisting: result.isExisting || false,
          generatedAt: result.generatedAt,
        });

        // Log da operação (sem alert)
        if (result.isExisting) {
          console.log(
            `📋 Plano do mês recuperado! Gerado em: ${new Date(
              result.generatedAt
            ).toLocaleDateString("pt-BR")}`
          );
        } else {
          console.log("🎉 Novo plano personalizado gerado com sucesso!");
        }

        return result.plan;
      } else if (result.error === "MONTHLY_LIMIT_REACHED") {
        // Limite mensal atingido
        setPlanStatus({
          isExisting: true,
          generatedAt: result.generatedAt,
          daysUntilNext: result.daysUntilNext,
          nextPlanAvailable: result.nextPlanAvailable,
        });

        // ✅ Parar loading IMEDIATAMENTE após atualizar estado
        setIsGenerating(false);

        console.log(
          `🔒 Limite de 30 dias atingido! Próximo plano em: ${result.daysUntilNext} dias`
        );

        throw new Error(result.message);
      } else {
        throw new Error(result.error || "Erro desconhecido");
      }
    } catch (error: any) {
      console.error("❌ Erro ao gerar plano:", error);
      setError(error.message);

      // ✅ Só para loading se não foi parado antes (casos de erro real)
      setIsGenerating(false);

      // Log do erro (sem alert)
      console.log(`❌ Erro ao gerar plano: ${error.message}`);
      throw error;
    }
  };

  const clearPlan = () => {
    setPlan(null);
    setError(null);
    setPlanStatus(null);
  };

  return {
    isGenerating,
    plan,
    error,
    planStatus,
    generatePlan,
    clearPlan,
  };
}
