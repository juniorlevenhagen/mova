/**
 * Validador Avançado de Planos de Treino
 *
 * Validações baseadas em:
 * - Séries semanais por grupamento muscular
 * - Frequência de estímulo
 * - Padrões motores repetidos
 */

import type { TrainingPlan, Exercise } from "./trainingPlanValidator";
import { recordPlanRejection } from "@/lib/metrics/planRejectionMetrics";
import { getTrainingProfile } from "@/lib/profiles/trainingProfiles";
import { JOINT_RESTRICTION_RULES } from "../generators/contractRules";
import { TRAINING_PLAN_CONFIG } from "@/lib/config";

/* --------------------------------------------------------
   TIPOS E INTERFACES
-------------------------------------------------------- */

interface WeeklySeriesLimits {
  peito: number;
  costas: number;
  quadriceps: number;
  posterior: number;
  ombro: number;
  triceps: number;
  biceps: number;
  gluteos?: number;
  panturrilhas?: number;
}

interface MotorPatternLimits {
  hinge: number;
  horizontal_push: number;
  vertical_push: number;
  horizontal_pull: number;
  vertical_pull: number;
  squat?: number;
}

/* --------------------------------------------------------
   FUNÇÕES AUXILIARES
-------------------------------------------------------- */

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function normalizeMuscle(muscle: string): string {
  const normalized = normalize(muscle);
  if (normalized.includes("peito") || normalized.includes("peitoral"))
    return "peito";
  if (normalized.includes("costas") || normalized.includes("dorsal"))
    return "costas";
  if (normalized.includes("quadriceps") || normalized.includes("quadríceps"))
    return "quadriceps";
  if (normalized.includes("posterior") || normalized.includes("isquiotibiais"))
    return "posterior";
  if (normalized.includes("ombro") || normalized.includes("deltoide"))
    return "ombro";
  if (normalized.includes("triceps") || normalized.includes("tríceps"))
    return "triceps";
  if (normalized.includes("biceps") || normalized.includes("bíceps"))
    return "biceps";
  if (normalized.includes("gluteo") || normalized.includes("glúteo"))
    return "gluteos";
  if (normalized.includes("panturrilha")) return "panturrilhas";
  return normalized;
}

/**
 * Detecta o padrão motor de um exercício baseado no nome e músculo primário
 */
export function detectMotorPattern(exercise: Exercise): string | null {
  const name = normalize(exercise.name);
  const primary = normalizeMuscle(exercise.primaryMuscle);

  // HINGE (dobradiça de quadril)
  if (
    name.includes("stiff") ||
    name.includes("rdl") ||
    name.includes("romanian") ||
    name.includes("good morning") ||
    name.includes("hip thrust") ||
    name.includes("glute bridge") ||
    (name.includes("deadlift") && !name.includes("romanian"))
  ) {
    return "hinge";
  }

  // SQUAT (agachamento)
  if (
    name.includes("agachamento") ||
    name.includes("squat") ||
    name.includes("leg press") ||
    name.includes("hack squat") ||
    name.includes("bulgarian") ||
    name.includes("afundo") ||
    name.includes("lunge")
  ) {
    return "squat";
  }

  // HORIZONTAL PUSH (empurrar horizontal)
  if (
    name.includes("supino") ||
    name.includes("bench") ||
    name.includes("crucifixo") ||
    name.includes("crossover") ||
    name.includes("flexao") ||
    name.includes("push-up") ||
    (primary === "peito" &&
      (name.includes("inclinado") ||
        name.includes("declinado") ||
        name.includes("reto")))
  ) {
    return "horizontal_push";
  }

  // OVERHEAD MOVEMENT
  const normalizedNotes = exercise.notes ? normalize(exercise.notes) : "";
  if (
    primary === "ombro" &&
    (name.includes("elevacao lateral") || name.includes("elevação lateral")) &&
    (name.includes("acima de 90") ||
      name.includes("acima de 90°") ||
      normalizedNotes.includes("acima de 90"))
  ) {
    return "overhead_movement";
  }

  // VERTICAL PUSH (empurrar vertical)
  if (
    name.includes("desenvolvimento") ||
    name.includes("press") ||
    name.includes("military") ||
    name.includes("overhead") ||
    (primary === "ombro" && name.includes("desenvolvimento"))
  ) {
    return "vertical_push";
  }

  // HORIZONTAL PULL (puxar horizontal)
  if (
    name.includes("remada") ||
    name.includes("row") ||
    name.includes("t-bar") ||
    (primary === "costas" &&
      (name.includes("curvada") ||
        name.includes("unilateral") ||
        name.includes("baixa")))
  ) {
    return "horizontal_pull";
  }

  // VERTICAL PULL (puxar vertical)
  if (
    (name.includes("puxada") ||
      name.includes("pull") ||
      name.includes("chin-up") ||
      name.includes("lat pulldown") ||
      (primary === "costas" &&
        (name.includes("frente") ||
          name.includes("atras") ||
          name.includes("barra fixa")))) &&
    !name.includes("face pull")
  ) {
    return "vertical_pull";
  }

  return "unknown";
}

