/**
 * Gerador de Planos de Treino - Versão Corrigida
 */

import {
  type TrainingPlan,
  type TrainingDay,
  type Exercise,
} from "@/lib/validators/trainingPlanValidator";
import { adaptUserProfileToConstraints } from "./trainingProfileAdapter";
import { EXERCISE_DATABASE, DAY_STRUCTURES } from "./exerciseDatabase";

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

  // Se for Iniciante, mantém 3
  if (level.includes("iniciante")) {
    return 3;
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
  objective?: string,
  hasShoulderRestriction?: boolean,
  hasKneeRestriction?: boolean,
  equipment?: string,
  age?: number,
  gender?: string
): TrainingPlan {
  const constraints = adaptUserProfileToConstraints({
    activityLevel,
    frequency: trainingDays,
    division,
    availableTimeMinutes,
    imc,
    objective,
    jointLimitations: hasShoulderRestriction,
    kneeLimitations: hasKneeRestriction,
    equipment,
    age,
    gender,
  });

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
      const structure = DAY_STRUCTURES[dayType] || [];
      const exercises: Exercise[] = [];
      const usedNames = new Set<string>();

      for (const muscle of structure) {
        if (exercises.length >= constraints.maxExercisesPerSession) break;

        const templates = EXERCISE_DATABASE[muscle] || [];
        // Filtrar templates que já foram usados no dia para evitar duplicatas
        const available = templates.filter((t) => !usedNames.has(t.name));

        if (available.length > 0) {
          // Selecionar o primeiro disponível (pode ser melhorado com randomização se desejado)
          const template = available[0];
          usedNames.add(template.name);

          const isCompound = template.isCompound;
          const isLarge = template.isLarge;

          const sets = calculateSets(
            constraints.operationalLevel,
            isCompound,
            isLarge
          );

          exercises.push({
            name: template.name,
            primaryMuscle: template.primaryMuscle,
            secondaryMuscles: template.secondaryMuscles,
            sets,
            reps: `${constraints.profile.minReps}-${constraints.profile.maxReps}`,
            rest: isCompound ? "90s" : "60s",
            notes: template.notes,
          });
        }
      }

      templateCache[dayType] = exercises;
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
    overview: `Plano ${actualDivision} - Nível ${activityLevel}. Focado em ${objective || "condicionamento"}.`,
    weeklySchedule,
    progression:
      "Progressão linear de carga: aumente o peso sempre que completar as repetições estipuladas com técnica perfeita.",
  };
}
