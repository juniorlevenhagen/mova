/**
 * Valida se o número de exercícios por dia está dentro dos limites do nível
 *
 * @param exerciseCount - Número de exercícios no dia
 * @param level - Nível do usuário (ex: "Idoso", "Iniciante", "Atleta Alto Rendimento")
 * @returns true se o número de exercícios está dentro do limite do nível
 */
export function validateExercisesCountByLevel(
  exerciseCount: number,
  level: string
): boolean {
  // Limites absolutos
  if (exerciseCount < 3 || exerciseCount > 12) return false;

  const limits: Record<string, number> = {
    idoso: 5,
    limitado: 5,
    iniciante: 6,
    moderado: 8,
    intermediario: 8,
    avancado: 10,
    atleta: 12, // Aumentado para permitir volume de elite
    atleta_altorendimento: 12,
  };

  // Normalização consistente
  const key = level
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/\s+/g, "_") // Espaços viram underscore
    .replace("atleta_alto_rendimento", "atleta_altorendimento"); // Ajuste específico

  const max = limits[key] ?? 8;

  return exerciseCount <= max;
}
