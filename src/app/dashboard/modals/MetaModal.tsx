"use client";

import { useState, useEffect } from "react";

interface MetaData {
  pesoObjetivo: string;
  prazoMeses: string;
  observacoes: string;
}

interface MetaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: MetaData) => void;
  isLoading: boolean;
  pesoAtual?: number;
}

export function MetaModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  pesoAtual,
}: MetaModalProps) {
  const [modalData, setModalData] = useState({
    pesoObjetivo: "",
    prazoMeses: "6",
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

  const resetForm = () => {
    setModalData({
      pesoObjetivo: "",
      prazoMeses: "6",
      observacoes: "",
    });
  };

  const handleClose = () => {
    resetForm();
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
          onClick={handleClose}
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

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          {/* Peso Atual (apenas informativo) */}
          {pesoAtual && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs sm:text-sm text-gray-600">Peso Atual</p>
              <p className="text-base sm:text-lg font-semibold text-gray-800">
                {pesoAtual}kg
              </p>
            </div>
          )}

          {/* Peso Objetivo */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Peso Objetivo (kg)
            </label>
            <input
              type="number"
              name="pesoObjetivo"
              value={modalData.pesoObjetivo}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
              placeholder="Ex: 70"
              step="0.1"
              required
            />
          </div>

          {/* Prazo */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Prazo (meses)
            </label>
            <select
              name="prazoMeses"
              value={modalData.prazoMeses}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
              required
            >
              <option value="3">3 meses</option>
              <option value="6">6 meses</option>
              <option value="12">12 meses</option>
              <option value="18">18 meses</option>
            </select>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Observações (opcional)
            </label>
            <textarea
              name="observacoes"
              value={modalData.observacoes}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
              placeholder="Alguma observação sobre sua meta?"
              rows={3}
            />
          </div>

          {/* Resumo da Meta */}
          {modalData.pesoObjetivo && pesoAtual && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-xs sm:text-sm font-medium text-orange-800 mb-1 break-words">
                Resumo da Meta:
              </p>
              <p className="text-xs sm:text-sm text-orange-700 break-words">
                De {pesoAtual}kg para {modalData.pesoObjetivo}kg em{" "}
                {modalData.prazoMeses} meses
              </p>
              {Number(modalData.pesoObjetivo) < pesoAtual && (
                <p className="text-xs text-orange-600 mt-1 break-words">
                  Meta de perda:{" "}
                  {(
                    (pesoAtual - Number(modalData.pesoObjetivo)) /
                    Number(modalData.prazoMeses)
                  ).toFixed(1)}
                  kg/mês
                </p>
              )}
              {Number(modalData.pesoObjetivo) > pesoAtual && (
                <p className="text-xs text-orange-600 mt-1 break-words">
                  Meta de ganho:{" "}
                  {(
                    (Number(modalData.pesoObjetivo) - pesoAtual) /
                    Number(modalData.prazoMeses)
                  ).toFixed(1)}
                  kg/mês
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-3 sm:px-4 rounded-lg text-sm sm:text-base font-medium hover:bg-gray-400 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-orange-600 text-white py-2 px-3 sm:px-4 rounded-lg text-sm sm:text-base font-medium hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Salvando...
                </>
              ) : (
                "Salvar Meta"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
