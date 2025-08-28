import { useState, useEffect } from "react";
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
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

  // Verificar automaticamente se já existe um plano ao carregar
  useEffect(() => {
    const checkExistingPlan = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          setIsCheckingStatus(false);
          return;
        }

        // Buscar diretamente no Supabase em vez de usar API
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const { data: planResults } = await supabase
          .from("user_evolutions")
          .select("*")
          .eq("user_id", session.user.id)
          .eq("objetivo", "Plano personalizado gerado")
          .gte("date", thirtyDaysAgo.toISOString().split("T")[0])
          .order("date", { ascending: false })
          .limit(1);

        if (planResults && planResults.length > 0) {
          const planEntry = planResults[0];

          // Tentar extrair plano das observações
          let existingPlan = null;
          try {
            const planData = JSON.parse(planEntry.observacoes);
            if (planData.type === "monthly_plan" && planData.plan_data) {
              existingPlan = planData.plan_data;
            }
          } catch {
            console.warn("Plano antigo sem dados estruturados");
          }

          const planGeneratedAt = new Date(planEntry.date);
          const nextPlanDate = new Date(planGeneratedAt);
          nextPlanDate.setDate(nextPlanDate.getDate() + 30);

          const daysUntilNext = Math.ceil(
            (nextPlanDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );

          setPlanStatus({
            isExisting: true,
            generatedAt: planEntry.date,
            daysUntilNext,
            nextPlanAvailable: nextPlanDate.toISOString().split("T")[0],
          });

          if (existingPlan) {
            setPlan(existingPlan);
          }
        } else {
          setPlanStatus({
            isExisting: false,
          });
        }
      } catch (error) {
        console.error("Erro ao verificar plano existente:", error);
        setPlanStatus({
          isExisting: false,
        });
      } finally {
        setIsCheckingStatus(false);
      }
    };

    checkExistingPlan();
  }, []);

  const generatePlan = async () => {
    setIsGenerating(true);
    setError(null);

    try {
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

        if (errorData.error === "TRIAL_LIMIT_REACHED") {
          throw new Error(errorData.message || "Limite de planos atingido");
        }

        throw new Error(errorData.error || "Erro ao gerar plano");
      }

      const result = await response.json();

      if (result.success) {
        setPlan(result.plan);
        // ✅ Atualizar planStatus IMEDIATAMENTE com dados da API
        setPlanStatus({
          isExisting: result.isExisting || true, // Usar dados da API
          generatedAt: result.generatedAt,
          daysUntilNext: result.daysUntilNext,
          nextPlanAvailable: result.nextPlanAvailable,
        });

        // ✅ Parar loading IMEDIATAMENTE após atualizar estado
        setIsGenerating(false);

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

        throw new Error(result.message);
      } else {
        throw new Error(result.error || "Erro desconhecido");
      }
    } catch (error: unknown) {
      console.error("❌ Erro ao gerar plano:", error);
      setError(error instanceof Error ? error.message : "Erro desconhecido");

      // ✅ Só para loading se não foi parado antes (casos de erro real)
      setIsGenerating(false);

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
    isCheckingStatus,
    generatePlan,
    clearPlan,
  };
}
