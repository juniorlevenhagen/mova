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
import { useEvolution } from "@/hooks/useEvolution";
import { usePlanGeneration } from "@/hooks/usePlanGeneration";
import { ProtectedRoute } from "@/components/ProtectedRoute";

interface EvolutionData {
  peso: string;
  percentualGordura: string;
  massaMagra: string;
  cintura: string;
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
  const { isGenerating, plan, planStatus, generatePlan } = usePlanGeneration();

  // Função combinada para refresh após upload de PDF
  const handlePdfUploadRefresh = async () => {
    console.log("🔄 Iniciando refresh completo após upload PDF...");

    // Refresh do perfil
    await refreshProfile();
    console.log("✅ Perfil refreshed");

    // Refresh das evoluções
    await refreshEvolutions();
    console.log("✅ Evoluções refreshed");

    console.log("🎉 Refresh completo finalizado!");
  };

  // Função para gerar plano e abrir modal
  const handleGeneratePlan = async () => {
    try {
      await generatePlan();
      setShowPlanModal(true);
    } catch (error) {
      console.error("Erro ao gerar plano:", error);
    }
  };

  // Proteção mais robusta
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        console.log("Usuário não autenticado, redirecionando...");
        router.replace("/auth/login");
      } else {
        console.log("Usuário autenticado:", user.email);
      }
    }
  }, [user, authLoading, router]);

  // Mostrar loading enquanto verifica autenticação e carrega dados
  if (authLoading || profileLoading || evolutionLoading) {
    return (
      <div className="min-h-screen bg-[#f5f1e8] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {authLoading
              ? "Verificando autenticação..."
              : profileLoading
              ? "Carregando perfil..."
              : "Carregando evoluções..."}
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
  console.log("🏠 Dashboard - Dados do profile:", profile);
  console.log("📊 Dashboard - ProfileData processado:", profileData);

  // Dados de trial (ainda mockados - será implementado depois)
  const trial = {
    diasRestantes: 5,
    totalDias: 7,
    requisicoesRestantes: 3,
    totalRequisicoes: 5,
  };

  const trialPercent =
    ((trial.totalDias - trial.diasRestantes) / trial.totalDias) * 100;

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

          <TrialSection trial={trial} trialPercent={trialPercent} />

          <UserDataSection
            profile={profileData}
            onGeneratePlan={handleGeneratePlan}
            isGeneratingPlan={isGenerating}
            onProfileUpdate={handlePdfUploadRefresh}
            planStatus={planStatus}
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
      </div>
    </ProtectedRoute>
  );
}
