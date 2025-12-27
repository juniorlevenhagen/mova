/**
 * Auditoria Pura de Contratos
 *
 * Valida se planos gerados satisfazem contratos de grupo muscular.
 * Apenas registra métricas - NÃO corrige, NÃO bloqueia.
 *
 * Regras:
 * - Apenas verificação (não interfere no fluxo)
 * - Registra rejeições se contrato não satisfeito
 * - Complementa métricas existentes
 */

import { recordPlanRejection } from "@/lib/metrics/planRejectionMetrics";
import type {
  TrainingPlan,
  Exercise,
} from "@/lib/validators/trainingPlanValidator";
import type { MuscleGroupContract } from "./muscleGroupContracts";
import {
  getContractForMuscleGroup,
  getMinStructural,
} from "./muscleGroupContracts";
import { detectMotorPattern } from "@/lib/validators/advancedPlanValidator";
import { getContractKey } from "./exerciseTypes";

/**
 * Verifica se um plano satisfaz um contrato de grupo muscular
 */
function contractSatisfied(
  plan: TrainingPlan,
  contract: MuscleGroupContract,
  context: {
    activityLevel: string;
    muscleGroup: string;
  }
): boolean {
  const contractKey = getContractKey(context.activityLevel);
  const minRequired = contract.minStructural[contractKey] || 1;

  // Coletar todos os exercícios do grupo muscular no plano
  const groupExercises: Array<{ name: string; primaryMuscle: string }> = [];
  for (const day of plan.weeklySchedule) {
    for (const exercise of day.exercises) {
      const normalizedMuscle = exercise.primaryMuscle
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      const normalizedGroup = context.muscleGroup
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      // Verificar se o exercício pertence ao grupo
      if (
        normalizedMuscle.includes(normalizedGroup) ||
        normalizedGroup.includes(normalizedMuscle)
      ) {
        groupExercises.push({
          name: exercise.name,
          primaryMuscle: exercise.primaryMuscle,
        });
      }
    }
  }

  // Contar exercícios estruturais
  // Nota: Como não temos acesso ao ExerciseTemplate original, usamos heurística
  // Se o exercício tiver padrão motor detectável, provavelmente é estrutural
  let structuralCount = 0;
  const patternsFound = new Set<string>();

  for (const ex of groupExercises) {
    // Converter para formato Exercise para detectMotorPattern
    const exerciseForDetection: Exercise = {
      name: ex.name,
      primaryMuscle: ex.primaryMuscle,
      sets: 0,
      reps: "0",
      rest: "0s",
    };
    const pattern = detectMotorPattern(exerciseForDetection);
    if (pattern) {
      patternsFound.add(pattern);
      structuralCount++;
    }
  }

  // Verificar requisito mínimo de estruturais
  if (structuralCount < minRequired) {
    return false;
  }

  // Verificar padrões obrigatórios
  if (contract.requiredPatterns) {
    for (const requiredPattern of contract.requiredPatterns) {
      // Mapear padrões do contrato para padrões detectados
      const mappedPattern = mapContractPatternToDetected(requiredPattern);
      if (!patternsFound.has(mappedPattern)) {
        return false; // Padrão obrigatório ausente
      }
    }
  }

  return true;
}

/**
 * Mapeia padrão do contrato para padrão detectado pelo sistema
 */
function mapContractPatternToDetected(contractPattern: string): string {
  const mapping: Record<string, string> = {
    knee_dominant: "squat",
    hip_dominant: "hinge",
    horizontal_push: "horizontal_push",
    vertical_push: "vertical_push",
    horizontal_pull: "horizontal_pull",
    vertical_pull: "vertical_pull",
    unilateral: "squat", // Unilateral geralmente é detectado como squat
  };

  return mapping[contractPattern] || contractPattern;
}

/**
 * Audita um plano contra contratos de grupo muscular
 * Apenas registra métricas - não interfere no fluxo
 */
export function auditContract(
  plan: TrainingPlan,
  context: {
    activityLevel: string;
    muscleGroups?: string[]; // Se não fornecido, audita todos os grupos com contrato
  }
): void {
  const muscleGroups = context.muscleGroups || [
    "quadriceps",
    "posterior de coxa",
    "peitoral",
    "costas",
    "ombros",
  ];

  for (const muscleGroup of muscleGroups) {
    const contract = getContractForMuscleGroup(muscleGroup);

    if (!contract) {
      continue; // Sem contrato para este grupo
    }

    const satisfied = contractSatisfied(plan, contract, {
      activityLevel: context.activityLevel,
      muscleGroup,
    });

    if (!satisfied) {
      // Registrar rejeição (apenas métrica, não bloqueia)
      recordPlanRejection("contract_violation", {
        contract: muscleGroup,
        activityLevel: context.activityLevel,
        details: {
          minRequired: getMinStructural(contract, context.activityLevel),
          requiredPatterns: contract.requiredPatterns || [],
        },
      });
    }
  }
}
