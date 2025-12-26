/**
 * DayStateManager - Gerencia estado do dia durante a geração
 *
 * Rastreia exercícios, padrões motores, volume por músculo em tempo real
 */

import type { Exercise } from "@/lib/validators/trainingPlanValidator";
import type { GenerationConstraints } from "./trainingProfileAdapter";
import { detectMotorPattern } from "@/lib/validators/advancedPlanValidator";

// Normalização de músculo (mesma lógica do validador)
function normalizeMuscle(muscle: string): string {
  const normalized = muscle
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  // Normalizações específicas
  if (normalized.includes("peito") || normalized.includes("peitoral")) {
    return "peito";
  }
  if (normalized.includes("costas") || normalized.includes("dorsal")) {
    return "costas";
  }
  if (normalized.includes("ombro") || normalized.includes("ombros")) {
    return "ombro";
  }
  if (normalized.includes("quadriceps") || normalized.includes("quadríceps")) {
    return "quadriceps";
  }
  if (
    normalized.includes("posterior") ||
    normalized.includes("isquiotibiais")
  ) {
    return "posterior";
  }
  if (normalized.includes("gluteo") || normalized.includes("glúteo")) {
    return "gluteos";
  }
  if (normalized.includes("panturrilha")) {
    return "panturrilhas";
  }
  if (normalized.includes("triceps") || normalized.includes("tríceps")) {
    return "triceps";
  }
  if (normalized.includes("biceps") || normalized.includes("bíceps")) {
    return "biceps";
  }

  return normalized;
}

export interface DayState {
  exercises: Exercise[];
  motorPatterns: Record<string, number>;
  musclesVolume: Record<string, number>; // Volume em séries
  primaryMuscles: Record<string, number>; // Contagem de exercícios por músculo primário
  dayType: string;
  constraints: {
    maxExercises: number;
    maxPerMuscle: number;
    motorPatternLimits: Record<string, number>;
  };
}

export type ValidationReasonType = "HARD" | "SOFT";

export interface ValidationResult {
  allowed: boolean;
  reason?: string;
  reasonType?: ValidationReasonType; // HARD = sem saída, SOFT = pode tentar alternativa
  details?: {
    muscle?: string;
    pattern?: string;
    current?: number;
    limit?: number;
  };
}

/**
 * Inicializa o estado do dia
 */
export function initDayState(
  dayType: string,
  constraints: GenerationConstraints
): DayState {
  return {
    exercises: [],
    motorPatterns: {},
    musclesVolume: {},
    primaryMuscles: {},
    dayType,
    constraints: {
      maxExercises: constraints.maxExercisesPerSession,
      maxPerMuscle: constraints.maxExercisesPerMuscle,
      motorPatternLimits: constraints.motorPatternLimitsPerDay,
    },
  };
}

/**
 * Atualiza o estado após adicionar um exercício
 */
export function updateDayState(dayState: DayState, exercise: Exercise): void {
  // Adicionar exercício
  dayState.exercises.push(exercise);

  // Atualizar padrão motor (ignorar "unknown")
  const pattern = detectMotorPattern(exercise);
  if (pattern && pattern !== "unknown") {
    dayState.motorPatterns[pattern] =
      (dayState.motorPatterns[pattern] || 0) + 1;
  }

  // Atualizar volume do músculo primário
  const primaryMuscle = normalizeMuscle(exercise.primaryMuscle);
  dayState.primaryMuscles[primaryMuscle] =
    (dayState.primaryMuscles[primaryMuscle] || 0) + 1;

  // Atualizar volume em séries
  const sets =
    typeof exercise.sets === "number"
      ? exercise.sets
      : parseInt(exercise.sets) || 0;
  dayState.musclesVolume[primaryMuscle] =
    (dayState.musclesVolume[primaryMuscle] || 0) + sets;
}

/**
 * Estado semanal para rastrear séries por músculo
 */
export interface WeekState {
  muscleWeeklySeries: Map<string, number>; // Músculo -> séries semanais acumuladas
  weeklySeriesLimits: Record<string, number>; // Limites semanais por músculo
}

/**
 * Valida se um exercício pode ser adicionado considerando limites semanais
 * Retorna objeto com allowed e reason
 *
 * 🔴 IMPORTANTE: Verifica considerando o mínimo de séries possível (1 em déficit, 2 normalmente)
 * para evitar adicionar exercícios que depois não podem ser ajustados
 */
export function canAddExerciseToWeek(
  exercise: Exercise,
  weekState: WeekState,
  minSetsPerExercise: number = 1 // 🔴 NOVO: Mínimo de séries por exercício (1 em déficit, 2 normalmente)
): ValidationResult {
  const primaryMuscle = normalizeMuscle(exercise.primaryMuscle);
  const sets =
    typeof exercise.sets === "number"
      ? exercise.sets
      : parseInt(exercise.sets) || 0;

  const currentWeeklySeries =
    weekState.muscleWeeklySeries.get(primaryMuscle) || 0;
  const weeklyLimit = weekState.weeklySeriesLimits[primaryMuscle];

  // Se não há limite definido para este músculo, permitir
  if (!weeklyLimit) {
    return { allowed: true };
  }

  // 🔴 CORREÇÃO: Verificar com o mínimo de séries possível, não com as séries do template
  // Isso evita adicionar exercícios que depois não podem ser ajustados
  const setsToCheck = Math.max(minSetsPerExercise, sets); // Usar o maior entre mínimo e séries do template

  // Verificar se adicionar este exercício (com mínimo de séries) excederia o limite semanal
  const newTotal = currentWeeklySeries + setsToCheck;
  if (newTotal > weeklyLimit) {
    return {
      allowed: false,
      reason: "weekly_series_limit_exceeded",
      reasonType: "HARD", // Limite semanal é HARD
      details: {
        muscle: primaryMuscle,
        current: currentWeeklySeries,
        limit: weeklyLimit,
        attempted: setsToCheck, // Mostrar séries que seriam usadas
        wouldBe: newTotal,
        minSetsPerExercise, // Informar qual mínimo está sendo usado
      },
    };
  }

  return { allowed: true };
}

