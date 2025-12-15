/**
 * Validador de Planos de Treino
 *
 * Funções e tipos para validação de planos de treino gerados pela IA.
 * Movido para arquivo separado para permitir uso em testes e outras partes do código.
 */

import { validateExercisesCountByLevel } from "@/lib/validators/exerciseCountValidator";
import { recordPlanRejection } from "@/lib/metrics/planRejectionMetrics";

/* --------------------------------------------------------
   Tipos
-------------------------------------------------------- */

export interface Exercise {
  name: string;
  primaryMuscle: string; // Músculo primário (obrigatório)
  secondaryMuscles?: string[]; // Músculos secundários (opcional, máximo 2)
  sets: number; // Mudança: de string para number
  reps: string;
  rest: string;
  notes?: string; // Mudança: opcional
}

export interface TrainingDay {
  day: string;
  type?: string;
  exercises: Exercise[];
}

export interface TrainingPlan {
  overview: string;
  weeklySchedule: TrainingDay[];
  progression: string;
}

/* --------------------------------------------------------
   Funções auxiliares
-------------------------------------------------------- */

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function primaryGroup(ex: Exercise | unknown): string {
  if (!ex || typeof ex !== "object") return "";
  const e = ex as Exercise;
  if (!e.primaryMuscle || typeof e.primaryMuscle !== "string") return "";
  return normalize(e.primaryMuscle);
}

/**
 * Normaliza o nome da divisão, convertendo sinônimos para o padrão interno
 * Ex: "Legs" -> "lower", "PPL" -> "ppl"
 */
function normalizeDivisionName(name: string): string {
  const normalized = normalize(name);
  // Aceitar "legs" como sinônimo de "lower"
  if (normalized === "legs") return "lower";
  return normalized;
}

/**
 * Valida se a divisão do plano corresponde à frequência semanal
 */
function validateDivisionByFrequency(
  plan: TrainingPlan,
  trainingDays: number
): boolean {
  const expectedDivisionByFrequency: Record<number, string[]> = {
    2: ["full", "fullbody"],
    3: ["full", "fullbody"],
    4: ["upper", "lower"], // Upper/Lower
    5: ["push", "pull", "legs", "lower"], // PPL
    6: ["push", "pull", "legs", "lower"], // PPL 2x
    7: ["push", "pull", "legs", "lower"], // PPL com ajustes
  };

  const expectedDivisions = expectedDivisionByFrequency[trainingDays] || [];
  if (expectedDivisions.length === 0) return true; // Se não há regra, aceita

  // Coletar todas as divisões usadas no plano
  const usedDivisions = new Set<string>();
  for (const day of plan.weeklySchedule) {
    const dayType = normalizeDivisionName(day.type || "");
    usedDivisions.add(dayType);
  }

  // Verificar se todas as divisões usadas são esperadas
  for (const division of usedDivisions) {
    if (!expectedDivisions.includes(division)) {
      return false; // Divisão incompatível com frequência
    }
  }

  // Validações específicas por frequência
  if (trainingDays === 4) {
    // 4x deve ter Upper e Lower
    const hasUpper = usedDivisions.has("upper");
    const hasLower = usedDivisions.has("lower") || usedDivisions.has("legs");
    if (!hasUpper || !hasLower) return false;
  } else if (trainingDays >= 5) {
    // 5x+ deve ter Push, Pull e Legs/Lower
    const hasPush = usedDivisions.has("push");
    const hasPull = usedDivisions.has("pull");
    const hasLegs = usedDivisions.has("lower") || usedDivisions.has("legs");
    if (!hasPush || !hasPull || !hasLegs) return false;
  }

  return true;
}

/**
 * Valida distribuição inteligente de músculos primários por tipo de dia
 */
