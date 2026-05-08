/**
 * Gerador de Planos de Treino - Versão Corrigida
 */

import {
  type TrainingPlan,
  type TrainingDay,
  type Exercise,
} from "@/lib/validators/trainingPlanValidator";
import { adaptUserProfileToConstraints } from "./trainingProfileAdapter";
import { EXERCISE_DATABASE, DAY_STRUCTURES } from "./exerciseDatabase";
import { JOINT_RESTRICTION_RULES } from "./contractRules";

/* --------------------------------------------------------
   LÓGICA DE CÁLCULO DE SÉRIES (CORRIGIDA)
-------------------------------------------------------- */

/**
 * Determina o número de séries por exercício.
 * CORREÇÃO: Permitir 2 séries para iniciantes/sedentários para aumentar variedade
 * sem explodir o volume semanal.
 */
function calculateSets(
  activityLevel: string,
  isCompound: boolean,
  isLarge: boolean,
  availableTimeMinutes?: number
): number {
  // 🕒 [TEMPO CRÍTICO] Se o tempo for <= 30 min, forçar 2 séries para caber volume
  if (availableTimeMinutes && availableTimeMinutes <= 30) {
    return 2;
  }

  const level = activityLevel
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  // Se for Iniciante ou Sedentario, permitimos 2 para dar mais flexibilidade
  if (
    level.includes("iniciante") ||
    level.includes("sedentario") ||
    level.includes("idoso")
  ) {
    return 2;
  }

  // Para Atleta/Avançado, pode chegar a 4 em compostos
  if (level.includes("atleta") || level.includes("avancado")) {
    return isCompound ? 4 : 3;
  }

  // Para Moderado/Intermediário
  if (isCompound && isLarge) {
    return 4;
  }

  return 3;
}

/* --------------------------------------------------------
   FUNÇÃO PRINCIPAL DE GERAÇÃO
-------------------------------------------------------- */

