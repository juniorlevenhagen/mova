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
  } = useUserProfile(user);
  const router = useRouter();
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const {
    evolutions,
    loading: evolutionLoading,
    isAdding,
    error: evolutionError,
    addEvolution,
  } = useEvolution(user);
  const { isGenerating, generatePlan } = usePlanGeneration();

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

  // Dados do perfil (sempre reais, com fallbacks apenas para campos opcionais)
  const profileData = {
    altura: profile?.height || 0,
    peso: profile?.weight || 0,
    sexo: profile?.gender || "Não informado",
    frequenciaTreinos: profile?.training_frequency || "Não informado",
    objetivo: profile?.objective || "Não informado",
    birthDate: profile?.birth_date || null, // Adicionar data de nascimento
    nivelAtividade: "Moderado", // Valor padrão fixo
  };

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
            onGeneratePlan={generatePlan}
            isGeneratingPlan={isGenerating}
          />

          <EvolutionSection
            evolutions={evolutions}
            onAddEvolution={handleAddEvolucao}
            isAddingEvolution={isAdding}
            userProfile={profileData}
          />
        </div>

        <AddEvolutionModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSubmit={handleModalSubmit}
          isLoading={isAdding}
        />
      </div>
    </ProtectedRoute>
  );
}
