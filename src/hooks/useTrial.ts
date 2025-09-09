import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

interface UserTrial {
  id: string;
  user_id: string;
  trial_start_date: string;
  trial_end_date: string;
  plans_generated: number;
  max_plans_allowed: number;
  is_active: boolean;
  upgraded_to_premium: boolean;
  upgraded_at: string | null;
  created_at: string;
  updated_at: string;
  last_plan_generated_at: string | null;
  days_between_plans: number;
  premium_plan_count: number;
  premium_plan_cycle_start: string | null;
  premium_max_plans_per_cycle: number;
  premium_cycle_days: number;
}

interface TrialStatus {
  isNewUser?: boolean;
  canGenerate: boolean;
  plansRemaining: number;
  isPremium: boolean;
  hasUsedFreePlan?: boolean;
  message: string;
  daysRemaining?: number;
  plansGenerated?: number;
  // Para premium
  daysUntilNextCycle?: number;
  cycleDays?: number;
}

export function useTrial(user: User | null) {
  const [trial, setTrial] = useState<UserTrial | null>(null);
  const [trialStatus, setTrialStatus] = useState<TrialStatus>({
    canGenerate: false,
    plansRemaining: 0,
    isPremium: false,
    message: "Carregando...",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buscar dados do trial
  const fetchTrial = async () => {
    if (!user) {
      setTrial(null);
      setTrialStatus({
        isNewUser: true,
        canGenerate: true,
        plansRemaining: 1,
        isPremium: false,
        message: "Você pode gerar 1 plano grátis!",
      });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Buscar dados do trial
      const { data: trialData, error: trialError } = await supabase
        .from("user_trials")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle(); // Usar maybeSingle() em vez de single()

      if (trialError) {
        throw trialError;
      }

      // Lógica para determinar status
      let status: TrialStatus;

      if (!trialData) {
        // Usuário novo - pode gerar 1 plano grátis
        status = {
          isNewUser: true,
          canGenerate: true,
          plansRemaining: 1,
          isPremium: false,
          message: "Você pode gerar 1 plano grátis!",
          daysRemaining: 7,
          plansGenerated: 0,
        };
      } else {
        // Usuário existente
        const isPremium = trialData.upgraded_to_premium;
        const plansGenerated = trialData.plans_generated || 0;

        // Calcular dias restantes do trial
        const trialEndDate = new Date(trialData.trial_end_date);
        const now = new Date();
        const daysRemaining = Math.max(
          0,
          Math.ceil(
            (trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          )
        );

        if (isPremium) {
          // ✅ Usuário premium - 2 planos por período de 30 dias (não por mês do calendário)
          const maxPlansPerCycle = trialData.premium_max_plans_per_cycle || 2;
          const cycleStartDate = trialData.premium_plan_cycle_start
            ? new Date(trialData.premium_plan_cycle_start)
            : new Date(trialData.upgraded_at || trialData.created_at);

          const now = new Date();
          const daysSinceStart = Math.floor(
            (now.getTime() - cycleStartDate.getTime()) / (1000 * 60 * 60 * 24)
          );

          // Verificar se precisa resetar o ciclo (30 dias)
          const cycleLength = trialData.premium_cycle_days || 30;
          const isNewCycle = daysSinceStart >= cycleLength;

          // Calcular planos restantes no ciclo atual
          const currentCycleCount = isNewCycle
            ? 0
            : trialData.premium_plan_count || 0;
          const plansRemaining = Math.max(
            0,
            maxPlansPerCycle - currentCycleCount
          );

          // Calcular próxima renovação
          const nextRenewalDate = new Date(cycleStartDate);
          nextRenewalDate.setDate(nextRenewalDate.getDate() + cycleLength);
          const daysUntilRenewal = Math.ceil(
            (nextRenewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );

          status = {
            isNewUser: false,
            canGenerate: plansRemaining > 0,
            plansRemaining,
            isPremium: true,
            message:
              plansRemaining > 0
                ? `Você pode gerar ${plansRemaining} plano${
                    plansRemaining !== 1 ? "s" : ""
                  } neste ciclo!`
                : `Limite do ciclo atingido. Renovação em ${daysUntilRenewal} dias.`,
            daysRemaining: daysUntilRenewal,
            plansGenerated: currentCycleCount,
            daysUntilNextCycle: daysUntilRenewal,
            cycleDays: cycleLength,
          };
        } else {
          // Usuário grátis - 1 plano total
          const maxPlans = 1; // Usuários grátis só podem gerar 1 plano
          const plansRemaining = Math.max(0, maxPlans - plansGenerated);

          status = {
            isNewUser: false,
            canGenerate: plansRemaining > 0,
            plansRemaining,
            isPremium: false,
            message:
              plansRemaining > 0
                ? "Você pode gerar 1 plano grátis!"
                : "Plano grátis utilizado. Faça upgrade para continuar!",
            daysRemaining,
            plansGenerated,
          };
        }
      }

      setTrialStatus(status);
      setTrial(trialData || null);
    } catch (error: unknown) {
      console.error("Erro ao buscar trial:", error);
      setError("Erro ao carregar dados do trial");

      // Fallback em caso de erro
      setTrialStatus({
        isNewUser: true,
        canGenerate: true,
        plansRemaining: 1,
        isPremium: false,
        message: "Você pode gerar 1 plano grátis!",
        daysRemaining: 7,
        plansGenerated: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  // Incrementar contador de planos gerados
  const incrementPlanUsage = async () => {
    if (!user) return false;

    try {
      const now = new Date().toISOString();

      // Buscar trial atual
      const { data: currentTrial, error: fetchError } = await supabase
        .from("user_trials")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle(); // Usar maybeSingle() em vez de single()

      if (fetchError) {
        throw fetchError;
      }

      if (!currentTrial) {
        // Criar novo trial para usuário
        const { error: insertError } = await supabase
          .from("user_trials")
          .insert({
            user_id: user.id,
            plans_generated: 1,
            last_plan_generated_at: now,
            trial_start_date: now,
            trial_end_date: new Date(
              Date.now() + 7 * 24 * 60 * 60 * 1000
            ).toISOString(), // 7 dias
            is_active: true,
            upgraded_to_premium: false,
            max_plans_allowed: 1, // Usuários grátis só podem gerar 1 plano
          });

        if (insertError) throw insertError;
      } else {
        // Atualizar trial existente
        const isPremium = currentTrial.upgraded_to_premium;
        const updateData: Record<string, number | string> = {
          last_plan_generated_at: now,
        };

        if (isPremium) {
          // ✅ Lógica premium - verificar se precisa resetar ciclo
          const cycleStartDate = currentTrial.premium_plan_cycle_start
            ? new Date(currentTrial.premium_plan_cycle_start)
            : new Date(currentTrial.upgraded_at || currentTrial.created_at);

          const daysSinceStart = Math.floor(
            (new Date(now).getTime() - cycleStartDate.getTime()) /
              (1000 * 60 * 60 * 24)
          );
          const cycleLength = currentTrial.premium_cycle_days || 30;

          if (daysSinceStart >= cycleLength) {
            // Resetar ciclo premium
            updateData.premium_plan_count = 1;
            updateData.premium_plan_cycle_start = now;
          } else {
            // Incrementar contador do ciclo atual
            updateData.premium_plan_count =
              (currentTrial.premium_plan_count || 0) + 1;
          }
        } else {
          // Lógica grátis - apenas incrementar
          updateData.plans_generated = (currentTrial.plans_generated || 0) + 1;
        }

        const { error: updateError } = await supabase
          .from("user_trials")
          .update(updateData)
          .eq("user_id", user.id);

        if (updateError) throw updateError;
      }

      // Recarregar dados
      await fetchTrial();
      return true;
    } catch (error: unknown) {
      console.error("Erro ao incrementar uso do plano:", error);
      return false;
    }
  };

  // Fazer upgrade para premium
  const upgradeToPremium = async () => {
    if (!trial || !user) return false;

    try {
      const { data, error } = await supabase
        .from("user_trials")
        .update({
          upgraded_to_premium: true,
          upgraded_at: new Date().toISOString(),
          is_active: false, // Trial não é mais necessário
        })
        .eq("user_id", user.id)
        .select()
        .maybeSingle(); // Usar maybeSingle() em vez de single()

      if (error) throw error;
      setTrial(data);
      return true;
    } catch (error: unknown) {
      console.error("Erro ao fazer upgrade:", error);
      return false;
    }
  };

  // Carregar trial quando usuário mudar
  useEffect(() => {
    // Resetar dados quando o usuário mudar
    setTrial(null);
    setTrialStatus({
      canGenerate: false,
      plansRemaining: 0,
      isPremium: false,
      message: "Carregando...",
    });
    setError(null);

    if (user?.id) {
      if (process.env.NODE_ENV === "development") {
        console.log("Carregando trial para usuário:", user.id);
      }
      fetchTrial();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // Usar apenas o ID do usuário como dependência

  return {
    trial,
    trialStatus,
    loading,
    error,
    incrementPlanUsage,
    upgradeToPremium,
    refetch: fetchTrial,
  };
}