export function generateTrainingPlanStructure(
  trainingDays: number,
  activityLevel: string,
  division?: "PPL" | "Upper/Lower" | "Full Body",
  availableTimeMinutes?: number,
  imc?: number,
  objective?: string,
  hasShoulderRestriction?: boolean,
  hasKneeRestriction?: boolean,
  equipment?: string,
  age?: number,
  gender?: string
): TrainingPlan {
  const constraints = adaptUserProfileToConstraints({
    activityLevel,
    frequency: trainingDays,
    division,
    availableTimeMinutes,
    imc,
    objective,
    jointLimitations: hasShoulderRestriction,
    kneeLimitations: hasKneeRestriction,
    equipment,
    age,
    gender,
  });

  const actualDivision = constraints.division;
  const weeklySchedule: TrainingDay[] = [];

  // Usar a frequência final das constraints (pode ter sido ajustada por segurança)
  // Mas mantemos trainingDays para o loop se não houver ajuste, ou se quisermos forçar o loop original.
  // No entanto, se o adaptador sugeriu uma mudança de frequência, devemos segui-la.
  const finalFrequency =
    constraints.safetyFeedback?.suggestedChange?.field === "frequency"
      ? constraints.safetyFeedback.suggestedChange.value
      : trainingDays;

  // Objeto para garantir que o Treino A seja sempre igual ao outro Treino A, e o B igual ao B
  const templateCache: Record<string, Exercise[][]> = {};
  const dayTypeCounters: Record<string, number> = {};

  // Tracking de séries semanais para evitar ultrapassar limites
  const weeklySeriesCounter = new Map<string, number>();

  const days =
    actualDivision === "PPL"
      ? ["Push", "Pull", "Legs"]
      : actualDivision === "Upper/Lower"
        ? ["Upper", "Lower"]
        : ["Full Body"];

  for (let i = 0; i < finalFrequency; i++) {
    const dayType = days[i % days.length];

    // Incrementar contador para este tipo de dia (Ex: Upper 1, Upper 2...)
    dayTypeCounters[dayType] = (dayTypeCounters[dayType] ?? 0) + 1;
    const dayOccurrence = dayTypeCounters[dayType] - 1;

    // Alternar entre versão A (0) e B (1) se houver mais de uma ocorrência na semana
    const dayVersion = dayOccurrence % 2;
    const versionLabel = dayVersion === 0 ? "A" : "B";
    const specializedKey = `${dayType} ${versionLabel}`;

    if (!templateCache[dayType]) {
      templateCache[dayType] = [];
    }

    // Se ainda não geramos esta versão (A ou B) deste tipo de dia, geramos agora
    if (!templateCache[dayType][dayVersion]) {
      const structure =
        DAY_STRUCTURES[specializedKey] || DAY_STRUCTURES[dayType] || [];
      const exercises: Exercise[] = [];
      const usedNames = new Set<string>();

      for (const muscle of structure) {
        if (exercises.length >= constraints.maxExercisesPerSession) break;

        let templates = EXERCISE_DATABASE[muscle] || [];

        // 🔒 [VARIEDADE] Se for versão B e NÃO houver estrutura especializada,
        // rotacionar templates para pegar exercícios diferentes.
        // Se houver estrutura especializada (como Lower A/B), a seleção natural já deve bastar.
        if (
          dayVersion === 1 &&
          !DAY_STRUCTURES[specializedKey] &&
          templates.length > 1
        ) {
          templates = [...templates.slice(1), templates[0]];
        }

        // 🔒 [RESTRIÇÃO ARTICULAR] Filtrar exercícios proibidos
        if (hasShoulderRestriction || hasKneeRestriction) {
          templates = templates.filter((t) => {
            if (hasShoulderRestriction) {
              const restricted =
                JOINT_RESTRICTION_RULES.shoulder.restrictedPatterns;
              if ((restricted as readonly string[]).includes(t.motorPattern))
                return false;
            }
            if (hasKneeRestriction) {
              const restricted =
                JOINT_RESTRICTION_RULES.knee.restrictedPatterns;
              if ((restricted as readonly string[]).includes(t.motorPattern))
                return false;
            }
            return true;
          });
        }

        // 🕒 [OTIMIZAÇÃO] Priorizar compostos e gerenciar volume se o tempo for restrito
        if (constraints.isTimeRestricted) {
          const isolationMuscles = ["biceps", "triceps", "panturrilhas"];

          // Verificar se este músculo de isolamento é OBRIGATÓRIO para este tipo de dia
          const dayTypeNormalized = dayType.toLowerCase();
          const requiredForDay =
            (dayTypeNormalized === "push" && muscle === "triceps") ||
            (dayTypeNormalized === "pull" && muscle === "biceps") ||
            ((dayTypeNormalized === "legs" || dayTypeNormalized === "lower") &&
              muscle === "panturrilhas");

          // Só pular se NÃO for obrigatório para a divisão
          if (
            isolationMuscles.includes(muscle) &&
            !requiredForDay &&
            exercises.length >= constraints.maxExercisesPerSession - 1
          ) {
            console.log(
              `🕒 [TEMPO] Pulando isolador opcional (${muscle}) para priorizar tempo.`
            );
            continue;
          }

          // Priorizar templates que são compostos
          const compounds = templates.filter((t) => t.isCompound);
          if (compounds.length > 0) {
            templates = compounds;
          }
        }

        // Filtrar templates que já foram usados no dia para evitar duplicatas
        const available = templates.filter((t) => !usedNames.has(t.name));

        if (available.length > 0) {
          // Selecionar o primeiro disponível
          const template = available[0];

          const isCompound = template.isCompound;
          const isLarge = template.isLarge;

          const sets = calculateSets(
            constraints.operationalLevel,
            isCompound,
            isLarge,
            availableTimeMinutes
          );

          // 🔒 [VOLUME SEMANAL] Verificar se adicionar este exercício ultrapassa o limite semanal
          const normalizedMuscle = muscle.toLowerCase();
          const limit = (
            constraints.weeklySeriesLimits as Record<string, number>
          )[normalizedMuscle];

          if (limit) {
            // Estimar quantas vezes esse tipo de dia ocorre na semana
            // Para A/B, cada versão ocorre metade das vezes (aprox)
            const occurrences = Math.ceil(finalFrequency / (days.length * 2));
            const currentTotal = weeklySeriesCounter.get(normalizedMuscle) || 0;
            const projectedTotal = currentTotal + sets * occurrences;

            // Margem de tolerância de 20% (mesma do validador)
            const toleranceLimit = Math.ceil(limit * 1.2);

            if (projectedTotal > toleranceLimit) {
              console.log(
                `⚠️ [VOLUME] Pulando exercício para ${muscle} para não exceder limite semanal (${projectedTotal} > ${toleranceLimit}).`
              );
              continue;
            }

            weeklySeriesCounter.set(normalizedMuscle, projectedTotal);
          }

          usedNames.add(template.name);
          exercises.push({
            name: template.name,
            primaryMuscle: template.primaryMuscle,
            secondaryMuscles: template.secondaryMuscles,
            sets,
            reps: `${constraints.profile.minReps}-${constraints.profile.maxReps}`,
            rest: isCompound ? "90s" : "60s",
            notes: template.notes,
          });
        }
      }

      templateCache[dayType][dayVersion] = exercises;
    }

    const currentExercises = templateCache[dayType][dayVersion] || [];

    weeklySchedule.push({
      day: `Dia ${i + 1} - ${dayType} (${versionLabel})`,
      type: dayType,
      exercises: currentExercises,
      description: `Foco em ${dayVersion === 0 ? "base e força" : "variação e volume"}.`,
    });
  }

  return {
    overview: `Plano ${actualDivision} - Nível ${constraints.operationalLevel}. Focado em ${objective || "condicionamento"}.`,
    weeklySchedule,
    progression:
      "Progressão linear de carga: aumente o peso sempre que completar as repetições estipuladas com técnica perfeita.",
    safetyFeedback: constraints.safetyFeedback,
  };
}
