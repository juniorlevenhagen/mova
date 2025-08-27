"use client";

import { useState, useRef } from "react";

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

  const [uploadMode, setUploadMode] = useState<"manual" | "upload">("manual");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const dataToSubmit: EvolutionData = {
      ...modalData,
      arquivoAvaliacao: uploadedFile || undefined,
    };

    onSubmit(dataToSubmit);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setModalData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "image/jpeg",
        "image/png",
      ];
      const maxSize = 10 * 1024 * 1024; // 10MB

      if (!allowedTypes.includes(file.type)) {
        alert("Tipo de arquivo não suportado. Use PDF, DOC, DOCX, JPG ou PNG.");
        return;
      }

      if (file.size > maxSize) {
        alert("Arquivo muito grande. Máximo 10MB.");
        return;
      }

      setUploadedFile(file);
      setUploadLoading(true);

      try {
        // Se for PDF, processar com OpenAI
        if (file.type === "application/pdf") {
          const formData = new FormData();
          formData.append("file", file);

          const response = await fetch("/api/process-pdf", {
            method: "POST",
            body: formData,
          });

          if (response.ok) {
            const result = await response.json();

            // Preencher automaticamente os campos com os dados extraídos
            setModalData((prev) => ({
              ...prev,
              peso: result.extractedData.peso?.toString() || "",
              percentualGordura:
                result.extractedData.percentual_gordura?.toString() || "",
              massaMagra: result.extractedData.massa_magra?.toString() || "",
              cintura: result.extractedData.cintura?.toString() || "",
              observacoes: result.extractedData.observacoes || "",
            }));

            // Mostrar mensagem de sucesso
            alert(
              "Dados extraídos com sucesso! Verifique e ajuste se necessário."
            );
          } else {
            const error = await response.json();
            alert(`Erro ao processar PDF: ${error.error}`);
          }
        }
      } catch (error) {
        console.error("Erro no processamento:", error);
        alert("Erro ao processar arquivo. Tente novamente.");
      } finally {
        setUploadLoading(false);
      }
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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
    setUploadedFile(null);
    setUploadMode("manual");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Adicionar Evolução
        </h3>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Como deseja adicionar sua evolução?
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setUploadMode("manual")}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                uploadMode === "manual"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Preenchimento Manual
            </button>
            <button
              type="button"
              onClick={() => setUploadMode("upload")}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                uploadMode === "upload"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Upload de Avaliação
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {uploadMode === "manual" ? (
            <>
              {/* Composição Corporal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    Percentual de gordura (%)
                  </label>
                  <input
                    type="number"
                    name="percentualGordura"
                    value={modalData.percentualGordura}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent"
                    placeholder="Ex: 20"
                    step="0.1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Massa magra (kg)
                  </label>
                  <input
                    type="number"
                    name="massaMagra"
                    value={modalData.massaMagra}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent"
                    placeholder="Ex: 60"
                    step="0.1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cintura (cm)
                  </label>
                  <input
                    type="number"
                    name="cintura"
                    value={modalData.cintura}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent"
                    placeholder="Ex: 80"
                    required
                  />
                </div>
              </div>

              {/* Atividade e Objetivos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    Objetivo atual
                  </label>
                  <select
                    name="objetivo"
                    value={modalData.objetivo}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent"
                    required
                  >
                    <option value="">Selecione o objetivo</option>
                    <option value="Hipertrofia">Hipertrofia</option>
                    <option value="Emagrecimento">Emagrecimento</option>
                    <option value="Força">Força</option>
                    <option value="Resistência">Resistência</option>
                    <option value="Definição">Definição</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nível de atividade
                  </label>
                  <select
                    name="nivelAtividade"
                    value={modalData.nivelAtividade}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent"
                    required
                  >
                    <option value="">Selecione o nível</option>
                    <option value="Sedentário">Sedentário</option>
                    <option value="Leve">Leve</option>
                    <option value="Moderado">Moderado</option>
                    <option value="Ativo">Ativo</option>
                    <option value="Muito Ativo">Muito Ativo</option>
                  </select>
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
            </>
          ) : (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <div className="mb-4">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                {!uploadedFile ? (
                  <div>
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <span className="text-blue-600 hover:text-blue-800 font-medium">
                        Clique para fazer upload
                      </span>
                      <span className="text-gray-500"> ou arraste e solte</span>
                    </label>
                    <p className="text-xs text-gray-500 mt-2">
                      PDF, DOC, DOCX, JPG, PNG (máx. 10MB)
                    </p>
                    <input
                      ref={fileInputRef}
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={handleFileUpload}
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <svg
                        className="h-5 w-5 text-green-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-800">
                          {uploadedFile.name}
                        </p>
                        <p className="text-xs text-green-600">
                          {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="text-red-600 hover:text-red-800"
                      >
                        <svg
                          className="h-5 w-5"
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

                    {uploadLoading && (
                      <div className="flex items-center gap-2 text-blue-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span className="text-sm">Processando arquivo...</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observações adicionais (opcional)
                </label>
                <textarea
                  name="observacoes"
                  value={modalData.observacoes}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent"
                  placeholder="Alguma observação sobre sua avaliação física?"
                  rows={3}
                />
              </div>
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
              disabled={isLoading || (uploadMode === "upload" && !uploadedFile)}
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