/**
 * Obtém limites de padrões motores por treino
 */
function getMotorPatternLimits(): MotorPatternLimits {
  return {
    hinge: 2,
    horizontal_push: 4,
    vertical_push: 2,
    horizontal_pull: 4,
    vertical_pull: 2,
    squat: 4,
  };
}

/**
 * Obtém limites de séries semanais baseado no nível de atividade.
 * Simples e sem lógica de déficit — o gerador é responsável por
 * calibrar o volume antes de gerar o plano.
 */
export function getWeeklySeriesLimits(
  activityLevel?: string | null
): WeeklySeriesLimits {
  const profile = getTrainingProfile(activityLevel);

  return {
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
}

/* --------------------------------------------------------
   VALIDAÇÕES PRINCIPAIS
-------------------------------------------------------- */

/**
 * 1️⃣ Validação por SÉRIES SEMANAIS (obrigatória)
 *
 * Margem de tolerância aumentada para 20% (era 10%) para acomodar
 * arredondamentos e séries mínimas obrigatórias por exercício.
 *
 * 🏠 Volume Density Modifier: Em casa/ao ar livre, limites são 15% maiores.
 */
export function validateWeeklySeries(
  plan: TrainingPlan,
  trainingDays: number,
  activityLevel?: string | null,
  equipment?: string | null
): boolean {
  const limits = getWeeklySeriesLimits(activityLevel);
  const weeklySeries = new Map<string, number>();

  const environmentVolumeModifier: Record<string, number> = {
    gym: 1.0,
    academia: 1.0,
    home: 1.15,
    casa: 1.15,
    outdoor: 1.15,
    ar_livre: 1.15,
    both: 1.0,
    ambos: 1.0,
  };

  const normalizedEquipment = equipment?.toLowerCase() || "gym";
  const volumeModifier = environmentVolumeModifier[normalizedEquipment] || 1.0;

  // Contar séries semanais por músculo
  for (const day of plan.weeklySchedule) {
    for (const exercise of day.exercises) {
      const muscle = normalizeMuscle(exercise.primaryMuscle);
      const sets =
        typeof exercise.sets === "number"
          ? exercise.sets
          : parseInt(exercise.sets) || 0;

      const current = weeklySeries.get(muscle) || 0;
      weeklySeries.set(muscle, current + sets);
    }
  }

  // Validar contra limites com margem de 20% + modificador de ambiente
  for (const [muscle, totalSeries] of weeklySeries) {
    const limit = limits[muscle as keyof WeeklySeriesLimits];

    if (limit) {
      // ✅ ALTERAÇÃO: margem aumentada de 10% → 20%
      // Necessário para acomodar séries mínimas obrigatórias (ex: minSetsInDeficit: 2)
      // sem rejeitar planos que estão dentro do espírito do limite
      const toleranceMargin = Math.ceil(limit * 0.2);

      const baseEffectiveLimit = limit + toleranceMargin;
      const effectiveLimit = Math.ceil(baseEffectiveLimit * volumeModifier);

      if (totalSeries > effectiveLimit) {
        console.warn("Plano rejeitado: excesso de séries semanais", {
          muscle,
          totalSeries,
          limit,
          baseEffectiveLimit,
          effectiveLimit,
          equipment: normalizedEquipment,
          volumeModifier,
          trainingDays,
        });

        recordPlanRejection("excesso_series_semanais", {
          activityLevel: activityLevel || undefined,
          trainingDays,
          muscle,
          totalSeries,
          limit,
          effectiveLimit,
          equipment: normalizedEquipment,
        }).catch(() => {});

        return false;
      }
    }
  }

  return true;
}

/**
 * 2️⃣ Validação por PADRÃO MOTOR (não por músculo)
 *
 * Valida que não há excesso de padrões motores repetidos no mesmo treino.
 */
export function validateMotorPatterns(plan: TrainingPlan): boolean {
  const limits = getMotorPatternLimits();

  for (const day of plan.weeklySchedule) {
    const patternCounts = new Map<string, number>();

    for (const exercise of day.exercises) {
      const pattern = detectMotorPattern(exercise);
      if (pattern) {
        const current = patternCounts.get(pattern) || 0;
        patternCounts.set(pattern, current + 1);
      }
    }

    for (const [pattern, count] of patternCounts) {
      const limit = limits[pattern as keyof MotorPatternLimits];

      if (limit && count > limit) {
        console.warn("Plano rejeitado: excesso de padrão motor no treino", {
          pattern,
          count,
          limit,
          day: day.day,
        });

        recordPlanRejection("excesso_padrao_motor", {
          pattern,
          count,
          limit,
          day: day.day,
        }).catch(() => {});

        return false;
      }
    }
  }

  return true;
}

/**
 * Identifica se um músculo é primário em um tipo de dia
 */
function isPrimaryMuscleInDayType(muscle: string, dayType: string): boolean {
  const normalizedMuscle = normalizeMuscle(muscle);
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
}

/**
 * Identifica se um músculo é secundário em um tipo de dia
 */
function isSecondaryMuscleInDayType(muscle: string, dayType: string): boolean {
  const normalizedMuscle = normalizeMuscle(muscle);
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
}

/**
 * 3️⃣ Validação de FREQUÊNCIA × VOLUME (CONTEXTUAL)
 *
 * Threshold de rejeição aumentado de 25% → 40% para músculos primários,
 * evitando rejeições desnecessárias em dias onde o músculo é o foco principal.
 */
export function validateFrequencyVolume(
  plan: TrainingPlan,
  activityLevel?: string | null
): boolean {
  const limits = getWeeklySeriesLimits(activityLevel);

  const muscleFrequency = new Map<string, number>();
  const muscleSeriesPerDay = new Map<string, Map<number, number>>();
  const dayTypeMap = new Map<number, string>();

  for (let dayIndex = 0; dayIndex < plan.weeklySchedule.length; dayIndex++) {
    const day = plan.weeklySchedule[dayIndex];
    const dayType = normalize(day.type || "");
    dayTypeMap.set(dayIndex, dayType);

    for (const exercise of day.exercises) {
      const muscle = normalizeMuscle(exercise.primaryMuscle);
      const sets =
        typeof exercise.sets === "number"
          ? exercise.sets
          : parseInt(exercise.sets) || 0;

      if (!muscleFrequency.has(muscle)) {
        muscleFrequency.set(muscle, 0);
        muscleSeriesPerDay.set(muscle, new Map());
      }

      const currentFreq = muscleFrequency.get(muscle)!;
      if (!muscleSeriesPerDay.get(muscle)!.has(dayIndex)) {
        muscleFrequency.set(muscle, currentFreq + 1);
        muscleSeriesPerDay.get(muscle)!.set(dayIndex, 0);
      }

      const daySeries = muscleSeriesPerDay.get(muscle)!.get(dayIndex) || 0;
      muscleSeriesPerDay.get(muscle)!.set(dayIndex, daySeries + sets);
    }
  }

  for (const [muscle, frequency] of muscleFrequency) {
    const weeklyLimit = limits[muscle as keyof WeeklySeriesLimits];
    if (!weeklyLimit) continue;

    const daySeriesMap = muscleSeriesPerDay.get(muscle)!;

    for (const [dayIndex, seriesInDay] of daySeriesMap) {
      const dayType = dayTypeMap.get(dayIndex) || "";
      const isPrimary = isPrimaryMuscleInDayType(muscle, dayType);
      const isSecondary = isSecondaryMuscleInDayType(muscle, dayType);

      const baseMaxSeriesPerSession =
        frequency === 2
          ? Math.floor(weeklyLimit * 0.5)
          : Math.floor(weeklyLimit / frequency);

      let maxSeriesPerSession = baseMaxSeriesPerSession;

      if (isPrimary) {
        if (baseMaxSeriesPerSession >= 2) {
          const bonusMultiplier =
            1 + TRAINING_PLAN_CONFIG.PRIMARY_MUSCLE_SESSION_BONUS;
          maxSeriesPerSession = Math.ceil(
            baseMaxSeriesPerSession * bonusMultiplier
          );
        } else {
          maxSeriesPerSession = baseMaxSeriesPerSession;
        }
      } else if (isSecondary) {
        maxSeriesPerSession = baseMaxSeriesPerSession;
      }

      if (seriesInDay > maxSeriesPerSession) {
        // Músculos secundários: nunca rejeitar, será ajustado automaticamente
        if (isSecondary) {
          console.warn(
            `⚠️ Músculo secundário ${muscle} excede limite por sessão no ${dayType} day, mas será ajustado automaticamente`,
            {
              muscle,
              frequency,
              seriesInDay,
              maxSeriesPerSession,
              weeklyLimit,
              day: plan.weeklySchedule[dayIndex].day,
            }
          );
          continue;
        }

        // ✅ ALTERAÇÃO: threshold aumentado de 25% → 40% para primários
        // Músculos primários em seu próprio dia têm maior capacidade de recuperação
        // e um excesso moderado é fisiologicamente aceitável
        const excessPercent =
          ((seriesInDay - maxSeriesPerSession) / maxSeriesPerSession) * 100;
        if (excessPercent > 40) {
          console.warn("Plano rejeitado: excesso de séries por sessão", {
            muscle,
            frequency,
            seriesInDay,
            maxSeriesPerSession,
            weeklyLimit,
            day: plan.weeklySchedule[dayIndex].day,
            dayType,
            isPrimary,
            excessPercent,
          });

          recordPlanRejection("excesso_series_por_sessao", {
            activityLevel: activityLevel || undefined,
            muscle,
            frequency,
            seriesInDay,
            maxSeriesPerSession,
            weeklyLimit,
            day: plan.weeklySchedule[dayIndex].day,
            dayType,
          }).catch(() => {});

          return false;
        }
      }
    }
  }

  return true;
}

/**
 * 4️⃣ Validação de RESTRIÇÕES ARTICULARES (defesa em profundidade)
 *
 * 🔒 HARD RULE: Restrições articulares nunca podem ser violadas.
 */
export function validateJointRestrictions(
  plan: TrainingPlan,
  hasShoulderRestriction?: boolean,
  hasKneeRestriction?: boolean
): boolean {
  if (!hasShoulderRestriction && !hasKneeRestriction) {
    return true;
  }

  for (const day of plan.weeklySchedule) {
    for (const exercise of day.exercises) {
      const pattern = detectMotorPattern(exercise);
      if (!pattern || pattern === "unknown") continue;

      if (hasShoulderRestriction) {
        const restrictedPatterns =
          JOINT_RESTRICTION_RULES.shoulder.restrictedPatterns;
        if (
          restrictedPatterns.includes(
            pattern as "vertical_push" | "overhead_movement"
          )
        ) {
          console.warn(
            "Plano rejeitado: violação de restrição articular (ombro)",
            { exercise: exercise.name, pattern, day: day.day }
          );
          recordPlanRejection("restricao_articular_ombro", {
            exercise: exercise.name,
            pattern,
            day: day.day,
          }).catch(() => {});
          return false;
        }
      }

      if (hasKneeRestriction) {
        const restrictedPatterns =
          JOINT_RESTRICTION_RULES.knee.restrictedPatterns;
        if (
          restrictedPatterns.includes(
            pattern as "squat" | "deep_flexion" | "impact"
          )
        ) {
          console.warn(
            "Plano rejeitado: violação de restrição articular (joelho)",
            { exercise: exercise.name, pattern, day: day.day }
          );
          recordPlanRejection("restricao_articular_joelho", {
            exercise: exercise.name,
            pattern,
            day: day.day,
          }).catch(() => {});
          return false;
        }
      }
    }
  }

  return true;
}

/**
 * Validação completa avançada
 *
 * Executa todas as validações avançadas em sequência.
 *
 * ✅ ALTERAÇÕES vs versão anterior:
 * - validateDeficitCompatibility REMOVIDA (causava dupla penalização do déficit)
 * - validateWeeklySeries: margem de tolerância 10% → 20%
 * - validateFrequencyVolume: threshold de rejeição 25% → 40%
 */
export function validateAdvancedRules(
  plan: TrainingPlan,
  trainingDays: number,
  activityLevel?: string | null,
  objective?: string | null,
  imc?: number,
  hasShoulderRestriction?: boolean,
  hasKneeRestriction?: boolean,
  equipment?: string | null
): boolean {
  // 1. Séries semanais (com modificador de ambiente)
  if (!validateWeeklySeries(plan, trainingDays, activityLevel, equipment)) {
    return false;
  }

  // 2. Padrões motores
  if (!validateMotorPatterns(plan)) {
    return false;
  }

  // 3. Frequência × Volume
  if (!validateFrequencyVolume(plan, activityLevel)) {
    return false;
  }

  // 4. Restrições articulares (hard rule — nunca pode ser violada)
  if (
    !validateJointRestrictions(plan, hasShoulderRestriction, hasKneeRestriction)
  ) {
    return false;
  }

  return true;
}