function validateMuscleDistribution(
  day: TrainingDay,
  dayType: string
): boolean {
  const primaryMuscleCounts = new Map<string, number>();
  for (const ex of day.exercises) {
    if (!ex.primaryMuscle) continue;
    const primary = normalize(ex.primaryMuscle);
    primaryMuscleCounts.set(
      primary,
      (primaryMuscleCounts.get(primary) || 0) + 1
    );
  }

  const totalExercises = day.exercises.length;

  if (dayType === "push") {
    // Push: alternar entre Peitoral e Ombros
    // Tríceps nunca deve ser primário na maioria (máximo 30%)
    const tricepsCount = primaryMuscleCounts.get("triceps") || 0;
    const maxTriceps = Math.ceil(totalExercises * 0.3);
    if (tricepsCount > maxTriceps) {
      console.warn(
        "Plano rejeitado: tríceps como primário em excesso no dia Push",
        {
          tricepsCount,
          maxTriceps,
          totalExercises,
          day: day.day,
        }
      );
      return false;
    }
    // Deve ter pelo menos Peitoral OU Ombros como primários
    const hasPeitoral = primaryMuscleCounts.has("peitoral");
    const hasOmbros = primaryMuscleCounts.has("ombros");
    if (!hasPeitoral && !hasOmbros) {
      console.warn(
        "Plano rejeitado: Push day sem Peitoral ou Ombros como primários",
        {
          day: day.day,
        }
      );
      return false;
    }
  } else if (dayType === "pull") {
    // Pull: alternar entre Costas e Posterior de coxa
    // Bíceps nunca deve dominar (máximo 30%)
    const bicepsCount = primaryMuscleCounts.get("biceps") || 0;
    const maxBiceps = Math.ceil(totalExercises * 0.3);
    if (bicepsCount > maxBiceps) {
      console.warn(
        "Plano rejeitado: bíceps como primário em excesso no dia Pull",
        {
          bicepsCount,
          maxBiceps,
          totalExercises,
          day: day.day,
        }
      );
      return false;
    }
  } else if (dayType === "lower" || dayType === "legs") {
    // Lower/Legs: distribuir entre Quadríceps, Posterior, Glúteos
    // Nenhum músculo pode ter mais de 50%
    const maxPerMuscle = Math.ceil(totalExercises * 0.5);
    for (const [muscle, count] of primaryMuscleCounts) {
      if (count > maxPerMuscle) {
        console.warn(
          "Plano rejeitado: músculo concentrado demais no dia Lower",
          {
            muscle,
            count,
            maxPerMuscle,
            totalExercises,
            day: day.day,
          }
        );
        return false;
      }
    }
  }

  return true;
}

/**
 * Valida se o tempo de treino cabe no tempo disponível
 */
function validateTrainingTime(
  day: TrainingDay,
  availableTimeMinutes: number
): boolean {
  let totalTimeSeconds = 0;

  for (const ex of day.exercises) {
    // Parsear sets (agora é number)
    const sets =
      typeof ex.sets === "number" ? ex.sets : parseInt(ex.sets, 10) || 3;

    // Parsear rest (ex: "60s", "90s", "2min")
    let restSeconds = 60; // default
    const restStr = ex.rest?.toLowerCase() || "60s";
    if (restStr.includes("min")) {
      restSeconds = parseInt(restStr, 10) * 60;
    } else if (restStr.includes("s")) {
      restSeconds = parseInt(restStr, 10) || 60;
    }

    // Tempo por exercício: (sets * tempo_execucao) + (sets * rest)
    // Assumir ~30s por série de execução
    const executionTimePerSet = 30;
    const timePerExercise = sets * (executionTimePerSet + restSeconds);
    totalTimeSeconds += timePerExercise;
  }

  const totalTimeMinutes = totalTimeSeconds / 60;
  const requiredMinutes = Math.ceil(totalTimeMinutes);

  if (requiredMinutes > availableTimeMinutes) {
    console.warn("Plano rejeitado: tempo de treino excede disponível", {
      required: requiredMinutes.toFixed(1),
      available: availableTimeMinutes,
      day: day.day,
      type: day.type,
    });
    recordPlanRejection("tempo_treino_excede_disponivel", {
      required: requiredMinutes.toFixed(1),
      available: availableTimeMinutes,
      day: day.day,
      dayType: day.type,
    });
    return false;
  }

  return true;
}

/**
 * Valida a ordem lógica dos grupos musculares nos exercícios
 */
