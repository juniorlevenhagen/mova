"use client";

import { useState, useEffect, useRef } from "react";
import { typography, components, colors } from "@/lib/design-tokens";
import { PersonalizedPlan } from "@/types/personalized-plan";
import { supabase } from "@/lib/supabase";
import jsPDF from "jspdf";
import { Dumbbell, Zap, RotateCcw, Info, TrendingUp } from "lucide-react";

interface PersonalizedPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: PersonalizedPlan | null;
  userProfile?: {
    altura: number;
    peso: number;
    pesoInicial: number;
    sexo: string;
    frequenciaTreinos: string;
    objetivo: string;
    birthDate: string | null;
    nivelAtividade: string;
    tempoTreino?: string;
    dietaryRestrictions?: string;
    foodBudget?: string;
  };
}

// Funções auxiliares para extrair informações do texto da OpenAI
function extractCalories(text: string): string {
  const match = text.match(/(\d+)\s*(?:kcal|calorias|cal)/i);
  return match ? `${match[1]} kcal` : "";
}

function extractMacros(text: string): Array<{ name: string; value: string }> {
  const macros: Array<{ name: string; value: string }> = [];

  // Proteínas
  const proteinMatch = text.match(/prote[íi]nas?[:\s]+([^\n]+)/i);
  if (proteinMatch) {
    macros.push({ name: "Proteínas", value: proteinMatch[1].trim() });
  }

  // Carboidratos
  const carbsMatch = text.match(/carboidratos?[:\s]+([^\n]+)/i);
  if (carbsMatch) {
    macros.push({ name: "Carboidratos", value: carbsMatch[1].trim() });
  }

  // Gorduras
  const fatsMatch = text.match(/gorduras?[:\s]+([^\n]+)/i);
  if (fatsMatch) {
    macros.push({ name: "Gorduras", value: fatsMatch[1].trim() });
  }

  return macros;
}

// Lista de alimentos que devem ser contados em unidades (não pesados)
// Apenas ovos devem ser contados em unidades, todos os outros alimentos devem ser pesados
const UNIT_FOODS = ["ovo", "ovos"];

// Função para verificar se um alimento deve ser contado em unidades
function shouldUseUnits(foodName: string): boolean {
  const foodLower = foodName.toLowerCase();
  return UNIT_FOODS.some((unitFood) => foodLower.includes(unitFood));
}

// Função para normalizar e formatar quantidades
// Se o alimento deve ser contado em unidades, mantém unidades
// Se o alimento deve ser pesado, converte para gramas/kg
function formatQuantity(
  quantity: string | undefined,
  foodName?: string
): string | null {
  if (!quantity) return null;

  const qty = quantity.trim();
  const useUnits = foodName ? shouldUseUnits(foodName) : false;

  // Se já está em formato de unidade (un, unidades, etc.), manter se for alimento de unidade
  const unitMatch = qty.match(
    /(\d+(?:[.,]\d+)?)\s*(un|unidade|unidades|un\.)/i
  );
  if (unitMatch && useUnits) {
    const num = parseFloat(unitMatch[1].replace(",", "."));
    const un = num === 1 ? "unidade" : "unidades";
    return `${Math.round(num)} ${un}`;
  }

  // Se já está em formato de peso (g, kg, gramas, etc.)
  const weightMatch = qty.match(
    /(\d+(?:[.,]\d+)?)\s*(g|kg|gramas?|quilogramas?)/i
  );
  if (weightMatch) {
    const num = parseFloat(weightMatch[1].replace(",", "."));
    const unit = weightMatch[2].toLowerCase();

    // Se é alimento de unidade (ovo) mas veio em peso, tentar converter para unidade aproximada
    if (useUnits && unit.includes("g")) {
      // Aproximação: 1 ovo ~50g
      if (foodName?.toLowerCase().includes("ovo")) {
        const units = Math.round(num / 50);
        return units === 1 ? "1 unidade" : `${units} unidades`;
      }
    }

    // Se está em kg, manter em kg
    if (unit.includes("kg") || unit.includes("quilograma")) {
      const kg = num.toFixed(num % 1 === 0 ? 0 : 1).replace(".", ",");
      return `${kg}kg`;
    }

    // Se está em gramas e >= 1000, converter para kg
    if (num >= 1000) {
      const kg = (num / 1000).toFixed(1).replace(".", ",");
      return `${kg}kg`;
    }

    // Caso contrário, manter em gramas
    const g = Math.round(num);
    return `${g}g`;
  }

  // Tentar extrair apenas números (sem unidade)
  const numberMatch = qty.match(/(\d+(?:[.,]\d+)?)/);
  if (numberMatch) {
    const num = parseFloat(numberMatch[1].replace(",", "."));

    // Se é alimento de unidade, usar unidades
    if (useUnits) {
      const un = Math.round(num) === 1 ? "unidade" : "unidades";
      return `${Math.round(num)} ${un}`;
    }

    // Se o número for >= 1000, converter para kg
    if (num >= 1000) {
      const kg = (num / 1000).toFixed(1).replace(".", ",");
      return `${kg}kg`;
    }

    // Caso contrário, adicionar "g" para alimentos pesáveis
    const g = Math.round(num);
    return `${g}g`;
  }

  // Se não conseguir normalizar, retornar como está
  return qty;
}

function extractMeals(text: string): Array<{
  name: string;
  timing?: string;
  foods: Array<{ name: string; quantity?: string; calories?: string }>;
  totalCalories?: string;
}> {
  const meals: Array<{
    name: string;
    timing?: string;
    foods: Array<{ name: string; quantity?: string; calories?: string }>;
    totalCalories?: string;
  }> = [];

  // Padrões comuns de refeições
  const mealPatterns = [
    /(?:caf[ée]\s+da\s+manh[ãa]|desjejum|breakfast)/i,
    /(?:lanche\s+da\s+manh[ãa]|lanche\s+matinal)/i,
    /(?:almo[çc]o|lunch)/i,
    /(?:lanche\s+da\s+tarde|lanche\s+tarde)/i,
    /(?:jantar|dinner)/i,
    /(?:ceia|supper)/i,
  ];

  const lines = text.split("\n");
  let currentMeal: {
    name: string;
    timing?: string;
    foods: Array<{ name: string; quantity?: string; calories?: string }>;
    totalCalories?: string;
  } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Verificar se é uma nova refeição
    const mealMatch = mealPatterns.find((pattern) => pattern.test(line));
    if (mealMatch) {
      if (currentMeal) {
        meals.push(currentMeal);
      }
      currentMeal = {
        name: line,
        foods: [],
      };

      // Tentar extrair horário da próxima linha
      if (i + 1 < lines.length) {
        const timingMatch = lines[i + 1].match(/(\d{1,2}[:h]\d{2}|\d{1,2}h)/i);
        if (timingMatch) {
          currentMeal.timing = timingMatch[1];
        }
      }
      continue;
    }

    // Se estamos em uma refeição, tentar extrair alimentos
    if (currentMeal) {
      // Padrão: alimento (quantidade) - calorias
      const foodMatch = line.match(
        /[-•]\s*(.+?)(?:\s*\(([^)]+)\))?(?:\s*-\s*(\d+)\s*kcal)?/i
      );
      if (foodMatch) {
        currentMeal.foods.push({
          name: foodMatch[1].trim(),
          quantity: foodMatch[2]?.trim(),
          calories: foodMatch[3] ? `${foodMatch[3]} kcal` : undefined,
        });
      } else if (line && !line.match(/^(total|calorias|kcal)/i)) {
        // Se não tem padrão mas tem conteúdo, adicionar como alimento
        currentMeal.foods.push({ name: line });
      }

      // Tentar extrair total de calorias da refeição
      const totalMatch = line.match(/total[:\s]+(\d+)\s*kcal/i);
      if (totalMatch) {
        currentMeal.totalCalories = `${totalMatch[1]} kcal`;
      }
    }
  }

  if (currentMeal) {
    meals.push(currentMeal);
  }

  // Se não encontrou refeições estruturadas, criar uma refeição genérica com todo o texto
  if (meals.length === 0) {
    meals.push({
      name: "Plano Nutricional",
      foods: [{ name: text }],
    });
  }

  return meals;
}

function extractHydration(text: string): string | null {
  const hydrationMatch = text.match(
    /hidrata[çc][ãa]o[:\s]+([^\n]+(?:\n[^\n]+)*)/i
  );
  return hydrationMatch ? hydrationMatch[1].trim() : null;
}

function extractSupplements(text: string): string[] {
  const supplements: string[] = [];
  const supplementMatch = text.match(
    /suplementos?[:\s]+([^\n]+(?:\n[^\n]+)*)/i
  );

  if (supplementMatch) {
    const supplementText = supplementMatch[1];
    const lines = supplementText.split("\n");
    lines.forEach((line) => {
      const cleanLine = line.replace(/^[-•]\s*/, "").trim();
      if (cleanLine) {
        supplements.push(cleanLine);
      }
    });
  }

  return supplements;
}

// Interface para refeição estruturada
interface MealOption {
  food?: string;
  name?: string;
  quantity?: string;
  calories?: number;
}

interface MealPlanItem {
  meal?: string;
  name?: string;
  timing?: string;
  options?: MealOption[];
  foods?: Array<{ name: string; quantity?: string; calories?: string }>;
}

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest: string;
  notes?: string;
  primaryMuscle: string;
  secondaryMuscles?: string[];
  muscleGroups?: string[];
}

