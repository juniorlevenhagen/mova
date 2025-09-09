"use client";

import { useState, useEffect } from "react";
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
import { UpgradeModal } from "./components/UpgradeModal";
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
  treinos: string;
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
  const [premiumOverride, setPremiumOverride] = useState(false);
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
  } = usePlanGeneration();

  const {
    trialStatus,
    loading: trialLoading,
    refetch: refetchTrial,
  } = useTrial(user);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Função combinada para refresh após upload de PDF
  const handlePdfUploadRefresh = async () => {
    // Refresh do perfil
    await refreshProfile();

    // Refresh das evoluções
    await refreshEvolutions();
  };

  // Função para gerar plano e abrir modal
  const handleGeneratePlan = async () => {
    setPlanError(null); // Limpar erros anteriores

    // Se já existe um plano no estado, apenas abrir o modal
    if (plan && planStatus?.isExisting) {
      setShowPlanModal(true);
      return;
    }

    const result = await generatePlan();

    // ✅ Sucesso - recarregar dados do trial e abrir modal
    if (result) {
      await refetchTrial();
      setShowPlanModal(true);
    }
    // ✅ Se houver erro, será tratado pelo useEffect que monitora planGenerationError
  };

  // ✅ Detectar retorno do Stripe e verificar pagamento (ANTES dos early returns)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const upgradeParam = urlParams.get("upgrade");
    const sessionId = urlParams.get("session_id");

    if (upgradeParam === "success" && sessionId && user) {
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

          if (result.success && result.isPremium) {
            setShowUpgradeModal(false);
            setPremiumOverride(true);

            // Refresh do trial status após confirmar premium
            setTimeout(() => {
              refetchTrial();
            }, 500);
          }
        } catch (error) {
          console.error("❌ Erro ao verificar pagamento:", error);
        }

        // Limpar URL sempre
        const newUrl = window.location.pathname;
        window.history.replaceState({}, "", newUrl);
      };

      verifyPayment();
    } else if (upgradeParam === "success" && user) {
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
          if (res.success && res.isPremium) {
            setShowUpgradeModal(false);
            setPremiumOverride(true);
            setTimeout(() => {
              refetchTrial();
            }, 500);
          }
        } catch (e) {
          console.error("❌ Fallback verify-payment falhou:", e);
        } finally {
          const newUrl = window.location.pathname;
          window.history.replaceState({}, "", newUrl);
        }
      };

      runFallback();
    }
  }, [refetchTrial, user]);

  // ✅ Monitorar erros do hook de geração de planos
  useEffect(() => {
    if (planGenerationError) {
      setPlanError(planGenerationError);

      // Esconder erro após 8 segundos
      setTimeout(() => {
        setPlanError(null);
      }, 8000);
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

  // Mostrar loading enquanto verifica autenticação e carrega dados
  if (
    authLoading ||
    profileLoading ||
    evolutionLoading ||
    isCheckingStatus ||
    trialLoading
  ) {
    return (
      <div className="min-h-screen bg-[#f5f1e8] flex items-center justify-center">
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

  // Não renderizar nada se não estiver autenticado
  if (!user) {
    return null;
  }

  // Dados do usuário (reais ou fallback)
  const userDisplayData = {
    full_name:
      userData?.full_name ||
      user.user_metadata?.full_name ||
      user.email?.split("@")[0] ||
      "Usuário",
    email: userData?.email || user.email || "",
  };

  // Verificar se precisa completar o registro
  const needsProfileCompletion = !profile;

  // Dados do perfil (sempre reais, com fallbacks apenas para campos opcionais)
  const profileData = {
    altura: profile?.height || 0,
    peso: profile?.weight || 0, // Peso atual
    pesoInicial: profile?.initial_weight || 0, // Peso inicial
    sexo: profile?.gender || "Não informado",
    frequenciaTreinos: profile?.training_frequency || "Não informado",
    objetivo: profile?.objective || "Não informado",
    birthDate: profile?.birth_date || null,
    nivelAtividade: "Moderado", // Valor padrão fixo
  };

  // Log para debug - verificar se os dados estão chegando do hook

  // Dados de trial (usando dados reais do hook)
  const isPremiumUI = premiumOverride || (trialStatus?.isPremium ?? false);
  const trialData = {
    diasRestantes: trialStatus?.daysRemaining || 7,
    totalDias: 7,
    requisicoesRestantes: isPremiumUI
      ? typeof trialStatus?.plansRemaining === "number"
        ? trialStatus.plansRemaining
        : 2
      : typeof trialStatus?.plansRemaining === "number"
      ? trialStatus.plansRemaining
      : 1,
    totalRequisicoes: isPremiumUI ? 2 : 1,
  };

  // Debug removido - sistema funcionando

  // Removido trialPercent pois não está sendo usado no componente

  const handleLogout = async () => {
    setLogoutLoading(true);
    await supabase.auth.signOut();
    router.push("/");
    setLogoutLoading(false);
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
                experiência, complete seu registro com informações físicas.{" "}
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
      <div className="min-h-screen bg-[#f5f1e8] p-4">
        <div className="max-w-3xl mx-auto space-y-8">
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
            trial={trialData}
            onUpgrade={handleUpgrade}
            isPremium={isPremiumUI}
          />

          <UserDataSection
            profile={profileData}
            onGeneratePlan={handleGeneratePlan}
            isGeneratingPlan={isGenerating}
            onProfileUpdate={handlePdfUploadRefresh}
            planStatus={planStatus}
            isCheckingPlanStatus={isCheckingStatus}
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
        />

        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          isPremium={isPremiumUI}
        />
      </div>
    </ProtectedRoute>
  );
}
