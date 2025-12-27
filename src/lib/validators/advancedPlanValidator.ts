/**
 * Validador Avançado de Planos de Treino
 *
 * Validações baseadas em:
 * - Séries semanais por grupamento muscular
 * - Frequência de estímulo
 * - Padrões motores repetidos
 * - Compatibilidade com déficit calórico
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

interface DeficitConfig {
  ativo: boolean;
  multiplicador_volume: number;
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
  // Mapear variações para nomes padrão
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

  // OVERHEAD MOVEMENT (movimento acima da cabeça - pode ser SOFT ou HARD dependendo do contexto)
  // Detectar antes de vertical_push para ter prioridade
  // Verificar tanto no nome normalizado quanto nas notas
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
  // Excluir "Face pull" que é horizontal, não vertical
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

  // Fallback explícito: padrão desconhecido
  // "unknown" não conta para limites e não é permitido em compostos grandes
  return "unknown";
}

/**
 * Obtém limites de séries semanais baseado no nível de atividade
 * Agora usa os perfis técnicos
 */
export function getWeeklySeriesLimits(
  activityLevel?: string | null
): WeeklySeriesLimits {
  const profile = getTrainingProfile(activityLevel);

  // Converter weeklySets do perfil para o formato WeeklySeriesLimits
  return {
    peito: profile.weeklySets.large,
    costas: profile.weeklySets.large,
    quadriceps: profile.weeklySets.large,
    posterior: Math.floor(profile.weeklySets.large * 0.8), // 80% do large
    ombro: profile.weeklySets.small,
    triceps: profile.weeklySets.small,
    biceps: profile.weeklySets.small,
    gluteos: Math.floor(profile.weeklySets.large * 0.6), // 60% do large
    panturrilhas: Math.floor(profile.weeklySets.small * 0.5), // 50% do small
  };
}

/**
 * Obtém limites de padrões motores por treino
 */
function getMotorPatternLimits(): MotorPatternLimits {
  return {
    hinge: 1,
    horizontal_push: 2,
    vertical_push: 1,
    horizontal_pull: 2,
    vertical_pull: 1,
    squat: 2,
  };
}

/**
 * Detecta se há déficit calórico ativo baseado no objetivo
 */
function detectDeficit(objective?: string | null, imc?: number): DeficitConfig {
  const obj = normalize(objective || "");
  const isEmagrecimento =
    obj.includes("emagrec") || obj.includes("perder") || obj.includes("queima");

  // Se IMC >= 25 e objetivo é "ganhar massa", também deve usar déficit (recomposição)
  const isRecomposicao = !!(
    imc &&
    imc >= 25 &&
    (obj.includes("ganhar") || obj.includes("massa"))
  );

  return {
    ativo: isEmagrecimento || isRecomposicao,
    multiplicador_volume: 0.7, // Reduz volume em 30% quando em déficit
  };
}

/* --------------------------------------------------------
   VALIDAÇÕES PRINCIPAIS
-------------------------------------------------------- */

/**
 * 1️⃣ Validação por SÉRIES SEMANAIS (obrigatória)
 *
 * Conta séries por exercício, soma por músculo,
 * multiplica pela frequência semanal e valida contra limites
 */
export function validateWeeklySeries(
  plan: TrainingPlan,
  trainingDays: number,
  activityLevel?: string | null
): boolean {
  const limits = getWeeklySeriesLimits(activityLevel);
  const weeklySeries = new Map<string, number>();

  // Contar séries semanais por músculo
  for (const day of plan.weeklySchedule) {
    for (const exercise of day.exercises) {
      const muscle = normalizeMuscle(exercise.primaryMuscle);
      const sets =
        typeof exercise.sets === "number"
          ? exercise.sets
          : parseInt(exercise.sets) || 0;

      // Contar séries do músculo primário
      const current = weeklySeries.get(muscle) || 0;
      weeklySeries.set(muscle, current + sets);
    }
  }

  // Validar contra limites
  for (const [muscle, totalSeries] of weeklySeries) {
    const limit = limits[muscle as keyof WeeklySeriesLimits];

    if (limit && totalSeries > limit) {
      console.warn("Plano rejeitado: excesso de séries semanais", {
        muscle,
        totalSeries,
        limit,
        trainingDays,
      });

      recordPlanRejection("excesso_series_semanais", {
        activityLevel: activityLevel || undefined,
        trainingDays,
        muscle,
        totalSeries,
        limit,
      }).catch(() => {});

      return false;
    }
  }

  return true;
}