function validateExerciseOrder(day: TrainingDay): boolean {
  const dayType = normalizeDivisionName(day.type || "");

  // Ordem esperada por divisão (grupos grandes antes de pequenos)
  const expectedOrderByDivision: Record<string, string[][]> = {
    push: [["peitoral"], ["ombros"], ["triceps"]],
    pull: [["costas"], ["biceps"]],
    lower: [["quadriceps"], ["posterior de coxa"], ["gluteos", "panturrilhas"]],
    legs: [["quadriceps"], ["posterior de coxa"], ["gluteos", "panturrilhas"]],
    upper: [["peitoral", "costas"], ["ombros"], ["biceps", "triceps"]],
    full: [
      ["peitoral", "costas"],
      ["quadriceps", "posterior de coxa", "gluteos"],
      ["ombros"],
      ["biceps", "triceps"],
    ],
  };

  const expectedOrder = expectedOrderByDivision[dayType];
  if (!expectedOrder) return true; // Se não há regra de ordem, aceita

  // Mapear cada exercício para seu músculo primário
  const exerciseGroups: string[] = [];
  for (const ex of day.exercises) {
    const primary = primaryGroup(ex);
    if (primary) exerciseGroups.push(normalize(primary));
  }

  // Verificar se a ordem está correta (grupos grandes antes de pequenos)
  let lastGroupIndex = -1;
  for (const groupSet of expectedOrder) {
    // Encontrar o primeiro índice onde algum grupo deste conjunto aparece
    let currentGroupIndex = exerciseGroups.length;
    for (const group of groupSet) {
      const index = exerciseGroups.findIndex((g) => g === normalize(group));
      if (index !== -1 && index < currentGroupIndex) {
        currentGroupIndex = index;
      }
    }

    // Se encontrou algum grupo deste conjunto
    if (currentGroupIndex < exerciseGroups.length) {
      // Deve aparecer depois do conjunto anterior
      if (currentGroupIndex < lastGroupIndex) {
        return false; // Ordem incorreta
      }
      lastGroupIndex = currentGroupIndex;
    }
  }

  return true;
}

/* --------------------------------------------------------
   HELPER: Registrar rejeição com métricas
-------------------------------------------------------- */

function rejectPlan(
  reason: Parameters<typeof recordPlanRejection>[0],
  context: Parameters<typeof recordPlanRejection>[1],
  message: string,
  warnData?: Record<string, unknown>
): void {
  console.warn(`Plano rejeitado: ${message}`, warnData);
  recordPlanRejection(reason, context).catch(() => {
    // Não lançar erro - a validação continua funcionando
  });
}

