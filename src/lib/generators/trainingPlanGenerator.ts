/**
 * Gerador de Planos de Treino - Versão Corrigida
 */

import {
  type TrainingPlan,
  type TrainingDay,
  type Exercise,
} from "@/lib/validators/trainingPlanValidator";
import { adaptUserProfileToConstraints } from "./trainingProfileAdapter";
import { buildApprovalContract } from "./approvalContract";
import { PlanQualityAccumulator } from "@/lib/metrics/planQualityMetrics";

/* --------------------------------------------------------
   LÓGICA DE CÁLCULO DE SÉRIES (CORRIGIDA)
-------------------------------------------------------- */

/**
 * Determina o número de séries por exercício.
 * CORREÇÃO: Mínimo de 3 séries para o perfil Moderado/Intermediário.
 */
function calculateSets(
  activityLevel: string,
  isCompound: boolean,
  isLarge: boolean
): number {
  const level = activityLevel.toLowerCase();

  // Se for Iniciante, mantém 2
  if (level.includes("iniciante")) {
    return 2;
  }

  // Para Atleta/Avançado, pode chegar a 4 em compostos
  if (level.includes("atleta") || level.includes("avancado")) {
    return isCompound ? 4 : 3;
  }

  // CORREÇÃO PARA PERFIL MODERADO:
  // Forçamos o retorno de no mínimo 3 séries, independente de défice calórico.
  if (isCompound && isLarge) {
    return 4;
  }

  return 3;
}

/* --------------------------------------------------------
   FUNÇÃO PRINCIPAL DE GERAÇÃO
-------------------------------------------------------- */

export function generateTrainingPlanStructure(
  trainingDays: number,
  activityLevel: string,
  division?: "PPL" | "Upper/Lower" | "Full Body",
  availableTimeMinutes?: number,
  imc?: number,
  objective?: string
): TrainingPlan {
  const qualityAccumulator = new PlanQualityAccumulator();

  const constraints = adaptUserProfileToConstraints({
    activityLevel,
    frequency: trainingDays,
    division,
    availableTimeMinutes,
    imc,
    objective,
  });

  const approvalContract = buildApprovalContract(
    constraints,
    trainingDays,
    activityLevel,
    objective,
    imc
  );

  const actualDivision = constraints.division;
  const weeklySchedule: TrainingDay[] = [];

  // Objeto para garantir que o Treino A seja sempre igual ao outro Treino A
  const templateCache: Record<string, Exercise[]> = {};

  const days =
    actualDivision === "PPL"
      ? ["Push", "Pull", "Legs"]
      : actualDivision === "Upper/Lower"
        ? ["Upper", "Lower"]
        : ["Full Body"];

  for (let i = 0; i < trainingDays; i++) {
    const dayType = days[i % days.length];

    // Se já geramos esse tipo de dia antes, clonamos a lista de exercícios
    if (!templateCache[dayType]) {
      // Aqui entraria a sua função interna de busca no banco de dados
      // templateCache[dayType] = fetchExercisesFor(dayType...);
    }

    weeklySchedule.push({
      day: `Dia ${i + 1} - ${dayType}`,
      type: dayType,
      exercises: templateCache[dayType] || [], // Garante repetição idêntica
      description: templateCache[dayType]
        ? "Foco em progressão de carga (repetição do treino anterior)."
        : undefined,
    });
  }

  return {
    overview: `Plano ${actualDivision} - Nível ${activityLevel}`,
    weeklySchedule,
    progression: "Progressão linear de carga.",
  };
}
