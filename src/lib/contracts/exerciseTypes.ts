/**
 * Vocabulário Controlado - Tipos Padronizados
 *
 * Define tipos padronizados para classificação funcional de exercícios.
 * Mantém retrocompatibilidade com sistema existente (compound/isolation).
 */

export type MuscleGroup =
  | "chest"
  | "back"
  | "quadriceps"
  | "hamstrings"
  | "glutes"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "calves"
  | "traps";

export type ExerciseRole = "structural" | "isolated";

export type MovementPattern =
  | "knee_dominant"
  | "hip_dominant"
  | "horizontal_push"
  | "vertical_push"
  | "horizontal_pull"
  | "vertical_pull"
  | "unilateral";

/**
 * Mapeia o tipo existente (compound/isolation) para ExerciseRole
 */
export function mapTypeToRole(type?: "compound" | "isolation"): ExerciseRole {
  return type === "compound" ? "structural" : "isolated";
}

/**
 * Mapeia nomes de músculos em português para MuscleGroup padronizado
 */
export function mapMuscleToGroup(muscle: string): MuscleGroup | null {
  const normalized = muscle
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (normalized.includes("peito") || normalized.includes("peitoral")) {
    return "chest";
  }
  if (normalized.includes("costa")) {
    return "back";
  }
  if (normalized.includes("quadricep")) {
    return "quadriceps";
  }
  if (normalized.includes("posterior") && normalized.includes("coxa")) {
    return "hamstrings";
  }
  if (normalized.includes("gluteo") || normalized.includes("glúteo")) {
    return "glutes";
  }
  if (normalized.includes("ombro")) {
    return "shoulders";
  }
  if (normalized.includes("biceps")) {
    return "biceps";
  }
  if (normalized.includes("triceps")) {
    return "triceps";
  }
  if (normalized.includes("panturrilha")) {
    return "calves";
  }
  if (normalized.includes("trapezio") || normalized.includes("trapézio")) {
    return "traps";
  }

  return null;
}

/**
 * Mapeia activityLevel em português para chave de contrato
 */
export function getContractKey(activityLevel: string): string {
  const level = activityLevel
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (level.includes("sedentario") || level.includes("sedentário")) {
    return "sedentary";
  }
  if (level.includes("moderado")) {
    return "moderate";
  }
  if (
    level.includes("atleta") &&
    (level.includes("alto") || level.includes("rendimento"))
  ) {
    return "advanced";
  }
  if (
    level.includes("atleta") ||
    level.includes("avancado") ||
    level.includes("avançado")
  ) {
    return "athlete";
  }

  return "moderate"; // default
}
