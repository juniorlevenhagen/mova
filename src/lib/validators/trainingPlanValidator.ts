/**
 * Validador de Planos de Treino
 *
 * Funções e tipos para validação de planos de treino gerados pela IA.
 * Movido para arquivo separado para permitir uso em testes e outras partes do código.
 */

import { validateExercisesCountByLevel } from "@/lib/validators/exerciseCountValidator";
import { recordPlanRejection } from "@/lib/metrics/planRejectionMetrics";
import { recordPlanCorrection } from "@/lib/metrics/planCorrectionMetrics";
import { validateAdvancedRules } from "@/lib/validators/advancedPlanValidator";
import {
  getTrainingProfile,
  isValidRepsForProfile,
  isIsolationExercise,
} from "@/lib/profiles/trainingProfiles";

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

function isBig(muscle: string): boolean {
  const big = [
    "peitoral",
    "peito",
    "costas",
    "dorsal",
    "quadriceps",
    "posterior de coxa",
    "isquiotibiais",
    "gluteos",
    "glúteo",
    "glúteos",
  ];
  return big.includes(normalize(muscle));
}

function isMedium(muscle: string): boolean {
  const medium = ["ombros", "trapezio"];
  return medium.includes(normalize(muscle));
}

/**
 * Valida se a divisão do plano corresponde à frequência semanal
 */
