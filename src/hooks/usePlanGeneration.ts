import { useState, useEffect, useCallback } from "react";
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
    isPremiumCooldown?: boolean; // Nova propriedade para cooldown premium
    hoursUntilNext?: number; // Horas até próximo plano (premium) - para countdown preciso
  } | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

  // Função para verificar status do plano (extraída para poder ser chamada externamente)
  const checkExistingPlan = useCallback(async () => {
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

        // ✅ Extrair plano diretamente do campo plan_data
        let existingPlan = null;
        try {
          existingPlan = planEntry.plan_data;

          // ✅ Compatibilidade: Se não houver nutritionPlan mas houver dietPlan (legacy), converter
          if (
            existingPlan &&
            !existingPlan.nutritionPlan &&
            existingPlan.dietPlan
          ) {
            try {
              existingPlan.nutritionPlan =
                typeof existingPlan.dietPlan === "string"
                  ? JSON.parse(existingPlan.dietPlan)
                  : existingPlan.dietPlan;
              console.log("🔄 Convertido dietPlan (legacy) para nutritionPlan");
            } catch (e) {
              console.warn(
                "⚠️ Erro ao converter dietPlan para nutritionPlan:",
                e
              );
            }
          }

          console.log("📥 Plano carregado do banco:", {
            hasAnalysis: !!existingPlan?.analysis,
            hasTrainingPlan: !!existingPlan?.trainingPlan,
            hasNutritionPlan: !!existingPlan?.nutritionPlan,
            hasGoals: !!existingPlan?.goals,
            hasMotivation: !!existingPlan?.motivation,
            planKeys: existingPlan ? Object.keys(existingPlan) : [],
          });
        } catch (error) {
          console.warn("Erro ao extrair plano:", error);
        }

        const availablePrompts = trialData?.available_prompts || 0;
        const maxFreePlans = trialData?.max_plans_allowed || 0;
        const plansGenerated = trialData?.plans_generated || 0;
        const freePlansRemaining = Math.max(0, maxFreePlans - plansGenerated);

        console.log("📊 Status do plano verificado:", {
          availablePrompts,
          plansGenerated,
          freePlansRemaining,
          hasExistingPlan: true,
          willAllowNewPlan: availablePrompts > 0 || freePlansRemaining > 0,
        });

        if (availablePrompts > 0) {
          // ✅ HÁ PROMPTS DISPONÍVEIS - mostrar plano existente MAS permitir gerar novo
          // IMPORTANTE: Manter plano existente para o usuário poder visualizar
          setPlanStatus({
            isExisting: true, // true = existe plano, mas pode gerar novo se tiver prompts
            generatedAt: planEntry.generated_at,
          });
          if (existingPlan) {
            setPlan(existingPlan); // Manter plano existente no estado
          }
          console.log(
            `✅ ${availablePrompts} prompt(s) disponível(is) - mostrando plano existente (mas pode gerar novo)`
          );
        } else if (freePlansRemaining <= 0) {
          // Não há prompts e não há planos grátis - mostrar plano existente
          setPlanStatus({
            isExisting: true,
            generatedAt: planEntry.generated_at,
          });
          if (existingPlan) {
            setPlan(existingPlan); // Definir plano existente apenas quando não há prompts
          }
          console.log(
            "📌 Sem prompts e sem planos grátis - mostrar plano existente"
          );
        } else {
          // Há plano grátis disponível - permitir gerar
          setPlanStatus({
            isExisting: false,
          });
          setPlan(null); // Limpar plano antigo quando há plano grátis disponível
          console.log(
            "✅ Plano grátis disponível - pode gerar novo plano (plano antigo removido do estado)"
          );
        }
      } else {
        // Não há plano existente - permitir gerar
        const availablePrompts = trialData?.available_prompts || 0;
        const maxFreePlans = trialData?.max_plans_allowed || 0;
        const plansGenerated = trialData?.plans_generated || 0;
        const freePlansRemaining = Math.max(0, maxFreePlans - plansGenerated);

        console.log("📊 Sem plano existente - status:", {
          availablePrompts,
          plansGenerated,
          freePlansRemaining,
          canGenerate: availablePrompts > 0 || freePlansRemaining > 0,
        });

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
  }, []);

  // Verificar automaticamente se já existe um plano ao carregar
  useEffect(() => {
    checkExistingPlan();
  }, [checkExistingPlan]);

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
          // ✅ Criar erro customizado com dados adicionais para melhor tratamento
          interface CreditsError extends Error {
            type: string;
            errorCode: string;
            actionRequired: string;
            availablePrompts: number;
          }

          const creditsError = new Error(
            errorData.message || "Você atingiu o limite de planos gratuitos. Compre prompts para gerar novos planos personalizados!"
          ) as CreditsError;
          creditsError.type = "TRIAL_LIMIT_REACHED";
          creditsError.errorCode = errorData.errorCode || "NO_CREDITS";
          creditsError.actionRequired = errorData.actionRequired || "purchase_prompts";
          creditsError.availablePrompts = errorData.availablePrompts || 0;

          throw creditsError;
        }

        if (errorData.error === "COOLDOWN_ACTIVE") {
          // ✅ Usar horasRemaining para mensagem mais precisa
          const hoursRemaining = errorData.hoursRemaining || 0;
          const hours = Math.floor(hoursRemaining);
          const minutes = Math.floor((hoursRemaining - hours) * 60);

          const message =
            errorData.message ||
            (hoursRemaining >= 1
              ? `Aguarde ${hours}h ${minutes}m para gerar um novo plano.`
              : `Aguarde ${minutes} minutos para gerar um novo plano.`);

          console.log("⏳ Erro de cooldown detectado:", {
            message,
            hoursRemaining,
            nextPlanAvailable: errorData.nextPlanAvailable,
            availablePrompts: errorData.availablePrompts,
          });

          // ✅ Criar erro customizado com dados adicionais
          interface CooldownError extends Error {
            type: string;
            hoursRemaining: number;
            nextPlanAvailable?: string;
            availablePrompts: number;
          }

          const cooldownError = new Error(message) as CooldownError;
          cooldownError.type = "COOLDOWN_ACTIVE";
          cooldownError.hoursRemaining = hoursRemaining;
          cooldownError.nextPlanAvailable = errorData.nextPlanAvailable;
          cooldownError.availablePrompts = errorData.availablePrompts || 0;

          console.log(
            "📤 Relançando erro de cooldown com dados:",
            cooldownError
          );
          throw cooldownError;
        }

        throw new Error(errorData.error || "Erro ao gerar plano");
      }

      const result = await response.json();

      console.log("📥 Resposta da API:", {
        success: result.success,
        hasPlan: !!result.plan,
        planKeys: result.plan ? Object.keys(result.plan) : [],
        hasNutritionPlan: !!result.plan?.nutritionPlan,
      });

      if (result.success) {
        setPlan(result.plan);
        console.log("✅ Plano definido no estado:", {
          keys: result.plan ? Object.keys(result.plan) : [],
          hasNutritionPlan: !!result.plan?.nutritionPlan,
          isExisting: result.isExisting,
        });
        // ✅ Atualizar planStatus IMEDIATAMENTE com dados da API
        // IMPORTANTE: Se um plano foi gerado (mesmo que haja prompts disponíveis),
        // devemos mostrar esse plano como existente para que o usuário possa visualizá-lo
        setPlanStatus({
          isExisting: true, // Sempre true quando um plano é gerado (permite visualizar)
          generatedAt: result.generatedAt || new Date().toISOString(),
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
      } else if (result.error === "PLAN_INCOMPLETE") {
        // Plano incompleto retornado pela API
        setIsGenerating(false);
        throw new Error(
          result.message ||
            `O plano gerado está incompleto. Campos faltando: ${result.missingFields?.join(", ") || "desconhecidos"}. Tente gerar novamente.`
        );
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

      // ✅ Relançar erros de cooldown para serem tratados no componente
      if (
        error &&
        typeof error === "object" &&
        "type" in error &&
        error.type === "COOLDOWN_ACTIVE"
      ) {
        throw error; // Relançar erro de cooldown
      }

      // ✅ Verificar se é erro de cooldown pela mensagem
      if (
        errorMessage.includes("Aguarde") ||
        errorMessage.includes("cooldown") ||
        errorMessage.includes("Cooldown")
      ) {
        throw error; // Relançar erro de cooldown
      }

      // ✅ Não re-lançar outros erros - apenas retornar null para indicar falha
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
    refetchPlanStatus: checkExistingPlan,
  };
}