/**
 * 2️⃣ Validação por PADRÃO MOTOR (não por músculo)
 *
 * Valida que não há excesso de padrões motores repetidos no mesmo treino
 */
export function validateMotorPatterns(plan: TrainingPlan): boolean {
  const limits = getMotorPatternLimits();

  for (const day of plan.weeklySchedule) {
    const patternCounts = new Map<string, number>();

    // Contar padrões motores no dia
    for (const exercise of day.exercises) {
      const pattern = detectMotorPattern(exercise);
      if (pattern) {
        const current = patternCounts.get(pattern) || 0;
        patternCounts.set(pattern, current + 1);
      }
    }

    // Validar contra limites
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
 * 3️⃣ Validação de DÉFICIT CALÓRICO (flag global)
 *
 * Se déficit ativo, reduz volume máximo em 30%
 */
export function validateDeficitCompatibility(
  plan: TrainingPlan,
  objective?: string | null,
  imc?: number,
  activityLevel?: string | null
): boolean {
  const deficit = detectDeficit(objective, imc);

  if (!deficit.ativo) {
    return true; // Sem déficit, validação passa
  }

  // Com déficit, aplicar multiplicador de volume
  const limits = getWeeklySeriesLimits(activityLevel);
  const adjustedLimits: WeeklySeriesLimits = {
    peito: Math.floor(limits.peito * deficit.multiplicador_volume),
    costas: Math.floor(limits.costas * deficit.multiplicador_volume),
    quadriceps: Math.floor(limits.quadriceps * deficit.multiplicador_volume),
    posterior: Math.floor(limits.posterior * deficit.multiplicador_volume),
    ombro: Math.floor(limits.ombro * deficit.multiplicador_volume),
    triceps: Math.floor(limits.triceps * deficit.multiplicador_volume),
    biceps: Math.floor(limits.biceps * deficit.multiplicador_volume),
    gluteos: limits.gluteos
      ? Math.floor(limits.gluteos * deficit.multiplicador_volume)
      : undefined,
    panturrilhas: limits.panturrilhas
      ? Math.floor(limits.panturrilhas * deficit.multiplicador_volume)
      : undefined,
  };

  const weeklySeries = new Map<string, number>();

  // Contar séries semanais
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

  // 🔍 INSTRUMENTAÇÃO: Coletar informações detalhadas sobre exercícios por músculo
  const muscleExercises = new Map<
    string,
    Array<{ name: string; sets: number; day: string }>
  >();
  for (const day of plan.weeklySchedule) {
    for (const exercise of day.exercises) {
      const muscle = normalizeMuscle(exercise.primaryMuscle);
      const sets =
        typeof exercise.sets === "number"
          ? exercise.sets
          : parseInt(exercise.sets) || 0;

      if (!muscleExercises.has(muscle)) {
        muscleExercises.set(muscle, []);
      }
      muscleExercises.get(muscle)!.push({
        name: exercise.name,
        sets,
        day: day.day,
      });
    }
  }

  // Validar contra limites ajustados
  for (const [muscle, totalSeries] of weeklySeries) {
    const limit = adjustedLimits[muscle as keyof WeeklySeriesLimits];

    if (limit && totalSeries > limit) {
      const exercises = muscleExercises.get(muscle) || [];
      const exerciseCount = exercises.length;

      // 🔍 LOG DETALHADO para diagnóstico
      console.error(
        "🔴 [DIAGNÓSTICO DÉFICIT] Plano rejeitado: excesso de volume em déficit calórico",
        {
          muscle,
          totalSeries,
          limit,
          multiplicador: deficit.multiplicador_volume,
          objective,
          exerciseCount, // Quantidade de exercícios
          minSeriesPerExercise: 1, // Em déficit, mínimo é 1
          maxPossibleWithMinSets: exerciseCount * 1, // Máximo possível com 1 série cada
          exercises: exercises.map((ex) => ({
            name: ex.name,
            sets: ex.sets,
            day: ex.day,
          })),
          // Análise: se mesmo com 1 série por exercício excede, problema é quantidade de exercícios
          analysis:
            exerciseCount * 1 > limit
              ? `PROBLEMA: ${exerciseCount} exercícios × 1 série = ${exerciseCount} séries > limite ${limit}. Precisa reduzir quantidade de exercícios.`
              : `OK: ${exerciseCount} exercícios × 1 série = ${exerciseCount} séries ≤ limite ${limit}. Problema pode ser séries individuais > 1.`,
        }
      );

      recordPlanRejection("excesso_volume_em_deficit", {
        activityLevel: activityLevel || undefined,
        muscle,
        totalSeries,
        limit,
        multiplicador: deficit.multiplicador_volume,
        objective: objective || undefined,
        exerciseCount,
      }).catch(() => {});

      return false;
    }
  }

  return true;
}

/**
 * Identifica se um músculo é primário em um tipo de dia
 * Músculos primários podem ter limites maiores por sessão
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
 * Músculos secundários devem ter prioridade menor ao ajustar séries
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
 * 4️⃣ Validação de FREQUÊNCIA × VOLUME (CONTEXTUAL)
 *
 * Valida que a distribuição de séries por sessão é compatível com a frequência semanal
 * REGRA CONTEXTUAL: Limites variam conforme o tipo de dia e papel do músculo
 * - Músculos primários em seu tipo de dia podem ter limites maiores (até 20% mais)
 * - Músculos secundários têm limites mais restritivos
 * - Nunca rejeitar se for possível reduzir séries de exercícios secundários
 */
export function validateFrequencyVolume(
  plan: TrainingPlan,
  activityLevel?: string | null
): boolean {
  const limits = getWeeklySeriesLimits(activityLevel);

  // Contar frequência semanal por músculo (quantos dias o músculo é treinado)
  const muscleFrequency = new Map<string, number>();
  const muscleSeriesPerDay = new Map<string, Map<number, number>>(); // músculo -> dia -> séries
  const dayTypeMap = new Map<number, string>(); // dia -> tipo

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

      // Contar frequência
      if (!muscleFrequency.has(muscle)) {
        muscleFrequency.set(muscle, 0);
        muscleSeriesPerDay.set(muscle, new Map());
      }

      const currentFreq = muscleFrequency.get(muscle)!;
      if (!muscleSeriesPerDay.get(muscle)!.has(dayIndex)) {
        muscleFrequency.set(muscle, currentFreq + 1);
        muscleSeriesPerDay.get(muscle)!.set(dayIndex, 0);
      }

      // Contar séries por dia
      const daySeries = muscleSeriesPerDay.get(muscle)!.get(dayIndex) || 0;
      muscleSeriesPerDay.get(muscle)!.set(dayIndex, daySeries + sets);
    }
  }

  // Validar com limites contextuais baseados no tipo de dia
  for (const [muscle, frequency] of muscleFrequency) {
    const weeklyLimit = limits[muscle as keyof WeeklySeriesLimits];
    if (!weeklyLimit) continue;

    const daySeriesMap = muscleSeriesPerDay.get(muscle)!;

    for (const [dayIndex, seriesInDay] of daySeriesMap) {
      const dayType = dayTypeMap.get(dayIndex) || "";
      const isPrimary = isPrimaryMuscleInDayType(muscle, dayType);
      const isSecondary = isSecondaryMuscleInDayType(muscle, dayType);

      // Calcular limite base por sessão
      const baseMaxSeriesPerSession =
        frequency === 2
          ? Math.floor(weeklyLimit * 0.5) // 50% do teto semanal
          : Math.floor(weeklyLimit / frequency); // Distribuição igual

      // 🔒 REGRA CONTEXTUAL: Ajustar limite baseado no papel do músculo no tipo de dia
      let maxSeriesPerSession = baseMaxSeriesPerSession;

      if (isPrimary) {
        // Músculos primários podem ter bônus configurável de séries por sessão
        // Ex: ombro em Push pode ter mais séries que o padrão
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

      // Verificar se excede o limite contextual
      if (seriesInDay > maxSeriesPerSession) {
        // 🔒 REGRA: Nunca rejeitar se for músculo secundário
        // A correção automática deve reduzir séries de secundários primeiro
        if (isSecondary) {
          // Logar como warning, mas não rejeitar
          // A função correctSameTypeDaysExercises vai ajustar
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
          // Continuar validação (não rejeitar)
          continue;
        }

        // Para músculos primários, rejeitar apenas se exceder muito (mais de 25% do limite)
        const excessPercent =
          ((seriesInDay - maxSeriesPerSession) / maxSeriesPerSession) * 100;
        if (excessPercent > 25) {
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
        // Se exceder pouco (≤25%), permitir (será ajustado pela correção automática)
      }
    }
  }

  return true;
}

/**
 * 5️⃣ Validação de RESTRIÇÕES ARTICULARES (defesa em profundidade)
 *
 * Valida que nenhum exercício viola restrições articulares baseadas em padrão motor
 * 🔒 HARD RULE: Restrições articulares nunca podem ser violadas
 */
export function validateJointRestrictions(
  plan: TrainingPlan,
  hasShoulderRestriction?: boolean,
  hasKneeRestriction?: boolean
): boolean {
  if (!hasShoulderRestriction && !hasKneeRestriction) {
    return true; // Sem restrições, não há o que validar
  }

  for (const day of plan.weeklySchedule) {
    for (const exercise of day.exercises) {
      const pattern = detectMotorPattern(exercise);
      if (!pattern || pattern === "unknown") continue;

      // Verificar restrição de ombro
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
            {
              exercise: exercise.name,
              pattern,
              day: day.day,
            }
          );
          recordPlanRejection("restricao_articular_ombro", {
            exercise: exercise.name,
            pattern,
            day: day.day,
          }).catch(() => {});
          return false;
        }
      }

      // Verificar restrição de joelho
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
            {
              exercise: exercise.name,
              pattern,
              day: day.day,
            }
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
 * Executa todas as validações avançadas em sequência
 */
export function validateAdvancedRules(
  plan: TrainingPlan,
  trainingDays: number,
  activityLevel?: string | null,
  objective?: string | null,
  imc?: number,
  hasShoulderRestriction?: boolean,
  hasKneeRestriction?: boolean
): boolean {
  // 1. Séries semanais
  if (!validateWeeklySeries(plan, trainingDays, activityLevel)) {
    return false;
  }

  // 2. Padrões motores
  if (!validateMotorPatterns(plan)) {
    return false;
  }

  // 3. Déficit calórico
  if (!validateDeficitCompatibility(plan, objective, imc, activityLevel)) {
    return false;
  }

  // 4. Frequência × Volume
  if (!validateFrequencyVolume(plan, activityLevel)) {
    return false;
  }

  // 5. Restrições articulares (defesa em profundidade)
  if (
    !validateJointRestrictions(plan, hasShoulderRestriction, hasKneeRestriction)
  ) {
    return false;
  }

  return true;
}
