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

      // Buscar status usando função SIMPLIFICADA
      const { data: status, error: statusError } = await supabase.rpc(
        "get_trial_status_simple",
        { user_uuid: user.id }
      );

      if (statusError) {
        console.error("Erro ao buscar status do trial:", statusError);
        throw statusError;
      }

      setTrialStatus(status);

      // Buscar dados brutos do trial para compatibilidade
      const { data: trialData, error: trialError } = await supabase
        .from("user_trials")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (trialError && trialError.code !== "PGRST116") {
        throw trialError;
      }

      setTrial(trialData || null);
    } catch (error: unknown) {
      console.error("Erro ao buscar trial:", error);
      setError("Erro ao carregar dados do trial");
    } finally {
      setLoading(false);
    }
  };

  // Criar novo trial (não utilizada)
  /* const createTrial = async () => {
    if (!user) return;

    try {
      console.log("Tentando criar trial para usuário:", user.id);

      const { data, error } = await supabase
        .from("user_trials")
        .upsert(
          {
            user_id: user.id,
          },
          {
            onConflict: "user_id",
          }
        )
        .select()
        .single();

      if (error) {
        console.error("Erro detalhado ao criar trial:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        throw error;
      }

      console.log("Trial criado com sucesso:", data);
      setTrial(data);
    } catch (error: unknown) {
      console.error("Erro ao criar trial:", error);
      setError(
        "Erro ao criar trial: " + (error instanceof Error ? error.message : "Erro desconhecido")
      );
    }
  }; */

  // Incrementar contador de planos gerados (nova lógica)
  const incrementPlanUsage = async () => {
    if (!user) return false;

    try {
      // Usar a função SIMPLIFICADA do banco
      const { error } = await supabase.rpc("update_plan_generated_simple", {
        user_uuid: user.id,
      });

      if (error) throw error;

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
        .single();

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
    fetchTrial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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