/* --------------------------------------------------------
   VALIDAÇÃO FLEXÍVEL E TIPADA
-------------------------------------------------------- */
export function isTrainingPlanUsable(
  plan: TrainingPlan | null,
  trainingDays: number,
  activityLevel?: string | null,
  availableTimeMinutes?: number
): boolean {
  if (!plan?.weeklySchedule || !Array.isArray(plan.weeklySchedule)) {
    console.warn("Plano rejeitado: weeklySchedule inválido ou ausente");
    recordPlanRejection("weeklySchedule_invalido", {
      activityLevel: activityLevel || undefined,
      trainingDays,
    });
    return false;
  }
  if (plan.weeklySchedule.length !== trainingDays) {
    console.warn("Plano rejeitado: número de dias incompatível", {
      expected: trainingDays,
      received: plan.weeklySchedule.length,
    });
    recordPlanRejection("numero_dias_incompativel", {
      activityLevel: activityLevel || undefined,
      trainingDays,
      expected: trainingDays,
      received: plan.weeklySchedule.length,
    });
    return false;
  }

  // Validação de divisão × frequência (hard rule)
  if (!validateDivisionByFrequency(plan, trainingDays)) {
    console.warn("Plano rejeitado: divisão incompatível com frequência", {
      frequency: trainingDays,
    });
    recordPlanRejection("divisao_incompativel_frequencia", {
      activityLevel: activityLevel || undefined,
      trainingDays,
      frequency: trainingDays,
    });
    return false;
  }

  for (const day of plan.weeklySchedule) {
    if (!day.exercises?.length) {
      console.warn("Plano rejeitado: dia sem exercícios", {
        day: day.day,
        type: day.type,
      });
      recordPlanRejection("dia_sem_exercicios", {
        activityLevel: activityLevel || undefined,
        trainingDays,
        dayType: day.type,
        day: day.day,
      });
      return false;
    }

    // Validação de limite de exercícios por nível
    const level = activityLevel || "Moderado";
    if (!validateExercisesCountByLevel(day.exercises.length, level)) {
      console.warn("Plano rejeitado: excesso de exercícios por nível", {
        level,
        exercises: day.exercises.length,
        day: day.day,
        type: day.type,
      });
      recordPlanRejection("excesso_exercicios_nivel", {
        activityLevel: level,
        trainingDays,
        exerciseCount: day.exercises.length,
        dayType: day.type,
        day: day.day,
      });
      return false;
    }

    // Normalizar divisão (Legs -> Lower)
    const dayType = normalizeDivisionName(day.type || "");

    // MUSCLES ALLOWED BY DAY
    const allowed = {
      push: ["peitoral", "triceps", "ombros"],
      pull: ["costas", "biceps", "trapézio", "deltoide posterior", "ombros"],
      legs: ["quadriceps", "posterior de coxa", "gluteos", "panturrilhas"],
      lower: [
        "quadriceps",
        "posterior de coxa",
        "gluteos",
        "panturrilhas",
        "abdomen",
        "core",
      ],
      upper: ["peitoral", "triceps", "ombros", "costas", "biceps"],
      full: [
        "peitoral",
        "costas",
        "quadriceps",
        "posterior de coxa",
        "ombros",
        "biceps",
        "triceps",
        "abdomen",
        "core",
      ],
      shouldersarms: ["ombros", "biceps", "triceps"],
    };

    const allowedMuscles = allowed[dayType as keyof typeof allowed] || [];

    // Build primary muscle counts map (NOVO: conta apenas primaryMuscle)
    const primaryMuscleCounts = new Map<string, number>();
    for (const ex of day.exercises) {
      if (!ex.primaryMuscle) {
        rejectPlan(
          "exercicio_sem_primaryMuscle",
          {
            activityLevel: level,
            trainingDays,
            dayType,
            day: day.day,
            exercise: ex.name,
          },
          "exercício sem primaryMuscle",
          {
            exercise: ex.name,
            day: day.day,
            type: day.type,
          }
        );
        return false;
      }

      // Validate exercises - check if primary muscle is allowed for this day type
      const mg = normalize(ex.primaryMuscle);

      // If day type has specific allowed muscles, validate
      if (allowedMuscles.length > 0 && !allowedMuscles.includes(mg)) {
        // Special cases for strict validation
        if (dayType === "legs" || dayType === "lower") {
          // Legs/Lower cannot have upper body
          if (["peitoral", "costas", "biceps", "triceps"].includes(mg)) {
            rejectPlan(
              "grupo_muscular_proibido",
              {
                activityLevel: level,
                trainingDays,
                dayType,
                muscle: mg,
                day: day.day,
                exercise: ex.name,
              },
              "grupo muscular proibido no dia",
              {
                dayType,
                muscleGroup: mg,
                day: day.day,
                exercise: ex.name,
              }
            );
            return false;
          }
        } else if (dayType === "push") {
          // Push cannot have costas/biceps
          if (["costas", "biceps"].includes(mg)) {
            console.warn("Plano rejeitado: grupo muscular proibido no dia", {
              dayType,
              muscleGroup: mg,
              day: day.day,
              exercise: ex.name,
            });
            return false;
          }
        } else if (dayType === "pull") {
          // Pull cannot have peito/triceps
          if (["peitoral", "triceps"].includes(mg)) {
            console.warn("Plano rejeitado: grupo muscular proibido no dia", {
              dayType,
              muscleGroup: mg,
              day: day.day,
              exercise: ex.name,
            });
            return false;
          }
        } else if (dayType === "shouldersarms") {
          // Shoulders & Arms cannot have costas
          if (mg === "costas") {
            console.warn("Plano rejeitado: grupo muscular proibido no dia", {
              dayType,
              muscleGroup: mg,
              day: day.day,
              exercise: ex.name,
            });
            return false;
          }
        }
      }

      // Contar apenas primaryMuscle
      const primary = normalize(ex.primaryMuscle);
      primaryMuscleCounts.set(
        primary,
        (primaryMuscleCounts.get(primary) || 0) + 1
      );
    }

    // Validate Lower day requirements (usando primaryMuscle)
    if (dayType === "lower" || dayType === "legs") {
      const hasQuadriceps = primaryMuscleCounts.has("quadriceps");
      const hasPosterior = primaryMuscleCounts.has("posterior de coxa");
      const hasGluteos = primaryMuscleCounts.has("gluteos");
      const hasPanturrilhas = primaryMuscleCounts.has("panturrilhas");

      if (
        !hasQuadriceps ||
        !hasPosterior ||
        (!hasGluteos && !hasPanturrilhas)
      ) {
        rejectPlan(
          "lower_sem_grupos_obrigatorios",
          {
            activityLevel: level,
            trainingDays,
            dayType,
            day: day.day,
            hasQuadriceps,
            hasPosterior,
            hasGluteos,
            hasPanturrilhas,
          },
          "Lower day sem grupos obrigatórios",
          {
            day: day.day,
            hasQuadriceps,
            hasPosterior,
            hasGluteos,
            hasPanturrilhas,
          }
        );
        return false;
      }
    }

    // Validate Full Body day requirements (usando primaryMuscle)
    if (dayType === "full") {
      const hasPeitoral = primaryMuscleCounts.has("peitoral");
      const hasCostas = primaryMuscleCounts.has("costas");
      const hasPernas =
        primaryMuscleCounts.has("quadriceps") ||
        primaryMuscleCounts.has("posterior de coxa") ||
        primaryMuscleCounts.has("gluteos");
      const hasOmbros = primaryMuscleCounts.has("ombros");

      if (!hasPeitoral || !hasCostas || !hasPernas || !hasOmbros) {
        rejectPlan(
          "full_body_sem_grupos_obrigatorios",
          {
            activityLevel: level,
            trainingDays,
            dayType,
            day: day.day,
            hasPeitoral,
            hasCostas,
            hasPernas,
            hasOmbros,
          },
          "Full Body day sem grupos obrigatórios",
          {
            day: day.day,
            hasPeitoral,
            hasCostas,
            hasPernas,
            hasOmbros,
          }
        );
        return false;
      }
    }

    // Validação de grupos obrigatórios por divisão (usando primaryMuscle)
    const requiredGroupsByDivision: Record<string, string[]> = {
      push: ["peitoral", "ombros", "triceps"],
      pull: ["costas", "biceps"],
      legs: ["quadriceps", "posterior de coxa"],
      lower: ["quadriceps", "posterior de coxa"],
      upper: ["peitoral", "costas", "ombros"],
      full: ["peitoral", "costas"], // Pernas já validado acima
    };

    const requiredGroups = requiredGroupsByDivision[dayType];
    if (requiredGroups) {
      // Verificar se todos os grupos obrigatórios estão presentes
      for (const requiredGroup of requiredGroups) {
        if (!primaryMuscleCounts.has(normalize(requiredGroup))) {
          rejectPlan(
            "grupo_obrigatorio_ausente",
            {
              activityLevel: level,
              trainingDays,
              dayType,
              requiredGroup,
              day: day.day,
            },
            "grupo muscular obrigatório ausente",
            {
              dayType,
              requiredGroup,
              day: day.day,
            }
          );
          return false;
        }
      }
    }

    // Validação de ordem lógica dos exercícios
    if (!validateExerciseOrder(day)) {
      rejectPlan(
        "ordem_exercicios_invalida",
        {
          activityLevel: level,
          trainingDays,
          dayType,
          day: day.day,
        },
        "ordem de exercícios inválida",
        {
          day: day.day,
          type: day.type,
        }
      );
      return false;
    }

    // NOVA VALIDAÇÃO: Limite de exercícios por músculo primário (por nível)
    const maxPerMuscleByLevel: Record<string, number> = {
      idoso: 3,
      limitado: 3,
      iniciante: 4,
      moderado: 5,
      atleta: 6,
      atleta_altorendimento: 8,
    };

    const normalizedLevel = level
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "_")
      .replace("atleta_alto_rendimento", "atleta_altorendimento");

    const maxPerMuscle = maxPerMuscleByLevel[normalizedLevel] || 5;

    for (const [muscle, count] of primaryMuscleCounts) {
      if (count > maxPerMuscle) {
        rejectPlan(
          "excesso_exercicios_musculo_primario",
          {
            activityLevel: level,
            trainingDays,
            dayType,
            muscle,
            muscleCount: count,
            maxAllowed: maxPerMuscle,
            day: day.day,
          },
          "excesso de exercícios com mesmo músculo primário",
          {
            muscle,
            count,
            max: maxPerMuscle,
            level,
            day: day.day,
            type: day.type,
          }
        );
        return false;
      }
    }

    // NOVA VALIDAÇÃO: Distribuição inteligente por tipo de dia
    if (!validateMuscleDistribution(day, dayType)) {
      return false;
    }

    // NOVA VALIDAÇÃO: Validar secondaryMuscles (máximo 2)
    for (const ex of day.exercises) {
      if (ex.secondaryMuscles && ex.secondaryMuscles.length > 2) {
        rejectPlan(
          "secondaryMuscles_excede_limite",
          {
            activityLevel: level,
            trainingDays,
            dayType,
            exercise: ex.name,
            secondaryMusclesCount: ex.secondaryMuscles.length,
            day: day.day,
          },
          "secondaryMuscles excede limite de 2",
          {
            exercise: ex.name,
            secondaryMuscles: ex.secondaryMuscles.length,
            day: day.day,
          }
        );
        return false;
      }
    }

    // NOVA VALIDAÇÃO: Tempo de treino (se fornecido)
    if (availableTimeMinutes && availableTimeMinutes > 0) {
      if (!validateTrainingTime(day, availableTimeMinutes)) {
        // validateTrainingTime já registra a métrica internamente
        return false;
      }
    }
  }

  return true;
}
