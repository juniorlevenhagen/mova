"use client";

import { useState, useEffect, useMemo, startTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { DashboardHeader } from "./components/DashboardHeader";
import { TrialSection } from "./components/TrialSection";
import { UserDataSection } from "./components/UserDataSection";
import { EvolutionSection } from "./components/EvolutionSection";
import { AddEvolutionModal } from "./modals/AddEvolutionModal";
import { PersonalizedPlanModal } from "./components/PersonalizedPlanModal";
import { PromptPurchaseModal } from "./components/PromptPurchaseModal";
import { CooldownModal } from "./components/CooldownModal";
import { PlanHistoryModal } from "./components/PlanHistoryModal";
import { useEvolution } from "@/hooks/useEvolution";
import { usePlanGeneration } from "@/hooks/usePlanGeneration";
import { useTrial } from "@/hooks/useTrial";
import { ProtectedRoute } from "@/components/ProtectedRoute";

interface EvolutionData {
  peso: string;
  percentualGordura: string;
  massaMagra: string;
  cintura: string;
  quadril: string;
  braco: string;
  coxa: string;
  bemEstar: string;
  observacoes: string;
  objetivo: string;
  nivelAtividade: string;
  arquivoAvaliacao?: File;
}

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const {
    profile,
    userData,
    loading: profileLoading,
    error,
    refreshProfile,
  } = useUserProfile(user);
  const router = useRouter();
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);

  const {
    evolutions,
    loading: evolutionLoading,
    isAdding,
    error: evolutionError,
    addEvolution,
    refetch: refreshEvolutions,
  } = useEvolution(user);
  const {
    isGenerating,
    plan,
    planStatus,
    isCheckingStatus,
    generatePlan,
    error: planGenerationError,
    refetchPlanStatus,
  } = usePlanGeneration();

  const {
    trialStatus,
    loading: trialLoading,
    refetch: refetchTrial,
  } = useTrial(user);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showCooldownModal, setShowCooldownModal] = useState(false);
  const verifyRunning = useRef(false);
  const [cooldownData, setCooldownData] = useState<{
    message: string;
    hoursRemaining?: number;
    nextPlanAvailable?: string;
    availablePrompts?: number;
  } | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Função combinada para refresh após upload de PDF
  const handlePdfUploadRefresh = async () => {
    // Refresh do perfil
    await refreshProfile(true);

    // Refresh das evoluções
    await refreshEvolutions(true);
  };

  // Função para gerar plano e abrir modal
  const handleGeneratePlan = async () => {
    setPlanError(null); // Limpar erros anteriores
    setShowCooldownModal(false); // Fechar modal de cooldown se estiver aberto

    // ✅ Verificar se deve mostrar plano existente OU gerar novo
    // IMPORTANTE: Se há prompts disponíveis, sempre tentar gerar novo (mesmo com plano existente)
    const hasAvailablePrompts = (trialStatus?.availablePrompts || 0) > 0;
    const canGenerateNew = trialStatus?.canGenerate === true;

    // ✅ Se tem prompts disponíveis E pode gerar, sempre gerar novo plano
    // ✅ Se NÃO tem prompts E tem plano existente, mostrar plano existente
    if (
      plan &&
      planStatus?.isExisting === true &&
      !hasAvailablePrompts &&
      !canGenerateNew
    ) {
      // Apenas mostrar plano existente se NÃO há créditos disponíveis E NÃO pode gerar
      console.log("📌 Mostrando plano existente (sem créditos disponíveis)");
      setShowPlanModal(true);
      return;
    }

    // ✅ Gerar novo plano (tem créditos OU pode gerar)
    console.log("🔄 Gerando novo plano...", {
      hasAvailablePrompts,
      canGenerateNew,
    });
    try {
      const result = await generatePlan();

      // ✅ Sucesso - recarregar dados do trial e abrir modal
      if (result) {
        await refetchTrial(true);
        setShowPlanModal(true);
      } else {
        // ✅ Se result é null, pode ser erro de créditos que não foi lançado
        // Verificar erro do hook
        if (planGenerationError) {
          const errorMessage = planGenerationError;
          if (
            errorMessage.includes("limite de planos gratuitos") ||
            errorMessage.includes("Compre créditos")
          ) {
            console.log(
              "💳 Erro de créditos detectado (via planGenerationError), abrindo modal de compra"
            );
            setShowUpgradeModal(true);
            return;
          }
        }
      }
    } catch (error: unknown) {
      // ✅ Capturar erro de cooldown especificamente
      const errorMessage =
        error instanceof Error ? error.message : "Erro ao gerar plano";

      // ✅ Type guard para erro de créditos
      interface CreditsError extends Error {
        type?: string;
        errorCode?: string;
        actionRequired?: string;
        availablePrompts?: number;
      }

      const isCreditsError = (err: unknown): err is CreditsError => {
        return (
          typeof err === "object" &&
          err !== null &&
          ("type" in err || "errorCode" in err) &&
          ((err as CreditsError).type === "TRIAL_LIMIT_REACHED" ||
            (err instanceof Error &&
              (err.message.includes("limite de planos gratuitos") ||
                err.message.includes("Compre créditos"))))
        );
      };

      const creditsError = isCreditsError(error) ? error : null;

      // ✅ Verificar se é erro de créditos (limite atingido) - PRIORIDADE ALTA
      if (
        creditsError ||
        errorMessage.includes("limite de planos gratuitos") ||
        errorMessage.includes("Compre prompts") ||
        (typeof error === "object" &&
          error !== null &&
          "type" in error &&
          (error as { type?: string }).type === "TRIAL_LIMIT_REACHED")
      ) {
        // ✅ Erro de créditos detectado - abrir modal sem logar no console
        setShowUpgradeModal(true);
        setPlanError(null); // Limpar qualquer erro anterior
        // Não mostrar erro adicional, o modal já explica
        return;
      }

      // ✅ Type guard para erro de cooldown
      interface CooldownError extends Error {
        type?: string;
        hoursRemaining?: number;
        nextPlanAvailable?: string;
        availablePrompts?: number;
      }

      const isCooldownError = (err: unknown): err is CooldownError => {
        return (
          typeof err === "object" &&
          err !== null &&
          ("type" in err || "message" in err) &&
          ((err as CooldownError).type === "COOLDOWN_ACTIVE" ||
            (err instanceof Error &&
              (err.message.includes("Aguarde") ||
                err.message.includes("cooldown") ||
                err.message.includes("Cooldown"))))
        );
      };

      const cooldownError = isCooldownError(error) ? error : null;

      // ✅ Verificar se é erro de cooldown (por tipo ou mensagem)
      if (
        cooldownError?.type === "COOLDOWN_ACTIVE" ||
        errorMessage.includes("Aguarde") ||
        errorMessage.includes("cooldown") ||
        errorMessage.includes("Cooldown")
      ) {
        // ✅ Usar dados do erro se disponíveis, senão extrair da mensagem
        const hoursRemaining =
          cooldownError?.hoursRemaining ||
          (() => {
            const hoursMatch = errorMessage.match(/(\d+)h/);
            const minutesMatch = errorMessage.match(/(\d+)m/);
            const hours = hoursMatch ? parseInt(hoursMatch[1]) : 24;
            const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
            return hours + minutes / 60;
          })();

        const nextPlanAvailable =
          cooldownError?.nextPlanAvailable ||
          (() => {
            const now = new Date();
            return new Date(
              now.getTime() + hoursRemaining * 60 * 60 * 1000
            ).toISOString();
          })();

        const availablePrompts =
          cooldownError?.availablePrompts || trialStatus?.availablePrompts || 0;

        setCooldownData({
          message: errorMessage,
          hoursRemaining,
          nextPlanAvailable,
          availablePrompts,
        });
        setShowCooldownModal(true);

        // ✅ Prevenir que o erro apareça no console após ser tratado
        // O erro já foi capturado e o modal será aberto
        return; // Retornar aqui para não propagar o erro
      } else {
        // Outros erros - mostrar na mensagem padrão
        console.log("⚠️ Erro não é de cooldown, mostrando mensagem padrão");
        setPlanError(errorMessage);
      }
    }
  };

  // ✅ Detectar retorno do Stripe e verificar pagamento (ANTES dos early returns)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const purchaseParam = urlParams.get("purchase");
    const upgradeParam = urlParams.get("upgrade"); // Mantém compatibilidade com código antigo
    const sessionId = urlParams.get("session_id");

    // Suporta tanto "purchase" (novo) quanto "upgrade" (antigo)
    const isSuccess =
      (purchaseParam === "success" || upgradeParam === "success") &&
      sessionId &&
      user;

    if (isSuccess && !verifyRunning.current) {
      verifyRunning.current = true;

      // Limpar URL imediatamente para evitar re-execução em re-renders rápidos
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);

      const verifyPayment = async () => {
        try {
          // Obter token de autenticação
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (!session?.access_token) return;

          // Verificar pagamento no Stripe
          const response = await fetch("/api/verify-payment", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ sessionId }),
          });

          const result = await response.json();

          console.log("📋 Resultado do verify-payment:", result);

          if (result.success) {
            // ✅ Atualizações críticas para UI - IMEDIATAS (sem startTransition)
            setShowUpgradeModal(false);

            // ✅ Verificar se os prompts já foram adicionados pelo webhook
            const promptsAlreadyAdded = (result.availablePrompts || 0) > 0;

            console.log(
              `📊 Prompts já adicionados pelo webhook? ${promptsAlreadyAdded} (availablePrompts: ${result.availablePrompts})`
            );

            // ✅ Aguardar refetchTrial() terminar antes de refetchPlanStatus()
            // Se os prompts ainda não foram adicionados, aguardar mais tempo e fazer retry
            startTransition(async () => {
              console.log("🔄 Recarregando dados após pagamento...");

              // Se os prompts não foram adicionados ainda, aguardar e fazer retry
              if (!promptsAlreadyAdded) {
                console.log(
                  "⏳ Aguardando webhook processar (pode levar alguns segundos)..."
                );
                let retries = 5;
                let promptsFound = false;

                while (retries > 0 && !promptsFound) {
                  await new Promise((resolve) => setTimeout(resolve, 2000)); // Aguardar 2s entre tentativas
                  await refetchTrial(true);
                  // Verificar novamente após refetch
                  const {
                    data: { session: checkSession },
                  } = await supabase.auth.getSession();
                  if (checkSession?.access_token) {
                    const checkResponse = await fetch("/api/verify-payment", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${checkSession.access_token}`,
                      },
                      body: JSON.stringify({}),
                    });
                    const checkResult = await checkResponse.json();
                    promptsFound = (checkResult.availablePrompts || 0) > 0;
                    console.log(
                      `🔄 Tentativa ${6 - retries}/5: availablePrompts=${checkResult.availablePrompts}`,
                      promptsFound ? "✅ Encontrado!" : "⏳ Aguardando..."
                    );
                  }
                  retries--;
                }

                if (!promptsFound) {
                  console.warn(
                    "⚠️ Webhook pode não ter processado ainda. Tente recarregar a página."
                  );
                }
              } else {
                // Prompts já foram adicionados, apenas recarregar
                await refetchTrial(true);
              }

              console.log("🔄 Recarregando status do plano...");
              refetchPlanStatus(); // Recarregar status do plano após compra de prompts
            });
          }
        } catch (error) {
          console.error("❌ Erro ao verificar pagamento:", error);
        }
      };

      verifyPayment();
    } else if (
      (purchaseParam === "success" || upgradeParam === "success") &&
      user &&
      !verifyRunning.current
    ) {
      verifyRunning.current = true;

      // Limpar URL imediatamente
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);

      // Fallback sem session_id: tentar ativar premium via /api/verify-payment
      const runFallback = async () => {
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (!session?.access_token) return;

          const response = await fetch("/api/verify-payment", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({}),
          });

          const res = await response.json();
          console.log("📋 Resultado do verify-payment (fallback):", res);

          if (res.success) {
            setShowUpgradeModal(false);
            const promptsAlreadyAdded = (res.availablePrompts || 0) > 0;
            console.log(
              `📊 Prompts já adicionados (fallback)? ${promptsAlreadyAdded} (availablePrompts: ${res.availablePrompts})`
            );

            // ✅ Aguardar refetchTrial terminar antes de refetchPlanStatus
            console.log("🔄 Recarregando dados após pagamento (fallback)...");

            if (!promptsAlreadyAdded) {
              console.log("⏳ Aguardando webhook processar (fallback)...");
              // Aguardar mais tempo no fallback
              await new Promise((resolve) => setTimeout(resolve, 3000));
            }

            await refetchTrial(true);
            console.log("🔄 Recarregando status do plano (fallback)...");
            refetchPlanStatus();
          }
        } catch (e) {
          console.error("❌ Fallback verify-payment falhou:", e);
        }
      };

      runFallback();
    }
  }, [refetchTrial, refetchPlanStatus, user]);

  // ✅ Monitorar erros do hook de geração de planos
  useEffect(() => {
    if (planGenerationError) {
      const errorMessage = planGenerationError;

      // ✅ Verificar se é erro de créditos e abrir modal automaticamente
      if (
        errorMessage.includes("limite de planos gratuitos") ||
        errorMessage.includes("Compre prompts") ||
        errorMessage.includes("TRIAL_LIMIT_REACHED")
      ) {
        console.log(
          "💳 Erro de créditos detectado (via useEffect), abrindo modal de compra"
        );
        setShowUpgradeModal(true);
        setPlanError(null); // Não mostrar erro adicional, o modal já explica
      } else {
        // Outros erros - mostrar na mensagem padrão
        setPlanError(errorMessage);

        // Esconder erro após 8 segundos
        setTimeout(() => {
          setPlanError(null);
        }, 8000);
      }
    } else {
      setPlanError(null);
    }
  }, [planGenerationError]);

  // Proteção mais robusta
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace("/auth/login");
      } else {
      }
    }
  }, [user, authLoading, router]);

  // ✅ Mover TODOS os useMemo para aqui (antes dos early returns)
  const userDisplayData = useMemo(
    () => ({
      full_name:
        userData?.full_name ||
        user?.user_metadata?.full_name ||
        user?.email?.split("@")[0] ||
        "Usuário",
      email: userData?.email || user?.email || "",
    }),
    [userData, user]
  );

  const profileData = useMemo(
    () => ({
      altura: profile?.height || 0,
      peso: profile?.weight || 0,
      pesoInicial: profile?.initial_weight || 0,
      sexo: profile?.gender || "Não informado",
      frequenciaTreinos: profile?.training_frequency || "Não informado",
      objetivo: profile?.objective || "Não informado",
      birthDate: profile?.birth_date || null,
      nivelAtividade: profile?.nivel_atividade || "Moderado",
      tempoTreino: profile?.training_time || "",
      dietaryRestrictions: profile?.dietary_restrictions || "Nenhuma",
      foodBudget: profile?.food_budget || "moderado",
    }),
    [profile]
  );

  // ✅ Early returns DEPOIS dos hooks
  if (
    authLoading ||
    profileLoading ||
    evolutionLoading ||
    isCheckingStatus ||
    trialLoading
  ) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {authLoading
              ? "Verificando autenticação..."
              : profileLoading
                ? "Carregando perfil..."
                : evolutionLoading
                  ? "Carregando evoluções..."
                  : "Verificando planos..."}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Verificar se precisa completar o registro
  const needsProfileCompletion = !profile;

  // Log para debug - verificar se os dados estão chegando do hook

  // Dados de trial (usando dados reais do hook)
  const trialStatusForUI = trialStatus ?? {
    canGenerate: false,
    plansRemaining: 0,
    hasUsedFreePlan: true,
    availablePrompts: 0,
    message: "Carregando...",
    isInCooldown: false,
    hoursUntilNextPlan: undefined,
    nextPlanAvailable: undefined,
  };

  // Debug removido - sistema funcionando

  // Removido trialPercent pois não está sendo usado no componente

  const handleLogout = async () => {
    try {
      setLogoutLoading(true);

      // Limpar todos os dados de armazenamento ANTES do logout
      localStorage.clear();
      sessionStorage.clear();

      // Limpar cookies do Supabase manualmente antes do logout
      if (typeof document !== "undefined") {
        const cookies = document.cookie.split(";");
        cookies.forEach((cookie) => {
          const eqPos = cookie.indexOf("=");
          const name =
            eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
          // Limpar cookies do Supabase
          if (name.includes("supabase") || name.includes("sb-")) {
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
          }
        });
      }

      // Fazer logout do Supabase com scope global para limpar todos os dados
      const { error } = await supabase.auth.signOut({ scope: "global" });

      if (error) {
        console.error("Erro ao fazer logout:", error);
      }

      // Aguardar um pouco para garantir que o logout foi processado
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Redirecionar usando window.location para garantir reload completo
      window.location.href = "/auth/login";
    } catch (error) {
      console.error("Erro inesperado no logout:", error);
      // Mesmo com erro, tentar redirecionar e limpar tudo
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "/auth/login";
    } finally {
      setLogoutLoading(false);
    }
  };

  const handleAddEvolucao = () => {
    setShowModal(true);
  };

  const handleModalSubmit = async (data: EvolutionData) => {
    await addEvolution(data);
    setShowModal(false);
  };

  const handleUpgrade = () => {
    setShowUpgradeModal(true);
  };

  return (
    <ProtectedRoute>
      {/* Aviso para completar registro */}
      {needsProfileCompletion && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Complete seu perfil:</strong> Para uma melhor
                experiência, complete seu registro com informações físicas{" "}
                <a
                  href="/register/step2"
                  className="font-medium underline hover:text-yellow-600"
                >
                  Completar agora
                </a>
              </p>
            </div>
          </div>
        </div>
      )}
      <div className="min-h-screen bg-white p-4 sm:p-6">
        <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8">
          {/* ✅ Alerta de erro ao gerar plano */}
          {planError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-red-800 font-medium">
                    Limite de Planos Atingido
                  </h3>
                  <p className="text-red-700 text-sm">{planError}</p>
                  {planError.includes("Faça upgrade") && (
                    <button
                      onClick={() => setShowUpgradeModal(true)}
                      className="mt-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Fazer Upgrade Agora
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Mostrar erros se houver */}
          {(error || evolutionError) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">
                    {error || evolutionError}
                  </p>
                </div>
              </div>
            </div>
          )}

          <DashboardHeader
            user={userDisplayData}
            onLogout={handleLogout}
            logoutLoading={logoutLoading}
          />

          <TrialSection
            status={trialStatusForUI}
            onBuyPrompts={handleUpgrade}
          />

          <UserDataSection
            profile={profileData}
            onGeneratePlan={handleGeneratePlan}
            isGeneratingPlan={isGenerating}
            onProfileUpdate={handlePdfUploadRefresh}
            planStatus={planStatus}
            isCheckingPlanStatus={isCheckingStatus}
            onViewHistory={() => setShowHistoryModal(true)}
            trialStatus={trialStatusForUI}
          />

          <EvolutionSection
            evolutions={evolutions}
            onAddEvolution={handleAddEvolucao}
            isAddingEvolution={isAdding}
            userProfile={profileData}
            loading={evolutionLoading}
          />
        </div>

        <AddEvolutionModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSubmit={handleModalSubmit}
          isLoading={isAdding}
        />

        <PersonalizedPlanModal
          isOpen={showPlanModal}
          onClose={() => setShowPlanModal(false)}
          plan={plan}
          userProfile={profileData}
        />

        <PromptPurchaseModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
        />

        {/* Modal de Cooldown */}
        {cooldownData && (
          <CooldownModal
            isOpen={showCooldownModal}
            onClose={() => {
              setShowCooldownModal(false);
              setCooldownData(null);
            }}
            message={cooldownData.message}
            hoursRemaining={cooldownData.hoursRemaining}
            nextPlanAvailable={cooldownData.nextPlanAvailable}
            availablePrompts={cooldownData.availablePrompts}
          />
        )}

        {/* Modal de Histórico de Planos */}
        <PlanHistoryModal
          isOpen={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
          userProfile={profileData}
        />
      </div>
    </ProtectedRoute>
  );
}
