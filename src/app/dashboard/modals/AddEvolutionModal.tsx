"use client";

import { useState } from "react";

interface EvolutionData {
  peso: string;
  treinos: string;
  bemEstar: string;
  observacoes: string;
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
    treinos: "",
    bemEstar: "3",
    observacoes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(modalData);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setModalData((prev) => ({ ...prev, [name]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Adicionar Evolução
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Peso atual (kg)
            </label>
            <input
              type="number"
              name="peso"
              value={modalData.peso}
              onChange={handleChange}
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
              onChange={handleChange}
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
              onChange={handleChange}
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
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent"
              placeholder="Como foi sua semana de treinos?"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-400 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
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
  );
}
