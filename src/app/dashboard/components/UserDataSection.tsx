"use client";

import { useState, useRef, useEffect } from "react";

interface UserDataSectionProps {
  profile: {
    altura: number;
    peso: number;
    sexo: string;
    frequenciaTreinos: string;
    objetivo: string;
    nivelAtividade?: string; // Add this
    idade?: number; // Add this
  };
  onGeneratePlan: () => void;
  isGeneratingPlan: boolean;
}

export function UserDataSection({
  profile,
  onGeneratePlan,
  isGeneratingPlan,
}: UserDataSectionProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [hasEvaluation, setHasEvaluation] = useState(false);
  const [evaluationFileName, setEvaluationFileName] = useState("");
  const [uploadDate, setUploadDate] = useState("");
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showIMCModal, setShowIMCModal] = useState(false);
  const [showCaloriaModal, setShowCaloriaModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados para edição inline
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [userProfile, setUserProfile] = useState(profile);

  // Verificar se já existe avaliação salva
  useEffect(() => {
    const savedEvaluation = localStorage.getItem("userEvaluation");
    if (savedEvaluation) {
      const evaluation = JSON.parse(savedEvaluation);
      setHasEvaluation(true);
      setEvaluationFileName(evaluation.fileName);
      setUploadDate(evaluation.uploadDate);
    }
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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

      setIsUploading(true);

      // Simular upload e substituição de arquivo antigo
      setTimeout(() => {
        setIsUploading(false);
        setHasEvaluation(true);
        setEvaluationFileName(file.name);
        const currentDate = new Date().toISOString();
        setUploadDate(currentDate);

        // Salvar no localStorage (substitui arquivo antigo)
        localStorage.setItem(
          "userEvaluation",
          JSON.stringify({
            fileName: file.name,
            fileSize: file.size,
            uploadDate: currentDate,
          })
        );

        console.log("Avaliação física carregada:", file.name);
        console.log("Arquivo antigo substituído com sucesso");
      }, 2000);
    }
  };

  const handleRemoveFile = () => {
    setHasEvaluation(false);
    setEvaluationFileName("");
    setUploadDate("");
    localStorage.removeItem("userEvaluation");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleGeneratePlan = () => {
    if (!hasEvaluation) {
      setShowConfirmationModal(true);
    } else {
      onGeneratePlan();
    }
  };

  const confirmGeneratePlan = () => {
    setShowConfirmationModal(false);
    onGeneratePlan();
  };

  // Funções para edição inline
  const startEditing = (field: string, currentValue: string) => {
    setEditingField(field);
    setEditValue(currentValue);
  };

  const saveEdit = () => {
    if (editingField && editValue.trim()) {
      setUserProfile((prev) => ({
        ...prev,
        [editingField]: editValue,
      }));

      // Salvar no localStorage
      localStorage.setItem(
        "userProfile",
        JSON.stringify({
          ...userProfile,
          [editingField]: editValue,
        })
      );

      setEditingField(null);
      setEditValue("");
    }
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      saveEdit();
    } else if (e.key === "Escape") {
      cancelEdit();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Calcular IMC dinamicamente (com proteção contra valores zero)
  const calcularIMC = (peso: number, altura: number) => {
    if (peso <= 0 || altura <= 0) return "0.0";
    const alturaEmMetros = altura / 100;
    return (peso / (alturaEmMetros * alturaEmMetros)).toFixed(1);
  };

  // Obter classificação do IMC
  const getClassificacaoIMC = (imc: number) => {
    if (imc < 18.5) return { texto: "Abaixo do peso", cor: "text-red-600" };
    if (imc < 25) return { texto: "Peso saudável", cor: "text-green-600" };
    if (imc < 30) return { texto: "Sobrepeso", cor: "text-yellow-600" };
    if (imc < 40) return { texto: "Obesidade", cor: "text-orange-600" };
    return { texto: "Obesidade Grave", cor: "text-red-600" };
  };

  const imcAtual = parseFloat(
    calcularIMC(userProfile.peso, userProfile.altura)
  );
  const classificacaoIMC = getClassificacaoIMC(imcAtual);

  // Calcular Caloria Basal Estimada
  const calcularCaloriaBasal = (
    peso: number,
    altura: number,
    idade: number,
    sexo: string,
    nivelAtividade: string
  ) => {
    // Fórmula de Harris-Benedict
    let tmb;
    if (sexo === "Masculino") {
      tmb = 88.362 + 13.397 * peso + 4.799 * altura - 5.677 * idade;
    } else {
      tmb = 447.593 + 9.247 * peso + 3.098 * altura - 4.33 * idade;
    }

    // Fatores de atividade
    const fatoresAtividade = {
      Sedentário: 1.2,
      Leve: 1.375,
      Moderado: 1.55,
      Ativo: 1.725,
      "Muito Ativo": 1.9,
    };

    const fator =
      fatoresAtividade[nivelAtividade as keyof typeof fatoresAtividade] || 1.2;
    return Math.round(tmb * fator);
  };

  const caloriaBasal = calcularCaloriaBasal(
    userProfile.peso,
    userProfile.altura,
    userProfile.idade || 28, // idade mockada por enquanto
    userProfile.sexo,
    userProfile.nivelAtividade || "Moderado"
  );

  // Renderizar campo editável com proteção para valores vazios
  const renderEditableField = (
    field: string,
    label: string,
    value: string,
    options?: string[]
  ) => {
    const displayValue = value || "Não informado";
    const isEditing = editingField === field;

    return (
      <div className="relative">
        <span className="block text-gray-500 text-sm">{label}</span>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <div className="flex-1">
              {options ? (
                <select
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleKeyPress}
                  onBlur={saveEdit}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-gray-800 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                >
                  {options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleKeyPress}
                  onBlur={saveEdit}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-gray-800 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              )}
            </div>
          ) : (
            <>
              <span
                className={`block font-bold ${
                  value ? "text-gray-800" : "text-gray-400 italic"
                }`}
              >
                {displayValue}
              </span>
              <button
                onClick={() => startEditing(field, value || "")}
                className="text-gray-400 hover:text-blue-600 transition-colors"
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
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        Seus Dados Atuais
      </h2>

      {/* Indicador permanente de avaliação */}
      {hasEvaluation && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium text-green-800">
                  Avaliação física disponível
                </p>
                <p className="text-xs text-green-600">{evaluationFileName}</p>
                <p className="text-xs text-gray-500">
                  Upload em: {formatDate(uploadDate)}
                </p>
              </div>
            </div>
            <button
              onClick={handleRemoveFile}
              className="text-red-600 hover:text-red-800 text-sm"
            >
              Remover
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <span className="block text-gray-500 text-sm">Altura</span>
          <span className="block text-gray-800 font-bold">
            {userProfile.altura} cm
          </span>
        </div>

        {/* Peso editável */}
        {renderEditableField("peso", "Peso", `${userProfile.peso} kg`)}

        <div>
          <div className="flex items-center gap-2">
            <span className="block text-gray-500 text-sm">IMC</span>
            <button
              onClick={() => setShowIMCModal(true)}
              className="text-gray-400 hover:text-blue-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
          <span className="block text-gray-800 font-bold">{imcAtual}</span>
          <span className={`block text-xs ${classificacaoIMC.cor}`}>
            {classificacaoIMC.texto}
          </span>
        </div>
        <div>
          <span className="block text-gray-500 text-sm">Sexo</span>
          <span className="block text-gray-800 font-bold">
            {userProfile.sexo}
          </span>
        </div>

        {/* Campos editáveis */}
        {renderEditableField(
          "frequenciaTreinos",
          "Frequência de Treinos",
          userProfile.frequenciaTreinos,
          [
            "2x por semana",
            "3x por semana",
            "4x por semana",
            "5x por semana",
            "6x por semana",
          ]
        )}

        {renderEditableField("objetivo", "Objetivo", userProfile.objetivo, [
          "Hipertrofia",
          "Emagrecimento",
          "Força",
          "Resistência",
          "Definição",
        ])}

        <div>
          <div className="flex items-center gap-2">
            <span className="block text-gray-500 text-sm">
              Caloria Basal Estimada
            </span>
            <button
              onClick={() => setShowCaloriaModal(true)}
              className="text-gray-400 hover:text-blue-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
          <span className="block text-gray-800 font-bold">
            {caloriaBasal} kcal
          </span>
        </div>
        {/* Idade editável */}
        {renderEditableField(
          "idade",
          "Idade",
          `${userProfile.idade || 28} anos`
        )}

        {renderEditableField(
          "nivelAtividade",
          "Nível de Atividade",
          userProfile.nivelAtividade || "Moderado",
          ["Sedentário", "Leve", "Moderado", "Ativo", "Muito Ativo"]
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mt-8">
        <button
          onClick={handleGeneratePlan}
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

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className={`py-3 px-6 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
            hasEvaluation
              ? "bg-green-600 text-white hover:bg-green-700"
              : "bg-gray-600 text-white hover:bg-gray-700"
          }`}
        >
          {isUploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Enviando...
            </>
          ) : hasEvaluation ? (
            "Avaliação Enviada"
          ) : (
            "Upload Avaliação"
          )}
        </button>
      </div>

      {/* Modal de Confirmação */}
      {showConfirmationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Avaliação Física Recomendada
            </h3>
            <p className="text-gray-600 mb-6">
              Para um plano de treino e dieta ainda mais personalizado e eficaz,
              recomendamos adicionar sua avaliação física. Isso permitirá que a
              IA analise seus dados específicos e gere um plano mais preciso.
            </p>
            <p className="text-gray-600 mb-6">
              Deseja gerar seu plano personalizado sem adicionar avaliação
              física?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmationModal(false)}
                className="flex-1 py-2 px-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Adicionar Avaliação
              </button>
              <button
                onClick={confirmGeneratePlan}
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Gerar Sem Avaliação
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal IMC */}
      {showIMCModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              O que é o IMC?
            </h3>
            <div className="text-gray-600 mb-6 space-y-3">
              <p>
                O <strong>Índice de Massa Corporal (IMC)</strong> é uma medida
                que relaciona peso e altura para avaliar se uma pessoa está com
                peso adequado.
              </p>
              <p>
                <strong>Limitações importantes:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Não diferencia entre gordura e músculo</li>
                <li>Pode classificar atletas como sobrepeso</li>
                <li>Não considera distribuição de gordura</li>
                <li>Pode não ser preciso para idosos</li>
              </ul>
              <p className="text-sm bg-blue-50 p-3 rounded">
                <strong>Dica:</strong> Para uma avaliação mais precisa,
                considere adicionar sua avaliação física que inclui percentual
                de gordura e massa magra.
              </p>
            </div>
            <button
              onClick={() => setShowIMCModal(false)}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Entendi
            </button>
          </div>
        </div>
      )}

      {/* Modal Caloria Basal */}
      {showCaloriaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              O que é Caloria Basal?
            </h3>
            <div className="text-gray-600 mb-6 space-y-3">
              <p>
                A <strong>Caloria Basal</strong> é a quantidade de calorias que
                seu corpo gasta em repouso durante 24 horas para manter funções
                básicas como:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Respiração e circulação</li>
                <li>Digestão e absorção</li>
                <li>Funções celulares</li>
                <li>Manutenção da temperatura corporal</li>
              </ul>
              <p>
                <strong>Como é calculada:</strong> Usando a fórmula de
                Harris-Benedict baseada em seu peso, altura, idade, sexo e nível
                de atividade física.
              </p>
              <p className="text-sm bg-green-50 p-3 rounded">
                <strong>Importante:</strong> Este valor serve como base para
                calcular suas necessidades calóricas diárias totais.
              </p>
            </div>
            <button
              onClick={() => setShowCaloriaModal(false)}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Entendi
            </button>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        className="sr-only"
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        onChange={handleFileUpload}
      />
    </div>
  );
}