function validateDivisionByFrequency(
  plan: TrainingPlan,
  trainingDays: number,
  activityLevel?: string | null
): boolean {
  const level = normalize(activityLevel || "moderado");
  const isAdvanced =
    level === "atleta" ||
    level === "avancado" ||
    level === "atleta_altorendimento";

  const expectedDivisionByFrequency: Record<number, string[]> = {
    2: ["full", "fullbody"],
    3: ["full", "fullbody"],
    4: ["upper", "lower"], // Upper/Lower
    5: isAdvanced
      ? ["push", "pull", "legs", "lower", "upper"]
      : ["push", "pull", "legs", "lower"], // PPL ou PPL+UL para atletas
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

  // Log para debug
  console.log("🔍 Validação de divisão:", {
    trainingDays,
    level,
    isAdvanced,
    expectedDivisions,
    usedDivisions: Array.from(usedDivisions),
    dayTypes: plan.weeklySchedule.map((d) => ({
      day: d.day,
      originalType: d.type,
      normalizedType: normalizeDivisionName(d.type || ""),
    })),
  });

  // Verificar se todas as divisões usadas são esperadas
  for (const division of usedDivisions) {
    if (!expectedDivisions.includes(division)) {
      console.warn("❌ Divisão não esperada:", {
        division,
        expectedDivisions,
        usedDivisions: Array.from(usedDivisions),
      });
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
    // 5x+ deve ter Push, Pull e Legs/Lower (e opcionalmente Upper para 5x atletas)
    const hasPush = usedDivisions.has("push");
    const hasPull = usedDivisions.has("pull");
    const hasLegs = usedDivisions.has("lower") || usedDivisions.has("legs");

    // Se for 5x e não tiver a tríade PPL básica, pode ser que tenha Upper/Lower misturado se for avançado
    if (!hasPush || !hasPull || !hasLegs) {
      if (trainingDays === 5 && isAdvanced) {
        // Para atletas 5x, permitimos PPL + UL
        const hasUpper = usedDivisions.has("upper");
        if (hasUpper && (hasPush || hasPull || hasLegs)) return true;
      }
      return false;
    }
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
    const hasPeitoral =
      primaryMuscleCounts.has("peitoral") || primaryMuscleCounts.has("peito");
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
    const bicepsCount =
      primaryMuscleCounts.get("biceps") ||
      primaryMuscleCounts.get("bíceps") ||
      0;
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
      typeof ex.sets === "number"
        ? ex.sets
        : parseInt(ex.sets as unknown as string, 10) || 3;

    // Parsear rest (ex: "60s", "90s", "2min", "90-120s" → pega primeiro número)
    let restSeconds = 60; // default
    const restStr = ex.rest?.toLowerCase() || "60s";
    if (restStr.includes("min")) {
      restSeconds = parseInt(restStr, 10) * 60;
    } else if (restStr.includes("s")) {
      // Pegar primeiro número (ex: "90-120s" → 90)
      const match = restStr.match(/(\d+)/);
      restSeconds = match ? parseInt(match[1], 10) : 60;
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
    }).catch(() => {});
    return false;
  }

  return true;
}

/**
 * Valida se o nome do exercício corresponde ao primaryMuscle atribuído
 * Rejeita correspondências incorretas conhecidas (ex: "Elevação de panturrilha" com primaryMuscle "ombros")
 */
function validateExerciseMuscleMatch(exercise: Exercise): boolean {
  const name = normalize(exercise.name);
  const primary = normalize(exercise.primaryMuscle);

  // ❌ Correspondências incorretas conhecidas (exercício × músculo)
  const invalidMatches: Array<{
    exercisePattern: string[];
    invalidMuscle: string[];
  }> = [
    // Panturrilha nunca pode ser ombros
    {
      exercisePattern: ["panturrilha"],
      invalidMuscle: ["ombros", "ombro", "deltoide", "deltoides"],
    },
    // Remada nunca pode ser ombros como primário
    {
      exercisePattern: ["remada", "remado"],
      invalidMuscle: ["ombros", "ombro", "deltoide", "deltoides"],
    },
    // Exercícios de pernas nunca podem ser braços
    // ⚠️ IMPORTANTE: "flexão de braços" (push-up) é válido para peitoral!
    // Apenas bloquear flexões de PERNAS (flexão de joelhos, flexão de pernas)
    {
      exercisePattern: [
        "agachamento",
        "leg press",
        "extensao",
        "extensão",
        "flexao de pernas",
        "flexão de pernas",
        "flexao de joelhos",
        "flexão de joelhos",
        "pernas",
        "perna",
      ],
      invalidMuscle: [
        "ombros",
        "ombro",
        "biceps",
        "bíceps",
        "triceps",
        "tríceps",
        "peitoral",
        "peito",
        "costas",
        "dorsal",
      ],
    },
    // Exercícios de braços nunca podem ser pernas
    {
      exercisePattern: [
        "supino",
        "desenvolvimento",
        "elevacao lateral",
        "elevação lateral",
        "crucifixo",
      ],
      invalidMuscle: [
        "quadriceps",
        "quadríceps",
        "posterior",
        "gluteos",
        "glúteos",
        "panturrilhas",
        "panturrilha",
      ],
    },
    // Elevação de panturrilha especificamente
    {
      exercisePattern: ["panturrilha"],
      invalidMuscle: [
        "ombros",
        "ombro",
        "deltoide",
        "deltoides",
        "peitoral",
        "costas",
        "biceps",
        "bíceps",
        "triceps",
        "tríceps",
      ],
    },
  ];

  // Verificar cada regra de correspondência inválida
  for (const rule of invalidMatches) {
    const matchesExercisePattern = rule.exercisePattern.some((pattern) =>
      name.includes(pattern)
    );
    const matchesInvalidMuscle = rule.invalidMuscle.some((muscle) =>
      primary.includes(muscle)
    );

    if (matchesExercisePattern && matchesInvalidMuscle) {
      return false; // Correspondência inválida detectada
    }
  }

  return true; // Correspondência válida ou não detectada como inválida
}

/**
 * Valida a ordem lógica dos grupos musculares nos exercícios
 */
function validateExerciseOrder(day: TrainingDay): boolean {
  const dayType = normalizeDivisionName(day.type || "");

  // Ordem esperada por divisão (grupos grandes antes de pequenos)
  const expectedOrderByDivision: Record<string, string[][]> = {
    push: [["peitoral", "peito"], ["ombros"], ["triceps", "tríceps"]],
    pull: [
      ["costas", "dorsal"],
      ["biceps", "bíceps"],
    ],
    lower: [
      ["quadriceps", "quadríceps"],
      ["posterior de coxa", "isquiotibiais"],
      ["gluteos", "glúteos", "panturrilhas"],
    ],
    legs: [
      ["quadriceps", "quadríceps"],
      ["posterior de coxa", "isquiotibiais"],
      ["gluteos", "glúteos", "panturrilhas"],
    ],
    upper: [
      ["peitoral", "peito", "costas", "dorsal"],
      ["ombros"],
      ["biceps", "bíceps", "triceps", "tríceps"],
    ],
    full: [
      ["peitoral", "peito", "costas", "dorsal"],
      [
        "quadriceps",
        "quadríceps",
        "posterior de coxa",
        "isquiotibiais",
        "gluteos",
        "glúteos",
      ],
      ["ombros"],
      ["biceps", "bíceps", "triceps", "tríceps"],
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
        // Ordem incorreta: aplicar correção automática reagrupando os exercícios
        const reordered: typeof day.exercises = [];
        const used = new Set<number>();

        // Adicionar em ordem esperada
        for (const groupSetInner of expectedOrder) {
          for (let i = 0; i < day.exercises.length; i++) {
            if (used.has(i)) continue;
            const ex = day.exercises[i];
            const primary = primaryGroup(ex);
            if (!primary) continue;
            const normalized = normalize(primary);
            if (groupSetInner.some((g) => normalize(g) === normalized)) {
              reordered.push(ex);
              used.add(i);
            }
          }
        }

        // Adicionar qualquer exercício restante que não casou (fallback)
        for (let i = 0; i < day.exercises.length; i++) {
          if (!used.has(i)) {
            reordered.push(day.exercises[i]);
          }
        }

        day.exercises = reordered;
        return true;
      }
      lastGroupIndex = currentGroupIndex;
    }
  }

  return true;
}

