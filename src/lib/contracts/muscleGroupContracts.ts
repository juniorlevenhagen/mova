/**
 * Contratos por Grupo Muscular
 *
 * Define requisitos estruturais mínimos por grupo muscular e nível de atividade.
 * Complementa o ApprovalContract (não substitui).
 *
 * Regras:
 * - minStructural: Quantidade mínima de exercícios estruturais obrigatórios
 * - requiredPatterns: Padrões motores que DEVEM estar presentes
 * - allowedPatterns: Padrões motores permitidos (se não especificado, todos são permitidos)
 * - allowUnilateralAsStructural: Se unilateral conta como estrutural
 */

import type { MovementPattern } from "./exerciseTypes";
import { getContractKey } from "./exerciseTypes";

export interface MuscleGroupContract {
  minStructural: Record<string, number>; // sedentary, moderate, athlete, advanced
  requiredPatterns?: MovementPattern[];
  allowedPatterns?: MovementPattern[];
  allowUnilateralAsStructural?: boolean;
}

/**
 * Contrato para Inferiores (Lower Body)
 */
export const lowerBodyContract: MuscleGroupContract = {
  minStructural: {
    sedentary: 1,
    moderate: 2,
    athlete: 2,
    advanced: 3,
  },
  requiredPatterns: ["knee_dominant", "hip_dominant"],
  allowUnilateralAsStructural: true,
};

/**
 * Contrato para Peitoral
 */
export const chestContract: MuscleGroupContract = {
  minStructural: {
    sedentary: 1,
    moderate: 1,
    athlete: 1,
    advanced: 2,
  },
  requiredPatterns: ["horizontal_push"],
  allowedPatterns: ["horizontal_push", "vertical_push"], // inclui inclinado como vertical
};

/**
 * Contrato para Costas
 */
export const backContract: MuscleGroupContract = {
  minStructural: {
    sedentary: 1,
    moderate: 1,
    athlete: 1,
    advanced: 2,
  },
  requiredPatterns: ["horizontal_pull", "vertical_pull"], // pelo menos um dos dois
};

/**
 * Contrato para Ombros
 */
export const shouldersContract: MuscleGroupContract = {
  minStructural: {
    sedentary: 0, // Ombros podem ser secundários em outros exercícios
    moderate: 0,
    athlete: 1,
    advanced: 1,
  },
  requiredPatterns: ["vertical_push"],
};

/**
 * Obtém o contrato para um grupo muscular
 */
export function getContractForMuscleGroup(
  muscleGroup: string
): MuscleGroupContract | null {
  const normalized = muscleGroup
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (
    normalized.includes("quadricep") ||
    normalized.includes("posterior") ||
    normalized.includes("coxa") ||
    normalized.includes("gluteo") ||
    normalized.includes("glúteo")
  ) {
    return lowerBodyContract;
  }
  if (normalized.includes("peito") || normalized.includes("peitoral")) {
    return chestContract;
  }
  if (normalized.includes("costa")) {
    return backContract;
  }
  if (normalized.includes("ombro")) {
    return shouldersContract;
  }

  return null; // Sem contrato específico (usa lógica padrão)
}

/**
 * Obtém o requisito mínimo de estruturais para um nível de atividade
 */
export function getMinStructural(
  contract: MuscleGroupContract,
  activityLevel: string
): number {
  const key = getContractKey(activityLevel);
  return contract.minStructural[key] || 1; // default: 1
}

/**
 * Verifica se um padrão motor é obrigatório no contrato
 */
export function isPatternRequired(
  contract: MuscleGroupContract,
  pattern: MovementPattern
): boolean {
  return contract.requiredPatterns?.includes(pattern) || false;
}

/**
 * Verifica se um padrão motor é permitido no contrato
 */
export function isPatternAllowed(
  contract: MuscleGroupContract,
  pattern: MovementPattern
): boolean {
  if (!contract.allowedPatterns) {
    return true; // Se não especificado, todos são permitidos
  }
  return contract.allowedPatterns.includes(pattern);
}
