/**
 * ContractValidator - Validador de Invariantes do ApprovalContract
 *
 * Este módulo valida que o ApprovalContract está sendo usado corretamente
 * e que as regras estão sendo respeitadas durante a geração.
 *
 * 🎯 OBJETIVO: Garantir robustez e prevenir regressões
 *
 * 🔒 REGRA DE OURO:
 * - ApprovalContract DECIDE (regras de negócio)
 * - Validator principal VERIFICA (validação final)
 * - ContractValidator apenas VERIFICA INTEGRIDADE (não cria regras novas)
 *
 * ⚠️ IMPORTANTE:
 * - NUNCA duplicar lógica do ApprovalContract ou do validador principal
 * - FLEXIBLE nunca bloqueia, apenas gera warnings/recomendações
 * - Este validador é apenas para detectar bugs/inconsistências, não para revalidar regras
 */

import type { ApprovalContract } from "./approvalContract";
import type { WeekState } from "./dayStateManager";
import type { Exercise } from "@/lib/validators/trainingPlanValidator";
import { detectMotorPattern } from "@/lib/validators/advancedPlanValidator";

/* --------------------------------------------------------
   TIPOS E INTERFACES
-------------------------------------------------------- */

export interface ContractValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface PlanIntegrityCheck {
  valid: boolean;
  violations: Array<{
    type: "HARD" | "SOFT";
    rule: string;
    details: Record<string, unknown>;
  }>;
}

/* --------------------------------------------------------
   VALIDAÇÃO DE INVARIANTES DO CONTRATO
-------------------------------------------------------- */

/**
 * Valida que o ApprovalContract está bem formado
 */
