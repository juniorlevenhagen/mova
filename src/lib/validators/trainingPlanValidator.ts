/**
 * Validador de Planos de Treino
 *
 * Funções e tipos para validação de planos de treino gerados pela IA.
 * Movido para arquivo separado para permitir uso em testes e outras partes do código.
 */

import { recordPlanRejection } from "@/lib/metrics/planRejectionMetrics";
import { recordPlanCorrection } from "@/lib/metrics/planCorrectionMetrics";
import {
  validateAdvancedRules,
  getWeeklySeriesLimits,
} from "@/lib/validators/advancedPlanValidator";
import {
  getTrainingProfile,
  isValidRepsForProfile,
  isIsolationExercise,
} from "@/lib/profiles/trainingProfiles";
import { TRAINING_PLAN_CONFIG } from "@/lib/config";

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
  // Aceitar "full body" (com espaço) como "fullbody"
  if (normalized === "full body") return "fullbody";
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
 * Detecta nível de risco de um exercício baseado no nome
 * - high: Exercícios estruturais pesados (deadlift, clean, snatch)
 * - moderate: Agachamentos, desenvolvimentos
 * - low: Isolados e máquinas
 */
function getExerciseRiskLevel(
  exerciseName: string
): "low" | "moderate" | "high" {
  const normalized = normalize(exerciseName);

  // Alto risco: Olímpicos e variações de deadlift
  if (
    normalized.includes("deadlift") ||
    normalized.includes("terra") ||
    normalized.includes("clean") ||
    normalized.includes("snatch") ||
    normalized.includes("arranco")
  ) {
    return "high";
  }

  // Risco moderado: Agachamentos pesados e desenvolvimentos com barra
  if (
    (normalized.includes("agachamento") && normalized.includes("barra")) ||
    (normalized.includes("squat") && normalized.includes("bar")) ||
    (normalized.includes("desenvolvimento") && normalized.includes("barra")) ||
    (normalized.includes("press") && normalized.includes("bar"))
  ) {
    return "moderate";
  }

  // Baixo risco: todo o resto (isolados, máquinas, peso corporal)
  return "low";
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
 * EXCEÇÃO: Full Body para idosos (≥60 anos) permite variedade de exercícios
 */
function validateSameTypeDaysHaveSameExercises(
  plan: TrainingPlan,
  age?: number
): boolean {
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

    // 🛡️ EXCEÇÃO: Idosos (≥60 anos) podem ter exercícios diferentes em Full Body para variedade e segurança
    if (age && age >= 60 && dayType === "fullbody") {
      console.log(
        `🛡️ [IDOSO VALIDATOR] Permitindo variedade de exercícios em Full Body para idade=${age}`
      );
      continue; // Pular validação de exercícios iguais
    }

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
  activityLevel?: string | null,
  context?: {
    imc?: number;
    objective?: string;
  }
): TrainingPlan | null {
  if (!plan?.weeklySchedule) return plan;

  const profile = getTrainingProfile(activityLevel);

  // 🔴 Detectar déficit calórico e definir séries mínimas flexíveis
  const obj = normalize(context?.objective || "");
  const isEmagrecimento =
    obj.includes("emagrec") || obj.includes("perder") || obj.includes("queima");
  const isRecomposicao = !!(
    context?.imc &&
    context.imc >= 25 &&
    (obj.includes("ganhar") || obj.includes("massa"))
  );
  const hasDeficit = isEmagrecimento || isRecomposicao;
  // 🔴 REGRA CRÍTICA: Em déficit calórico, séries mínimas são flexíveis (1 série permitida)
  const minSetsPerExercise = hasDeficit ? 1 : 2;
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

      // Usar minSetsPerExercise em vez de valor fixo 2
      const newSets = Math.max(
        minSetsPerExercise,
        Math.round(currentSets * reductionFactor)
      );
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
        // Usar minSetsPerExercise em vez de valor fixo 1 (panturrilhas podem ter 1, outros músculos usam minSetsPerExercise)
        const minSets = muscle === "panturrilhas" ? 1 : minSetsPerExercise;
        exercise.sets = Math.max(minSets, Math.round(currentSets * factor));
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
 * 🔒 NOVO: Valida limites semanais antes de duplicar exercícios para evitar
 * exceder os limites permitidos por nível de atividade.
 *
 * @param plan - Plano de treino a ser corrigido
 * @param activityLevel - Nível de atividade (opcional, usado para validar limites)
 * @returns Plano corrigido e flag indicando se houve correção
 */
export function correctSameTypeDaysExercises(
  plan: TrainingPlan,
  activityLevel?: string | null
): {
  plan: TrainingPlan;
  wasCorrected: boolean;
} {
  if (!plan?.weeklySchedule || !Array.isArray(plan.weeklySchedule)) {
    return { plan, wasCorrected: false };
  }

  let wasCorrected = false;
  const correctedSchedule = [...plan.weeklySchedule];

  // 🔒 NOVO: Obter limites semanais se activityLevel fornecido
  const weeklyLimits = activityLevel
    ? getWeeklySeriesLimits(activityLevel)
    : null;

  // 🔒 NOVO: Funções auxiliares para identificar papel do músculo no tipo de dia
  const isPrimaryMuscleInDayTypeLocal = (
    muscle: string,
    dayType: string
  ): boolean => {
    const normalizedMuscle = normalizeMuscleLocal(muscle);
    const normalizedDayType = normalize(dayType);

    if (normalizedDayType === "push") {
      return (
        normalizedMuscle.includes("peito") ||
        normalizedMuscle.includes("peitoral") ||
        normalizedMuscle.includes("ombro") ||
        normalizedMuscle.includes("deltoide")
      );
    }

    if (normalizedDayType === "pull") {
      return (
        normalizedMuscle.includes("costas") ||
        normalizedMuscle.includes("dorsal") ||
        normalizedMuscle.includes("biceps") ||
        normalizedMuscle.includes("bíceps")
      );
    }

    if (normalizedDayType === "lower" || normalizedDayType === "legs") {
      return (
        normalizedMuscle.includes("quadriceps") ||
        normalizedMuscle.includes("quadríceps") ||
        normalizedMuscle.includes("posterior") ||
        normalizedMuscle.includes("isquiotibiais") ||
        normalizedMuscle.includes("gluteos") ||
        normalizedMuscle.includes("glúteos")
      );
    }

    return false;
  };

  const isSecondaryMuscleInDayTypeLocal = (
    muscle: string,
    dayType: string
  ): boolean => {
    const normalizedMuscle = normalizeMuscleLocal(muscle);
    const normalizedDayType = normalize(dayType);

    if (normalizedDayType === "push") {
      return (
        normalizedMuscle.includes("triceps") ||
        normalizedMuscle.includes("tríceps")
      );
    }

    if (normalizedDayType === "pull") {
      return (
        normalizedMuscle.includes("ombro") ||
        normalizedMuscle.includes("deltoide")
      );
    }

    if (normalizedDayType === "lower" || normalizedDayType === "legs") {
      return normalizedMuscle.includes("panturrilha");
    }

    return false;
  };

  // Função auxiliar para normalizar músculo (mesma lógica de normalizeMuscleLocal)
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

      // Se precisa corrigir, validar limites antes de duplicar
      if (needsCorrection) {
        // 🔒 NOVO: Calcular séries que seriam adicionadas ao duplicar
        const seriesToAdd = new Map<string, number>();
        for (const exercise of firstDayExercises) {
          const muscle = normalizeMuscleLocal(exercise.primaryMuscle);
          const sets =
            typeof exercise.sets === "number"
              ? exercise.sets
              : parseInt(String(exercise.sets), 10) || 0;
          const current = seriesToAdd.get(muscle) || 0;
          seriesToAdd.set(muscle, current + sets);
        }

        // 🔒 NOVO: Verificar se a duplicação excederia limites semanais E por sessão
        let wouldExceedLimits = false;
        const adjustments = new Map<string, number>(); // músculo -> fator de ajuste

        if (weeklyLimits) {
          // Calcular frequência real de cada músculo no plano completo
          const muscleFrequency = new Map<string, number>();
          for (const day of correctedSchedule) {
            const dayMuscles = new Set<string>();
            for (const ex of day.exercises) {
              const muscle = normalizeMuscleLocal(ex.primaryMuscle);
              dayMuscles.add(muscle);
            }
            for (const muscle of dayMuscles) {
              muscleFrequency.set(
                muscle,
                (muscleFrequency.get(muscle) || 0) + 1
              );
            }
          }

          for (const [muscle] of seriesToAdd.entries()) {
            const limit = weeklyLimits[muscle as keyof typeof weeklyLimits];

            if (limit !== undefined) {
              // Calcular séries do primeiro dia para esse músculo
              let firstDaySeries = 0;
              for (const ex of firstDayExercises) {
                const exMuscle = normalizeMuscleLocal(ex.primaryMuscle);
                if (exMuscle === muscle) {
                  const exSets =
                    typeof ex.sets === "number"
                      ? ex.sets
                      : parseInt(String(ex.sets), 10) || 0;
                  firstDaySeries += exSets;
                }
              }

              // Se todos os dias tiverem as mesmas séries do primeiro dia, o total será:
              // séries_por_dia * número_de_dias_do_mesmo_tipo
              const numberOfDaysOfSameType = days.length;
              const totalIfDuplicated = firstDaySeries * numberOfDaysOfSameType;

              // Calcular frequência real do músculo (quantos dias ele é treinado)
              const frequency =
                muscleFrequency.get(muscle) || numberOfDaysOfSameType;

              // 🔒 NOVO: Calcular limite contextual baseado no tipo de dia e papel do músculo
              const isPrimary = isPrimaryMuscleInDayTypeLocal(muscle, dayType);
              const isSecondary = isSecondaryMuscleInDayTypeLocal(
                muscle,
                dayType
              );

              // Calcular limite base por sessão
              const baseMaxSeriesPerSession =
                frequency === 2
                  ? Math.floor(limit * 0.5) // 50% do teto semanal
                  : Math.floor(limit / frequency); // Distribuição igual

              // 🔒 REGRA CONTEXTUAL: Ajustar limite baseado no papel do músculo no tipo de dia
              let maxSeriesPerSession = baseMaxSeriesPerSession;

              if (isPrimary) {
                // Músculos primários podem ter bônus configurável de séries por sessão
                // 🔒 PROTEÇÃO: Garantir que o bônus só seja aplicado se o limite base for >= 2
                // Para limites muito baixos (ex: 1 série), o bônus pode não ser apropriado
                if (baseMaxSeriesPerSession >= 2) {
                  const bonusMultiplier =
                    1 + TRAINING_PLAN_CONFIG.PRIMARY_MUSCLE_SESSION_BONUS;
                  maxSeriesPerSession = Math.ceil(
                    baseMaxSeriesPerSession * bonusMultiplier
                  );
                } else {
                  // Para limites muito baixos, manter o limite base (sem bônus)
                  maxSeriesPerSession = baseMaxSeriesPerSession;
                }
              } else if (isSecondary) {
                // Músculos secundários mantêm o limite padrão (sem aumento)
                maxSeriesPerSession = baseMaxSeriesPerSession;
              }

              // Verificar se excede limite semanal
              const exceedsWeeklyLimit = totalIfDuplicated > limit;

              // Verificar se excede limite por sessão (contextual)
              const exceedsSessionLimit = firstDaySeries > maxSeriesPerSession;

              // Se exceder qualquer limite, calcular fator de ajuste
              if (exceedsWeeklyLimit || exceedsSessionLimit) {
                wouldExceedLimits = true;
                // Usar o menor entre: limite semanal/dias e limite por sessão
                const maxSetsPerDayByWeekly = Math.floor(
                  limit / numberOfDaysOfSameType
                );
                const maxSetsPerDay = Math.min(
                  maxSetsPerDayByWeekly,
                  maxSeriesPerSession
                );

                // 🔒 REGRA: Priorizar redução em músculos secundários
                // Músculos secundários podem ter redução maior (até 40% do original)
                // Músculos primários têm redução mínima (mínimo 60% do original)
                const minReductionFactor = isSecondary ? 0.4 : 0.6;

                const adjustmentFactor =
                  firstDaySeries > 0
                    ? Math.max(
                        minReductionFactor,
                        maxSetsPerDay / firstDaySeries
                      )
                    : 0;
                adjustments.set(muscle, adjustmentFactor);
              }
            }
          }
        }

        wasCorrected = true;

        // 🔒 NOVO: Se precisar ajustar séries, aplicar em TODOS os dias do mesmo tipo (incluindo o primeiro)
        // Isso garante que todos os dias do mesmo tipo tenham séries idênticas
        if (wouldExceedLimits && adjustments.size > 0) {
          // Criar exercícios ajustados uma vez
          const adjustedExercises = firstDayExercises.map((ex) => {
            const muscle = normalizeMuscleLocal(ex.primaryMuscle);
            const adjustmentFactor = adjustments.get(muscle);

            if (adjustmentFactor !== undefined) {
              const originalSets =
                typeof ex.sets === "number"
                  ? ex.sets
                  : parseInt(String(ex.sets), 10) || 0;
              const adjustedSets = Math.max(
                1,
                Math.round(originalSets * adjustmentFactor)
              );

              return {
                ...ex,
                sets: adjustedSets,
                secondaryMuscles: ex.secondaryMuscles
                  ? [...ex.secondaryMuscles]
                  : undefined,
              };
            }

            return {
              ...ex,
              secondaryMuscles: ex.secondaryMuscles
                ? [...ex.secondaryMuscles]
                : undefined,
            };
          });

          // Aplicar os exercícios ajustados em TODOS os dias (incluindo o primeiro)
          for (let i = 0; i < days.length; i++) {
            days[i].exercises = adjustedExercises.map((ex) => ({
              ...ex,
              secondaryMuscles: ex.secondaryMuscles
                ? [...ex.secondaryMuscles]
                : undefined,
            }));
          }

          console.log(
            `🔧 Correção automática: Todos os dias do tipo ${dayType} agora têm os mesmos exercícios com séries ajustadas para respeitar limites semanais`
          );
        } else {
          // Sem ajuste necessário, apenas copiar exercícios do primeiro para os demais
          for (let i = 1; i < days.length; i++) {
            const currentDay = days[i];
            // Criar cópia profunda dos exercícios (sem ajuste)
            currentDay.exercises = firstDayExercises.map((ex) => ({
              ...ex,
              secondaryMuscles: ex.secondaryMuscles
                ? [...ex.secondaryMuscles]
                : undefined,
            }));
          }

          console.log(
            `🔧 Correção automática: Dias do tipo ${dayType} agora têm os mesmos exercícios`
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
    hasShoulderRestriction?: boolean; // 🔒 Restrições articulares
    hasKneeRestriction?: boolean; // 🔒 Restrições articulares
    equipment?: string; // 🏋️ Ambiente de treino (casa, academia, ar_livre)
  }
): boolean {
  // Ajustar séries para respeitar limites semanais antes de validar
  const planForValidation = adjustWeeklySeriesForValidation(
    plan,
    activityLevel,
    context // Passar context para detectar déficit calórico
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
  if (!validateSameTypeDaysHaveSameExercises(planForValidation, context?.age)) {
    return false; // A função já registra a rejeição
  }

  // ✅ NOVAS VALIDAÇÕES AVANÇADAS (antes das validações por dia)
  // 1. Séries semanais por grupamento
  // 2. Padrões motores repetidos
  // 3. Compatibilidade com déficit calórico
  // 4. Frequência × Volume
  // 5. Restrições articulares (defesa em profundidade)
  if (
    !validateAdvancedRules(
      planForValidation,
      trainingDays,
      activityLevel,
      context?.objective,
      context?.imc,
      context?.hasShoulderRestriction,
      context?.hasKneeRestriction,
      context?.equipment
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

  // 🛡️ VALIDAÇÃO DE RISCO PARA IDOSOS (SEMANAL)
  // Para pessoas com 60+ anos, limitar exposição total a exercícios de alto risco
  // Não importa se estão em dias diferentes: 2 deadlifts na semana = 2 exposições
  if (context?.age && context.age >= 60) {
    let totalHighRiskExercises = 0;
    const highRiskExercisesList: string[] = [];

    for (const day of planForValidation.weeklySchedule) {
      const dayHighRisk = day.exercises.filter(
        (ex) => getExerciseRiskLevel(ex.name) === "high"
      );
      totalHighRiskExercises += dayHighRisk.length;
      highRiskExercisesList.push(...dayHighRisk.map((ex) => ex.name));
    }

    if (totalHighRiskExercises > 1) {
      console.warn(
        "Plano rejeitado: excesso de exercícios de alto risco para idoso (semanal)",
        {
          age: context.age,
          totalHighRiskExercises,
          maxAllowed: 1,
          exercises: highRiskExercisesList,
        }
      );
      recordPlanRejection("excesso_exercicios_alto_risco_idoso", {
        activityLevel: activityLevel || undefined,
        trainingDays,
        age: context.age,
        totalHighRiskExercises,
        maxAllowed: 1,
        exercises: highRiskExercisesList.join(", "),
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

    // 🔴 Ajustar maxExercisesPerSession considerando objetivo e tempo disponível (mesma lógica do gerador)
    let adjustedMaxExercises = profile.maxExercisesPerSession;

    // 🎯 FULL BODY COMPACTO: Exceção estrutural necessária
    // Full Body precisa de 5 exercícios mínimos para cobertura muscular completa
    // mesmo com tempo limitado (1 lower, 1 push, 1 pull, 1 posterior/core, 1 complementar)
    const dayTypeForLimit = normalizeDivisionName(day.type || "");
    const isFullBody = dayTypeForLimit === "fullbody";
    const isSedentary =
      normalizedLevel.includes("sedentario") ||
      normalizedLevel.includes("sedentary");
    const hasVeryLimitedTime =
      availableTimeMinutes && availableTimeMinutes <= 40;

    if (isFullBody && isSedentary && hasVeryLimitedTime) {
      // Full Body Compacto: permite 5 exercícios (cobertura muscular mínima)
      adjustedMaxExercises = Math.min(adjustedMaxExercises, 5);
    } else if (
      isSedentary &&
      availableTimeMinutes &&
      availableTimeMinutes <= 40
    ) {
      // Outras divisões (Upper/Lower, etc): limitar a 4 exercícios
      adjustedMaxExercises = Math.min(adjustedMaxExercises, 4);
    }

    // Ajuste para emagrecimento com pouco tempo e Upper/Lower
    const isEmagrecimento =
      context?.objective &&
      (context.objective.toLowerCase().includes("emagrecimento") ||
        context.objective.toLowerCase().includes("perda") ||
        context.objective.toLowerCase().includes("perder"));
    const hasLimitedTime = availableTimeMinutes && availableTimeMinutes <= 50;
    const isUpperLower =
      dayTypeForLimit === "upper" || dayTypeForLimit === "lower";

    if (isEmagrecimento && hasLimitedTime && isUpperLower) {
      adjustedMaxExercises = Math.min(adjustedMaxExercises, 5);
    }

    // Validar número máximo de exercícios por sessão (usando perfil ajustado)
    if (day.exercises.length > adjustedMaxExercises) {
      console.warn("Plano rejeitado: excesso de exercícios por sessão", {
        level,
        exercises: day.exercises.length,
        maxAllowed: adjustedMaxExercises,
        baseMax: profile.maxExercisesPerSession,
        day: day.day,
        type: day.type,
        objective: context?.objective,
        availableTimeMinutes,
      });
      recordPlanRejection("excesso_exercicios_sessao", {
        activityLevel: level,
        trainingDays,
        exerciseCount: day.exercises.length,
        maxAllowed: adjustedMaxExercises,
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
        // Se estiver muito longe (ex: 0 exercícios para grupo grande), rejeitamos.

        // 🔴 EXCEÇÃO: Full Body em déficit calórico pode ter 1 exercício por grupo grande
        const isFullBodyDeficit = dayType === "fullbody" && context?.objective;
        const isWayTooLow = isBig(muscle) && count === 0; // Apenas 0 é crítico

        if (isWayTooLow && !isFullBodyDeficit) {
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

    // NOVA VALIDAÇÃO: Validar secondaryMuscles (contexto: exercícios compostos podem ter até 3)
    for (const ex of day.exercises) {
      if (ex.secondaryMuscles && ex.secondaryMuscles.length > 0) {
        // 🔍 Detectar se é exercício estrutural/composto baseado no nome
        const exerciseName = normalize(ex.name);
        const isStructuralExercise =
          exerciseName.includes("deadlift") ||
          exerciseName.includes("terra") ||
          exerciseName.includes("agachamento") ||
          exerciseName.includes("squat") ||
          exerciseName.includes("supino") ||
          exerciseName.includes("bench") ||
          exerciseName.includes("remada") ||
          exerciseName.includes("row") ||
          exerciseName.includes("puxada") ||
          exerciseName.includes("pulldown") ||
          exerciseName.includes("desenvolvimento") ||
          exerciseName.includes("press");

        // Exercícios estruturais: até 3 músculos secundários
        // Exercícios isolados: até 2 músculos secundários
        const maxSecondaryMuscles = isStructuralExercise ? 3 : 2;

        if (ex.secondaryMuscles.length > maxSecondaryMuscles) {
          rejectPlan(
            "secondaryMuscles_excede_limite",
            {
              activityLevel: level,
              trainingDays,
              dayType,
              exercise: ex.name,
              secondaryMusclesCount: ex.secondaryMuscles.length,
              maxAllowed: maxSecondaryMuscles,
              isStructural: isStructuralExercise,
              day: day.day,
            },
            `secondaryMuscles excede limite de ${maxSecondaryMuscles}`,
            {
              exercise: ex.name,
              secondaryMuscles: ex.secondaryMuscles.length,
              maxAllowed: maxSecondaryMuscles,
              isStructural: isStructuralExercise,
              day: day.day,
            }
          );
          return false;
        }
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
