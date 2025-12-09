"use client";

import { useState, useEffect } from "react";

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

  useEffect(() => {
    if (isOpen) {
      // Salvar a posição atual do scroll
      const scrollY = window.scrollY;
      
      // Bloquear scroll do body
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
      
      return () => {
        // Restaurar scroll do body
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        document.body.style.overflow = "";
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md mx-2 sm:mx-4 relative max-h-[95vh] sm:max-h-[90vh] overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "#94a3b8 #f1f5f9" }}>
        {/* Botão X no canto superior direito */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Fechar"
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
        <h2 className="text-lg sm:text-xl font-semibold mb-4 pr-8 sm:pr-0">Adicionar Atividade</h2>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-md sm:max-w-full mx-auto sm:mx-0">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Data
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="w-full max-w-xs mx-auto sm:mx-0 block p-2 sm:p-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Horário
              </label>
              <input
                type="time"
                value={formData.horario}
                onChange={(e) =>
                  setFormData({ ...formData, horario: e.target.value })
                }
                className="w-full max-w-xs mx-auto sm:mx-0 block p-2 sm:p-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
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
              className="w-full p-2 sm:p-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
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
              className="w-full p-2 sm:p-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
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
              className="w-full p-2 sm:p-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Tipo de Treino
            </label>
            <select
              value={formData.tipo_treino}
              onChange={(e) =>
                setFormData({ ...formData, tipo_treino: e.target.value })
              }
              className="w-full p-2 sm:p-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
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
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Observações
            </label>
            <textarea
              value={formData.observacoes}
              onChange={(e) =>
                setFormData({ ...formData, observacoes: e.target.value })
              }
              className="w-full p-2 sm:p-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              rows={3}
              placeholder="Como foi o treino? Alguma observação?"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isLoading ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
