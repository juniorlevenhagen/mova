"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

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

  // Barra de progresso (dias de teste)
  const trialPercent =
    ((trial.totalDias - trial.diasRestantes) / trial.totalDias) * 100;

  const router = useRouter();
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [isAddingEvolution, setIsAddingEvolution] = useState(false);
  const [modalData, setModalData] = useState({
    peso: "",
    treinos: "",
    bemEstar: "3",
    observacoes: "",
  });

  const handleLogout = async () => {
    setLogoutLoading(true);
    await supabase.auth.signOut();
    router.push("/");
    setLogoutLoading(false);
  };

  const handleAddEvolucao = () => {
    setShowModal(true);
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingEvolution(true);

    try {
      // Simular delay de salvamento
      await new Promise((resolve) => setTimeout(resolve, 2000));
      console.log("Dados da evolução:", modalData);
      setShowModal(false);
      setModalData({ peso: "", treinos: "", bemEstar: "3", observacoes: "" });
    } catch (error) {
      console.error("Erro ao salvar evolução:", error);
    } finally {
      setIsAddingEvolution(false);
    }
  };

  const handleModalChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setModalData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGerarPlano = async () => {
    setIsGeneratingPlan(true);

    try {
      // Simular delay de geração do plano
      await new Promise((resolve) => setTimeout(resolve, 3000));
      console.log("Gerando plano personalizado...");
      // Aqui você implementaria a lógica real de geração
    } catch (error) {
      console.error("Erro ao gerar plano:", error);
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f1e8] p-4">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header com logout */}
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-2xl font-bold text-gray-800">
            Olá, {user.full_name}! Seja bem-vindo ao Mova+.
          </h1>
          <button
            onClick={handleLogout}
            disabled={logoutLoading}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {logoutLoading ? "Saindo..." : "Sair"}
          </button>
        </div>

        {/* Seção: Período de Teste */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            Seu Período de Teste
          </h2>
          <div className="flex flex-col md:flex-row md:items-center md:gap-8 gap-2 mb-2">
            <span className="text-gray-700 text-base">
              ⏱ Faltam <span className="font-bold">{trial.diasRestantes}</span>{" "}
              dias do seu teste gratuito.
            </span>
            <span className="text-gray-700 text-base">
              🧠 Você pode gerar mais{" "}
              <span className="font-bold">{trial.requisicoesRestantes}</span>{" "}
              planos personalizados.
            </span>
          </div>
          {/* Barra de progresso */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <div
              className="bg-green-500 h-3 rounded-full transition-all"
              style={{ width: `${trialPercent}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Aproveite o máximo durante esse período!
          </p>
        </div>

        {/* Seção: Dados do Usuário */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Seus Dados
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <span className="block text-gray-500 text-sm">Altura</span>
              <span className="block text-gray-800 font-bold">
                {profile.altura} cm
              </span>
            </div>
            <div>
              <span className="block text-gray-500 text-sm">Peso</span>
              <span className="block text-gray-800 font-bold">
                {profile.peso} kg
              </span>
            </div>
            <div>
              <span className="block text-gray-500 text-sm">IMC</span>
              <span className="block text-gray-800 font-bold">23.7</span>
              <span className="block text-xs text-green-600">Peso normal</span>
            </div>
            <div>
              <span className="block text-gray-500 text-sm">Sexo</span>
              <span className="block text-gray-800 font-bold">
                {profile.sexo}
              </span>
            </div>
            <div>
              <span className="block text-gray-500 text-sm">
                Frequência de Treinos
              </span>
              <span className="block text-gray-800 font-bold">
                {profile.frequenciaTreinos}
              </span>
            </div>
            <div>
              <span className="block text-gray-500 text-sm">Objetivo</span>
              <span className="block text-gray-800 font-bold">
                {profile.objetivo}
              </span>
            </div>
            <div>
              <span className="block text-gray-500 text-sm">
                Caloria Basal Estimada
              </span>
              <span className="block text-gray-800 font-bold">1.850 kcal</span>
            </div>
            <div>
              <span className="block text-gray-500 text-sm">Idade</span>
              <span className="block text-gray-800 font-bold">28 anos</span>
            </div>
            <div>
              <span className="block text-gray-500 text-sm">
                Nível de Atividade
              </span>
              <span className="block text-gray-800 font-bold">Moderado</span>
            </div>
          </div>

          {/* Botão para gerar plano personalizado */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <button
              onClick={handleGerarPlano}
              disabled={isGeneratingPlan}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isGeneratingPlan ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Gerando Plano...
                </>
              ) : (
                "Gerar Plano Personalizado (Treino + Dieta)"
              )}
            </button>
          </div>
        </div>

        {/* Seção: Evolução do Usuário */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mt-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Sua Evolução
          </h2>

          {/* Cards de métricas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <h3 className="text-sm text-gray-600">Peso Atual</h3>
              <p className="text-2xl font-bold text-gray-800">75kg</p>
              <p className="text-xs text-green-600">-2kg este mês</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <h3 className="text-sm text-gray-600">Treinos/Semana</h3>
              <p className="text-2xl font-bold text-green-600">4</p>
              <p className="text-xs text-green-600">Meta atingida</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <h3 className="text-sm text-gray-600">Bem-estar</h3>
              <p className="text-2xl font-bold text-blue-600">4/5</p>
              <p className="text-xs text-blue-600">Muito bem</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <h3 className="text-sm text-gray-600">Sequência</h3>
              <p className="text-2xl font-bold text-gray-800">12 dias</p>
              <p className="text-xs text-gray-600">Última atualização</p>
            </div>
          </div>

          {/* Gráfico mockado */}
          <div className="w-full h-40 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
            <span className="text-gray-400">[Gráfico de evolução aqui]</span>
          </div>

          {/* Últimos registros mockados */}
          <div className="space-y-2">
            <div className="grid grid-cols-5 gap-2 text-sm text-gray-700 items-center">
              <span>10/06/2024</span>
              <span>Peso: 75kg</span>
              <span>Treinos: 4</span>
              <span>Bem-estar: 4/5</span>
              <button
                onClick={() => setShowDetailsModal(true)}
                className="text-blue-600 hover:text-blue-800 justify-self-end"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-5 gap-2 text-sm text-gray-700 items-center">
              <span>03/06/2024</span>
              <span>Peso: 76kg</span>
              <span>Treinos: 3</span>
              <span>Bem-estar: 3/5</span>
              <button
                onClick={() => setShowDetailsModal(true)}
                className="text-blue-600 hover:text-blue-800 justify-self-end"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-5 gap-2 text-sm text-gray-700 items-center">
              <span>27/05/2024</span>
              <span>Peso: 77kg</span>
              <span>Treinos: 2</span>
              <span>Bem-estar: 2/5</span>
              <button
                onClick={() => setShowDetailsModal(true)}
                className="text-blue-600 hover:text-blue-800 justify-self-end"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Botão para adicionar novo registro */}
          <button
            onClick={handleAddEvolucao}
            disabled={isAddingEvolution}
            className="mt-4 bg-green-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isAddingEvolution ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Salvando...
              </>
            ) : (
              "Adicionar Evolução"
            )}
          </button>
        </div>
      </div>

      {/* Modal para Adicionar Evolução */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Adicionar Evolução
            </h3>

            <form onSubmit={handleModalSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Peso atual (kg)
                </label>
                <input
                  type="number"
                  name="peso"
                  value={modalData.peso}
                  onChange={handleModalChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent"
                  placeholder="Ex: 75"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Treinos na semana
                </label>
                <input
                  type="number"
                  name="treinos"
                  value={modalData.treinos}
                  onChange={handleModalChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent"
                  placeholder="Ex: 4"
                  min="0"
                  max="7"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Como se sente (1-5)
                </label>
                <select
                  name="bemEstar"
                  value={modalData.bemEstar}
                  onChange={handleModalChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent"
                  required
                >
                  <option value="1">1 - Muito mal</option>
                  <option value="2">2 - Mal</option>
                  <option value="3">3 - Regular</option>
                  <option value="4">4 - Bem</option>
                  <option value="5">5 - Muito bem</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observações (opcional)
                </label>
                <textarea
                  name="observacoes"
                  value={modalData.observacoes}
                  onChange={handleModalChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent"
                  placeholder="Como foi sua semana de treinos?"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={isAddingEvolution}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-400 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isAddingEvolution}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isAddingEvolution ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Salvando...
                    </>
                  ) : (
                    "Salvar"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
