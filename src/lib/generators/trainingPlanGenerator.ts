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
import { detectMotorPattern } from "@/lib/validators/advancedPlanValidator";

/* --------------------------------------------------------
   CONSTANTES DE TEMPO (FISIOLOGIA APLICADA)
-------------------------------------------------------- */

const EXECUTION_TIME_PER_SET = 45; // segundos
const TRANSITION_TIME_PER_EXERCISE = 120; // segundos (montagem/deslocamento)

/**
 * Calcula o tempo estimado de treino em minutos baseado na lista de exercícios
 * Seguindo estritamente a fórmula do GEMINI.md:
 * sum(Séries * (45s + Descanso)) + (Nº de Exercícios * 120s)
 */
function calculateEstimatedTimeMinutes(exercises: Exercise[]): number {
  if (exercises.length === 0) return 0;

  let totalSeconds = 0;
  exercises.forEach((ex) => {
    const restSeconds = parseInt(ex.rest) || 60;
    // Tempo por exercício = (séries * (execução + descanso))
    const exerciseTime = ex.sets * (EXECUTION_TIME_PER_SET + restSeconds);
    totalSeconds += exerciseTime;
  });

  // Adiciona tempo de transição (120s por exercício)
  totalSeconds += exercises.length * TRANSITION_TIME_PER_EXERCISE;

  return Math.ceil(totalSeconds / 60);
}

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
  const level = activityLevel
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  // 1. Determinar base por nível
  let sets = 3;

  if (
    level.includes("iniciante") ||
    level.includes("sedentario") ||
    level.includes("idoso")
  ) {
    sets = 2;
  } else if (level.includes("atleta") || level.includes("avancado")) {
    sets = isCompound ? 4 : 3;
  } else if (isCompound && isLarge) {
    sets = 4;
  }

  // 2. Aplicar travas de tempo (caps)
  if (availableTimeMinutes) {
    // 🕒 [TEMPO CRÍTICO] Se o tempo for <= 30 min, forçar 2 séries
    if (availableTimeMinutes <= 30) {
      sets = 2;
    }
    // 🕒 [TEMPO RESTRITO] Se o tempo for <= 45 min, teto de 3 séries
    else if (availableTimeMinutes <= 45) {
      sets = Math.min(sets, 3);
    }
  }

  return sets;
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
  gender?: string,
  previousPlan?: TrainingPlan
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

  // 🕒 [ESTRATÉGIA DE TEMPO] Se usarmos cálculo matemático, podemos ser mais flexíveis
  // com o maxExercisesPerSession, pois o loop interno já valida o tempo real.
  // Aumentar para permitir que o algoritmo matemático decida o corte final.
  const isHighVolume = constraints.operationalLevel.includes("Atleta") || constraints.operationalLevel.includes("Alto");
  const maxExercises = isHighVolume ? Math.max(constraints.maxExercisesPerSession, 10) : constraints.maxExercisesPerSession + 1;

  const actualDivision = constraints.division;
  const weeklySchedule: TrainingDay[] = [];

  // 🔄 [VARIEDADE] Mapear exercícios do plano anterior para evitar repetição
  const previousExerciseNames = new Set<string>();
  if (previousPlan) {
    previousPlan.weeklySchedule.forEach((day) => {
      day.exercises.forEach((ex) => previousExerciseNames.add(ex.name));
    });
    console.log(
      `🔄 [Variedade] Detectado plano anterior com ${previousExerciseNames.size} exercícios. Tentando rotacionar.`
    );
  }

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
  const allUsedExerciseNamesInCurrentPlan = new Set<string>(); // 🆕 Rastreador global da semana

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
      const usedNamesInDay = new Set<string>();
      const patternCounts: Record<string, number> = {}; // 🆕 Rastreador de padrões motores para o dia
      const muscleCounts: Record<string, number> = {}; // 🆕 Rastreador de exercícios por músculo no dia
      let highAxialLoadCount = 0; // 🆕 Rastreador de carga axial no dia

      for (const muscle of structure) {
        if (exercises.length >= maxExercises) break;

        // 🕒 [OTIMIZAÇÃO] Identificar se o músculo é obrigatório para o dia
        const dayTypeNormalized = dayType.toLowerCase();
        const requiredForDay =
          (dayTypeNormalized === "push" && muscle === "triceps") ||
          (dayTypeNormalized === "pull" && muscle === "biceps") ||
          ((dayTypeNormalized === "legs" || dayTypeNormalized === "lower") &&
            muscle === "panturrilhas");

        // 🔒 [RESTRIÇÃO DE PERFIL] Validar limite de exercícios por músculo no dia
        if (
          muscleCounts[muscle] !== undefined &&
          muscleCounts[muscle] >= constraints.maxExercisesPerMuscle
        ) {
          continue;
        }

        let templates = EXERCISE_DATABASE[muscle] || [];

        // 🔄 [VARIEDADE HISTÓRICA E SEMANAL] Priorizar o que não foi usado
        const forbiddenNames = new Set([
          ...Array.from(previousExerciseNames),
          ...Array.from(allUsedExerciseNamesInCurrentPlan),
        ]);

        if (forbiddenNames.size > 0) {
          const freshTemplates = templates.filter(
            (t) => !forbiddenNames.has(t.name)
          );
          if (freshTemplates.length > 0) {
            templates = freshTemplates;
          }
        }

        // 🔒 [VARIEDADE INTERNA] Se for versão B e NÃO houver estrutura especializada,
        // rotacionar templates para pegar exercícios diferentes.
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
        const available = templates.filter((t) => !usedNamesInDay.has(t.name));

        if (available.length > 0) {
          // Selecionar o primeiro disponível
          const template = available[0];

          // 🔒 [CARGA AXIAL] Validar limite de carga axial para IMC alto
          if (
            template.isHighAxialLoad &&
            constraints.maxHighAxialLoadPerDay !== undefined &&
            highAxialLoadCount >= constraints.maxHighAxialLoadPerDay
          ) {
            console.log(
              `🔒 [AXIAL] Pulando ${template.name} - limite de ${constraints.maxHighAxialLoadPerDay} exercício(s) axial(is) atingido.`
            );
            continue;
          }

          // 🔒 [PADRÕES MOTORES] Validar limites por dia (especialmente importante para IMC alto)
          const pattern = template.motorPattern;
          if (pattern) {
            const patternLimit =
              constraints.motorPatternLimitsPerDay[
                pattern as keyof typeof constraints.motorPatternLimitsPerDay
              ];
            if (
              patternLimit !== undefined &&
              (patternCounts[pattern] || 0) >= patternLimit
            ) {
              console.log(
                `🔒 [PADRÃO] Pulando ${template.name} - limite de ${patternLimit} para ${pattern} atingido.`
              );
              continue;
            }
          }

          const isCompound = template.isCompound;
          const isLarge = template.isLarge;

          let sets = calculateSets(
            constraints.operationalLevel,
            isCompound,
            isLarge,
            availableTimeMinutes
          );

          // 🕒 [VALIDAÇÃO MATEMÁTICA DE TEMPO]
          if (availableTimeMinutes) {
            const restValue = isCompound ? 90 : 60;
            const currentEstimatedTime = (testSets: number) =>
              calculateEstimatedTimeMinutes([
                ...exercises,
                {
                  name: template.name,
                  primaryMuscle: template.primaryMuscle,
                  sets: testSets,
                  rest: `${restValue}s`,
                  reps: "",
                },
              ]);

            let estimated = currentEstimatedTime(sets);

            // Se exceder o tempo, tentar reduzir séries (mínimo 2)
            if (estimated > availableTimeMinutes && sets > 2) {
              sets--;
              estimated = currentEstimatedTime(sets);
              if (estimated > availableTimeMinutes && sets > 2) {
                sets--;
                estimated = currentEstimatedTime(sets);
              }
            }

            // Se ainda exceder o tempo e já tivermos um volume mínimo (3 exercícios), pulamos
            // MAS: Só pulamos se NÃO for obrigatório para o dia (para não invalidar o plano)
            if (
              estimated > availableTimeMinutes &&
              exercises.length >= 3 &&
              !requiredForDay
            ) {
              console.log(
                `🕒 [TEMPO] Pulando ${template.name} para respeitar limite de ${availableTimeMinutes}min (Estimado: ${estimated}min).`
              );
              continue;
            }
          }

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

          if (pattern) {
            patternCounts[pattern] = (patternCounts[pattern] || 0) + 1;
          }

          muscleCounts[muscle] = (muscleCounts[muscle] || 0) + 1;

          if (template.isHighAxialLoad) {
            highAxialLoadCount++;
          }

          usedNamesInDay.add(template.name);
          allUsedExerciseNamesInCurrentPlan.add(template.name);
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

    // Se já existia no cache (ex: segunda ocorrência de Upper A), 
    // garantir que marcamos como usado globalmente (embora já devesse estar)
    currentExercises.forEach(ex => allUsedExerciseNamesInCurrentPlan.add(ex.name));

    weeklySchedule.push({
      day: `Dia ${i + 1} - ${dayType} (${versionLabel})`,
      type: `${dayType} (${versionLabel})`,
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
