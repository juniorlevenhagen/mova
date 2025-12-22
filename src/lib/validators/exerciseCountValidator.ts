import { getTrainingProfile } from "@/lib/profiles/trainingProfiles";

/**
 * Valida se o número de exercícios por dia está dentro dos limites do nível
 * Agora usa os perfis técnicos
 *
 * @param exerciseCount - Número de exercícios no dia
 * @param level - Nível do usuário (ex: "Idoso", "Iniciante", "Atleta Alto Rendimento")
 * @returns true se o número de exercícios está dentro do limite do nível
 */
export function validateExercisesCountByLevel(
  exerciseCount: number,
  level: string
): boolean {
  // Limites absolutos (safety check)
  if (exerciseCount < 3 || exerciseCount > 12) return false;

  // Usar perfil técnico
  const profile = getTrainingProfile(level);
  const max = profile.maxExercisesPerSession;

  return exerciseCount <= max;
}
