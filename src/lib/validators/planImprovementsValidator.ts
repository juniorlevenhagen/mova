/**
 * Validações Adicionais para Melhorias do Sistema de Planos
 * 
 * Implementa validações baseadas na análise de planos gerados:
 * - Volume máximo de exercícios por grupo muscular
 * - Validação de calorias vs TDEE
 * - Validação de repetições por IMC + objetivo
 * - Validação de diversidade de exercícios
 */

import { TrainingPlan, TrainingDay, Exercise } from "./trainingPlanValidator";

export interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  suggestions: string[];
}

/**
 * Valida volume máximo de exercícios por grupo muscular
 */
export function validateExerciseVolumePerMuscleGroup(
  day: TrainingDay,
  activityLevel: string
): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  const suggestions: string[] = [];

  // Contar exercícios por grupo muscular
  const muscleGroupCount = new Map<string, number>();
  const muscleGroupExercises = new Map<string, string[]>();

  for (const ex of day.exercises) {
    const muscle = ex.primaryMuscle.toLowerCase().trim();
    const count = muscleGroupCount.get(muscle) || 0;
    muscleGroupCount.set(muscle, count + 1);

    const exercises = muscleGroupExercises.get(muscle) || [];
    exercises.push(ex.name);
    muscleGroupExercises.set(muscle, exercises);
  }

  // Definir limites por nível
  const normalizedLevel = activityLevel
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .replace("atleta_alto_rendimento", "atleta_altorendimento");

  const maxPerMuscleGroup: Record<string, number> = {
    idoso: 2,
    limitado: 2,
    iniciante: 3,
    moderado: 4,
    intermediario: 5,
    avancado: 6,
    atleta: 7,
    atleta_altorendimento: 7, // Máximo absoluto mesmo para atletas
  };

  const maxAllowed = maxPerMuscleGroup[normalizedLevel] || 5;

  // Validar cada grupo muscular
  for (const [muscle, count] of muscleGroupCount.entries()) {
    if (count > maxAllowed) {
      const exercises = muscleGroupExercises.get(muscle) || [];
      errors.push(
        `Grupo muscular "${muscle}" tem ${count} exercícios (máximo: ${maxAllowed}). Exercícios: ${exercises.join(", ")}`
      );
      suggestions.push(
        `Reduzir exercícios de ${muscle} para no máximo ${maxAllowed}. Priorizar exercícios compostos e 1-2 isolados.`
      );
    } else if (count > maxAllowed - 1) {
      warnings.push(
        `Grupo muscular "${muscle}" está no limite (${count}/${maxAllowed} exercícios). Considere reduzir para melhor foco.`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
    suggestions,
  };
}

/**
 * Valida se calorias estão dentro de limites seguros baseado em TDEE
 */
export function validateCaloriesVsTDEE(
  dailyCalories: number,
  tdee: number,
  objective: string,
  imc: number
): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  const suggestions: string[] = [];

  const deficit = tdee - dailyCalories;
  const surplus = dailyCalories - tdee;
  const deficitPercent = (deficit / tdee) * 100;
  const surplusPercent = (surplus / tdee) * 100;

  if (objective === "Emagrecimento" || objective.toLowerCase().includes("emagrec")) {
    // Déficit máximo: 25% do TDEE OU 600 kcal, o que for menor
    const maxDeficit = Math.min(tdee * 0.25, 600);
    const maxDeficitPercent = (maxDeficit / tdee) * 100;

    if (deficit > maxDeficit) {
      errors.push(
        `Déficit calórico muito agressivo: ${deficit.toFixed(0)} kcal (${deficitPercent.toFixed(1)}% do TDEE). Máximo recomendado: ${maxDeficit.toFixed(0)} kcal (${maxDeficitPercent.toFixed(1)}%)`
      );
      const recommended = tdee - maxDeficit;
      suggestions.push(
        `Ajustar calorias para aproximadamente ${Math.round(recommended)} kcal/dia (déficit de ${maxDeficitPercent.toFixed(1)}%)`
      );
    } else if (deficitPercent > 20) {
      warnings.push(
        `Déficit calórico elevado: ${deficitPercent.toFixed(1)}% do TDEE. Pode comprometer performance e recuperação.`
      );
    }

    // Verificar se não está muito próximo do mínimo absoluto
    const minCalories = imc >= 30 ? 1500 : 1200; // Homens: 1500, Mulheres: 1200 (assumindo homem se IMC alto)
    if (dailyCalories < minCalories) {
      errors.push(
        `Calorias abaixo do mínimo absoluto recomendado: ${dailyCalories} kcal (mínimo: ${minCalories} kcal)`
      );
      suggestions.push(
        `Aumentar calorias para pelo menos ${minCalories} kcal/dia para segurança metabólica`
      );
    }
  } else if (objective === "Ganhar Massa" || objective.toLowerCase().includes("ganhar")) {
    // Superávit máximo: 20% do TDEE OU 400 kcal, o que for menor
    const maxSurplus = Math.min(tdee * 0.2, 400);
    const maxSurplusPercent = (maxSurplus / tdee) * 100;

    if (surplus > maxSurplus) {
      errors.push(
        `Superávit calórico muito alto: ${surplus.toFixed(0)} kcal (${surplusPercent.toFixed(1)}% do TDEE). Máximo recomendado: ${maxSurplus.toFixed(0)} kcal (${maxSurplusPercent.toFixed(1)}%)`
      );
      const recommended = tdee + maxSurplus;
      suggestions.push(
        `Ajustar calorias para aproximadamente ${Math.round(recommended)} kcal/dia (superávit de ${maxSurplusPercent.toFixed(1)}%)`
      );
    }

    // Para IMC ≥ 25, não deve usar superávit (deve ser recomposição)
    if (imc >= 25 && surplus > 0) {
      errors.push(
        `IMC ${imc.toFixed(1)} (sobrepeso/obesidade) com objetivo de ganhar massa deve usar RECOMPOSIÇÃO (déficit), não superávit.`
      );
      const recommendedDeficit = tdee * 0.225; // 22.5% de déficit
      const recommended = tdee - recommendedDeficit;
      suggestions.push(
        `Ajustar para recomposição: ${Math.round(recommended)} kcal/dia (déficit de 22.5% do TDEE)`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
    suggestions,
  };
}

/**
 * Extrai faixa de repetições de string (ex: "8-12" → {min: 8, max: 12})
 */
function extractRepsRange(reps: string): { min: number; max: number } | null {
  const match = reps.match(/(\d+)\s*-\s*(\d+)/);
  if (match) {
    return {
      min: parseInt(match[1], 10),
      max: parseInt(match[2], 10),
    };
  }
  // Tentar pegar número único
  const singleMatch = reps.match(/(\d+)/);
  if (singleMatch) {
    const num = parseInt(singleMatch[1], 10);
    return { min: num, max: num };
  }
  return null;
}

/**
 * Valida repetições baseado em IMC e objetivo
 */
export function validateRepsForIMCAndObjective(
  exercises: Exercise[],
  imc: number,
  objective: string
): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  const suggestions: string[] = [];

  const normalizedObjective = objective.toLowerCase();

  // Regras por IMC e objetivo
  if (imc >= 25 && imc < 30) {
    // Sobrepeso
    if (
      normalizedObjective.includes("emagrec") ||
      normalizedObjective.includes("perder")
    ) {
      // Deve ser 10-15 reps
      for (const ex of exercises) {
        const repsRange = extractRepsRange(ex.reps);
        if (repsRange) {
          if (repsRange.max < 10) {
            errors.push(
              `Exercício "${ex.name}": ${ex.reps} reps é muito baixo para emagrecimento com IMC ${imc.toFixed(1)}. Recomendado: 10-15 reps.`
            );
            suggestions.push(
              `Ajustar "${ex.name}" para 10-15 repetições (endurance para emagrecimento)`
            );
          } else if (repsRange.min < 10 && repsRange.max <= 12) {
            warnings.push(
              `Exercício "${ex.name}": ${ex.reps} reps está no limite inferior. Para emagrecimento, ideal é 10-15 reps.`
            );
          }
        }
      }
    } else if (normalizedObjective.includes("ganhar") || normalizedObjective.includes("massa")) {
      // Recomposição: 8-12 reps (não 6-8)
      for (const ex of exercises) {
        const repsRange = extractRepsRange(ex.reps);
        if (repsRange) {
          if (repsRange.max <= 8) {
            errors.push(
              `Exercício "${ex.name}": ${ex.reps} reps é muito baixo para recomposição com IMC ${imc.toFixed(1)}. Recomendado: 8-12 reps.`
            );
            suggestions.push(
              `Ajustar "${ex.name}" para 8-12 repetições (recomposição, não força máxima)`
            );
          }
        }
      }
    }
  } else if (imc >= 30 && imc < 35) {
    // Obesidade Grau I
    if (
      normalizedObjective.includes("emagrec") ||
      normalizedObjective.includes("perder")
    ) {
      // Deve ser 12-18 reps
      for (const ex of exercises) {
        const repsRange = extractRepsRange(ex.reps);
        if (repsRange) {
          if (repsRange.max < 12) {
            errors.push(
              `Exercício "${ex.name}": ${ex.reps} reps é muito baixo para emagrecimento com IMC ${imc.toFixed(1)}. Recomendado: 12-18 reps (segurança articular).`
            );
            suggestions.push(
              `Ajustar "${ex.name}" para 12-18 repetições (endurance e segurança)`
            );
          } else if (repsRange.min < 12) {
            warnings.push(
              `Exercício "${ex.name}": ${ex.reps} reps está no limite inferior. Para obesidade grau I, ideal é 12-18 reps.`
            );
          }
        }
      }
    } else if (normalizedObjective.includes("ganhar") || normalizedObjective.includes("massa")) {
      // Recomposição: 10-15 reps (não menos de 10)
      for (const ex of exercises) {
        const repsRange = extractRepsRange(ex.reps);
        if (repsRange) {
          if (repsRange.max < 10) {
            errors.push(
              `Exercício "${ex.name}": ${ex.reps} reps é muito baixo para recomposição com IMC ${imc.toFixed(1)}. Recomendado: 10-15 reps.`
            );
            suggestions.push(
              `Ajustar "${ex.name}" para 10-15 repetições (recomposição com segurança)`
            );
          }
        }
      }
    }
  } else if (imc >= 35) {
    // Obesidade Grau II/III
    if (
      normalizedObjective.includes("emagrec") ||
      normalizedObjective.includes("perder")
    ) {
      // Deve ser 15-20 reps
      for (const ex of exercises) {
        const repsRange = extractRepsRange(ex.reps);
        if (repsRange) {
          if (repsRange.max < 15) {
            errors.push(
              `Exercício "${ex.name}": ${ex.reps} reps é muito baixo para emagrecimento com IMC ${imc.toFixed(1)}. Recomendado: 15-20 reps (máxima segurança).`
            );
            suggestions.push(
              `Ajustar "${ex.name}" para 15-20 repetições (máxima segurança articular)`
            );
          } else if (repsRange.min < 15) {
            warnings.push(
              `Exercício "${ex.name}": ${ex.reps} reps está no limite inferior. Para obesidade grau II/III, ideal é 15-20 reps.`
            );
          }
        }
      }
    } else if (normalizedObjective.includes("ganhar") || normalizedObjective.includes("massa")) {
      // Recomposição: 12-18 reps (nunca menos de 12)
      for (const ex of exercises) {
        const repsRange = extractRepsRange(ex.reps);
        if (repsRange) {
          if (repsRange.max < 12) {
            errors.push(
              `Exercício "${ex.name}": ${ex.reps} reps é muito baixo para recomposição com IMC ${imc.toFixed(1)}. Recomendado: 12-18 reps (nunca menos de 12).`
            );
            suggestions.push(
              `Ajustar "${ex.name}" para 12-18 repetições (recomposição com máxima segurança)`
            );
          }
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
    suggestions,
  };
}

/**
 * Normaliza nome de exercício para detectar similaridades
 */
function normalizeExerciseName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extrai tipo base de exercício (ex: "supino reto" e "supino inclinado" → ambos "supino")
 */
function extractExerciseBaseType(name: string): string {
  const normalized = normalizeExerciseName(name);
  
  // Padrões conhecidos
  const patterns = [
    { pattern: /supino/i, base: "supino" },
    { pattern: /remada/i, base: "remada" },
    { pattern: /agachamento/i, base: "agachamento" },
    { pattern: /leg press/i, base: "leg press" },
    { pattern: /puxada/i, base: "puxada" },
    { pattern: /desenvolvimento/i, base: "desenvolvimento" },
    { pattern: /rosca/i, base: "rosca" },
    { pattern: /triceps|tríceps/i, base: "triceps" },
    { pattern: /crucifixo/i, base: "crucifixo" },
  ];

  for (const { pattern, base } of patterns) {
    if (pattern.test(normalized)) {
      return base;
    }
  }

  // Se não encontrar padrão, retornar primeira palavra
  const words = normalized.split(" ");
  return words[0] || normalized;
}

/**
 * Valida diversidade de exercícios (evita múltiplas variações similares)
 */
export function validateExerciseDiversity(
  exercises: Exercise[]
): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  const suggestions: string[] = [];

  // Agrupar exercícios por tipo base
  const exercisesByType = new Map<string, Exercise[]>();

  for (const ex of exercises) {
    const baseType = extractExerciseBaseType(ex.name);
    const group = exercisesByType.get(baseType) || [];
    group.push(ex);
    exercisesByType.set(baseType, group);
  }

  // Validar grupos com muitos exercícios similares
  for (const [baseType, group] of exercisesByType.entries()) {
    if (group.length > 3) {
      const exerciseNames = group.map((ex) => ex.name).join(", ");
      errors.push(
        `Muitas variações do mesmo tipo de exercício (${baseType}): ${group.length} exercícios. Exercícios: ${exerciseNames}`
      );
      suggestions.push(
        `Reduzir variações de ${baseType} para no máximo 3 exercícios. Priorizar: 1 composto principal + 1-2 variações/isolados.`
      );
    } else if (group.length === 3) {
      warnings.push(
        `3 variações de ${baseType} no mesmo treino. Considere reduzir para 2 para melhor foco.`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
    suggestions,
  };
}

/**
 * Validação completa de um plano de treino com todas as melhorias
 */
export function validatePlanWithImprovements(
  plan: TrainingPlan,
  activityLevel: string,
  imc: number,
  objective: string,
  dailyCalories?: number,
  tdee?: number
): ValidationResult {
  const allWarnings: string[] = [];
  const allErrors: string[] = [];
  const allSuggestions: string[] = [];

  // Validar cada dia de treino
  for (const day of plan.weeklySchedule) {
    // Volume por grupo muscular
    const volumeResult = validateExerciseVolumePerMuscleGroup(day, activityLevel);
    allWarnings.push(...volumeResult.warnings);
    allErrors.push(...volumeResult.errors);
    allSuggestions.push(...volumeResult.suggestions);

    // Repetições por IMC + objetivo
    const repsResult = validateRepsForIMCAndObjective(day.exercises, imc, objective);
    allWarnings.push(...repsResult.warnings);
    allErrors.push(...repsResult.errors);
    allSuggestions.push(...repsResult.suggestions);

    // Diversidade de exercícios
    const diversityResult = validateExerciseDiversity(day.exercises);
    allWarnings.push(...diversityResult.warnings);
    allErrors.push(...diversityResult.errors);
    allSuggestions.push(...diversityResult.suggestions);
  }

  // Validar calorias vs TDEE (se disponível)
  if (dailyCalories && tdee) {
    const caloriesResult = validateCaloriesVsTDEE(
      dailyCalories,
      tdee,
      objective,
      imc
    );
    allWarnings.push(...caloriesResult.warnings);
    allErrors.push(...caloriesResult.errors);
    allSuggestions.push(...caloriesResult.suggestions);
  }

  return {
    isValid: allErrors.length === 0,
    warnings: allWarnings,
    errors: allErrors,
    suggestions: allSuggestions,
  };
}

