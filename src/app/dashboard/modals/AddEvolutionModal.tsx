"use client";

import { useState } from "react";

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
  // Removido: arquivoAvaliacao - upload agora é só em "Seus Dados"
}

interface AddEvolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EvolutionData) => void;
  isLoading: boolean;
}

export function AddEvolutionModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: AddEvolutionModalProps) {
  const [modalData, setModalData] = useState({
    peso: "",
    percentualGordura: "",
    massaMagra: "",
    cintura: "",
    treinos: "",
    bemEstar: "3",
    observacoes: "",
    objetivo: "",
    nivelAtividade: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const dataToSubmit: EvolutionData = {
      ...modalData,
    };

    onSubmit(dataToSubmit);
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setModalData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setModalData({
      peso: "",
      percentualGordura: "",
      massaMagra: "",
      cintura: "",
      treinos: "",
      bemEstar: "3",
      observacoes: "",
      objetivo: "",
      nivelAtividade: "",
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                ✏️ Adicionar Evolução Manual
              </h3>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                💡 <strong>Update rápido:</strong> Preencha apenas os campos que
                mudaram. Para avaliação completa com PDF, use o upload em "Seus
                Dados".
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Dados Físicos */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">
                  📊 Dados Físicos (Opcionais)
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="peso"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Peso atual (kg)
                    </label>
                    <input
                      type="number"
                      id="peso"
                      name="peso"
                      value={modalData.peso}
                      onChange={handleInputChange}
                      step="0.1"
                      placeholder="ex: 75.5"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="percentualGordura"
                      className="block text-sm font-medium text-gray-700"
                    >
                      % Gordura
                    </label>
                    <input
                      type="number"
                      id="percentualGordura"
                      name="percentualGordura"
                      value={modalData.percentualGordura}
                      onChange={handleInputChange}
                      step="0.1"
                      placeholder="ex: 18.5"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="massaMagra"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Massa magra (kg)
                    </label>
                    <input
                      type="number"
                      id="massaMagra"
                      name="massaMagra"
                      value={modalData.massaMagra}
                      onChange={handleInputChange}
                      step="0.1"
                      placeholder="ex: 61.4"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="cintura"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Cintura (cm)
                    </label>
                    <input
                      type="number"
                      id="cintura"
                      name="cintura"
                      value={modalData.cintura}
                      onChange={handleInputChange}
                      placeholder="ex: 82"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Dados Subjetivos */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">
                  🎯 Atividade & Bem-estar
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="treinos"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Treinos na semana
                    </label>
                    <select
                      id="treinos"
                      name="treinos"
                      value={modalData.treinos}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Selecione...</option>
                      <option value="1">1x por semana</option>
                      <option value="2">2x por semana</option>
                      <option value="3">3x por semana</option>
                      <option value="4">4x por semana</option>
                      <option value="5">5x por semana</option>
                      <option value="6">6x por semana</option>
                      <option value="7">Todos os dias</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="nivelAtividade"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Nível de atividade
                    </label>
                    <select
                      id="nivelAtividade"
                      name="nivelAtividade"
                      value={modalData.nivelAtividade}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Selecione...</option>
                      <option value="Sedentário">Sedentário</option>
                      <option value="Leve">Leve</option>
                      <option value="Moderado">Moderado</option>
                      <option value="Intenso">Intenso</option>
                      <option value="Muito intenso">Muito intenso</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="objetivo"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Objetivo atual
                    </label>
                    <select
                      id="objetivo"
                      name="objetivo"
                      value={modalData.objetivo}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Selecione...</option>
                      <option value="Emagrecer">Emagrecer</option>
                      <option value="Ganhar massa">Ganhar massa</option>
                      <option value="Manter forma">Manter forma</option>
                      <option value="Definir músculos">Definir músculos</option>
                      <option value="Melhorar condicionamento">
                        Melhorar condicionamento
                      </option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="bemEstar"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Como se sente? (1-5)
                    </label>
                    <select
                      id="bemEstar"
                      name="bemEstar"
                      value={modalData.bemEstar}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="1">1 - Muito mal</option>
                      <option value="2">2 - Mal</option>
                      <option value="3">3 - Regular</option>
                      <option value="4">4 - Bem</option>
                      <option value="5">5 - Excelente</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Observações */}
              <div>
                <label
                  htmlFor="observacoes"
                  className="block text-sm font-medium text-gray-700"
                >
                  Observações (opcional)
                </label>
                <textarea
                  id="observacoes"
                  name="observacoes"
                  rows={3}
                  value={modalData.observacoes}
                  onChange={handleInputChange}
                  placeholder="Como foi sua semana? Alguma mudança na rotina?"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Botões */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isLoading ? "Salvando..." : "💾 Salvar Evolução"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