/**
 * Atualiza o estado semanal após adicionar um exercício
 */
export function updateWeekState(
  weekState: WeekState,
  exercise: Exercise
): void {
  const primaryMuscle = normalizeMuscle(exercise.primaryMuscle);
  const sets =
    typeof exercise.sets === "number"
      ? exercise.sets
      : parseInt(exercise.sets) || 0;

  const current = weekState.muscleWeeklySeries.get(primaryMuscle) || 0;
  weekState.muscleWeeklySeries.set(primaryMuscle, current + sets);
}

/**
 * Valida se um exercício pode ser adicionado ao dia
 * Retorna objeto com allowed e reason para facilitar debugging
 *
 * NOTA: Esta função NÃO loga nada. É pura e testável.
 * O logging fica em addExerciseSafely.
 */
export function canAddExercise(
  exercise: Exercise,
  dayState: DayState,
  constraints: GenerationConstraints
): ValidationResult {
  // 1. Validação de padrão motor (HARD - sem saída)
  const pattern = detectMotorPattern(exercise);
  if (pattern && pattern !== "unknown") {
    const currentCount = dayState.motorPatterns[pattern] || 0;
    const limit =
      constraints.motorPatternLimitsPerDay[
        pattern as keyof typeof constraints.motorPatternLimitsPerDay
      ];

    if (limit && currentCount >= limit) {
      return {
        allowed: false,
        reason: "motor_pattern_limit",
        reasonType: "HARD", // Não há como contornar
        details: {
          pattern,
          current: currentCount,
          limit,
        },
      };
    }
  }

  // 2. Validação de limite de exercícios no dia (HARD - sem saída)
  if (dayState.exercises.length >= constraints.maxExercisesPerSession) {
    return {
      allowed: false,
      reason: "max_exercises_per_session",
      reasonType: "HARD", // Não há como contornar
      details: {
        current: dayState.exercises.length,
        limit: constraints.maxExercisesPerSession,
      },
    };
  }

  // 3. Validação de limite de exercícios por músculo primário (SOFT - pode tentar alternativa)
  const primaryMuscle = normalizeMuscle(exercise.primaryMuscle);
  const currentMuscleCount = dayState.primaryMuscles[primaryMuscle] || 0;

  if (currentMuscleCount >= constraints.maxExercisesPerMuscle) {
    return {
      allowed: false,
      reason: "max_exercises_per_muscle",
      reasonType: "SOFT", // Pode tentar exercício alternativo do mesmo grupo
      details: {
        muscle: primaryMuscle,
        current: currentMuscleCount,
        limit: constraints.maxExercisesPerMuscle,
      },
    };
  }

  // 4. Tudo OK
  return {
    allowed: true,
  };
}

/**
 * Adiciona exercício com validação e atualiza estado
 * Retorna resultado da operação
 *
 * Esta função decide se loga ou não (canAddExercise não loga)
 *
 * 🔴 NOVO: Verifica limites semanais ANTES de adicionar
 */
export function addExerciseSafely(
  exercise: Exercise,
  dayState: DayState,
  constraints: GenerationConstraints,
  dayExercises: Exercise[],
  options?: {
    logRejections?: boolean; // Default: true
    logLevel?: "warn" | "debug"; // Default: "warn"
    weekState?: WeekState; // 🔴 NOVO: Estado semanal para verificar limites
    minSetsPerExercise?: number; // 🔴 NOVO: Mínimo de séries por exercício (1 em déficit, 2 normalmente)
  }
): ValidationResult {
  // 🔴 1. Verificar limites semanais PRIMEIRO (antes de qualquer outra validação)
  if (options?.weekState) {
    const minSets = options.minSetsPerExercise ?? 1; // Default: 1 série (déficit)
    const weeklyValidation = canAddExerciseToWeek(
      exercise,
      options.weekState,
      minSets
    );
    if (!weeklyValidation.allowed) {
      const shouldLog = options?.logRejections !== false;
      if (shouldLog) {
        const logMessage = `⚠️ Exercício rejeitado (limite semanal): ${exercise.name} - ${weeklyValidation.reason}`;
        const logData = weeklyValidation.details;

        if (options?.logLevel === "debug") {
          console.debug(logMessage, logData);
        } else {
          console.warn(logMessage, logData);
        }
      }
      return weeklyValidation;
    }
  }

  // 2. Verificar limites diários
  const validation = canAddExercise(exercise, dayState, constraints);

  if (!validation.allowed) {
    // Log apenas se habilitado (padrão: true)
    const shouldLog = options?.logRejections !== false;
    if (shouldLog) {
      const logMessage = `⚠️ Exercício rejeitado: ${exercise.name} - ${validation.reason} (${validation.reasonType})`;
      const logData = validation.details;

      if (options?.logLevel === "debug") {
        console.debug(logMessage, logData);
      } else {
        console.warn(logMessage, logData);
      }
    }
    return validation;
  }

  // 3. Adicionar exercício (passou todas as validações)
  dayExercises.push(exercise);
  updateDayState(dayState, exercise);

  // 🔴 4. Atualizar estado semanal se fornecido
  if (options?.weekState) {
    updateWeekState(options.weekState, exercise);
  }

  return { allowed: true };
}
