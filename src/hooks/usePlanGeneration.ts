import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { PersonalizedPlan } from "@/types/personalized-plan";

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

        // ✅ Buscar dados do usuário (trial status + planos)
        const [{ data: trialData }, { data: planResults }] = await Promise.all([
          supabase
            .from("user_trials")
            .select("*")
            .eq("user_id", session.user.id)
            .maybeSingle(),
          supabase
            .from("user_plans")
            .select("*")
            .eq("user_id", session.user.id)
            .eq("is_active", true)
            .order("generated_at", { ascending: false })
            .limit(1),
        ]);

        if (planResults && planResults.length > 0) {
          const planEntry = planResults[0];
          const isPremium = trialData?.upgraded_to_premium || false;

          // ✅ Extrair plano diretamente do campo plan_data
          let existingPlan = null;
          try {
            existingPlan = planEntry.plan_data;
          } catch (error) {
            console.warn("Erro ao extrair plano:", error);
          }

          // ✅ Lógica diferente para premium vs grátis
          if (isPremium) {
            // Para premium: verificar se ainda pode gerar mais planos no ciclo
            const cycleStartDate = trialData?.premium_plan_cycle_start
              ? new Date(trialData.premium_plan_cycle_start)
              : new Date(trialData?.upgraded_at || planEntry.generated_at);

            const now = new Date();
            const daysSinceStart = Math.floor(
              (now.getTime() - cycleStartDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            const cycleLength = trialData?.premium_cycle_days || 30;
            const isNewCycle = daysSinceStart >= cycleLength;

            const currentCycleCount = isNewCycle
              ? 0
              : trialData?.premium_plan_count || 0;
            const maxPlansPerCycle =
              trialData?.premium_max_plans_per_cycle || 2;
            const canGenerateMore = currentCycleCount < maxPlansPerCycle;

            if (canGenerateMore) {
              // Premium pode gerar mais planos - não bloquear
              setPlanStatus({
                isExisting: false,
              });
            } else {
              // Premium atingiu limite - calcular próximo ciclo
              const nextCycleDate = new Date(cycleStartDate);
              nextCycleDate.setDate(nextCycleDate.getDate() + cycleLength);

              const daysUntilNext = Math.ceil(
                (nextCycleDate.getTime() - now.getTime()) /
                  (1000 * 60 * 60 * 24)
              );

              setPlanStatus({
                isExisting: true,
                generatedAt: planEntry.generated_at,
                daysUntilNext,
                nextPlanAvailable: nextCycleDate.toISOString().split("T")[0],
              });
            }
          } else {
            // Para usuários grátis: bloquear após 1 plano (lógica original)
            const planGeneratedAt = new Date(planEntry.generated_at);
            const nextPlanDate = new Date(planGeneratedAt);
            nextPlanDate.setDate(nextPlanDate.getDate() + 30);

            const daysUntilNext = Math.ceil(
              (nextPlanDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            );

            setPlanStatus({
              isExisting: true,
              generatedAt: planEntry.generated_at,
              daysUntilNext,
              nextPlanAvailable: nextPlanDate.toISOString().split("T")[0],
            });
          }

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

      // API original restaurada com correções para user_plans
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
      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido";
      setError(errorMessage);

      // ✅ Parar loading
      setIsGenerating(false);

      // ✅ Não re-lançar o erro - apenas retornar null para indicar falha
      return null;
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
