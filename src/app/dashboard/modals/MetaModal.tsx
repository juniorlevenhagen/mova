"use client";

import { useState } from "react";

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4"></h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Peso Atual (apenas informativo) */}
          {pesoAtual && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">Peso Atual</p>
              <p className="text-lg font-semibold text-gray-800">
                {pesoAtual}kg
              </p>
            </div>
          )}

          {/* Peso Objetivo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Peso Objetivo (kg)
            </label>
            <input
              type="number"
              name="pesoObjetivo"
              value={modalData.pesoObjetivo}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Ex: 70"
              step="0.1"
              required
            />
          </div>

          {/* Prazo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prazo (meses)
            </label>
            <select
              name="prazoMeses"
              value={modalData.prazoMeses}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observações (opcional)
            </label>
            <textarea
              name="observacoes"
              value={modalData.observacoes}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Alguma observação sobre sua meta?"
              rows={3}
            />
          </div>

          {/* Resumo da Meta */}
          {modalData.pesoObjetivo && pesoAtual && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-sm font-medium text-orange-800 mb-1">
                Resumo da Meta:
              </p>
              <p className="text-sm text-orange-700">
                De {pesoAtual}kg para {modalData.pesoObjetivo}kg em{" "}
                {modalData.prazoMeses} meses
              </p>
              {Number(modalData.pesoObjetivo) < pesoAtual && (
                <p className="text-xs text-orange-600 mt-1">
                  Meta de perda:{" "}
                  {(
                    (pesoAtual - Number(modalData.pesoObjetivo)) /
                    Number(modalData.prazoMeses)
                  ).toFixed(1)}
                  kg/mês
                </p>
              )}
              {Number(modalData.pesoObjetivo) > pesoAtual && (
                <p className="text-xs text-orange-600 mt-1">
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

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-400 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
