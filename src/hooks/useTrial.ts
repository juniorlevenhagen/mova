import { useState, useEffect, useCallback, useRef, useMemo } from "react";
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
  available_prompts?: number;
  package_prompts?: number; // ✅ Prompts do pacote de 3 (têm cooldown de 24h)
}

export interface TrialStatus {
  isNewUser?: boolean;
  canGenerate: boolean;
  plansRemaining: number;
  hasUsedFreePlan: boolean;
  message: string;
  plansGenerated?: number;
  availablePrompts: number;
  // ✅ Informações de cooldown para prompts
  isInCooldown?: boolean;
  hoursUntilNextPlan?: number;
  nextPlanAvailable?: string;
}

export function useTrial(user: User | null) {
  const [trial, setTrial] = useState<UserTrial | null>(null);
  const [trialStatus, setTrialStatus] = useState<TrialStatus>({
    canGenerate: false,
    plansRemaining: 0,
    hasUsedFreePlan: false,
    availablePrompts: 0,
    message: "Carregando...",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ref para evitar múltiplas chamadas simultâneas
  const fetchingRef = useRef(false);

  // Buscar dados do trial com useCallback
  const fetchTrial = useCallback(async () => {
    if (fetchingRef.current) return; // Prevenir chamadas simultâneas
    fetchingRef.current = true;
    if (!user) {
      setTrial(null);
      setTrialStatus({
        isNewUser: true,
        canGenerate: true,
        plansRemaining: 1,
        hasUsedFreePlan: false,
        availablePrompts: 0,
        message: "Você pode gerar 1 plano grátis!",
      });
      setLoading(false);
      fetchingRef.current = false;
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
        status = {
          isNewUser: true,
          canGenerate: true,
          plansRemaining: 1,
          hasUsedFreePlan: false,
          availablePrompts: 0,
          message: "Você pode gerar 1 plano grátis!",
          plansGenerated: 0,
          isInCooldown: false,
        };
      } else {
        const plansGenerated = trialData.plans_generated || 0;
        const availablePrompts = trialData.available_prompts || 0;
        const maxFreePlans = trialData.max_plans_allowed || 1;
        const freePlansRemaining = Math.max(0, maxFreePlans - plansGenerated);

        // ✅ Calcular cooldown APENAS para prompts do pacote de 3
        // Prompts unitários não têm cooldown - podem ser usados imediatamente
        const packagePrompts = trialData.package_prompts || 0;
        const singlePrompts = availablePrompts - packagePrompts; // Prompts unitários
        const promptCooldownHours = 24; // Configurável: horas de espera entre gerar planos com prompts do pacote
        let isInCooldown = false;
        let hoursUntilNextPlan: number | undefined;
        let nextPlanAvailable: string | undefined;

        console.log("📊 Debug cooldown:", {
          availablePrompts,
          packagePrompts,
          singlePrompts,
          lastPlanGeneratedAt: trialData.last_plan_generated_at,
        });

        // ✅ Calcular cooldown se houver prompts do pacote OU se houver last_plan_generated_at para mostrar informações
        if (trialData.last_plan_generated_at) {
          const lastPlanDate = new Date(trialData.last_plan_generated_at);
          const now = new Date();
          const hoursSinceLastPlan =
            (now.getTime() - lastPlanDate.getTime()) / (1000 * 60 * 60);

          // ✅ Só calcular cooldown se houver prompts do pacote E estiver dentro do período
          if (packagePrompts > 0) {
            const hoursRemaining = promptCooldownHours - hoursSinceLastPlan;

            console.log("⏳ Verificando cooldown do pacote:", {
              hoursSinceLastPlan: hoursSinceLastPlan.toFixed(2),
              hoursRemaining: hoursRemaining.toFixed(2),
              hasSinglePrompts: singlePrompts > 0,
            });

            if (hoursSinceLastPlan < promptCooldownHours) {
              // ✅ Se tem prompts do pacote e está dentro do período de cooldown, mostrar countdown
              isInCooldown = true; // ✅ Sempre mostrar countdown se tem prompts do pacote em cooldown
              hoursUntilNextPlan = Math.max(0, hoursRemaining);
              nextPlanAvailable = new Date(
                now.getTime() + hoursRemaining * 60 * 60 * 1000
              ).toISOString();
              console.log("✅ Countdown do pacote ativo:", {
                isInCooldown,
                hoursUntilNextPlan,
                canStillUseSinglePrompts: singlePrompts > 0,
              });
            } else {
              // ✅ Cooldown terminou, mostrar quando pode gerar novamente (agora)
              hoursUntilNextPlan = 0;
              nextPlanAvailable = now.toISOString();
              console.log("✅ Cooldown do pacote terminou - pode gerar agora");
            }
          } else if (singlePrompts === 0 && availablePrompts === 0) {
            // ✅ Sem prompts mas teve plano gerado - mostrar quando foi o último
            // Isso ajuda o usuário a saber quando pode comprar mais
            nextPlanAvailable = undefined;
          }
        }

        // ✅ Pode gerar se: tem prompts unitários OU (tem prompts do pacote e não está em cooldown) OU tem plano grátis
        const canGenerate =
          singlePrompts > 0 ||
          (packagePrompts > 0 && !isInCooldown) ||
          freePlansRemaining > 0;

        let message: string;
        if (availablePrompts > 0) {
          if (isInCooldown && hoursUntilNextPlan !== undefined) {
            // ✅ Em cooldown do pacote - mas pode ter prompts unitários
            const hours = Math.floor(hoursUntilNextPlan);
            const minutes = Math.floor((hoursUntilNextPlan - hours) * 60);
            const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

            if (singlePrompts > 0) {
              message =
                singlePrompts === 1
                  ? `Você tem 1 prompt disponível agora (sem cooldown). Próximo prompt do pacote disponível em ${timeStr}.`
                  : `Você tem ${singlePrompts} prompts disponíveis agora (sem cooldown). Próximos prompts do pacote disponíveis em ${timeStr}.`;
            } else {
              message =
                packagePrompts === 1
                  ? `Você tem 1 prompt do pacote disponível. Próximo plano pode ser gerado em ${timeStr}.`
                  : `Você tem ${packagePrompts} prompts do pacote disponíveis. Próximo plano pode ser gerado em ${timeStr}.`;
            }
          } else {
            // ✅ Não está em cooldown ou só tem prompts unitários
            if (singlePrompts > 0 && packagePrompts > 0) {
              message =
                singlePrompts === 1
                  ? `Você tem 1 prompt unitário disponível (sem cooldown). ${packagePrompts} prompt(s) do pacote também disponível(is).`
                  : `Você tem ${singlePrompts} prompts unitários disponíveis (sem cooldown). ${packagePrompts} prompt(s) do pacote também disponível(is).`;
            } else if (singlePrompts > 0) {
              message =
                singlePrompts === 1
                  ? "Você tem 1 prompt disponível para gerar planos!"
                  : `Você tem ${singlePrompts} prompts disponíveis para gerar planos!`;
            } else {
              message =
                packagePrompts === 1
                  ? "Você tem 1 prompt disponível para gerar planos!"
                  : `Você tem ${packagePrompts} prompts disponíveis para gerar planos!`;
            }
          }
        } else if (freePlansRemaining > 0) {
          message = "Você pode gerar 1 plano grátis!";
        } else {
          message =
            "Plano gratuito utilizado. Compre prompts para gerar novos planos.";
        }

        const plansRemaining =
          availablePrompts > 0 ? availablePrompts : freePlansRemaining;

        status = {
          isNewUser: false,
          canGenerate,
          plansRemaining,
          hasUsedFreePlan: freePlansRemaining === 0,
          availablePrompts,
          message,
          plansGenerated,
          isInCooldown,
          hoursUntilNextPlan,
          nextPlanAvailable,
        };
      }

      setTrialStatus(status);
      setTrial(trialData || null);

      console.log("✅ Trial atualizado:", {
        availablePrompts: status.availablePrompts,
        plansRemaining: status.plansRemaining,
        canGenerate: status.canGenerate,
        message: status.message,
      });
    } catch (error: unknown) {
      console.error("Erro ao buscar trial:", error);
      setError("Erro ao carregar dados do trial");

      // Fallback em caso de erro
      setTrialStatus({
        isNewUser: true,
        canGenerate: true,
        plansRemaining: 1,
        hasUsedFreePlan: false,
        availablePrompts: 0,
        message: "Você pode gerar 1 plano grátis!",
        plansGenerated: 0,
        isInCooldown: false,
      });
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [user]);

  // Incrementar contador de planos gerados
  const incrementPlanUsage = useCallback(async () => {
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
        // Primeiro plano do usuário (gratuito)
        const { error: insertError } = await supabase
          .from("user_trials")
          .insert({
            user_id: user.id,
            plans_generated: 1,
            last_plan_generated_at: now,
            trial_start_date: now,
            trial_end_date: new Date(
              Date.now() + 365 * 24 * 60 * 60 * 1000
            ).toISOString(),
            is_active: true,
            upgraded_to_premium: false,
            max_plans_allowed: 1,
            available_prompts: 0,
          });

        if (insertError) throw insertError;
      } else {
        const availablePrompts = currentTrial.available_prompts || 0;
        const plansGenerated = currentTrial.plans_generated || 0;
        const maxFreePlans = currentTrial.max_plans_allowed || 1;

        const updateData: Record<string, number | string> = {
          last_plan_generated_at: now,
          plans_generated: plansGenerated + 1,
        };

        if (availablePrompts > 0) {
          updateData.available_prompts = Math.max(availablePrompts - 1, 0);
        } else if (plansGenerated >= maxFreePlans) {
          // Nenhum recurso disponível - prevenir inconsistência
          console.warn(
            "Tentativa de gerar plano sem prompts ou plano grátis disponível."
          );
          return false;
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
  }, [user, fetchTrial]);

  // Carregar trial quando usuário mudar
  useEffect(() => {
    // Resetar dados quando o usuário mudar
    setTrial(null);
    setTrialStatus({
      canGenerate: false,
      plansRemaining: 0,
      hasUsedFreePlan: false,
      availablePrompts: 0,
      message: "Carregando...",
    });
    setError(null);

    if (user?.id) {
      fetchTrial().catch((error) => {
        console.error("Erro em fetchTrial:", error);
        setError("Erro ao carregar dados do trial");
        setLoading(false);
        fetchingRef.current = false;
      });
    } else {
      setLoading(false);
    }
  }, [user?.id, fetchTrial]); // Incluir fetchTrial como dependência

  // ✅ Memoizar o retorno para evitar re-renderizações desnecessárias
  return useMemo(
    () => ({
      trial,
      trialStatus,
      loading,
      error,
      incrementPlanUsage,
      refetch: fetchTrial,
    }),
    [trial, trialStatus, loading, error, incrementPlanUsage, fetchTrial]
  );
}