/**
 * Valida se treinos do mesmo tipo têm os mesmos exercícios
 * Quando Push A e Push D existem, devem ter exatamente os mesmos exercícios
 */
function validateSameTypeDaysHaveSameExercises(plan: TrainingPlan): boolean {
  if (!plan?.weeklySchedule) return true;

  // Agrupar dias por tipo
  const daysByType = new Map<string, TrainingDay[]>();
  for (const day of plan.weeklySchedule) {
    const dayType = normalizeDivisionName(day.type || "");
    if (!daysByType.has(dayType)) {
      daysByType.set(dayType, []);
    }
    daysByType.get(dayType)!.push(day);
  }

  // Para cada tipo que aparece múltiplas vezes, verificar se os exercícios são iguais
  for (const [dayType, days] of daysByType.entries()) {
    if (days.length <= 1) continue; // Apenas tipos que aparecem 2+ vezes

    // Comparar o primeiro dia com todos os outros
    const firstDay = days[0];
    const firstDayExercises = firstDay.exercises.map((ex) => ({
      name: normalize(ex.name),
      sets: ex.sets,
      reps: ex.reps,
      rest: ex.rest,
    }));

    for (let i = 1; i < days.length; i++) {
      const currentDay = days[i];
      const currentDayExercises = currentDay.exercises.map((ex) => ({
        name: normalize(ex.name),
        sets: ex.sets,
        reps: ex.reps,
        rest: ex.rest,
      }));

      // Verificar se têm o mesmo número de exercícios
      if (firstDayExercises.length !== currentDayExercises.length) {
        console.warn(
          `Plano rejeitado: dias do mesmo tipo (${dayType}) têm número diferente de exercícios`,
          {
            firstDay: firstDay.day,
            currentDay: currentDay.day,
            firstCount: firstDayExercises.length,
            currentCount: currentDayExercises.length,
          }
        );
        recordPlanRejection("dias_mesmo_tipo_exercicios_diferentes", {
          dayType,
          firstDay: firstDay.day,
          currentDay: currentDay.day,
          firstCount: firstDayExercises.length,
          currentCount: currentDayExercises.length,
        }).catch(() => {});
        return false;
      }

      // Verificar se os exercícios são os mesmos (mesmo nome, séries, reps, descanso)
      for (let j = 0; j < firstDayExercises.length; j++) {
        const firstEx = firstDayExercises[j];
        const currentEx = currentDayExercises[j];

        if (
          firstEx.name !== currentEx.name ||
          firstEx.sets !== currentEx.sets ||
          firstEx.reps !== currentEx.reps ||
          firstEx.rest !== currentEx.rest
        ) {
          console.warn(
            `Plano rejeitado: dias do mesmo tipo (${dayType}) têm exercícios diferentes`,
            {
              firstDay: firstDay.day,
              currentDay: currentDay.day,
              exerciseIndex: j,
              firstExercise: firstEx,
              currentExercise: currentEx,
            }
          );
          recordPlanRejection("dias_mesmo_tipo_exercicios_diferentes", {
            dayType,
            firstDay: firstDay.day,
            currentDay: currentDay.day,
            exerciseIndex: j,
            firstExercise: firstEx.name,
            currentExercise: currentEx.name,
          }).catch(() => {});
          return false;
        }
      }
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

/**
 * Ajusta séries semanais para respeitar limites antes da validação.
 * Versão simplificada do ajuste usado no gerador, aplicada a qualquer plano.
 */
function adjustWeeklySeriesForValidation(
  plan: TrainingPlan | null,
  activityLevel?: string | null
): TrainingPlan | null {
  if (!plan?.weeklySchedule) return plan;

  const profile = getTrainingProfile(activityLevel);
  const normalizeMuscleLocal = (muscle: string): string => {
    const normalized = normalize(muscle);
    if (normalized.includes("peito") || normalized.includes("peitoral"))
      return "peito";
    if (normalized.includes("costas") || normalized.includes("dorsal"))
      return "costas";
    if (normalized.includes("quadriceps") || normalized.includes("quadríceps"))
      return "quadriceps";
    if (
      normalized.includes("posterior") ||
      normalized.includes("isquiotibiais")
    )
      return "posterior";
    if (
      normalized.includes("ombro") ||
      normalized.includes("ombros") ||
      normalized.includes("deltoide")
    )
      return "ombro";
    if (normalized.includes("triceps") || normalized.includes("tríceps"))
      return "triceps";
    if (normalized.includes("biceps") || normalized.includes("bíceps"))
      return "biceps";
    if (normalized.includes("gluteo") || normalized.includes("glúteo"))
      return "gluteos";
    if (normalized.includes("panturrilha")) return "panturrilhas";
    return normalized;
  };
  const weeklyLimits: Record<string, number> = {
    peito: profile.weeklySets.large,
    costas: profile.weeklySets.large,
    quadriceps: profile.weeklySets.large,
    posterior: Math.floor(profile.weeklySets.large * 0.8),
    ombro: profile.weeklySets.small,
    triceps: profile.weeklySets.small,
    biceps: profile.weeklySets.small,
    gluteos: Math.floor(profile.weeklySets.large * 0.6),
    panturrilhas: Math.floor(profile.weeklySets.small * 0.5),
  };

  // Passo 1: coletar séries e posições de exercícios
  const weeklySeries = new Map<string, number>();
  const muscleExercises = new Map<
    string,
    Array<{ dayIndex: number; exerciseIndex: number }>
  >();

  for (let dayIndex = 0; dayIndex < plan.weeklySchedule.length; dayIndex++) {
    const day = plan.weeklySchedule[dayIndex];
    for (
      let exerciseIndex = 0;
      exerciseIndex < day.exercises.length;
      exerciseIndex++
    ) {
      const exercise = day.exercises[exerciseIndex];
      const muscle = normalizeMuscleLocal(exercise.primaryMuscle);
      const sets =
        typeof exercise.sets === "number"
          ? exercise.sets
          : parseInt(String(exercise.sets), 10) || 0;

      const current = weeklySeries.get(muscle) || 0;
      weeklySeries.set(muscle, current + sets);

      if (!muscleExercises.has(muscle)) {
        muscleExercises.set(muscle, []);
      }
      muscleExercises.get(muscle)!.push({ dayIndex, exerciseIndex });
    }
  }

  let adjustedPlan = plan;
  for (const [muscle, totalSeries] of weeklySeries) {
    const limit = weeklyLimits[muscle];
    if (!limit || totalSeries <= limit) continue;

    // Deep copy para não mutar o plano original
    if (adjustedPlan === plan) {
      adjustedPlan = JSON.parse(JSON.stringify(plan)) as TrainingPlan;
    }

    const reductionFactor = limit / totalSeries;
    const exercises = muscleExercises.get(muscle) || [];

    for (const { dayIndex, exerciseIndex } of exercises) {
      const exercise =
        adjustedPlan.weeklySchedule[dayIndex].exercises[exerciseIndex];
      const currentSets =
        typeof exercise.sets === "number"
          ? exercise.sets
          : parseInt(String(exercise.sets), 10) || 0;

      const newSets = Math.max(2, Math.round(currentSets * reductionFactor));
      exercise.sets = newSets;
    }
  }

  // Passo 2: validação final — se ainda exceder, clamp direto
  if (adjustedPlan !== plan) {
    const checkSeries = new Map<string, number>();
    for (const day of adjustedPlan.weeklySchedule) {
      for (const ex of day.exercises) {
        const muscle = normalizeMuscleLocal(ex.primaryMuscle);
        const sets =
          typeof ex.sets === "number"
            ? ex.sets
            : parseInt(String(ex.sets), 10) || 0;
        checkSeries.set(muscle, (checkSeries.get(muscle) || 0) + sets);
      }
    }
    for (const [muscle, totalSeries] of checkSeries) {
      const limit = weeklyLimits[muscle];
      if (!limit || totalSeries <= limit) continue;
      const factor = limit / totalSeries;
      for (const { dayIndex, exerciseIndex } of muscleExercises.get(muscle) ||
        []) {
        const exercise =
          adjustedPlan.weeklySchedule[dayIndex].exercises[exerciseIndex];
        const currentSets =
          typeof exercise.sets === "number"
            ? exercise.sets
            : parseInt(String(exercise.sets), 10) || 0;
        exercise.sets = Math.max(1, Math.round(currentSets * factor));
      }
    }
  }

  return adjustedPlan;
}

/* --------------------------------------------------------
   CORREÇÃO AUTOMÁTICA DE PLANOS
-------------------------------------------------------- */

/**
 * Corrige automaticamente um plano de treino para garantir que dias do mesmo tipo
 * tenham os mesmos exercícios, séries, reps e descanso.
 *
 * Esta função é chamada APÓS a geração para garantir consistência, evitando
 * rejeições e regenerações desnecessárias.
 *
 * @param plan - Plano de treino a ser corrigido
 * @returns Plano corrigido e flag indicando se houve correção
 */
export function correctSameTypeDaysExercises(plan: TrainingPlan): {
  plan: TrainingPlan;
  wasCorrected: boolean;
} {
  if (!plan?.weeklySchedule || !Array.isArray(plan.weeklySchedule)) {
    return { plan, wasCorrected: false };
  }

  let wasCorrected = false;
  const correctedSchedule = [...plan.weeklySchedule];

  // Agrupar dias por tipo
  const daysByType = new Map<string, TrainingDay[]>();
  for (let i = 0; i < correctedSchedule.length; i++) {
    const day = correctedSchedule[i];
    const dayType = normalizeDivisionName(day.type || "");
    if (!daysByType.has(dayType)) {
      daysByType.set(dayType, []);
    }
    daysByType.get(dayType)!.push(day);
  }

  // Para cada tipo que tem mais de 1 dia, copiar exercícios do primeiro para os demais
  for (const [dayType, days] of daysByType.entries()) {
    if (days.length > 1) {
      const firstDay = days[0];
      const firstDayExercises = firstDay.exercises;

      // Verificar se os dias já estão corretos
      let needsCorrection = false;
      for (let i = 1; i < days.length; i++) {
        const currentDay = days[i];
        const currentDayExercises = currentDay.exercises;

        // Comparar exercícios (nome, séries, reps, descanso)
        if (
          firstDayExercises.length !== currentDayExercises.length ||
          !firstDayExercises.every((ex, idx) => {
            const currentEx = currentDayExercises[idx];
            return (
              ex.name === currentEx.name &&
              ex.sets === currentEx.sets &&
              ex.reps === currentEx.reps &&
              ex.rest === currentEx.rest
            );
          })
        ) {
          needsCorrection = true;
          break;
        }
      }

      // Se precisa corrigir, copiar exercícios do primeiro dia para os demais
      if (needsCorrection) {
        wasCorrected = true;
        for (let i = 1; i < days.length; i++) {
          const currentDay = days[i];
          // Criar cópia profunda dos exercícios
          currentDay.exercises = firstDayExercises.map((ex) => ({
            ...ex,
            secondaryMuscles: ex.secondaryMuscles
              ? [...ex.secondaryMuscles]
              : undefined,
          }));

          console.log(
            `🔧 Correção automática: ${currentDay.day} agora tem os mesmos exercícios de ${firstDay.day} (tipo: ${dayType})`
          );
        }
      }
    }
  }

  return {
    plan: {
      ...plan,
      weeklySchedule: correctedSchedule,
    },
    wasCorrected,
  };
}

/* --------------------------------------------------------
   VALIDAÇÃO FLEXÍVEL E TIPADA
-------------------------------------------------------- */
export function isTrainingPlanUsable(
  plan: TrainingPlan | null,
  trainingDays: number,
  activityLevel?: string | null,
  availableTimeMinutes?: number,
  context?: {
    imc?: number;
    gender?: string;
    age?: number;
    objective?: string; // Novo: objetivo para validação de déficit calórico
  }
): boolean {
  // Ajustar séries para respeitar limites semanais antes de validar
  const planForValidation = adjustWeeklySeriesForValidation(
    plan,
    activityLevel
  );

  if (
    !planForValidation?.weeklySchedule ||
    !Array.isArray(planForValidation.weeklySchedule)
  ) {
    console.warn("Plano rejeitado: weeklySchedule inválido ou ausente");
    recordPlanRejection("weeklySchedule_invalido", {
      activityLevel: activityLevel || undefined,
      trainingDays,
    }).catch(() => {});
    return false;
  }
  if (planForValidation.weeklySchedule.length !== trainingDays) {
    console.warn("Plano rejeitado: número de dias incompatível", {
      expected: trainingDays,
      received: planForValidation.weeklySchedule.length,
    });
    recordPlanRejection("numero_dias_incompativel", {
      activityLevel: activityLevel || undefined,
      trainingDays,
      expected: trainingDays,
      received: planForValidation.weeklySchedule.length,
    }).catch(() => {});
    return false;
  }

  // Validação de divisão × frequência (hard rule)
  if (
    !validateDivisionByFrequency(planForValidation, trainingDays, activityLevel)
  ) {
    console.warn("Plano rejeitado: divisão incompatível com frequência", {
      frequency: trainingDays,
      level: activityLevel,
    });
    recordPlanRejection("divisao_incompativel_frequencia", {
      activityLevel: activityLevel || undefined,
      trainingDays,
      frequency: trainingDays,
    }).catch(() => {});
    return false;
  }

  // Validação: dias do mesmo tipo devem ter os mesmos exercícios
  if (!validateSameTypeDaysHaveSameExercises(planForValidation)) {
    return false; // A função já registra a rejeição
  }

  // ✅ NOVAS VALIDAÇÕES AVANÇADAS (antes das validações por dia)
  // 1. Séries semanais por grupamento
  // 2. Padrões motores repetidos
  // 3. Compatibilidade com déficit calórico
  // 4. Frequência × Volume
  if (
    !validateAdvancedRules(
      planForValidation,
      trainingDays,
      activityLevel,
      context?.objective,
      context?.imc
    )
  ) {
    return false; // A função já registra a rejeição
  }

  // Detectar ajuste técnico de divisão (ex: PPL+UL para Atleta 5x)
  const usedDivisions = new Set(
    planForValidation.weeklySchedule.map((d) =>
      normalizeDivisionName(d.type || "")
    )
  );
  if (trainingDays === 5 && usedDivisions.has("upper")) {
    recordPlanCorrection(
      {
        reason: "divisao_ajustada_tecnica",
        data: {
          originalDivision: "PPL Clássico",
          correctedDivision: "PPL + Upper/Lower",
          trainingDays: 5,
        },
      },
      {
        imc: 0,
        gender: "N/A",
        activityLevel: activityLevel || "Moderado",
        age: 0,
      }
    ).catch(() => {});
  }

  // NOVA VALIDAÇÃO: Proibir linguagem de viés estético (Neutralidade técnica)
  const forbiddenTerms = [
    "foco em gluteos",
    "foco em glúteos",
    "treino feminino",
    "obrigatorio para mulher",
    "obrigatório para mulher",
  ];
  const allText = (
    planForValidation.overview +
    planForValidation.progression +
    planForValidation.weeklySchedule
      .map((d) => d.exercises.map((e) => e.notes || "").join(" "))
      .join(" ")
  ).toLowerCase();

  for (const term of forbiddenTerms) {
    if (allText.includes(term)) {
      console.warn("Plano rejeitado: viés estético detectado", { term });
      recordPlanRejection("vies_estetico_detectado", {
        activityLevel: activityLevel || undefined,
        trainingDays,
        term,
      }).catch(() => {});
      return false;
    }
  }

  for (const day of planForValidation.weeklySchedule) {
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
      }).catch(() => {});
      return false;
    }

    // Validação de limite de exercícios por nível (usando perfis)
    const level = activityLevel || "Moderado";
    const profile = getTrainingProfile(level);
    const normalizedLevel = level
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "_")
      .replace("atleta_alto_rendimento", "atleta_altorendimento");

    // Validar número máximo de exercícios por sessão (usando perfil)
    if (day.exercises.length > profile.maxExercisesPerSession) {
      console.warn("Plano rejeitado: excesso de exercícios por sessão", {
        level,
        exercises: day.exercises.length,
        maxAllowed: profile.maxExercisesPerSession,
        day: day.day,
        type: day.type,
      });
      recordPlanRejection("excesso_exercicios_sessao", {
        activityLevel: level,
        trainingDays,
        exerciseCount: day.exercises.length,
        maxAllowed: profile.maxExercisesPerSession,
        dayType: day.type,
        day: day.day,
      }).catch(() => {});
      return false;
    }

    // Validação de reps por exercício (usando perfil)
    let lowRepCount = 0; // Contador de exercícios com reps baixas (3-5)
    for (const exercise of day.exercises) {
      // Validar se as reps estão dentro dos limites do perfil
      if (!isValidRepsForProfile(exercise.reps, profile)) {
        console.warn("Plano rejeitado: reps fora dos limites do perfil", {
          level,
          exercise: exercise.name,
          reps: exercise.reps,
          minReps: profile.minReps,
          maxReps: profile.maxReps,
          lowRepAllowed: profile.lowRepAllowed,
          day: day.day,
        });
        recordPlanRejection("reps_fora_limites_perfil", {
          activityLevel: level,
          trainingDays,
          exercise: exercise.name,
          reps: exercise.reps,
          minReps: profile.minReps,
          maxReps: profile.maxReps,
          day: day.day,
        }).catch(() => {});
        return false;
      }

      // Contar exercícios com reps baixas (3-5)
      const repsMatch = exercise.reps.match(/(\d+)(?:-(\d+))?/);
      if (repsMatch) {
        const minRep = parseInt(repsMatch[1]);
        if (minRep <= 5) {
          lowRepCount++;

          // Validar se isoladores podem ter reps baixas
          if (isIsolationExercise(exercise.name) && minRep <= 5) {
            // Isoladores nunca devem ter reps baixas (3-5)
            console.warn("Plano rejeitado: isolador com reps baixas", {
              level,
              exercise: exercise.name,
              reps: exercise.reps,
              day: day.day,
            });
            recordPlanRejection("isolador_com_reps_baixas", {
              activityLevel: level,
              trainingDays,
              exercise: exercise.name,
              reps: exercise.reps,
              day: day.day,
            }).catch(() => {});
            return false;
          }
        }
      }
    }

    // Validar limite de exercícios com reps baixas
    if (
      profile.maxLowRepExercises !== undefined &&
      lowRepCount > profile.maxLowRepExercises
    ) {
      console.warn("Plano rejeitado: excesso de exercícios com reps baixas", {
        level,
        lowRepCount,
        maxAllowed: profile.maxLowRepExercises,
        day: day.day,
      });
      recordPlanRejection("excesso_exercicios_reps_baixas", {
        activityLevel: level,
        trainingDays,
        lowRepCount,
        maxAllowed: profile.maxLowRepExercises,
        day: day.day,
      }).catch(() => {});
      return false;
    }

    // Normalizar divisão (Legs -> Lower)
    const dayType = normalizeDivisionName(day.type || "");

    // MUSCLES ALLOWED BY DAY
    const allowed = {
      push: ["peitoral", "peito", "triceps", "tríceps", "ombros"],
      pull: [
        "costas",
        "dorsal",
        "biceps",
        "bíceps",
        "trapézio",
        "deltoide posterior",
        "ombros",
      ],
      legs: [
        "quadriceps",
        "quadríceps",
        "posterior de coxa",
        "isquiotibiais",
        "gluteos",
        "glúteos",
        "panturrilhas",
      ],
      lower: [
        "quadriceps",
        "quadríceps",
        "posterior de coxa",
        "isquiotibiais",
        "gluteos",
        "glúteos",
        "panturrilhas",
        "abdomen",
        "core",
      ],
      upper: [
        "peitoral",
        "peito",
        "triceps",
        "tríceps",
        "ombros",
        "costas",
        "dorsal",
        "biceps",
        "bíceps",
      ],
      full: [
        "peitoral",
        "peito",
        "costas",
        "dorsal",
        "quadriceps",
        "quadríceps",
        "posterior de coxa",
        "isquiotibiais",
        "ombros",
        "biceps",
        "bíceps",
        "triceps",
        "tríceps",
        "abdomen",
        "core",
        "gluteos",
        "glúteos",
      ],
      shouldersarms: ["ombros", "biceps", "bíceps", "triceps", "tríceps"],
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
          if (
            [
              "peitoral",
              "peito",
              "costas",
              "dorsal",
              "biceps",
              "bíceps",
              "triceps",
              "tríceps",
            ].includes(mg)
          ) {
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
          if (["costas", "dorsal", "biceps", "bíceps"].includes(mg)) {
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
          if (["peitoral", "peito", "triceps", "tríceps"].includes(mg)) {
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
          if (mg === "costas" || mg === "dorsal") {
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
      const hasQuadriceps =
        primaryMuscleCounts.has("quadriceps") ||
        primaryMuscleCounts.has("quadríceps");
      const hasPosterior =
        primaryMuscleCounts.has("posterior de coxa") ||
        primaryMuscleCounts.has("isquiotibiais");
      const hasGluteos =
        primaryMuscleCounts.has("gluteos") ||
        primaryMuscleCounts.has("glúteos");
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
      const hasPeitoral =
        primaryMuscleCounts.has("peitoral") || primaryMuscleCounts.has("peito");
      const hasCostas =
        primaryMuscleCounts.has("costas") || primaryMuscleCounts.has("dorsal");
      const hasPernas =
        primaryMuscleCounts.has("quadriceps") ||
        primaryMuscleCounts.has("quadríceps") ||
        primaryMuscleCounts.has("posterior de coxa") ||
        primaryMuscleCounts.has("isquiotibiais") ||
        primaryMuscleCounts.has("gluteos") ||
        primaryMuscleCounts.has("glúteos");
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
    // ⚠️ IMPORTANTE: Push NÃO deve ter ombros (regra: evitar peito + ombros no mesmo dia)
    const requiredGroupsByDivision: Record<string, string[]> = {
      push: ["peito", "triceps"], // Ombros removidos - devem estar no Pull
      pull: ["costas", "biceps"], // Ombros podem estar aqui (posterior de ombro)
      legs: ["quadriceps", "posterior de coxa"],
      lower: ["quadriceps", "posterior de coxa"],
      upper: ["peito", "costas", "ombros"],
      full: ["peito", "costas"], // Pernas já validado acima
    };

    const requiredGroups = requiredGroupsByDivision[dayType];
    if (requiredGroups) {
      // Verificar se todos os grupos obrigatórios estão presentes
      for (const requiredGroup of requiredGroups) {
        const normalizedRequired = normalize(requiredGroup);
        // Permitir variações peito/peitoral, costas/dorsal, etc.
        let found = primaryMuscleCounts.has(normalizedRequired);
        if (!found && normalizedRequired === "peito")
          found = primaryMuscleCounts.has("peitoral");
        if (!found && normalizedRequired === "peitoral")
          found = primaryMuscleCounts.has("peito");
        if (!found && normalizedRequired === "costas")
          found = primaryMuscleCounts.has("dorsal");
        if (!found && normalizedRequired === "dorsal")
          found = primaryMuscleCounts.has("costas");
        if (!found && normalizedRequired === "triceps")
          found = primaryMuscleCounts.has("tríceps");
        if (!found && normalizedRequired === "tríceps")
          found = primaryMuscleCounts.has("triceps");
        if (!found && normalizedRequired === "biceps")
          found = primaryMuscleCounts.has("bíceps");
        if (!found && normalizedRequired === "bíceps")
          found = primaryMuscleCounts.has("biceps");
        if (!found && normalizedRequired === "quadriceps")
          found = primaryMuscleCounts.has("quadríceps");
        if (!found && normalizedRequired === "quadríceps")
          found = primaryMuscleCounts.has("quadriceps");
        if (!found && normalizedRequired === "posterior de coxa")
          found = primaryMuscleCounts.has("isquiotibiais");
        if (!found && normalizedRequired === "isquiotibiais")
          found = primaryMuscleCounts.has("posterior de coxa");

        if (!found) {
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

    // Validação de correspondência exercício × músculo primário
    for (const exercise of day.exercises) {
      if (!validateExerciseMuscleMatch(exercise)) {
        rejectPlan(
          "exercicio_musculo_incompativel",
          {
            activityLevel: level,
            trainingDays,
            dayType,
            day: day.day,
            exerciseName: exercise.name,
            primaryMuscle: exercise.primaryMuscle,
          },
          "exercício com músculo primário incompatível",
          {
            day: day.day,
            exerciseName: exercise.name,
            primaryMuscle: exercise.primaryMuscle,
          }
        );
        return false;
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

    // NOVA VALIDAÇÃO: Volume mínimo por grupo muscular (Piso Técnico)
    for (const [muscle, count] of primaryMuscleCounts) {
      let minRequired = 1;
      let muscleCategory = "pequeno";
      const isAdvanced =
        normalizedLevel === "atleta" ||
        normalizedLevel === "atleta_altorendimento" ||
        normalizedLevel === "avancado";
      const isBeginner =
        normalizedLevel === "iniciante" ||
        normalizedLevel === "idoso" ||
        normalizedLevel === "limitado";

      if (isBig(muscle)) {
        muscleCategory = "grande";
        // Piso técnico dinâmico para grupos grandes
        const isFocusDay = ["push", "pull", "legs", "lower"].includes(dayType);
        const isUpperDay = dayType === "upper";

        if (isBeginner) {
          minRequired = 2;
          // Exceção Full Body Iniciante: permite 1
          if (dayType === "full") minRequired = 1;
        } else if (isAdvanced) {
          // Para dias focados (Push, Pull, Legs): mínimo 4-5
          // Para Upper: mínimo 3 (compartilha espaço com outros grupos)
          // Para Full Body: mínimo 2
          if (isFocusDay) {
            minRequired = 4; // Reduzido de 5 para 4 para ser mais realista
          } else if (isUpperDay) {
            minRequired = 3; // Upper compartilha espaço
          } else if (dayType === "full") {
            minRequired = 2;
          } else {
            minRequired = 3;
          }
        } else {
          // Moderado/Intermediário
          minRequired = isFocusDay ? 3 : 2;
          if (isUpperDay) minRequired = 2; // Upper compartilha espaço
        }
      } else if (isMedium(muscle)) {
        muscleCategory = "médio";
        // Piso técnico para grupos médios
        const isUpperDay = dayType === "upper";
        const isFullBody = dayType === "full";

        if (isAdvanced) {
          // Para dias focados: mínimo 2-3
          // Para Upper/Full Body: mínimo 1-2 (compartilha espaço)
          if (isUpperDay || isFullBody) {
            minRequired = 1; // Upper e Full Body compartilham espaço
          } else {
            minRequired = 2; // Reduzido de 3 para 2 para ser mais realista
          }
        } else {
          minRequired = 2;
          // Em treinos muito densos (Full/Upper), permitimos 1
          if (isFullBody || isUpperDay) minRequired = 1;
        }
      }

      if (count < minRequired) {
        // Decisão técnica automática: Se estiver perto do mínimo, aceitamos mas registramos correção.
        // Se estiver muito longe (ex: 1 exercício para grupo grande em atleta), rejeitamos.
        const isWayTooLow = isBig(muscle) && count <= 1;

        if (isWayTooLow) {
          rejectPlan(
            "volume_insuficiente_critico",
            {
              activityLevel: level,
              trainingDays,
              dayType,
              muscle,
              count,
              minRequired,
              day: day.day,
            },
            `Volume insuficiente crítico para grupo ${muscleCategory} (${muscle}): ${count}/${minRequired}`,
            { muscle, count, minRequired, day: day.day }
          );
          return false;
        }

        // Caso contrário, permitimos a decisão técnica automática e registramos a correção
        if (context) {
          recordPlanCorrection(
            {
              reason: "ajuste_volume_minimo_obrigatorio",
              data: {
                muscle,
                category: muscleCategory,
                count,
                minRequired,
                day: day.day,
              },
            },
            {
              imc: context.imc || 0,
              gender: context.gender || "Não informado",
              activityLevel: level,
              age: context.age || 0,
            }
          ).catch(() => {});
        }
      }
    }

    // NOVA VALIDAÇÃO: Limite de exercícios por músculo primário (usando perfil)
    const maxPerMuscle = profile.maxExercisesPerMuscle;

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
