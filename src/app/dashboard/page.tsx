"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { DashboardHeader } from "./components/DashboardHeader";
import { TrialSection } from "./components/TrialSection";
import { UserDataSection } from "./components/UserDataSection";
import { EvolutionSection } from "./components/EvolutionSection";
import { AddEvolutionModal } from "./modals/AddEvolutionModal";
import { useEvolution } from "@/hooks/useEvolution";
import { usePlanGeneration } from "@/hooks/usePlanGeneration";

interface EvolutionData {
  peso: string;
  treinos: string;
  bemEstar: string;
  observacoes: string;
  arquivoAvaliacao?: File;
}

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  // MOCKS
  const user = {
    full_name: "João Silva",
    email: "joao@email.com",
  };
  const profile = {
    altura: 178,
    peso: 75,
    sexo: "Masculino",
    frequenciaTreinos: "4x por semana",
    objetivo: "Hipertrofia",
  };
  const trial = {
    diasRestantes: 5,
    totalDias: 7,
    requisicoesRestantes: 3,
    totalRequisicoes: 5,
  };

  const trialPercent =
    ((trial.totalDias - trial.diasRestantes) / trial.totalDias) * 100;

  const router = useRouter();
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const { isAdding, addEvolution } = useEvolution();
  const { isGenerating, generatePlan } = usePlanGeneration();

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
    <div className="min-h-screen bg-[#f5f1e8] p-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <DashboardHeader
          user={user}
          onLogout={handleLogout}
          logoutLoading={logoutLoading}
        />

        <TrialSection trial={trial} trialPercent={trialPercent} />

        <UserDataSection
          profile={profile}
          onGeneratePlan={generatePlan}
          isGeneratingPlan={isGenerating}
        />

        <EvolutionSection
          onAddEvolution={handleAddEvolucao}
          isAddingEvolution={isAdding}
        />
      </div>

      <AddEvolutionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleModalSubmit}
        isLoading={isAdding}
      />

      {showDetailsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Detalhes da Evolução
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Data:</span>
                <span className="font-medium">10/06/2024</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Peso:</span>
                <span className="font-medium">75kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Treinos na semana:</span>
                <span className="font-medium">4</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Bem-estar:</span>
                <span className="font-medium">4/5 - Muito bem</span>
              </div>
              <div className="border-t pt-3">
                <span className="text-gray-600 block mb-2">Observação:</span>
                <p className="text-gray-800 bg-gray-50 p-3 rounded">
                  &ldquo;Treinos muito bons esta semana, sentindo mais força nos
                  exercícios. Consegui aumentar a carga em alguns
                  exercícios.&rdquo;
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowDetailsModal(false)}
              className="mt-6 w-full bg-gray-800 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-900 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