export function validateContractIntegrity(
  contract: ApprovalContract
): ContractValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Validar limites semanais não são negativos
  for (const [muscle, limit] of Object.entries(contract.weeklySeriesLimits)) {
    if (limit < 0) {
      errors.push(`Limite semanal negativo para ${muscle}: ${limit}`);
    }
    if (limit === 0 && muscle !== "gluteos" && muscle !== "panturrilhas") {
      warnings.push(
        `Limite semanal zero para ${muscle} (pode ser intencional)`
      );
    }
  }

  // 2. Validar que minSetsPerExercise é consistente com déficit
  if (contract.deficit.active && contract.minSetsPerExercise !== 2) {
    errors.push(
      `Inconsistência: déficit ativo mas minSetsPerExercise=${contract.minSetsPerExercise} (deveria ser 1)`
    );
  }
  if (!contract.deficit.active && contract.minSetsPerExercise !== 2) {
    warnings.push(
      `minSetsPerExercise=${contract.minSetsPerExercise} sem déficit (normalmente é 2)`
    );
  }

  // 3. Validar que limites semanais estão ajustados para déficit
  if (contract.deficit.active) {
    // Verificar se os limites foram realmente multiplicados
    // (aproximação: limites devem ser menores que valores típicos sem déficit)
    const typicalLimits: Record<string, number> = {
      peito: 12,
      costas: 12,
      quadriceps: 12,
      posterior: 10,
      ombro: 8,
      triceps: 8,
      biceps: 8,
    };

    for (const [muscle, limit] of Object.entries(contract.weeklySeriesLimits)) {
      const typical = typicalLimits[muscle];
      if (typical && limit > typical * 0.8) {
        warnings.push(
          `Limite de ${muscle} (${limit}) parece não estar ajustado para déficit (típico sem déficit: ~${typical})`
        );
      }
    }
  }

  // 4. Validar que maxExercisesPerSession é razoável
  if (contract.maxExercisesPerSession < 3) {
    warnings.push(
      `maxExercisesPerSession muito baixo: ${contract.maxExercisesPerSession} (mínimo recomendado: 3)`
    );
  }
  if (contract.maxExercisesPerSession > 12) {
    warnings.push(
      `maxExercisesPerSession muito alto: ${contract.maxExercisesPerSession} (máximo recomendado: 12)`
    );
  }

  // 5. Validar que divisões válidas não estão vazias
  if (contract.validDivisions.length === 0) {
    errors.push(
      `Nenhuma divisão válida para ${contract.trainingDays} dias/semana`
    );
  }

  // 6. Validar limites de padrões motores são positivos
  for (const [pattern, limit] of Object.entries(contract.motorPatternLimits)) {
    if (limit <= 0) {
      errors.push(`Limite de padrão motor ${pattern} inválido: ${limit}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/* --------------------------------------------------------
   VALIDAÇÃO DE INTEGRIDADE DO PLANO GERADO
-------------------------------------------------------- */

/**
 * Valida que um plano gerado respeita o ApprovalContract usado
 *
 * ⚠️ IMPORTANTE: Esta função NÃO revalida regras de negócio.
 * Ela apenas verifica se o ApprovalContract foi respeitado durante a geração.
 * A validação final completa deve ser feita pelo validador principal.
 *
 * Esta função deve ser chamada APÓS a geração para detectar bugs/inconsistências,
 * não para substituir o validador principal.
 */
export function validatePlanAgainstContract(
  plan: { weeklySchedule: Array<{ exercises: Exercise[] }> },
  contract: ApprovalContract,
  weekState: WeekState
): PlanIntegrityCheck {
  const violations: PlanIntegrityCheck["violations"] = [];

  // 🔒 APENAS verificar se limites HARD foram respeitados (não revalidar regras)
  // Se o ApprovalContract foi usado corretamente, essas violações indicam bugs

  // 1. Validar limites semanais por músculo (HARD RULE)
  for (const [muscle, limit] of Object.entries(contract.weeklySeriesLimits)) {
    const currentSeries = weekState.muscleWeeklySeries.get(muscle) || 0;
    if (currentSeries > limit) {
      violations.push({
        type: "HARD",
        rule: "weekly_series_limit",
        details: {
          muscle,
          currentSeries,
          limit,
          excess: currentSeries - limit,
        },
      });
    }
  }

  // 2. Validar limites de exercícios por sessão (HARD RULE)
  for (const day of plan.weeklySchedule) {
    if (day.exercises.length > contract.maxExercisesPerSession) {
      violations.push({
        type: "HARD",
        rule: "max_exercises_per_session",
        details: {
          exercises: day.exercises.length,
          limit: contract.maxExercisesPerSession,
          excess: day.exercises.length - contract.maxExercisesPerSession,
        },
      });
    }
  }

  // 3. Validar limites de padrões motores por dia (HARD RULE)
  for (const day of plan.weeklySchedule) {
    const patternCounts = new Map<string, number>();
    for (const exercise of day.exercises) {
      const pattern = detectMotorPattern(exercise);
      if (pattern && pattern !== "unknown") {
        patternCounts.set(pattern, (patternCounts.get(pattern) || 0) + 1);
      }
    }

    for (const [pattern, count] of patternCounts) {
      const limit =
        contract.motorPatternLimits[
          pattern as keyof typeof contract.motorPatternLimits
        ];
      if (limit && count > limit) {
        violations.push({
          type: "HARD",
          rule: "motor_pattern_limit",
          details: {
            pattern,
            count,
            limit,
            excess: count - limit,
          },
        });
      }
    }
  }

  // 4. Validar restrições articulares (HARD RULE - defesa em profundidade)
  // 🔒 IMPORTANTE: Esta é uma verificação de integridade, não revalidação de regras
  // Se o ApprovalContract foi respeitado, nenhum exercício deveria violar restrições
  if (contract.restrictedJoints.shoulder || contract.restrictedJoints.knee) {
    for (const day of plan.weeklySchedule) {
      for (const exercise of day.exercises) {
        const pattern = detectMotorPattern(exercise);
        if (!pattern || pattern === "unknown") continue;

        // Verificar restrição de ombro
        if (contract.restrictedJoints.shoulder) {
          const restrictedPatterns = ["vertical_push", "overhead_movement"];
          if (restrictedPatterns.includes(pattern)) {
            violations.push({
              type: "HARD",
              rule: "joint_restriction",
              details: {
                joint: "shoulder",
                exercise: exercise.name,
                pattern,
                reason: `Exercício ${exercise.name} usa padrão motor ${pattern} que é restrito para ombro`,
              },
            });
          }
        }

        // Verificar restrição de joelho
        if (contract.restrictedJoints.knee) {
          const restrictedPatterns = ["squat", "deep_flexion", "impact"];
          if (restrictedPatterns.includes(pattern)) {
            violations.push({
              type: "HARD",
              rule: "joint_restriction",
              details: {
                joint: "knee",
                exercise: exercise.name,
                pattern,
                reason: `Exercício ${exercise.name} usa padrão motor ${pattern} que é restrito para joelho`,
              },
            });
          }
        }
      }
    }
  }

  // 🔒 NOTA: Não validar séries mínimas aqui - isso é FLEXIBLE e deve ser apenas warning
  // Se o ApprovalContract permitiu, não devemos bloquear aqui

  return {
    valid: violations.length === 0,
    violations,
  };
}

/* --------------------------------------------------------
   VALIDAÇÃO DE CONSISTÊNCIA COM VALIDADOR
-------------------------------------------------------- */

/**
 * Compara os limites do ApprovalContract com os limites esperados pelo validador
 *
 * Esta função garante que o contrato e o validador usam as mesmas regras.
 */
export function validateContractValidatorConsistency(
  contract: ApprovalContract,
  validatorLimits: Record<string, number>
): ContractValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const [muscle, validatorLimit] of Object.entries(validatorLimits)) {
    const contractLimit = contract.weeklySeriesLimits[muscle];
    if (contractLimit === undefined) {
      warnings.push(
        `Músculo ${muscle} tem limite no validador (${validatorLimit}) mas não no contrato`
      );
      continue;
    }

    if (contractLimit !== validatorLimit) {
      errors.push(
        `Inconsistência para ${muscle}: contrato=${contractLimit}, validador=${validatorLimit}`
      );
    }
  }

  // Verificar músculos no contrato que não estão no validador
  for (const muscle of Object.keys(contract.weeklySeriesLimits)) {
    if (!(muscle in validatorLimits)) {
      warnings.push(
        `Músculo ${muscle} tem limite no contrato mas não no validador`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/* --------------------------------------------------------
   VALIDAÇÃO DE USO CORRETO DO CONTRATO
-------------------------------------------------------- */

/**
 * Valida que o ApprovalContract está sendo usado corretamente durante a geração
 *
 * ⚠️ IMPORTANTE: Esta função apenas verifica se o contrato está sendo consultado.
 * Ela NÃO decide se o exercício deve ser adicionado - isso é responsabilidade do ApprovalContract.
 *
 * Esta função deve ser chamada ANTES de adicionar cada exercício para garantir
 * que o contrato está sendo consultado (detectar bugs de uso incorreto).
 */
export function validateContractUsage(
  contract: ApprovalContract | undefined,
  context: {
    exerciseName: string;
    muscle: string;
    sets: number;
    currentDayExercises: number;
    currentWeeklySeries: Map<string, number>;
  }
): ContractValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!contract) {
    // Bug: contrato não fornecido
    errors.push(
      `Bug detectado: ApprovalContract não fornecido ao tentar adicionar ${context.exerciseName}`
    );
    return { valid: false, errors, warnings };
  }

  // 🔒 NOTA: validateContractUsage foi removida - não é mais necessária
  // O ApprovalContract agora valida restrições articulares diretamente em canAddExercise
  // Esta função não pode mais ser usada porque canAddExercise requer um objeto Exercise completo

  const weekCheck = contract.canAddExerciseToWeek(
    context.muscle,
    context.sets,
    context.currentWeeklySeries
  );

  if (!weekCheck.allowed) {
    // Error: tentativa de violar limite HARD (indica bug)
    errors.push(
      `[BUG] Tentativa de adicionar ${context.exerciseName} violaria limite semanal HARD: ${weekCheck.reason}`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/* --------------------------------------------------------
   VALIDAÇÃO DE PROPRIEDADES INVARIANTES
-------------------------------------------------------- */

/**
 * Valida propriedades matemáticas invariantes que devem SEMPRE ser verdadeiras
 *
 * ⚠️ IMPORTANTE: Apenas propriedades matemáticas puras, não regras de negócio.
 * Regras de negócio são validadas pelo ApprovalContract e pelo validador principal.
 *
 * Estas são propriedades que, se violadas, indicam bugs no código, não problemas de regras.
 */
export function validateInvariantProperties(
  plan: { weeklySchedule: Array<{ exercises: Exercise[] }> },
  contract: ApprovalContract
): ContractValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 🔒 Propriedade matemática 1: Total de séries semanais não pode exceder soma dos limites
  // Esta é uma verificação de integridade matemática, não revalidação de regras
  const totalSeriesByMuscle = new Map<string, number>();
  for (const day of plan.weeklySchedule) {
    for (const exercise of day.exercises) {
      const muscle = exercise.primaryMuscle.toLowerCase();
      const sets =
        typeof exercise.sets === "number"
          ? exercise.sets
          : parseInt(String(exercise.sets), 10) || 0;
      totalSeriesByMuscle.set(
        muscle,
        (totalSeriesByMuscle.get(muscle) || 0) + sets
      );
    }
  }

  for (const [muscle, totalSeries] of totalSeriesByMuscle) {
    const limit = contract.weeklySeriesLimits[muscle];
    if (limit && totalSeries > limit) {
      // Se o ApprovalContract foi respeitado, isso não deveria acontecer
      // Indica bug no gerador ou no weekState
      errors.push(
        `Bug detectado: ${muscle} tem ${totalSeries} séries (limite: ${limit}). ApprovalContract deveria ter bloqueado.`
      );
    }
  }

  // 🔒 Propriedade matemática 2: Número total de exercícios não pode exceder limite teórico máximo
  // Esta é uma verificação matemática pura (limite × dias)
  const totalExercises = plan.weeklySchedule.reduce(
    (sum, day) => sum + day.exercises.length,
    0
  );
  const maxTotalExercises =
    contract.maxExercisesPerSession * contract.trainingDays;
  if (totalExercises > maxTotalExercises) {
    // Se o ApprovalContract foi respeitado, isso não deveria acontecer
    errors.push(
      `Bug detectado: Total de exercícios (${totalExercises}) excede máximo teórico (${maxTotalExercises}). ApprovalContract deveria ter bloqueado.`
    );
  }

  // 🔒 FLEXIBLE RULE: Em déficit, séries > 2 são apenas recomendação (warning, não erro)
  // FLEXIBLE nunca bloqueia, apenas recomenda
  if (contract.deficit.active) {
    for (const day of plan.weeklySchedule) {
      for (const exercise of day.exercises) {
        const sets =
          typeof exercise.sets === "number"
            ? exercise.sets
            : parseInt(String(exercise.sets), 10) || 0;
        // FLEXIBLE: apenas warning, não erro
        if (sets > 2) {
          warnings.push(
            `[FLEXIBLE] Em déficit, exercício ${exercise.name} tem ${sets} séries (recomendado: 1-2, mas permitido)`
          );
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
