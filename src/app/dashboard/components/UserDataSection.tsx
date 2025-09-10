"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useEvaluation } from "@/hooks/useEvaluation";
import { typography, components, colors } from "@/lib/design-tokens";

interface UserDataSectionProps {
  profile: {
    altura: number;
    peso: number;
    sexo: string;
    frequenciaTreinos: string;
    objetivo: string;
    nivelAtividade?: string;
    birthDate?: string | null; // Permitir null
  };
  onGeneratePlan: () => void;
  isGeneratingPlan: boolean;
  onProfileUpdate?: () => Promise<void>;
  planStatus?: {
    isExisting: boolean;
    generatedAt?: string;
    daysUntilNext?: number;
    nextPlanAvailable?: string;
    isPremiumCooldown?: boolean; // Nova propriedade para cooldown premium
    hoursUntilNext?: number; // Horas até próximo plano (premium)
  } | null;
  isCheckingPlanStatus?: boolean;
  isPremium?: boolean; // Nova prop para identificar usuários premium
}

export function UserDataSection({
  profile,
  onGeneratePlan,
  isGeneratingPlan,
  onProfileUpdate,
  planStatus,
  isCheckingPlanStatus = false,
  isPremium = false,
}: UserDataSectionProps) {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showIMCModal, setShowIMCModal] = useState(false);
  const [showCaloriaModal, setShowCaloriaModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados para edição inline
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [userProfile, setUserProfile] = useState(profile);

  // Hook para gerenciar avaliações
  const { evaluation, saveEvaluation, removeEvaluation } = useEvaluation(user);

  // Sincronizar estado local quando a prop profile mudar
  useEffect(() => {
    setUserProfile(profile);
  }, [profile]);

  // Função de upload otimizada para evitar re-renderizações
  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "image/jpeg",
        "image/png",
      ];
      const maxSize = 10 * 1024 * 1024; // 10MB

      if (!allowedTypes.includes(file.type)) {
        console.error("Tipo de arquivo não suportado:", file.type);
        return;
      }

      if (file.size > maxSize) {
        console.error("Arquivo muito grande:", file.size);
        return;
      }

      setIsUploading(true);

      try {
        // Se for PDF, processar com a API
        if (file.type === "application/pdf") {
          // Obter token de autorização
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (!session?.access_token) {
            console.error("❌ Erro: Usuário não autenticado");
            return;
          }

          const formData = new FormData();
          formData.append("file", file);

          const response = await fetch("/api/process-pdf", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
            body: formData,
          });

          if (response.ok) {
            const result = await response.json();

            if (result.success) {
              console.log("✅ PDF processado com sucesso!");

              // ✅ Só fazemos refresh mínimo se dados importantes mudaram
              if (result.evolutionCreated && onProfileUpdate) {
                // Refresh apenas das evoluções de forma assíncrona (não bloqueia UI)
                setTimeout(() => onProfileUpdate(), 100);
              }

              console.log("✅ Dashboard atualizado instantaneamente!");
            } else {
              console.error("❌ Erro no processamento:", result.error);
            }
          } else {
            console.error("❌ Erro na API:", response.status);

            // Ler o erro apenas uma vez
            let errorMessage = "Erro desconhecido";
            try {
              const error = await response.json();
              errorMessage = error.error || "Erro desconhecido";
            } catch {
              // Se não conseguir parsear como JSON, tentar ler como texto
              try {
                const errorText = await response.text();
                errorMessage = errorText || "Erro desconhecido";
              } catch {
                errorMessage = `Erro ${response.status}: ${response.statusText}`;
              }
            }

            console.error("❌ Detalhes do erro:", errorMessage);
          }
        }

        // Salvar no Supabase usando o hook
        const success = await saveEvaluation({
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
        });

        if (success) {
          console.log("✅ Avaliação salva com sucesso!");

          // ✅ Não fazemos refresh - o hook useEvaluation já atualizou o estado otimisticamente
          // A interface já mostra o estado correto instantaneamente
        } else {
          return;
        }
      } catch (error) {
        console.error("❌ Erro no processamento:", error);
      } finally {
        setIsUploading(false);
      }
    },
    [saveEvaluation, onProfileUpdate]
  );

  const handleRemoveFile = useCallback(async () => {
    const success = await removeEvaluation();
    if (!success) {
      return;
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [removeEvaluation]);

  const handleGeneratePlan = useCallback(() => {
    // ✅ PRIMEIRO: Verificar se já existe plano
    if (planStatus?.isExisting) {
      onGeneratePlan(); // Abre modal do plano existente
      return;
    }

    // ✅ SEGUNDO: Se não tem plano, verificar avaliação
    if (!evaluation) {
      setShowConfirmationModal(true); // Mostra modal de avaliação
    } else {
      onGeneratePlan(); // Gera novo plano
    }
  }, [evaluation, onGeneratePlan, planStatus?.isExisting]);

  const confirmGeneratePlan = useCallback(() => {
    setShowConfirmationModal(false);
    onGeneratePlan();
  }, [onGeneratePlan]);

  // Funções para edição inline
  const startEditing = (field: string, currentValue: string) => {
    setEditingField(field);
    setEditValue(currentValue);
  };

  const saveEdit = async () => {
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

      // Salvar no Supabase
      try {
        if (!user?.id) {
          console.error("Usuário não autenticado.");
          return;
        }

        // Mapear campos do frontend para campos do banco
        const fieldMapping: { [key: string]: string } = {
          peso: "weight",
          frequenciaTreinos: "training_frequency",
          objetivo: "objective",
          nivelAtividade: "nivel_atividade",
        };

        const dbField = fieldMapping[editingField] || editingField;

        const { error } = await supabase
          .from("user_profiles")
          .update({
            [dbField]: editValue,
          })
          .eq("user_id", user.id);

        if (error) {
          console.error("Erro ao salvar alteração:", error);
          // Reverter mudança local se falhar
          setUserProfile((prev) => ({
            ...prev,
            [editingField]: profile[editingField as keyof typeof profile],
          }));
        }
      } catch (error) {
        console.error("Erro inesperado ao salvar:", error);
        // Reverter mudança local se falhar
        setUserProfile((prev) => ({
          ...prev,
          [editingField]: profile[editingField as keyof typeof profile],
        }));
      }

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

  // Memoizar valores calculados para evitar recálculos desnecessários
  const imcAtual = useMemo(
    () => parseFloat(calcularIMC(userProfile.peso, userProfile.altura)),
    [userProfile.peso, userProfile.altura]
  );

  const classificacaoIMC = useMemo(
    () => getClassificacaoIMC(imcAtual),
    [imcAtual]
  );

  // Calcular Caloria Basal Estimada
  const calcularCaloriaBasal = useCallback(
    (
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
        fatoresAtividade[nivelAtividade as keyof typeof fatoresAtividade] ||
        1.2;
      return Math.round(tmb * fator);
    },
    []
  );

  const caloriaBasal = useMemo(
    () =>
      calcularCaloriaBasal(
        userProfile.peso,
        userProfile.altura,
        userProfile.birthDate ? calculateAge(userProfile.birthDate) : 28,
        userProfile.sexo,
        userProfile.nivelAtividade || "Moderado"
      ),
    [
      userProfile.peso,
      userProfile.altura,
      userProfile.birthDate,
      userProfile.sexo,
      userProfile.nivelAtividade,
      calcularCaloriaBasal,
    ]
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
        <span className="block text-gray-500 text-sm mb-1">{label}</span>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <div className="flex-1">
              {options ? (
                <select
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleKeyPress}
                  onBlur={saveEdit}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800 font-bold text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800 font-bold text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  autoFocus
                />
              )}
            </div>
          ) : (
            <>
              <span
                className={`block font-bold text-lg ${
                  value ? "text-gray-800" : "text-gray-400 italic"
                }`}
              >
                {displayValue}
              </span>
              <button
                onClick={() => startEditing(field, value || "")}
                className="text-gray-400 hover:text-blue-600 transition-colors p-1 rounded-full hover:bg-blue-50"
                title="Editar"
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
    <div className={`${components.card.base} ${components.card.padding}`}>
      <div className="mb-6">
        <h2
          className={`${typography.heading.h3} ${colors.text.primary} mb-2 flex items-center gap-3`}
        >
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          Seus Dados Atuais
        </h2>
        <p className="text-gray-600 text-sm">
          Gerencie suas informações pessoais e acompanhe seu progresso
        </p>
      </div>

      {/* Indicador permanente de avaliação */}
      {evaluation && (
        <div className="mb-6 relative overflow-hidden">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5 shadow-sm">
            {/* Decorative background pattern */}
            <div className="absolute top-0 right-0 w-24 h-24 opacity-10">
              <svg
                viewBox="0 0 100 100"
                fill="currentColor"
                className="text-green-600"
              >
                <path d="M50 0C22.4 0 0 22.4 0 50s22.4 50 50 50 50-22.4 50-50S77.6 0 50 0zm0 80c-16.6 0-30-13.4-30-30s13.4-30 30-30 30 13.4 30 30-13.4 30-30 30z" />
                <path d="M50 20c-16.6 0-30 13.4-30 30s13.4 30 30 30 30-13.4 30-30-13.4-30-30-30zm0 50c-11 0-20-9-20-20s9-20 20-20 20 9 20 20-9 20-20 20z" />
              </svg>
            </div>

            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-4">
                {/* Status indicator with animation */}
                <div className="relative">
                  <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                  <div className="absolute inset-0 w-4 h-4 bg-green-400 rounded-full animate-ping"></div>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-semibold text-green-900">
                      Avaliação física disponível
                    </h4>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      ✓ Ativa
                    </span>
                  </div>
                  <p className="text-sm text-green-700 font-medium mb-1">
                    {evaluation.file_name}
                  </p>
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <svg
                      className="w-3 h-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Upload em: {formatDate(evaluation.upload_date)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors duration-200"
                >
                  <svg
                    className="w-3 h-3 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                  Atualizar
                </button>
                <button
                  onClick={handleRemoveFile}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors duration-200"
                >
                  <svg
                    className="w-3 h-3 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Remover
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Seção de Dados Básicos */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <svg
              className="w-4 h-4 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            Dados Básicos
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <span className="block text-gray-500 text-sm mb-1">Altura</span>
              <span className="block text-gray-800 font-bold text-lg">
                {userProfile.altura} cm
              </span>
            </div>

            {/* Peso editável */}
            <div className="bg-gray-50 rounded-lg p-4">
              {renderEditableField("peso", "Peso", `${userProfile.peso} kg`)}
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="block text-gray-500 text-sm">IMC</span>
                <button
                  onClick={() => setShowIMCModal(true)}
                  className="text-gray-400 hover:text-blue-600 transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
              <span className="block text-gray-800 font-bold text-lg">
                {imcAtual.toFixed(2)}
              </span>
              <span
                className={`block text-xs ${classificacaoIMC.cor} font-medium`}
              >
                {classificacaoIMC.texto}
              </span>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <span className="block text-gray-500 text-sm mb-1">Sexo</span>
              <span className="block text-gray-800 font-bold text-lg">
                {userProfile.sexo.charAt(0).toUpperCase() +
                  userProfile.sexo.slice(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Seção de Dados de Treino */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <svg
              className="w-4 h-4 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            Dados de Treino
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <span className="block text-gray-500 text-sm mb-1">Idade</span>
              <span className="block text-gray-800 font-bold text-lg">
                {userProfile.birthDate
                  ? `${calculateAge(userProfile.birthDate)} anos`
                  : "Não informado"}
              </span>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
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
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              {renderEditableField(
                "objetivo",
                "Objetivo",
                userProfile.objetivo,
                [
                  "Ganho de Massa",
                  "Emagrecimento",
                  "Força",
                  "Resistência",
                  "Definição",
                ]
              )}
            </div>
          </div>
        </div>

        {/* Seção de Metabolismo */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <svg
              className="w-4 h-4 text-orange-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            Metabolismo
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="block text-gray-500 text-sm">
                  Caloria Basal Estimada
                </span>
                <button
                  onClick={() => setShowCaloriaModal(true)}
                  className="text-gray-400 hover:text-blue-600 transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
              <span className="block text-gray-800 font-bold text-lg">
                {caloriaBasal} kcal
              </span>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              {renderEditableField(
                "nivelAtividade",
                "Nível de Atividade",
                userProfile.nivelAtividade || "Moderado",
                ["Sedentário", "Leve", "Moderado", "Ativo", "Muito Ativo"]
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status do Plano Personalizado */}
      {planStatus && planStatus.isExisting && (
        <div className="mt-6 relative overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 shadow-sm">
            {/* Decorative background pattern */}
            <div className="absolute top-0 right-0 w-24 h-24 opacity-10">
              <svg
                viewBox="0 0 100 100"
                fill="currentColor"
                className="text-blue-600"
              >
                <path d="M50 0C22.4 0 0 22.4 0 50s22.4 50 50 50 50-22.4 50-50S77.6 0 50 0zm0 80c-16.6 0-30-13.4-30-30s13.4-30 30-30 30 13.4 30 30-13.4 30-30 30z" />
                <path d="M50 20c-16.6 0-30 13.4-30 30s13.4 30 30 30 30-13.4 30-30-13.4-30-30-30zm0 50c-11 0-20-9-20-20s9-20 20-20 20 9 20 20-9 20-20 20z" />
              </svg>
            </div>

            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-4">
                {/* Status indicator with animation */}
                <div className="relative">
                  <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
                  <div className="absolute inset-0 w-4 h-4 bg-blue-400 rounded-full animate-ping"></div>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-semibold text-blue-900">
                      {isPremium && planStatus.isPremiumCooldown
                        ? "Plano Premium - Próximo Disponível"
                        : "Plano Personalizado Ativo"}
                    </h4>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {isPremium && planStatus.isPremiumCooldown
                        ? "⏰ Cooldown"
                        : "✓ Ativo"}
                    </span>
                  </div>
                  <p className="text-sm text-blue-700 font-medium mb-1">
                    {isPremium && planStatus.isPremiumCooldown
                      ? `Último plano gerado em: ${new Date(
                          planStatus.generatedAt!
                        ).toLocaleDateString("pt-BR")}`
                      : `Gerado em: ${new Date(
                          planStatus.generatedAt!
                        ).toLocaleDateString("pt-BR")}`}
                  </p>
                  {isPremium && planStatus.isPremiumCooldown ? (
                    <p className="text-xs text-blue-600 flex items-center gap-1">
                      <svg
                        className="w-3 h-3"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Próximo plano disponível em:{" "}
                      <span className="font-semibold">
                        {planStatus.hoursUntilNext === 1
                          ? "1 hora"
                          : `${planStatus.hoursUntilNext} horas`}
                      </span>
                    </p>
                  ) : (
                    !isPremium && (
                      <p className="text-xs text-blue-600 flex items-center gap-1">
                        <svg
                          className="w-3 h-3"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Próximo plano disponível em:{" "}
                        <span className="font-semibold">
                          {planStatus.daysUntilNext} dias
                        </span>
                      </p>
                    )
                  )}
                </div>
              </div>

              <div className="text-blue-600">
                <svg
                  className="w-8 h-8"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 space-y-4">
        <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <svg
            className="w-4 h-4 text-purple-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Ações
        </h4>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleGeneratePlan}
            disabled={isGeneratingPlan || isCheckingPlanStatus}
            className={`flex-1 ${components.button.base} ${components.button.sizes.lg} bg-gradient-to-r from-gray-800 to-gray-900 text-white hover:from-gray-900 hover:to-black disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200`}
          >
            {isGeneratingPlan ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Gerando Plano...
              </>
            ) : isCheckingPlanStatus ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Verificando...
              </>
            ) : planStatus?.isExisting ? (
              <>
                <svg
                  className="w-5 h-5"
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
                Ver Plano Atual (Treino + Dieta)
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                  />
                </svg>
                Gerar Plano Personalizado (Treino + Dieta)
              </>
            )}
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className={`${components.button.base} ${
              components.button.sizes.lg
            } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200 ${
              evaluation
                ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700"
                : "bg-gradient-to-r from-gray-600 to-gray-700 text-white hover:from-gray-700 hover:to-gray-800"
            }`}
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Enviando...
              </>
            ) : evaluation ? (
              <>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Avaliação Enviada
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                Upload Avaliação
              </>
            )}
          </button>
        </div>
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
                className={`flex-1 ${components.button.base} ${components.button.sizes.md} bg-gray-200 text-gray-800 hover:bg-gray-300`}
              >
                Cancelar
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`flex-1 ${components.button.base} ${components.button.sizes.md} bg-green-600 text-white hover:bg-green-700`}
              >
                Adicionar Avaliação
              </button>
              <button
                onClick={confirmGeneratePlan}
                className={`flex-1 ${components.button.base} ${components.button.sizes.md} bg-gray-800 text-white hover:bg-gray-900`}
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
              className={`w-full ${components.button.base} ${components.button.sizes.md} bg-gray-800 text-white hover:bg-gray-900`}
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
              className={`w-full ${components.button.base} ${components.button.sizes.md} bg-gray-800 text-white hover:bg-gray-900`}
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

// Função para calcular idade (mover para dentro do componente)
const calculateAge = (birthDate: string) => {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
};
