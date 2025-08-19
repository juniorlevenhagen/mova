"use client";

import { useState } from "react";

interface CreateActivityData {
  date?: string;
  horario?: string; // Novo campo
  treinos_concluidos?: number | undefined; // Permitir undefined
  calorias_queimadas?: number | undefined;
  duracao_minutos?: number | undefined;
  tipo_treino?: string;
  observacoes?: string;
}

interface AddActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateActivityData) => Promise<void>;
  isLoading: boolean;
}

export function AddActivityModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: AddActivityModalProps) {
  const [formData, setFormData] = useState<CreateActivityData>({
    date: new Date().toISOString().split("T")[0],
    horario: new Date()
      .toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false, // Usar formato 24h
      })
      .slice(0, 5), // Pegar apenas HH:MM
    treinos_concluidos: undefined, // Mudar de 1 para undefined
    calorias_queimadas: undefined,
    duracao_minutos: undefined,
    tipo_treino: "",
    observacoes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-semibold mb-4">Adicionar Atividade</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Horário
              </label>
              <input
                type="time"
                value={formData.horario}
                onChange={(e) =>
                  setFormData({ ...formData, horario: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Treinos Concluídos
            </label>
            <input
              type="number"
              min="0"
              value={formData.treinos_concluidos || ""} // Usar "" quando undefined
              onChange={(e) =>
                setFormData({
                  ...formData,
                  treinos_concluidos: e.target.value
                    ? parseInt(e.target.value)
                    : undefined, // Permitir undefined
                })
              }
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Calorias Queimadas
            </label>
            <input
              type="number"
              min="0"
              value={formData.calorias_queimadas || ""} // Usar "" quando undefined
              onChange={(e) =>
                setFormData({
                  ...formData,
                  calorias_queimadas: e.target.value
                    ? parseInt(e.target.value)
                    : undefined, // Permitir undefined
                })
              }
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duração (minutos)
            </label>
            <input
              type="number"
              min="0"
              value={formData.duracao_minutos || ""} // Usar "" quando undefined
              onChange={(e) =>
                setFormData({
                  ...formData,
                  duracao_minutos: e.target.value
                    ? parseInt(e.target.value)
                    : undefined, // Permitir undefined
                })
              }
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Treino
            </label>
            <select
              value={formData.tipo_treino}
              onChange={(e) =>
                setFormData({ ...formData, tipo_treino: e.target.value })
              }
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Selecione...</option>
              <option value="Musculação">Musculação</option>
              <option value="Cardio">Cardio</option>
              <option value="Funcional">Funcional</option>
              <option value="Yoga">Yoga</option>
              <option value="Pilates">Pilates</option>
              <option value="Corrida">Corrida</option>
              <option value="Caminhada">Caminhada</option>
              <option value="Natação">Natação</option>
              <option value="Ciclismo">Ciclismo</option>
              <option value="Outro">Outro</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observações
            </label>
            <textarea
              value={formData.observacoes}
              onChange={(e) =>
                setFormData({ ...formData, observacoes: e.target.value })
              }
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Como foi o treino? Alguma observação?"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
