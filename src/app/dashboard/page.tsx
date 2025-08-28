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

  const {
    evolutions,
    loading: evolutionLoading,
    isAdding,
    error: evolutionError,
    addEvolution,
    refetch: refreshEvolutions,
  } = useEvolution(user);
  const { isGenerating, plan, planStatus, isCheckingStatus, generatePlan } =
    usePlanGeneration();

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
    try {
      // Se já existe um plano no estado, apenas abrir o modal
      if (plan && planStatus?.isExisting) {
        setShowPlanModal(true);
        return;
      }

      await generatePlan();

      // ✅ Recarregar dados do trial após gerar plano
      await refetchTrial();

      setShowPlanModal(true);
    } catch (error) {
      console.error("❌ Erro ao gerar plano:", error);
      // Não abrir modal se houver erro
    }
  };

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
  const trialData = {
    diasRestantes: trialStatus?.daysRemaining || 7,
    totalDias: 7,
    requisicoesRestantes: trialStatus?.plansRemaining ?? 1, // Usar ?? para não sobrescrever 0
    totalRequisicoes: trialStatus?.isPremium ? 2 : 1,
  };

  // Debug: Log dos dados do trial
  console.log("Trial Status:", {
    plansRemaining: trialStatus?.plansRemaining,
    isPremium: trialStatus?.isPremium,
    canGenerate: trialStatus?.canGenerate,
    message: trialStatus?.message,
  });

  // Debug: Log dos dados passados para o TrialSection
  console.log("Trial Data para TrialSection:", {
    diasRestantes: trialData.diasRestantes,
    requisicoesRestantes: trialData.requisicoesRestantes,
    totalRequisicoes: trialData.totalRequisicoes,
    hasUsedFreePlan: trialData.requisicoesRestantes === 0,
  });

  const trialPercent = trialStatus?.isPremium
    ? ((2 - (trialStatus?.plansRemaining || 0)) / 2) * 100
    : ((trialData.totalDias - trialData.diasRestantes) / trialData.totalDias) *
      100;

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

  const handleUpgradeConfirm = () => {
    // TODO: Implementar integração com gateway de pagamento
    alert("Funcionalidade de pagamento será implementada em breve!");
    setShowUpgradeModal(false);
  };

  // Função de debug para limpar cache
  const handleClearCache = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
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

          {/* Botão de debug temporário */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-yellow-800">
                  <strong>Debug:</strong> Usuário ID: {user.id}
                </p>
                <p className="text-xs text-yellow-600 mt-1">
                  Se estiver vendo dados incorretos, clique em &quot;Limpar
                  Cache&quot;
                </p>
              </div>
              <button
                onClick={handleClearCache}
                className="px-3 py-1 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600"
              >
                Limpar Cache
              </button>
            </div>
          </div>

          <TrialSection
            trial={trialData}
            trialPercent={trialPercent}
            onUpgrade={handleUpgrade}
            isPremium={trialStatus?.isPremium || false}
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
          onUpgrade={handleUpgradeConfirm}
        />
      </div>
    </ProtectedRoute>
  );
}