export function PersonalizedPlanModal({
  isOpen,
  onClose,
  plan,
  userProfile,
}: PersonalizedPlanModalProps) {
  const [activeTab, setActiveTab] = useState<
    "analysis" | "training" | "aerobic" | "diet" | "goals" | "motivation"
  >("analysis");
  const [openAIMessage, setOpenAIMessage] = useState<string>("");
  const [isLoadingOpenAI, setIsLoadingOpenAI] = useState<boolean>(false);
  const [isLoadingTrainingPlan, setIsLoadingTrainingPlan] =
    useState<boolean>(false);
  const [trainingPlanError, setTrainingPlanError] = useState<string | null>(
    null
  );
  const trainingPlanAttemptedRef = useRef(false);
  const [expandedCards, setExpandedCards] = useState<{
    training: boolean;
    aerobic: boolean;
    nutrition: boolean;
  }>({
    training: false,
    aerobic: false,
    nutrition: false,
  });

  const isTrainingPlanUsable = (
    trainingPlan: PersonalizedPlan["trainingPlan"]
  ) => {
    if (!trainingPlan) return false;
    if (!Array.isArray(trainingPlan.weeklySchedule)) return false;
    if (trainingPlan.weeklySchedule.length === 0) return false;
    for (const day of trainingPlan.weeklySchedule) {
      if (
        !day?.exercises ||
        !Array.isArray(day.exercises) ||
        day.exercises.length === 0
      ) {
        return false;
      }
    }
    return true;
  };

  // Helper para exibir o orçamento alimentar em formato amigável
  const getFoodBudgetLabel = (budget?: string) => {
    if (!budget) return "Moderado";
    switch (budget) {
      case "economico":
        return "Econômico";
      case "moderado":
        return "Moderado";
      case "premium":
        return "Premium";
      default:
        return budget;
    }
  };

  // Campos opcionais do plano
  const hasOptionalFields = {
    aerobicTraining: !!plan?.aerobicTraining,
    nutritionPlan: !!plan?.nutritionPlan,
    goals: !!plan?.goals,
    motivation: !!plan?.motivation,
  };

  console.log("📊 Campos opcionais presentes:", hasOptionalFields);
  console.log(
    "🔍 Plan object keys:",
    plan ? Object.keys(plan) : "plan is null"
  );
  console.log("🔍 nutritionPlan exists?", !!plan?.nutritionPlan);
  if (plan?.nutritionPlan) {
    console.log("🔍 nutritionPlan structure:", {
      hasDailyCalories: !!plan.nutritionPlan.dailyCalories,
      hasMacros: !!plan.nutritionPlan.macros,
      hasMealPlan: !!plan.nutritionPlan.mealPlan,
      hasHydration: !!plan.nutritionPlan.hydration,
    });
  }

  // Resetar activeTab se a tab atual não existir mais
  useEffect(() => {
    if (!isOpen || !plan) return;

    const availableTabs = [
      "analysis",
      "training",
      ...(hasOptionalFields.aerobicTraining ? ["aerobic"] : []),
      "diet", // Sempre disponível
      ...(hasOptionalFields.goals ? ["goals"] : []),
      ...(hasOptionalFields.motivation ? ["motivation"] : []),
    ];
    if (!availableTabs.includes(activeTab)) {
      setActiveTab("analysis");
    }
  }, [
    isOpen,
    plan,
    hasOptionalFields.aerobicTraining,
    hasOptionalFields.goals,
    hasOptionalFields.motivation,
    activeTab,
  ]);

  // Chamar OpenAI quando a aba Dieta for aberta
  useEffect(() => {
    if (activeTab === "diet" && !openAIMessage && !isLoadingOpenAI) {
      // Primeiro, tentar carregar dieta salva
      const loadSavedDiet = async () => {
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (!session) return null;

          const response = await fetch("/api/save-diet", {
            method: "GET",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.dietPlan) {
              return data.dietPlan;
            }
          }
          return null;
        } catch (error) {
          console.error("Erro ao carregar dieta salva:", error);
          return null;
        }
      };

      // Carregar dieta salva primeiro
      loadSavedDiet().then((savedDiet) => {
        if (savedDiet) {
          // Se existe dieta salva, usar ela
          setOpenAIMessage(savedDiet);
        } else {
          // Se não existe, gerar nova usando endpoint estruturado
          setIsLoadingOpenAI(true);

          if (!userProfile) {
            console.error("Perfil do usuário não disponível");
            setIsLoadingOpenAI(false);
            return;
          }

          // Calcular IMC
          const heightInMeters = (userProfile.altura || 0) / 100;
          const weight = userProfile.peso || 0;
          const imc =
            heightInMeters > 0 ? weight / (heightInMeters * heightInMeters) : 0;

          // Calcular idade a partir da data de nascimento, se disponível
          let age: number | null = null;
          if (userProfile.birthDate) {
            const birthDate = new Date(userProfile.birthDate);
            if (!isNaN(birthDate.getTime())) {
              const today = new Date();
              let calculatedAge = today.getFullYear() - birthDate.getFullYear();
              const monthDiff = today.getMonth() - birthDate.getMonth();
              if (
                monthDiff < 0 ||
                (monthDiff === 0 && today.getDate() < birthDate.getDate())
              ) {
                calculatedAge--;
              }
              age = calculatedAge;
            }
          }

          const userDataForAPI = {
            objective: userProfile.objetivo || "Não informado",
            weight,
            height: userProfile.altura || 0,
            imc: imc.toFixed(2),
            age,
            gender: userProfile.sexo || "Não informado",
            nivelAtividade: userProfile.nivelAtividade || "Moderado", // ✅ Nível de atividade do perfil
            trainingFrequency: userProfile.frequenciaTreinos || "Não informado",
            trainingTime: userProfile.tempoTreino || null,
            dietaryRestrictions: userProfile.dietaryRestrictions || "Nenhuma",
            foodBudget: userProfile.foodBudget || "moderado",
          };

          fetch("/api/generate-nutrition-plan", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userData: userDataForAPI,
              existingPlan: plan,
            }),
          })
            .then((res) => res.json())
            .then(async (data) => {
              if (data.success && data.nutritionPlan) {
                // Atualizar o plan com o nutritionPlan gerado
                if (plan) {
                  plan.nutritionPlan = data.nutritionPlan;
                }
                // Também salvar uma mensagem para fallback
                setOpenAIMessage("Plano nutricional gerado com sucesso!");

                // Salvar dieta no banco de dados
                // Isso atualizará o plano completo no banco com o nutritionPlan
                try {
                  const {
                    data: { session },
                  } = await supabase.auth.getSession();
                  if (session) {
                    const saveResponse = await fetch("/api/save-diet", {
                      method: "POST",
                      headers: {
                        Authorization: `Bearer ${session.access_token}`,
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        dietPlan: data.nutritionPlan, // Enviar objeto, não string
                      }),
                    });

                    if (saveResponse.ok) {
                      console.log(
                        "✅ Plano completo atualizado no banco de dados com nutritionPlan"
                      );
                    } else {
                      console.warn(
                        "⚠️ Aviso: Plano pode não ter sido atualizado no banco"
                      );
                    }
                  }
                } catch (saveError) {
                  console.error("Erro ao salvar dieta:", saveError);
                }
              } else {
                console.error("Erro ao gerar plano nutricional:", data.error);
                setOpenAIMessage("Erro ao gerar plano nutricional.");
              }
              setIsLoadingOpenAI(false);
            })
            .catch((error) => {
              console.error("Erro ao gerar dieta:", error);
              setOpenAIMessage("Erro ao gerar plano nutricional.");
              setIsLoadingOpenAI(false);
            });
        }
      });
    }
  }, [activeTab, openAIMessage, isLoadingOpenAI, userProfile, plan]);

  // Gerar trainingPlan sob demanda ao abrir a aba "Treino" (evita plano cortado por tokens)
  useEffect(() => {
    if (!isOpen || !plan) return;
    if (activeTab !== "training") return;
    if (isLoadingTrainingPlan) return;
    if (isTrainingPlanUsable(plan.trainingPlan)) return;
    if (trainingPlanAttemptedRef.current) return;

    const run = async () => {
      try {
        setTrainingPlanError(null);
        setIsLoadingTrainingPlan(true);
        trainingPlanAttemptedRef.current = true;

        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.access_token) {
          throw new Error("Usuário não autenticado");
        }

        const res = await fetch("/api/generate-training-plan", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        });

        const raw = await res.text();
        const data = (() => {
          try {
            return JSON.parse(raw);
          } catch {
            return { error: raw || "(empty response body)" };
          }
        })();
        if (!res.ok) {
          console.error(
            "❌ /api/generate-training-plan erro:",
            res.status,
            data,
            raw
          );
          throw new Error(
            `(${res.status}) ${data?.error || "Erro ao gerar treino"}`
          );
        }

        if (data?.success && data?.trainingPlan) {
          // Atualizar o `plan` em memória (padrão já usado no nutritionPlan)
          plan.trainingPlan = data.trainingPlan;
        } else {
          throw new Error("Resposta inesperada ao gerar treino");
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Erro ao gerar treino";
        setTrainingPlanError(msg);
      } finally {
        setIsLoadingTrainingPlan(false);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, activeTab]);

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

  if (!isOpen || !plan) return null;

  // Verificações de segurança para evitar erros
  // Temporariamente não validamos campos obrigatórios para testes
  // const missingFields: string[] = [];
  // if (!plan.analysis) missingFields.push("analysis");
  // if (!plan.trainingPlan) missingFields.push("trainingPlan");

  console.log("📊 Campos opcionais presentes:", hasOptionalFields);

  // Temporariamente desabilitado para testes
  // if (missingFields.length > 0) {
  //   console.error("❌ Plano incompleto. Campos faltando:", missingFields);
  //   console.error("📄 Plano completo:", JSON.stringify(plan, null, 2));
  //   return (
  //     <div className="fixed inset-0 z-50 overflow-y-auto">
  //       ... código do erro comentado ...
  //     </div>
  //   );
  // }

  const tabs = [
    { id: "analysis", label: "Análise" },
    { id: "training", label: "Treino" },
    ...(hasOptionalFields.aerobicTraining
      ? [{ id: "aerobic", label: "Aeróbico" }]
      : []),
    { id: "diet", label: "Dieta" },
    ...(hasOptionalFields.goals ? [{ id: "goals", label: "Metas" }] : []),
    ...(hasOptionalFields.motivation
      ? [{ id: "motivation", label: "Motivação" }]
      : []),
  ];

  // Garantir que activeTab seja válido (se a tab atual não existir, usar "analysis")
  const validActiveTab = tabs.some((tab) => tab.id === activeTab)
    ? activeTab
    : "analysis";

  const exportToPDF = async () => {
    if (!plan) return;

    try {
      // Buscar informações adicionais do usuário
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data: userData } = await supabase
        .from("users")
        .select("full_name")
        .eq("id", user?.id)
        .maybeSingle();

      // Buscar avaliação mais recente
      const { data: evaluation } = await supabase
        .from("user_evaluations")
        .select("created_at")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Calcular idade
      let idade = "Não informado";
      if (userProfile?.birthDate) {
        const birthDate = new Date(userProfile.birthDate);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (
          monthDiff < 0 ||
          (monthDiff === 0 && today.getDate() < birthDate.getDate())
        ) {
          age--;
        }
        idade = `${age} anos`;
      }

      // Formatar data da avaliação
      let dataAvaliacao = "Não informado";
      if (evaluation?.created_at) {
        dataAvaliacao = new Date(evaluation.created_at).toLocaleDateString(
          "pt-BR",
          {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          }
        );
      }

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      let yPosition = margin;
      const lineHeight = 7;
      const maxWidth = pageWidth - 2 * margin;

      // Função auxiliar para adicionar texto com quebra de linha
      const addText = (
        text: string,
        fontSize: number = 10,
        isBold: boolean = false,
        color: string = "#000000"
      ) => {
        doc.setFontSize(fontSize);
        doc.setFont("helvetica", isBold ? "bold" : "normal");
        doc.setTextColor(color);

        // Quebrar texto em linhas que cabem na largura da página
        const words = text.split(" ");
        const lines: string[] = [];
        let currentLine = "";

        words.forEach((word) => {
          const testLine = currentLine + (currentLine ? " " : "") + word;
          const testWidth = doc.getTextWidth(testLine);

          if (testWidth > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        });
        if (currentLine) {
          lines.push(currentLine);
        }

        // Verificar se precisa de nova página
        if (yPosition + lines.length * lineHeight > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }

        // Adicionar linhas ao PDF
        lines.forEach((line: string) => {
          doc.text(line, margin, yPosition);
          yPosition += lineHeight;
        });
        yPosition += 2; // Espaço entre parágrafos
      };

      // Cabeçalho
      doc.setFillColor(59, 130, 246); // Azul
      doc.rect(0, 0, pageWidth, 50, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("Plano Personalizado", margin, 25);

      // Informações do usuário no cabeçalho
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      const userName =
        userData?.full_name || user?.user_metadata?.full_name || "Usuário";
      doc.text(`Nome: ${userName}`, margin, 35);
      doc.text(`Idade: ${idade}`, margin + 80, 35);
      doc.text(`Data da Avaliação: ${dataAvaliacao}`, margin, 42);
      doc.text(
        `Objetivo: ${userProfile?.objetivo || "Não informado"}`,
        margin + 80,
        42
      );

      yPosition = 60;
      doc.setTextColor(0, 0, 0);

      // Informações do plano
      const currentDate = new Date().toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      addText(`Gerado em: ${currentDate}`, 10);
      if (userProfile?.peso) {
        // ✅ Usar peso do userProfile (que já pode ser histórico se veio do histórico)
        addText(`Peso atual: ${userProfile.peso} kg`, 10);
      }
      yPosition += 5;

      // Análise
      if (plan.analysis) {
        doc.setFillColor(59, 130, 246);
        doc.rect(margin, yPosition - 5, maxWidth, 8, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("ANÁLISE", margin + 5, yPosition);
        yPosition += 10;
        doc.setTextColor(0, 0, 0);

        if (plan.analysis.currentStatus) {
          addText("Status Atual:", 11, true);
          addText(plan.analysis.currentStatus, 10);
        }

        if (plan.analysis.strengths && plan.analysis.strengths.length > 0) {
          addText("Pontos Fortes:", 11, true);
          plan.analysis.strengths.forEach((strength) => {
            addText(`• ${strength}`, 10);
          });
        }

        if (
          plan.analysis.improvements &&
          plan.analysis.improvements.length > 0
        ) {
          addText("Áreas de Melhoria:", 11, true);
          plan.analysis.improvements.forEach((improvement) => {
            addText(`• ${improvement}`, 10);
          });
        }
        yPosition += 5;
      }

      // Plano de Treino
      if (plan.trainingPlan) {
        doc.setFillColor(34, 197, 94);
        doc.rect(margin, yPosition - 5, maxWidth, 8, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("PLANO DE TREINO", margin + 5, yPosition);
        yPosition += 10;
        doc.setTextColor(0, 0, 0);

        if (plan.trainingPlan.overview) {
          addText("Visão Geral:", 11, true);
          addText(plan.trainingPlan.overview, 10);
        }

        if (
          plan.trainingPlan.weeklySchedule &&
          plan.trainingPlan.weeklySchedule.length > 0
        ) {
          addText("Cronograma Semanal:", 11, true);
          plan.trainingPlan.weeklySchedule.forEach((day) => {
            addText(`${day.day} - ${day.type}`, 10, true);
            if (day.exercises && day.exercises.length > 0) {
              day.exercises.forEach((exercise) => {
                addText(
                  `  • ${exercise.name} - ${exercise.sets} séries x ${exercise.reps} reps`,
                  9
                );
                if (exercise.rest) {
                  addText(`    Descanso: ${exercise.rest}`, 9);
                }
              });
            }
            yPosition += 2;
          });
        }

        if (plan.trainingPlan.progression) {
          addText("Progressão:", 11, true);
          addText(plan.trainingPlan.progression, 10);
        }
        yPosition += 5;
      }

      // Treino Aeróbico
      if (plan.aerobicTraining) {
        doc.setFillColor(59, 130, 246);
        doc.rect(margin, yPosition - 5, maxWidth, 8, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("TREINO AERÓBICO/CARDIOVASCULAR", margin + 5, yPosition);
        yPosition += 10;
        doc.setTextColor(0, 0, 0);

        if (plan.aerobicTraining.overview) {
          addText("Visão Geral:", 11, true);
          addText(plan.aerobicTraining.overview, 10);
        }

        if (
          plan.aerobicTraining.weeklySchedule &&
          plan.aerobicTraining.weeklySchedule.length > 0
        ) {
          addText("Cronograma Semanal de Atividades Aeróbicas:", 11, true);
          plan.aerobicTraining.weeklySchedule.forEach((day) => {
            addText(`${day.day}`, 10, true);
            addText(`  Atividade: ${day.activity}`, 9);
            addText(`  Duração: ${day.duration}`, 9);
            addText(`  Intensidade: ${day.intensity}`, 9);
            if (day.heartRateZone) {
              addText(`  Zona de FC: ${day.heartRateZone}`, 9);
            }
            if (day.notes) {
              addText(`  Nota: ${day.notes}`, 9);
            }
            yPosition += 2;
          });
        }

        if (plan.aerobicTraining.recommendations) {
          addText("Recomendações:", 11, true);
          addText(plan.aerobicTraining.recommendations, 10);
        }

        if (plan.aerobicTraining.progression) {
          addText("Progressão:", 11, true);
          addText(plan.aerobicTraining.progression, 10);
        }
        yPosition += 5;
      }

      // Plano Nutricional
      if (plan.nutritionPlan) {
        doc.setFillColor(249, 115, 22);
        doc.rect(margin, yPosition - 5, maxWidth, 8, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("PLANO NUTRICIONAL", margin + 5, yPosition);
        yPosition += 10;
        doc.setTextColor(0, 0, 0);

        if (plan.nutritionPlan.dailyCalories) {
          addText(
            `Calorias Diárias: ${plan.nutritionPlan.dailyCalories} kcal`,
            11,
            true
          );
        }

        if (plan.nutritionPlan.macros) {
          addText("Macronutrientes:", 11, true);
          if (plan.nutritionPlan.macros.protein) {
            addText(`Proteínas: ${plan.nutritionPlan.macros.protein}`, 10);
          }
          if (plan.nutritionPlan.macros.carbs) {
            addText(`Carboidratos: ${plan.nutritionPlan.macros.carbs}`, 10);
          }
          if (plan.nutritionPlan.macros.fats) {
            addText(`Gorduras: ${plan.nutritionPlan.macros.fats}`, 10);
          }
        }

        if (
          plan.nutritionPlan.mealPlan &&
          plan.nutritionPlan.mealPlan.length > 0
        ) {
          addText("Plano Alimentar:", 11, true);
          plan.nutritionPlan.mealPlan.forEach((meal) => {
            addText(`${meal.meal} - ${meal.timing}`, 10, true);
            if (meal.options && meal.options.length > 0) {
              meal.options.forEach((option) => {
                const caloriesText = option.calories
                  ? ` (${option.calories} kcal)`
                  : "";
                addText(
                  `  • ${option.food} - ${option.quantity}${caloriesText}`,
                  9
                );
              });
            }
            yPosition += 2;
          });
        }

        if (plan.nutritionPlan.hydration) {
          addText("Hidratação:", 11, true);
          addText(plan.nutritionPlan.hydration, 10);
        }
        yPosition += 5;
      }

      // Metas
      if (plan.goals) {
        doc.setFillColor(139, 92, 246);
        doc.rect(margin, yPosition - 5, maxWidth, 8, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("METAS E OBJETIVOS", margin + 5, yPosition);
        yPosition += 10;
        doc.setTextColor(0, 0, 0);

        if (plan.goals.weekly && plan.goals.weekly.length > 0) {
          addText("Metas Semanais:", 11, true);
          plan.goals.weekly.forEach((goal) => {
            addText(`• ${goal}`, 10);
          });
        }

        if (plan.goals.monthly && plan.goals.monthly.length > 0) {
          addText("Metas Mensais:", 11, true);
          plan.goals.monthly.forEach((goal) => {
            addText(`• ${goal}`, 10);
          });
        }
        yPosition += 5;
      }

      // Motivação
      if (plan.motivation) {
        doc.setFillColor(236, 72, 153);
        doc.rect(margin, yPosition - 5, maxWidth, 8, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("MOTIVAÇÃO", margin + 5, yPosition);
        yPosition += 10;
        doc.setTextColor(0, 0, 0);

        if (plan.motivation.personalMessage) {
          addText(plan.motivation.personalMessage, 10, true);
        }

        if (plan.motivation.tips && plan.motivation.tips.length > 0) {
          addText("Dicas:", 11, true);
          plan.motivation.tips.forEach((tip) => {
            addText(`• ${tip}`, 10);
          });
        }
      }

      // Rodapé
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Página ${i} de ${totalPages} - Mova+`,
          pageWidth - margin,
          pageHeight - 10,
          { align: "right" }
        );
      }

      // Salvar PDF
      const fileName = `Plano_${currentDate.replace(/[\/\s:]/g, "_")}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Erro ao gerar PDF. Por favor, tente novamente.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

        <div
          className={`${components.card.base} relative inline-block align-bottom text-left overflow-hidden transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl w-full max-h-[95vh] sm:max-h-[90vh]`}
        >
          {/* Header */}
          <div className="bg-gray-800 px-4 sm:px-6 py-4 text-white relative pr-12 sm:pr-12">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
              <h3
                className={`${typography.heading.h2} text-white text-lg sm:text-xl`}
              >
                Seu Plano Personalizado
              </h3>
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={exportToPDF}
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg text-xs sm:text-sm font-medium whitespace-nowrap"
                  title="Exportar para PDF"
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
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  PDF
                </button>
              </div>
            </div>
            {/* Botão X no canto superior direito */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors z-10"
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

            {/* Tabs */}
            <div className="mt-4 flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() =>
                    setActiveTab(
                      tab.id as
                        | "analysis"
                        | "training"
                        | "aerobic"
                        | "diet"
                        | "goals"
                        | "motivation"
                    )
                  }
                  className={`${components.button.base} ${
                    components.button.sizes.sm
                  } flex-1 sm:flex-none min-w-[calc(33.333%-0.5rem)] sm:min-w-0 ${
                    validActiveTab === tab.id
                      ? "bg-white text-gray-800"
                      : "bg-gray-700 text-white hover:bg-gray-600"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div
            className="p-4 sm:p-6 max-h-[70vh] overflow-y-auto"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "#94a3b8 #f1f5f9",
            }}
          >
            {/* Resumo do perfil do usuário */}
            {userProfile && (
              <div className="mb-5 sm:mb-6">
                <h4
                  className={`${typography.heading.h4} text-gray-900 mb-1 sm:mb-2`}
                >
                  Resumo do seu perfil
                </h4>
                <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
                  Essas informações foram usadas para personalizar seu treino,
                  dieta e plano aeróbico.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4">
                    <p className="text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Objetivo
                    </p>
                    <p className="mt-1 text-sm sm:text-base text-gray-900 font-semibold break-words">
                      {userProfile.objetivo || "Não informado"}
                    </p>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4">
                    <p className="text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Nível de atividade
                    </p>
                    <p className="mt-1 text-sm sm:text-base text-gray-900 font-semibold break-words">
                      {userProfile.nivelAtividade || "Moderado"}
                    </p>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4">
                    <p className="text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Frequência de musculação
                    </p>
                    <p className="mt-1 text-sm sm:text-base text-gray-900 font-semibold break-words">
                      {userProfile.frequenciaTreinos || "Não informado"}
                    </p>
                  </div>

                  {userProfile.tempoTreino && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4">
                      <p className="text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Tempo disponível por treino
                      </p>
                      <p className="mt-1 text-sm sm:text-base text-gray-900 font-semibold break-words">
                        {userProfile.tempoTreino}
                      </p>
                    </div>
                  )}

                  {userProfile.dietaryRestrictions &&
                    userProfile.dietaryRestrictions !== "Nenhuma" && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4">
                        <p className="text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Restrições alimentares
                        </p>
                        <p className="mt-1 text-sm sm:text-base text-gray-900 font-semibold break-words">
                          {userProfile.dietaryRestrictions}
                        </p>
                      </div>
                    )}

                  {userProfile.foodBudget && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4">
                      <p className="text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Orçamento alimentar
                      </p>
                      <p className="mt-1 text-sm sm:text-base text-gray-900 font-semibold break-words">
                        {getFoodBudgetLabel(userProfile.foodBudget)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Resumo do plano gerado */}
            <div className="mb-5 sm:mb-6">
              <h4
                className={`${typography.heading.h4} text-gray-900 mb-1 sm:mb-2`}
              >
                Resumo do plano
              </h4>
              <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
                Visão rápida de como seu treino, dieta e cardio foram montados
                com base no seu objetivo.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                {/* Treino de força */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                  <p className="text-[11px] sm:text-xs font-medium text-blue-700 uppercase tracking-wide">
                    Treino de força
                  </p>
                  <p className="mt-1 text-sm sm:text-base text-blue-900 font-semibold">
                    {plan.trainingPlan?.weeklySchedule?.length
                      ? `${plan.trainingPlan.weeklySchedule.length} dia${
                          plan.trainingPlan.weeklySchedule.length > 1 ? "s" : ""
                        } de musculação/sem`
                      : userProfile?.frequenciaTreinos ||
                        "Frequência não definida"}
                  </p>
                  {plan.trainingPlan?.overview && (
                    <div className="mt-1">
                      <p
                        className={`text-xs sm:text-[13px] text-blue-800 ${
                          expandedCards.training ? "" : "line-clamp-2"
                        }`}
                      >
                        {plan.trainingPlan.overview}
                      </p>
                      {plan.trainingPlan.overview.length > 100 && (
                        <button
                          onClick={() =>
                            setExpandedCards((prev) => ({
                              ...prev,
                              training: !prev.training,
                            }))
                          }
                          className="mt-1 text-xs text-blue-600 hover:text-blue-800 font-medium underline"
                        >
                          {expandedCards.training ? "Ver menos" : "Ver mais"}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Cardio / aeróbico */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 sm:p-4">
                  <p className="text-[11px] sm:text-xs font-medium text-emerald-700 uppercase tracking-wide">
                    Cardio / aeróbico
                  </p>
                  <p className="mt-1 text-sm sm:text-base text-emerald-900 font-semibold">
                    {plan.aerobicTraining?.weeklySchedule?.length
                      ? `${plan.aerobicTraining.weeklySchedule.length} sessão${
                          plan.aerobicTraining.weeklySchedule.length > 1
                            ? "s"
                            : ""
                        } de cardio/sem`
                      : "Frequência não definida"}
                  </p>
                  {plan.aerobicTraining?.overview && (
                    <div className="mt-1">
                      <p
                        className={`text-xs sm:text-[13px] text-emerald-800 ${
                          expandedCards.aerobic ? "" : "line-clamp-2"
                        }`}
                      >
                        {plan.aerobicTraining.overview}
                      </p>
                      {plan.aerobicTraining.overview.length > 100 && (
                        <button
                          onClick={() =>
                            setExpandedCards((prev) => ({
                              ...prev,
                              aerobic: !prev.aerobic,
                            }))
                          }
                          className="mt-1 text-xs text-emerald-600 hover:text-emerald-800 font-medium underline"
                        >
                          {expandedCards.aerobic ? "Ver menos" : "Ver mais"}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Nutrição */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 sm:p-4">
                  <p className="text-[11px] sm:text-xs font-medium text-orange-700 uppercase tracking-wide">
                    Nutrição
                  </p>
                  <p className="mt-1 text-sm sm:text-base text-orange-900 font-semibold">
                    {plan.nutritionPlan?.dailyCalories
                      ? `${plan.nutritionPlan.dailyCalories} kcal/dia`
                      : "Calorias ainda não definidas"}
                  </p>
                  {plan.nutritionPlan?.macros && (
                    <p className="mt-1 text-xs sm:text-[13px] text-orange-800">
                      Prot: {plan.nutritionPlan.macros.protein || "N/A"} · Carb:{" "}
                      {plan.nutritionPlan.macros.carbs || "N/A"} · Gord:{" "}
                      {plan.nutritionPlan.macros.fats || "N/A"}
                    </p>
                  )}
                  {plan.nutritionPlan?.hydration && (
                    <div className="mt-1">
                      <p
                        className={`text-xs sm:text-[13px] text-orange-800 ${
                          expandedCards.nutrition ? "" : "line-clamp-2"
                        }`}
                      >
                        {plan.nutritionPlan.hydration}
                      </p>
                      {plan.nutritionPlan.hydration.length > 100 && (
                        <button
                          onClick={() =>
                            setExpandedCards((prev) => ({
                              ...prev,
                              nutrition: !prev.nutrition,
                            }))
                          }
                          className="mt-1 text-xs text-orange-600 hover:text-orange-800 font-medium underline"
                        >
                          {expandedCards.nutrition ? "Ver menos" : "Ver mais"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Análise */}
            {validActiveTab === "analysis" && (
              <div className="space-y-6">
                <div
                  className={`${colors.status.info.bg} ${colors.status.info.border} border rounded-lg p-4`}
                >
                  <h4
                    className={`${typography.heading.h4} ${colors.status.info.text} mb-2`}
                  >
                    Status Atual
                  </h4>
                  {userProfile?.peso && (
                    <div className="mb-3 pb-3 border-b border-blue-200">
                      <p className={`${colors.status.info.text} font-semibold`}>
                        Peso Atual: {userProfile.peso} kg
                      </p>
                    </div>
                  )}
                  <p className={`${colors.status.info.text}`}>
                    {plan.analysis?.currentStatus}
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div
                    className={`${colors.status.success.bg} ${colors.status.success.border} border rounded-lg p-4`}
                  >
                    <h4
                      className={`${typography.heading.h4} ${colors.status.success.text} mb-3`}
                    >
                      Pontos Fortes
                    </h4>
                    <ul className="space-y-2">
                      {(plan.analysis?.strengths || []).map(
                        (strength, index) => (
                          <li key={index} className="flex items-start">
                            <span
                              className={`${colors.status.success.accent} mr-2`}
                            >
                              •
                            </span>
                            <span className={`${colors.status.success.text}`}>
                              {strength}
                            </span>
                          </li>
                        )
                      )}
                    </ul>
                  </div>

                  <div
                    className={`${colors.status.warning.bg} ${colors.status.warning.border} border rounded-lg p-4`}
                  >
                    <h4
                      className={`${typography.heading.h4} ${colors.status.warning.text} mb-3`}
                    >
                      Áreas de Melhoria
                    </h4>
                    <ul className="space-y-2">
                      {(plan.analysis?.improvements || []).map(
                        (improvement, index) => (
                          <li key={index} className="flex items-start">
                            <span
                              className={`${colors.status.warning.accent} mr-2`}
                            >
                              •
                            </span>
                            <span className={`${colors.status.warning.text}`}>
                              {improvement}
                            </span>
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                </div>

                {plan.analysis?.specialConsiderations &&
                  plan.analysis.specialConsiderations.length > 0 && (
                    <div
                      className={`${colors.status.warning.bg} ${colors.status.warning.border} border rounded-lg p-4`}
                    >
                      <h4
                        className={`${typography.heading.h4} ${colors.status.warning.text} mb-3`}
                      >
                        Considerações Especiais
                      </h4>
                      <ul className="space-y-2">
                        {plan.analysis.specialConsiderations.map(
                          (consideration, index) => (
                            <li key={index} className="flex items-start">
                              <span
                                className={`${colors.status.warning.accent} mr-2`}
                              >
                                •
                              </span>
                              <span className={`${colors.status.warning.text}`}>
                                {consideration}
                              </span>
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}
              </div>
            )}

            {/* Treino */}
            {validActiveTab === "training" && (
              <div className="space-y-8">
                {trainingPlanError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-red-700 text-sm flex-1">
                        {trainingPlanError}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          trainingPlanAttemptedRef.current = false;
                          setTrainingPlanError(null);
                        }}
                        className="text-sm font-medium text-red-700 underline hover:text-red-800"
                      >
                        Tentar novamente
                      </button>
                    </div>
                  </div>
                )}

                {isLoadingTrainingPlan ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-gray-600 font-medium">
                      Gerando seu treino de alta performance...
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="bg-slate-900 rounded-xl p-3 sm:p-4 text-white shadow-lg border border-slate-800">
                      <div className="flex items-center gap-2.5 mb-2 sm:mb-3">
                        <div className="h-5 sm:h-6 w-1 bg-blue-500 rounded-full" />
                        <h4 className="text-sm sm:text-base font-bold uppercase tracking-wider text-blue-400">
                          Visão Geral da Estratégia
                        </h4>
                      </div>
                      <p className="text-[13px] sm:text-sm text-slate-300 leading-relaxed italic">
                        &quot;
                        {plan.trainingPlan?.overview ||
                          "Sua estratégia personalizada para máxima performance."}
                        &quot;
                      </p>
                    </div>

                    <div className="space-y-8 sm:space-y-12">
                      {(plan.trainingPlan?.weeklySchedule || []).map(
                        (day, dayIndex) => {
                          const exercises = day?.exercises || [];

                          // Helper para cores por tipo de treino
                          const getDayTheme = (type: string) => {
                            const t = type.toLowerCase();
                            if (t.includes("push"))
                              return {
                                text: "text-red-600",
                                bg: "bg-red-50",
                                accent: "bg-red-600",
                                shadow: "shadow-red-100",
                              };
                            if (t.includes("pull"))
                              return {
                                text: "text-blue-600",
                                bg: "bg-blue-50",
                                accent: "bg-blue-600",
                                shadow: "shadow-blue-100",
                              };
                            if (t.includes("legs") || t.includes("lower"))
                              return {
                                text: "text-emerald-600",
                                bg: "bg-emerald-50",
                                accent: "bg-emerald-600",
                                shadow: "shadow-emerald-100",
                              };
                            if (t.includes("upper"))
                              return {
                                text: "text-purple-600",
                                bg: "bg-purple-50",
                                accent: "bg-purple-600",
                                shadow: "shadow-purple-100",
                              };
                            return {
                              text: "text-slate-600",
                              bg: "bg-slate-50",
                              accent: "bg-slate-600",
                              shadow: "shadow-slate-100",
                            };
                          };

                          const theme = getDayTheme(day?.type || "");

                          // 🧠 Utilitário para inferir o músculo se a IA falhar ou enviar "Geral"
                          const inferMuscle = (ex: Exercise): string => {
                            const name = (ex.name || "").toLowerCase();
                            const primary = (
                              ex.primaryMuscle || ""
                            ).toLowerCase();

                            // Se já temos um músculo válido e não é genérico, usamos ele
                            const validMuscles = [
                              "peito",
                              "peitoral",
                              "costas",
                              "dorsal",
                              "ombros",
                              "deltoide",
                              "bíceps",
                              "tríceps",
                              "quadríceps",
                              "isquiotibiais",
                              "glúteos",
                              "panturrilhas",
                              "core",
                              "abdominal",
                              "trapézio",
                              "antebraço",
                              "lombar",
                            ];

                            if (primary && validMuscles.includes(primary)) {
                              return primary;
                            }

                            // Mapeamento de emergência baseado em palavras-chave (Exaustivo)
                            // PEITO
                            if (
                              name.includes("supino") ||
                              name.includes("crucifixo") ||
                              name.includes("peitoral") ||
                              name.includes("chest") ||
                              name.includes("cross over") ||
                              name.includes("voador") ||
                              name.includes("peck deck") ||
                              name.includes("flexão de braço")
                            )
                              return "peito";
                            // COSTAS
                            if (
                              name.includes("remada") ||
                              name.includes("puxada") ||
                              name.includes("barra fixa") ||
                              name.includes("pulldown") ||
                              name.includes("dorsal") ||
                              name.includes("serrote") ||
                              name.includes("low row") ||
                              name.includes("pullover")
                            )
                              return "costas";
                            // OMBROS
                            if (
                              name.includes("desenvolvimento") ||
                              name.includes("elevacao lateral") ||
                              name.includes("elevação lateral") ||
                              name.includes("frontal") ||
                              name.includes("deltoide") ||
                              name.includes("militar") ||
                              name.includes("arnold") ||
                              name.includes("shoulder press")
                            )
                              return "ombros";
                            // BÍCEPS
                            if (
                              name.includes("rosca") ||
                              name.includes("biceps") ||
                              name.includes("bíceps") ||
                              name.includes("martelo") ||
                              name.includes("scott")
                            )
                              return "bíceps";
                            // TRÍCEPS
                            if (
                              name.includes("triceps") ||
                              name.includes("tríceps") ||
                              name.includes("testa") ||
                              name.includes("pulley") ||
                              name.includes("paralelas") ||
                              name.includes("extensão de tríceps") ||
                              name.includes("coice")
                            )
                              return "tríceps";
                            // QUADRÍCEPS
                            if (
                              name.includes("agachamento") ||
                              name.includes("leg press") ||
                              name.includes("extensora") ||
                              name.includes("afundo") ||
                              name.includes("passada") ||
                              name.includes("hack") ||
                              name.includes("avanço") ||
                              name.includes("sissy")
                            )
                              return "quadríceps";
                            // ISQUIOTIBIAIS
                            if (
                              name.includes("flexora") ||
                              name.includes("stiff") ||
                              name.includes("isquiotibiais") ||
                              name.includes("mesa flexora") ||
                              name.includes("cadeira flexora") ||
                              name.includes("rdl") ||
                              name.includes("bom dia") ||
                              name.includes("good morning")
                            )
                              return "isquiotibiais";
                            // GLÚTEOS
                            if (
                              name.includes("pélvica") ||
                              name.includes("pelvica") ||
                              name.includes("gluteo") ||
                              name.includes("glúteo") ||
                              name.includes("abdução") ||
                              name.includes("clamshell") ||
                              name.includes("kickback")
                            )
                              return "glúteos";
                            // PANTURRILHAS
                            if (
                              name.includes("panturrilha") ||
                              name.includes("gemeos") ||
                              name.includes("gêmeos") ||
                              name.includes("soleo") ||
                              name.includes("sóleo")
                            )
                              return "panturrilhas";
                            // CORE / ABDÔMEN
                            if (
                              name.includes("abdominal") ||
                              name.includes("prancha") ||
                              name.includes("infra") ||
                              name.includes("supra") ||
                              name.includes("core") ||
                              name.includes("leg raise") ||
                              name.includes("crunch")
                            )
                              return "core";
                            // TRAPÉZIO
                            if (
                              name.includes("encolhimento") ||
                              name.includes("shrug") ||
                              name.includes("trapézio") ||
                              name.includes("trapezio")
                            )
                              return "trapézio";
                            // ANTEBRAÇO
                            if (
                              name.includes("antebraço") ||
                              name.includes("antebraco") ||
                              name.includes("flexão de punho") ||
                              name.includes("extensão de punho")
                            )
                              return "antebraço";
                            // LOMBAR
                            if (
                              name.includes("lombar") ||
                              name.includes("hiperextensão") ||
                              name.includes("hyper") ||
                              name.includes("back extension")
                            )
                              return "lombar";

                            return primary || "Geral";
                          };

                          // Agrupar exercícios por músculo inferido
                          const groupedByMuscle: Record<string, Exercise[]> =
                            {};

                          (exercises as unknown as Exercise[]).forEach((ex) => {
                            const muscle = inferMuscle(ex);

                            const key =
                              muscle.charAt(0).toUpperCase() +
                              muscle.slice(1).toLowerCase();
                            if (!groupedByMuscle[key])
                              groupedByMuscle[key] = [];
                            groupedByMuscle[key].push(ex);
                          });

                          // ✅ Ordenar grupos musculares (Decrescente: Grandes -> Médios -> Pequenos)
                          // Hierarchy: Pernas > Tronco > Ombros > Braços > Finalizadores
                          const muscleWeights: Record<string, number> = {
                            // Pernas (Topo)
                            quadríceps: 100,
                            isquiotibiais: 95,
                            glúteos: 90,
                            // Tronco (Base)
                            costas: 85,
                            peito: 85,
                            peitoral: 85,
                            dorsal: 85,
                            // Ombros e Pescoço
                            ombros: 80,
                            trapézio: 78,
                            // Braços
                            tríceps: 75,
                            bíceps: 70,
                            // Estabilização e Extremidades
                            core: 65,
                            abdominal: 65,
                            lombar: 62,
                            panturrilhas: 60,
                            antebraço: 55,
                          };

                          const sortedMuscleEntries = Object.entries(
                            groupedByMuscle
                          ).sort(([muscleA], [muscleB]) => {
                            const weightA =
                              muscleWeights[muscleA.toLowerCase()] || 0;
                            const weightB =
                              muscleWeights[muscleB.toLowerCase()] || 0;
                            return weightB - weightA;
                          });

                          return (
                            <div
                              key={dayIndex}
                              className={`bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden transition-all hover:shadow-xl`}
                            >
                              {/* Day Header - High Contrast */}
                              <div
                                className={`p-4 sm:p-5 ${theme.bg} border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4`}
                              >
                                <div className="flex items-center gap-3 sm:gap-4">
                                  <div
                                    className={`p-2.5 sm:p-3 rounded-lg sm:rounded-xl ${theme.accent} text-white shadow-md ${theme.shadow}`}
                                  >
                                    <Dumbbell className="w-5 h-5 sm:w-6 sm:h-6" />
                                  </div>
                                  <div>
                                    <h5 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-none mb-1.5 sm:mb-2">
                                      {day?.day || "Sessão de Elite"}
                                    </h5>
                                    <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                                      <span
                                        className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest bg-white ${theme.text} border-2 border-current shadow-sm`}
                                      >
                                        {day?.type || "Musculação"}
                                      </span>
                                      <div className="flex items-center gap-1 px-2 py-0.5 bg-slate-900/5 rounded-full">
                                        <Zap className="w-2.5 h-2.5 text-slate-500" />
                                        <span className="text-[9px] sm:text-[10px] text-slate-600 font-bold uppercase tracking-tighter">
                                          {exercises.length} Exercícios
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="p-4 sm:p-6">
                                <div className="space-y-6 sm:space-y-8">
                                  {sortedMuscleEntries.map(
                                    ([muscle, items]) => (
                                      <div key={muscle} className="relative">
                                        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5">
                                          <div
                                            className={`h-4 sm:h-5 w-1 ${theme.accent} rounded-full`}
                                          />
                                          <h6 className="font-black text-slate-900 text-[10px] sm:text-[11px] uppercase tracking-[0.15em] sm:tracking-[0.2em]">
                                            Bloco: {muscle}
                                          </h6>
                                          <div className="h-px flex-1 bg-gradient-to-r from-slate-100 to-transparent" />
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 sm:gap-5">
                                          {(() => {
                                            // ✅ Ordenar exercícios dentro do grupo (Compostos ANTES de Isoladores)
                                            const sortedExercises = [
                                              ...items,
                                            ].sort((a, b) => {
                                              const compoundKeywords = [
                                                "agachamento",
                                                "supino",
                                                "levantamento",
                                                "terra",
                                                "remada",
                                                "puxada",
                                                "desenvolvimento",
                                                "leg press",
                                                "afundo",
                                                "barra fixa",
                                                "paralelas",
                                                "passada",
                                                "avanço",
                                                "stiff",
                                                "rdl",
                                                "militar",
                                                "pulldown",
                                                "hack",
                                                "smith",
                                                "press",
                                                "mergulho",
                                              ];
                                              const aIsCompound =
                                                compoundKeywords.some((k) =>
                                                  a.name
                                                    .toLowerCase()
                                                    .includes(k)
                                                );
                                              const bIsCompound =
                                                compoundKeywords.some((k) =>
                                                  b.name
                                                    .toLowerCase()
                                                    .includes(k)
                                                );
                                              if (aIsCompound && !bIsCompound)
                                                return -1;
                                              if (!aIsCompound && bIsCompound)
                                                return 1;
                                              return 0;
                                            });

                                            return sortedExercises.map(
                                              (ex, idx) => (
                                                <div
                                                  key={idx}
                                                  className="group relative bg-white border border-slate-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 transition-all duration-300 hover:border-slate-200 hover:shadow-md"
                                                >
                                                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
                                                    <div className="flex-1">
                                                      <div className="flex items-center gap-2.5 sm:gap-3">
                                                        <span className="text-slate-200 font-black text-xl sm:text-2xl leading-none select-none">
                                                          {(idx + 1)
                                                            .toString()
                                                            .padStart(2, "0")}
                                                        </span>
                                                        <div>
                                                          <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-tight block mb-1">
                                                            {ex.name}
                                                          </h4>

                                                          {/* Secondary Muscles */}
                                                          {ex.secondaryMuscles &&
                                                            ex.secondaryMuscles
                                                              .length > 0 && (
                                                              <div className="flex flex-wrap gap-1.5">
                                                                {ex.secondaryMuscles.map(
                                                                  (
                                                                    sm: string,
                                                                    sidx: number
                                                                  ) => (
                                                                    <span
                                                                      key={sidx}
                                                                      className="px-1.5 py-0.5 bg-slate-50 text-slate-400 rounded text-[8px] sm:text-[9px] font-bold uppercase tracking-wider border border-slate-100"
                                                                    >
                                                                      + {sm}
                                                                    </span>
                                                                  )
                                                                )}
                                                              </div>
                                                            )}
                                                        </div>
                                                      </div>
                                                    </div>

                                                    {/* Stats Card - Mais compacto e horizontal */}
                                                    <div className="flex items-center gap-2 sm:gap-3 bg-slate-50/50 p-1.5 rounded-lg sm:rounded-xl border border-slate-100/50 lg:w-fit">
                                                      <div className="bg-white px-2.5 sm:px-3 py-1.5 rounded-md sm:rounded-lg shadow-sm text-center min-w-[55px] sm:min-w-[60px]">
                                                        <span className="block text-[8px] sm:text-[9px] text-slate-400 font-black uppercase tracking-tighter mb-0.5">
                                                          Séries
                                                        </span>
                                                        <span className="text-sm sm:text-base font-black text-slate-900 leading-none">
                                                          {ex.sets}
                                                        </span>
                                                      </div>
                                                      <div className="bg-white px-2.5 sm:px-3 py-1.5 rounded-md sm:rounded-lg shadow-sm text-center min-w-[65px] sm:min-w-[70px]">
                                                        <span className="block text-[8px] sm:text-[9px] text-slate-400 font-black uppercase tracking-tighter mb-0.5">
                                                          Reps
                                                        </span>
                                                        <span className="text-sm sm:text-base font-black text-slate-900 leading-none">
                                                          {ex.reps}
                                                        </span>
                                                      </div>
                                                      <div className="bg-white px-2.5 sm:px-3 py-1.5 rounded-md sm:rounded-lg shadow-sm text-center min-w-[70px] sm:min-w-[80px]">
                                                        <span className="block text-[8px] sm:text-[9px] text-slate-400 font-black uppercase tracking-tighter mb-0.5">
                                                          Descanso
                                                        </span>
                                                        <div className="flex items-center justify-center gap-1">
                                                          <RotateCcw className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-slate-400" />
                                                          <span className="text-[11px] sm:text-xs font-black text-slate-700 leading-none">
                                                            {ex.rest}
                                                          </span>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </div>

                                                  {/* Notes Section - Mais discreto */}
                                                  {ex.notes && (
                                                    <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-slate-50/30 rounded-lg sm:rounded-xl border border-slate-100/30 relative overflow-hidden group-hover:bg-white group-hover:border-slate-200 transition-colors">
                                                      <div className="relative z-10 flex items-start gap-2.5 sm:gap-3">
                                                        <div className="p-1 bg-white rounded shadow-sm border border-slate-100">
                                                          <Info className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400" />
                                                        </div>
                                                        <p className="text-[12px] sm:text-[13px] text-slate-600 leading-relaxed italic">
                                                          <span className="font-black text-slate-900 not-italic uppercase text-[8px] sm:text-[9px] tracking-widest block mb-0.5">
                                                            Nota:
                                                          </span>
                                                          {ex.notes}
                                                        </p>
                                                      </div>
                                                    </div>
                                                  )}
                                                </div>
                                              )
                                            );
                                          })()}
                                        </div>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>

                    {/* Progression Section - Elite UI */}
                    <div className="mt-8 sm:mt-10 bg-slate-900 rounded-xl sm:rounded-2xl p-5 sm:p-6 text-white relative overflow-hidden shadow-xl">
                      <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-[80px] -mr-24 -mt-24" />
                      <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-[80px] -ml-24 -mb-24" />

                      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 mb-4 sm:mb-6">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="p-2.5 sm:p-3 bg-emerald-500 rounded-lg sm:rounded-xl shadow-lg shadow-emerald-500/20">
                            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                          </div>
                          <div>
                            <h4 className="text-lg sm:text-xl font-black uppercase tracking-tight text-white">
                              Estratégia de Progressão
                            </h4>
                            <p className="text-slate-400 text-[11px] sm:text-xs font-medium">
                              Como evoluir seu treino nas próximas semanas
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        <div className="space-y-2.5 sm:space-y-3 text-slate-300 leading-relaxed text-[13px] sm:text-sm">
                          {plan.trainingPlan?.progression
                            ?.split("\n")
                            .filter((l) => l.trim().length > 0)
                            .slice(
                              0,
                              Math.ceil(
                                (plan.trainingPlan?.progression
                                  ?.split("\n")
                                  .filter((l) => l.trim().length > 0).length ||
                                  0) / 2
                              )
                            )
                            .map((line, i) => (
                              <div key={i} className="flex gap-3">
                                <div className="mt-2 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                <p>{line.replace(/^[-•]\s*/, "")}</p>
                              </div>
                            )) || (
                            <p>
                              Foco em progressão de carga e técnica impecável.
                            </p>
                          )}
                        </div>
                        <div className="space-y-2.5 sm:space-y-3 text-slate-300 leading-relaxed text-[13px] sm:text-sm">
                          {plan.trainingPlan?.progression
                            ?.split("\n")
                            .filter((l) => l.trim().length > 0)
                            .slice(
                              Math.ceil(
                                (plan.trainingPlan?.progression
                                  ?.split("\n")
                                  .filter((l) => l.trim().length > 0).length ||
                                  0) / 2
                              )
                            )
                            .map((line, i) => (
                              <div key={i} className="flex gap-3">
                                <div className="mt-2 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                                <p>{line.replace(/^[-•]\s*/, "")}</p>
                              </div>
                            )) || null}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Aeróbico */}
            {validActiveTab === "aerobic" && plan.aerobicTraining && (
              <div className="space-y-5 sm:space-y-6">
                <div
                  className={`${colors.status.info.bg} ${colors.status.info.border} border rounded-lg p-3 sm:p-4`}
                >
                  <h4
                    className={`${typography.heading.h4} ${colors.status.info.text} mb-1 sm:mb-2`}
                  >
                    Visão Geral do Treino Aeróbico
                  </h4>
                  <p
                    className={`${colors.status.info.text} text-sm sm:text-base`}
                  >
                    {plan.aerobicTraining.overview ||
                      "Visão geral não disponível"}
                  </p>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <h4
                    className={`${typography.heading.h4} ${colors.text.primary} text-base sm:text-lg`}
                  >
                    Cronograma Semanal de Atividades Aeróbicas
                  </h4>
                  {(plan.aerobicTraining.weeklySchedule || []).map(
                    (day, dayIndex) => (
                      <div
                        key={dayIndex}
                        className="border border-gray-200 rounded-lg p-3 sm:p-4"
                      >
                        <div className="flex items-center mb-2 sm:mb-3">
                          <h5 className="font-semibold text-base sm:text-lg text-gray-900">
                            {day?.day || "Dia não especificado"}
                          </h5>
                        </div>

                        <div className="bg-gray-50 border border-gray-100 rounded p-2.5 sm:p-3 space-y-2">
                          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                            <div className="flex-1 min-w-[120px]">
                              <span className="text-[11px] sm:text-sm font-medium text-gray-600">
                                Atividade:
                              </span>
                              <p className="font-medium text-sm sm:text-base text-gray-900">
                                {day?.activity || "Não especificado"}
                              </p>
                            </div>
                            <div>
                              <span className="text-[11px] sm:text-sm font-medium text-gray-600">
                                Duração:
                              </span>
                              <p className="text-sm sm:text-base text-gray-900">
                                {day?.duration || "N/A"}
                              </p>
                            </div>
                            <div>
                              <span className="text-[11px] sm:text-sm font-medium text-gray-600">
                                Intensidade:
                              </span>
                              <p className="text-sm sm:text-base text-gray-900">
                                {day?.intensity || "N/A"}
                              </p>
                            </div>
                            {day?.heartRateZone && (
                              <div>
                                <span className="text-[11px] sm:text-sm font-medium text-gray-600">
                                  Zona FC:
                                </span>
                                <p className="text-sm sm:text-base text-gray-900">
                                  {day.heartRateZone}
                                </p>
                              </div>
                            )}
                          </div>
                          {day.notes && (
                            <p className="text-xs sm:text-sm text-gray-600 mt-2 pt-2 border-t border-gray-200">
                              <span className="font-medium">Nota:</span>{" "}
                              {day.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  )}
                </div>

                {plan.aerobicTraining.recommendations && (
                  <div
                    className={`${colors.status.success.bg} ${colors.status.success.border} border rounded-lg p-4`}
                  >
                    <h4
                      className={`${typography.heading.h4} ${colors.status.success.text} mb-2`}
                    >
                      Recomendações
                    </h4>
                    <p className={`${colors.status.success.text}`}>
                      {plan.aerobicTraining.recommendations}
                    </p>
                  </div>
                )}

                {plan.aerobicTraining.progression && (
                  <div
                    className={`${colors.status.success.bg} ${colors.status.success.border} border rounded-lg p-4`}
                  >
                    <h4
                      className={`${typography.heading.h4} ${colors.status.success.text} mb-2`}
                    >
                      Progressão
                    </h4>
                    <p className={`${colors.status.success.text}`}>
                      {plan.aerobicTraining.progression}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Dieta */}
            {validActiveTab === "diet" && (
              <div className="space-y-5 sm:space-y-6">
                {/* Priorizar dados estruturados do plan.nutritionPlan se disponível */}
                {plan?.nutritionPlan ? (
                  <div className="space-y-5 sm:space-y-6">
                    {/* Resumo de Calorias e Macronutrientes */}
                    <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                      <div
                        className={`${colors.status.success.bg} ${colors.status.success.border} border rounded-lg p-3 sm:p-4`}
                      >
                        <h4
                          className={`${typography.heading.h4} ${colors.status.success.text} mb-2 sm:mb-3`}
                        >
                          Calorias Diárias
                        </h4>
                        <p
                          className={`text-xl sm:text-2xl font-bold ${colors.status.success.text}`}
                        >
                          {plan.nutritionPlan.dailyCalories || 0} kcal
                        </p>
                      </div>

                      <div
                        className={`${colors.status.info.bg} ${colors.status.info.border} border rounded-lg p-3 sm:p-4`}
                      >
                        <h4
                          className={`${typography.heading.h4} ${colors.status.info.text} mb-2 sm:mb-3`}
                        >
                          Macronutrientes
                        </h4>
                        <div className="space-y-1.5 sm:space-y-2 text-sm sm:text-base">
                          <div className="flex justify-between">
                            <span className={`${colors.status.info.text}`}>
                              Proteínas:
                            </span>
                            <span
                              className={`font-medium ${colors.status.info.text}`}
                            >
                              {plan.nutritionPlan.macros?.protein || "N/A"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className={`${colors.status.info.text}`}>
                              Carboidratos:
                            </span>
                            <span
                              className={`font-medium ${colors.status.info.text}`}
                            >
                              {plan.nutritionPlan.macros?.carbs || "N/A"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className={`${colors.status.info.text}`}>
                              Gorduras:
                            </span>
                            <span
                              className={`font-medium ${colors.status.info.text}`}
                            >
                              {plan.nutritionPlan.macros?.fats || "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Plano Alimentar */}
                    {plan.nutritionPlan.mealPlan &&
                      plan.nutritionPlan.mealPlan.length > 0 && (
                        <div>
                          <h4
                            className={`${typography.heading.h4} ${colors.text.primary} mb-3 sm:mb-4 text-base sm:text-lg`}
                          >
                            Plano Alimentar Diário
                          </h4>
                          <div className="space-y-3 sm:space-y-4">
                            {plan.nutritionPlan.mealPlan.map(
                              (meal: MealPlanItem, index: number) => (
                                <div
                                  key={index}
                                  className="border border-gray-200 rounded-lg p-3 sm:p-4 bg-white shadow-sm"
                                >
                                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                                    <h5 className="font-semibold text-gray-900 text-base sm:text-lg">
                                      {meal?.meal || meal?.name || "Refeição"}
                                    </h5>
                                    {meal?.timing && (
                                      <span className="text-xs sm:text-sm text-gray-600 bg-gray-100 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">
                                        {meal.timing}
                                      </span>
                                    )}
                                  </div>
                                  <div className="space-y-1.5 sm:space-y-2">
                                    {(meal.options || []).map(
                                      (
                                        option: MealOption,
                                        optionIndex: number
                                      ) => (
                                        <div
                                          key={optionIndex}
                                          className="flex items-start bg-gray-50 border border-gray-100 rounded p-1.5 sm:p-2"
                                        >
                                          <span className="text-green-600 mr-2 mt-0.5 sm:mt-1">
                                            •
                                          </span>
                                          <div className="flex-1 text-sm sm:text-base">
                                            <span className="text-gray-900 font-medium">
                                              {option.food || option.name}
                                            </span>
                                            {option.quantity &&
                                              formatQuantity(
                                                option.quantity,
                                                option.food || option.name
                                              ) && (
                                                <span className="text-gray-600 ml-1.5 sm:ml-2 font-medium">
                                                  (
                                                  {formatQuantity(
                                                    option.quantity,
                                                    option.food || option.name
                                                  )}
                                                  )
                                                </span>
                                              )}
                                            {option.calories && (
                                              <span className="text-gray-500 text-xs sm:text-sm ml-1.5 sm:ml-2">
                                                - {option.calories} kcal
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}

                    {/* Hidratação */}
                    {plan.nutritionPlan.hydration && (
                      <div
                        className={`${colors.status.info.bg} ${colors.status.info.border} border rounded-lg p-4`}
                      >
                        <h4
                          className={`${typography.heading.h4} ${colors.status.info.text} mb-2`}
                        >
                          Hidratação
                        </h4>
                        <p className={`${colors.status.info.text}`}>
                          {plan.nutritionPlan.hydration}
                        </p>
                      </div>
                    )}

                    {/* Suplementos */}
                    {plan.nutritionPlan.supplements &&
                      plan.nutritionPlan.supplements.length > 0 && (
                        <div
                          className={`${colors.status.warning.bg} ${colors.status.warning.border} border rounded-lg p-4`}
                        >
                          <h4
                            className={`${typography.heading.h4} ${colors.status.warning.text} mb-2`}
                          >
                            Suplementos Recomendados
                          </h4>
                          <ul className="space-y-1">
                            {plan.nutritionPlan.supplements.map(
                              (supplement: string, index: number) => (
                                <li
                                  key={index}
                                  className={`${colors.status.warning.text}`}
                                >
                                  • {supplement}
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}
                  </div>
                ) : isLoadingOpenAI ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className={`${colors.text.secondary}`}>
                      Gerando plano nutricional personalizado...
                    </p>
                  </div>
                ) : openAIMessage ? (
                  <div className="space-y-6">
                    {/* Fallback: usar dados extraídos do texto quando não há dados estruturados */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                      <p className="text-sm text-yellow-800">
                        ⚠️ Exibindo dados extraídos do texto. Para dados mais
                        precisos, aguarde a geração completa do plano.
                      </p>
                    </div>

                    {/* Resumo de Calorias e Macronutrientes */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div
                        className={`${colors.status.success.bg} ${colors.status.success.border} border rounded-lg p-4`}
                      >
                        <h4
                          className={`${typography.heading.h4} ${colors.status.success.text} mb-3`}
                        >
                          Calorias Diárias
                        </h4>
                        <p
                          className={`text-2xl font-bold ${colors.status.success.text}`}
                        >
                          {extractCalories(openAIMessage) || "Calculando..."}
                        </p>
                      </div>

                      <div
                        className={`${colors.status.info.bg} ${colors.status.info.border} border rounded-lg p-4`}
                      >
                        <h4
                          className={`${typography.heading.h4} ${colors.status.info.text} mb-3`}
                        >
                          Macronutrientes
                        </h4>
                        <div className="space-y-2">
                          {extractMacros(openAIMessage).length > 0 ? (
                            extractMacros(openAIMessage).map((macro, index) => (
                              <div key={index} className="flex justify-between">
                                <span className={`${colors.status.info.text}`}>
                                  {macro.name}:
                                </span>
                                <span
                                  className={`font-medium ${colors.status.info.text}`}
                                >
                                  {macro.value}
                                </span>
                              </div>
                            ))
                          ) : (
                            <p className={`${colors.status.info.text} text-sm`}>
                              Não encontrado no texto
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Plano Alimentar */}
                    {extractMeals(openAIMessage).length > 0 && (
                      <div>
                        <h4
                          className={`${typography.heading.h4} ${colors.text.primary} mb-4`}
                        >
                          Plano Alimentar Diário
                        </h4>
                        <div className="space-y-4">
                          {extractMeals(openAIMessage).map((meal, index) => (
                            <div
                              key={index}
                              className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <h5 className="font-semibold text-gray-900 text-lg">
                                  {meal.name}
                                </h5>
                                {meal.timing && (
                                  <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                                    {meal.timing}
                                  </span>
                                )}
                              </div>
                              <div className="space-y-2">
                                {meal.foods.map((food, foodIndex) => (
                                  <div
                                    key={foodIndex}
                                    className="flex items-start bg-gray-50 border border-gray-100 rounded p-2"
                                  >
                                    <span className="text-green-600 mr-2 mt-1">
                                      •
                                    </span>
                                    <div className="flex-1">
                                      <span className="text-gray-900 font-medium">
                                        {food.name}
                                      </span>
                                      {food.quantity &&
                                        formatQuantity(
                                          food.quantity,
                                          food.name
                                        ) && (
                                          <span className="text-gray-600 ml-2 font-medium">
                                            (
                                            {formatQuantity(
                                              food.quantity,
                                              food.name
                                            )}
                                            )
                                          </span>
                                        )}
                                      {food.calories && (
                                        <span className="text-gray-500 text-sm ml-2">
                                          - {food.calories} kcal
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                              {meal.totalCalories && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  <span className="text-sm font-medium text-gray-700">
                                    Total da refeição: {meal.totalCalories} kcal
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Hidratação */}
                    {extractHydration(openAIMessage) && (
                      <div
                        className={`${colors.status.info.bg} ${colors.status.info.border} border rounded-lg p-4`}
                      >
                        <h4
                          className={`${typography.heading.h4} ${colors.status.info.text} mb-2`}
                        >
                          Hidratação
                        </h4>
                        <p className={`${colors.status.info.text}`}>
                          {extractHydration(openAIMessage)}
                        </p>
                      </div>
                    )}

                    {/* Suplementos */}
                    {extractSupplements(openAIMessage).length > 0 && (
                      <div
                        className={`${colors.status.warning.bg} ${colors.status.warning.border} border rounded-lg p-4`}
                      >
                        <h4
                          className={`${typography.heading.h4} ${colors.status.warning.text} mb-2`}
                        >
                          Suplementos Recomendados
                        </h4>
                        <ul className="space-y-1">
                          {extractSupplements(openAIMessage).map(
                            (supplement, index) => (
                              <li
                                key={index}
                                className={`${colors.status.warning.text}`}
                              >
                                • {supplement}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className={`${colors.text.secondary}`}>
                      Gerando plano nutricional personalizado...
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Metas */}
            {validActiveTab === "goals" && (
              <div className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
                    <h4
                      className={`${typography.heading.h4} ${colors.status.success.text} mb-3`}
                    >
                      Metas Semanais
                    </h4>
                    <ul className="space-y-2">
                      {(plan.goals?.weekly || []).map((goal, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-green-600 mr-2">•</span>
                          <span className="text-green-800">{goal}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                    <h4
                      className={`${typography.heading.h4} ${colors.status.info.text} mb-3`}
                    >
                      Metas Mensais
                    </h4>
                    <ul className="space-y-2">
                      {(plan.goals?.monthly || []).map((goal, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-blue-600 mr-2">•</span>
                          <span className="text-blue-800">{goal}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div
                  className={`${colors.status.info.bg} ${colors.status.info.border} border rounded-lg p-3 sm:p-4`}
                >
                  <h4
                    className={`${typography.heading.h4} ${colors.status.info.text} mb-3`}
                  >
                    Indicadores de Progresso
                  </h4>
                  <ul className="space-y-2">
                    {(plan.goals?.tracking || []).map((indicator, index) => (
                      <li key={index} className="flex items-start">
                        <span className={`${colors.status.info.accent} mr-2`}>
                          •
                        </span>
                        <span className={`${colors.status.info.text}`}>
                          {indicator}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Motivação */}
            {validActiveTab === "motivation" && (
              <div className="space-y-6">
                <div
                  className={`${colors.status.info.bg} ${colors.status.info.border} border rounded-lg p-4`}
                >
                  <h4
                    className={`${typography.heading.h4} ${colors.status.info.text} mb-2`}
                  >
                    Mensagem Personalizada
                  </h4>
                  <p className={`${colors.status.info.text}`}>
                    {plan.motivation?.personalMessage ||
                      "Mensagem não disponível"}
                  </p>

                  {plan.motivation?.tips && plan.motivation.tips.length > 0 && (
                    <>
                      <h5
                        className={`${typography.heading.h4} ${colors.status.info.text} mt-4 mb-2`}
                      >
                        Dicas Motivacionais
                      </h5>
                      <ul className="space-y-2">
                        {plan.motivation.tips.map((tip, index) => (
                          <li key={index} className="flex items-start">
                            <span
                              className={`${colors.status.info.accent} mr-2`}
                            >
                              •
                            </span>
                            <span className={`${colors.status.info.text}`}>
                              {tip}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              ✅ Entendi, vamos começar!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
