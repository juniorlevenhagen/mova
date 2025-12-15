import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import { validateExercisesCountByLevel } from "@/lib/validators/exerciseCountValidator";
import { recordPlanRejection } from "@/lib/metrics/planRejectionMetrics";

/* --------------------------------------------------------
   Tipos locais
-------------------------------------------------------- */

type MuscleGroup = string;

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

interface TrainingResponseSchema {
  trainingPlan: TrainingPlan;
}

/* --------------------------------------------------------
   Cliente OpenAI
-------------------------------------------------------- */

// Lazy initialization para permitir mocks em testes
let openaiInstance: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!openaiInstance) {
    openaiInstance = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  }
  return openaiInstance;
}

/* --------------------------------------------------------
   SCHEMA CORRIGIDO – PERMITE LISTA DE EXERCÍCIOS COMPLETA
-------------------------------------------------------- */
const TRAINING_SCHEMA = {
  name: "training_plan",
  strict: false,
  schema: {
    type: "object",
    properties: {
      trainingPlan: {
        type: "object",
        properties: {
          overview: { type: "string" },
          weeklySchedule: {
            type: "array",
            items: {
              type: "object",
              properties: {
                day: { type: "string" },
                type: { type: "string" },
                exercises: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      primaryMuscle: {
                        type: "string",
                        description: "Músculo primário do exercício (obrigatório)",
                      },
                      secondaryMuscles: {
                        type: "array",
                        items: { type: "string" },
                        minItems: 0,
                        maxItems: 2,
                        description: "Músculos secundários (opcional, máximo 2)",
                      },
                      sets: {
                        type: "number",
                        description: "Número de séries",
                      },
                      reps: { type: "string" },
                      rest: { type: "string" },
                      notes: {
                        type: "string",
                        description: "Notas técnicas (opcional)",
                      },
                    },
                    required: ["name", "primaryMuscle", "sets", "reps", "rest"],
                  },
                },
              },
              required: ["day", "exercises"],
            },
          },
          progression: { type: "string" },
        },
        required: ["overview", "weeklySchedule", "progression"],
      },
    },
    required: ["trainingPlan"],
  },
};

/* --------------------------------------------------------
   Funções auxiliares tipadas
-------------------------------------------------------- */

function safeParseJSON(
  raw: string | null | undefined
): TrainingResponseSchema | Record<string, unknown> {
  try {
    return raw ? (JSON.parse(raw) as TrainingResponseSchema) : {};
  } catch {
    return {};
  }
}

/**
 * Parseia o tempo de treino de string para minutos (número)
 * Exemplos: "70 minutos" -> 70, "60" -> 60, "1 hora" -> 60
 */
function parseTrainingTime(timeStr: string | null | undefined): number | undefined {
  if (!timeStr) return undefined;
  
  // Extrair número da string
  const match = timeStr.match(/(\d+)/);
  if (!match) return undefined;
  
  const num = parseInt(match[1]);
  
  // Se contém "hora", multiplicar por 60
  if (timeStr.toLowerCase().includes("hora")) {
    return num * 60;
  }
  
  return num;
}

function parseTrainingDays(freq: string | null | undefined): number {
  if (!freq) return 3;
  const digits = String(freq).replace(/\D/g, "");
  const n = parseInt(digits, 10);
  if (!n || n < 1 || n > 7) return 3;
  return n;
}

function normalize(str: string): string {
  return String(str)
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

function isBig(group: string): boolean {
  const g = normalize(group);
  return (
    g === "peitoral" ||
    g === "costas" ||
    g === "quadriceps" ||
    g === "posterior de coxa" ||
    g === "gluteos" ||
    g === "ombros"
  );
}

function isSmall(group: string): boolean {
  const g = normalize(group);
  return (
    g === "biceps" || g === "triceps" || g === "panturrilhas" || g === "abdomen"
  );
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
    const sets = typeof ex.sets === "number" ? ex.sets : parseInt(ex.sets) || 3;

    // Parsear rest (formato "60s", "90s", etc.)
    const restMatch = ex.rest.match(/(\d+)/);
    const restSeconds = restMatch ? parseInt(restMatch[1]) : 60;

    // Tempo de descanso entre séries
    const restTime = sets * restSeconds;

    // Tempo de execução (estimado 30s por série)
    const executionTime = sets * 30;

    totalTimeSeconds += restTime + executionTime;
  }

  const totalMinutes = totalTimeSeconds / 60;

  if (totalMinutes > availableTimeMinutes) {
    console.warn("Plano rejeitado: tempo de treino excede disponível", {
      required: totalMinutes.toFixed(1),
      available: availableTimeMinutes,
      day: day.day,
      type: day.type,
    });
    // Persistir de forma assíncrona
    recordPlanRejection("tempo_treino_excede_disponivel", {
      required: totalMinutes,
      available: availableTimeMinutes,
      day: day.day,
      dayType: day.type,
    }).catch((error) => {
      console.error("Erro ao persistir métrica:", error);
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
  // Persistir de forma assíncrona (não bloqueia a validação)
  recordPlanRejection(reason, context).catch((error) => {
    console.error("Erro ao persistir métrica de rejeição:", error);
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
            day: day.day,
            exercise: ex.name,
          }
        );
        return false;
      }
      const primary = normalize(ex.primaryMuscle);
      primaryMuscleCounts.set(
        primary,
        (primaryMuscleCounts.get(primary) || 0) + 1
      );
    }

    // Validate exercises - check if primary muscle is allowed for this day type
    for (const ex of day.exercises) {
      if (!ex.primaryMuscle) continue;
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
        } else if (dayType === "upper") {
          // Upper cannot have legs
          if (
            [
              "quadriceps",
              "posterior de coxa",
              "gluteos",
              "panturrilhas",
            ].includes(mg)
          ) {
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
        } else {
          // For other types, if not in allowed list, reject
          console.warn("Plano rejeitado: grupo muscular não permitido", {
            dayType,
            muscleGroup: mg,
            day: day.day,
            exercise: ex.name,
          });
          return false;
        }
      }
    }

    // Validate Lower day requirements (usando primaryMuscle)
    if (dayType === "lower") {
      const hasQuadriceps = primaryMuscleCounts.has("quadriceps");
      const hasPosterior = primaryMuscleCounts.has("posterior de coxa");
      const hasGlutesOrCalves =
        primaryMuscleCounts.has("gluteos") ||
        primaryMuscleCounts.has("panturrilhas");

      if (!hasQuadriceps || !hasPosterior || !hasGlutesOrCalves) {
        rejectPlan(
          "lower_sem_grupos_obrigatorios",
          {
            activityLevel: level,
            trainingDays,
            dayType,
            day: day.day,
            hasQuadriceps,
            hasPosterior,
            hasGlutesOrCalves,
          },
          "Lower day sem grupos obrigatórios",
          {
            day: day.day,
            hasQuadriceps,
            hasPosterior,
            hasGlutesOrCalves,
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
        const hasGroup = day.exercises.some(
          (ex) => ex.primaryMuscle && normalize(ex.primaryMuscle) === requiredGroup
        );
        if (!hasGroup) {
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

/* --------------------------------------------------------
   ROTA PRINCIPAL
-------------------------------------------------------- */

export async function POST(request: NextRequest) {
  try {
    // 1) Autenticação
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "Token não encontrado" },
        { status: 401 }
      );
    }
    const token = authHeader.replace("Bearer ", "");

    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: userRes } = await supabaseAuth.auth.getUser(token);
    const user = userRes?.user ?? null;
    if (!user) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    // 2) Buscar profile e plano ativo
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    const { data: activePlan } = await supabase
      .from("user_plans")
      .select("id, plan_data, generated_at")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!activePlan) {
      return NextResponse.json(
        { error: "Nenhum plano ativo" },
        { status: 404 }
      );
    }

    // 3) Preparar dados
    const trainingDays = parseTrainingDays(profile?.training_frequency);
    const availableTimeMinutes = parseTrainingTime(profile?.training_time);

    const existing =
      (activePlan.plan_data?.trainingPlan as TrainingPlan | undefined) ?? null;

    if (
      isTrainingPlanUsable(
        existing,
        trainingDays,
        profile?.nivel_atividade,
        availableTimeMinutes
      )
    ) {
      return NextResponse.json({
        success: true,
        trainingPlan: existing,
        alreadyExists: true,
        planId: activePlan.id,
      });
    }

    const age = typeof profile?.age === "number" ? profile.age : null;

    const userData = {
      name: profile?.full_name || "Usuário",
      age,
      gender: profile?.gender || "Sem informação",
      height: profile?.height || 0,
      weight: profile?.weight || 0,
      objective: profile?.objective || "Não informado",
      trainingFrequency: profile?.training_frequency || "3x por semana",
      trainingLocation: profile?.training_location || "academia",
      limitations: profile?.limitations || "Nenhuma",
    };

    // 4) Prompts
    const systemPrompt = `
Você é um treinador profissional especializado em musculação, força e periodização, baseado em evidências científicas.

Sua tarefa é gerar APENAS o campo trainingPlan, respeitando rigorosamente as regras abaixo.
Não gere explicações extras, não gere textos fora do escopo do treino.

⚠️ Você NÃO deve gerar nada fora do JSON.

====================================================================
REGRAS GERAIS (OBRIGATÓRIO)
====================================================================

- Gere apenas treino de MUSCULAÇÃO.
- Use apenas exercícios amplamente reconhecidos e comuns em academias comerciais.
- Evite variações técnicas avançadas se o nível não for atleta ou atleta de alto rendimento.
- Respeite limitações físicas ou dores informadas; quando existirem, priorize máquinas e exercícios seguros.
- Utilize nomenclatura clara e padronizada dos exercícios.
- Não enfatize nenhum grupo muscular específico, a menos que o usuário solicite explicitamente.
- Seja objetivo e técnico.
- Evite redundâncias.
- Não gere texto motivacional.
- Não gere observações fora do treino.

====================================================================
BLOCO DE REGRAS OBRIGATÓRIAS – DIVISÃO E VOLUME DE TREINO
====================================================================

Leia e siga TODAS as regras abaixo antes de gerar o treino.
Nenhuma regra pode ser ignorada.

1️⃣ Escolha da divisão (OBRIGATÓRIA)

A divisão do treino DEVE ser escolhida exclusivamente com base na frequência semanal de musculação:

2–3x por semana → Full Body

4x por semana → Upper / Lower

5x por semana → Push / Pull / Legs (PPL)

6x por semana → Push / Pull / Legs (PPL) 2x

7x por semana → PPL com ajustes regenerativos ou técnicos

⚠️ Não utilize divisões diferentes das listadas acima.
⚠️ Nunca misture divisões no mesmo plano.
⚠️ A divisão escolhida deve ser aplicada de forma consistente durante toda a semana.

2️⃣ Definição rígida das divisões

Full Body
Cada sessão DEVE conter exercícios para:
- Peitoral
- Costas
- Pernas (quadríceps ou posteriores)
- Ombros
- Braços ou Core

Upper
Pode conter APENAS:
- Peitoral
- Costas
- Ombros
- Bíceps
- Tríceps
❌ Não incluir pernas ou panturrilhas.

Lower
Pode conter APENAS:
- Quadríceps
- Posteriores de coxa
- Glúteos
- Panturrilhas
- Core (opcional)

Obrigatório em todo treino Lower:
- ≥ 1 exercício de quadríceps
- ≥ 1 exercício de posteriores
- ≥ 1 exercício de glúteos ou panturrilhas
❌ Não incluir peitoral, costas ou braços.

Push
Pode conter APENAS:
- Peitoral
- Ombros (anterior e lateral)
- Tríceps

Pull
Pode conter APENAS:
- Costas
- Bíceps
- Posterior de ombro
- Trapézio (opcional)

3️⃣ Limite de exercícios por dia (OBRIGATÓRIO)

O número de exercícios por sessão DEVE respeitar o nível do usuário:

- Idoso / Limitado: 3–5 exercícios
- Iniciante: 4–6 exercícios
- Intermediário: 5–8 exercícios
- Avançado: 6–10 exercícios
- Atleta / Alto rendimento: 8–12 exercícios

🔒 Limites globais:
- Mínimo absoluto: 3 exercícios por dia
- Máximo absoluto: 12 exercícios por dia

4️⃣ Regras de volume por grupo muscular

- Grupos musculares principais PODEM e DEVEM ter mais de um exercício na mesma sessão quando o nível permitir
- Para Atleta / Alto rendimento, utilize 2–4 exercícios por grupo principal quando fizer sentido
- Evite repetir o mesmo padrão de movimento no mesmo dia

VOLUME POR GRUPO MUSCULAR (OBRIGATÓRIO):
- Grupo muscular grande principal do dia: 3 a 8 exercícios (ajustar conforme nível)
- Grupos musculares grandes secundários: 2 a 4 exercícios
- Grupos musculares pequenos (bíceps, tríceps, panturrilhas, abdômen): 1 a 4 exercícios

EQUILÍBRIO DE VOLUME (OBRIGATÓRIO):
- A menos que o usuário solicite foco específico:
  - Não priorize nenhum grupo muscular isoladamente
  - A diferença de volume entre grupos musculares grandes no mesmo dia NÃO deve ultrapassar 1 exercício

5️⃣ Validação final obrigatória (ANTES DE RESPONDER)

Antes de finalizar o plano, verifique internamente:
- A divisão corresponde corretamente à frequência semanal
- Nenhum grupo muscular aparece fora da divisão correta
- O número de exercícios por dia está dentro dos limites do nível
- Todo treino Lower atende às regras mínimas obrigatórias
- Todo treino Full Body contém todos os grupos obrigatórios

Somente após essa validação, gere a resposta final.

6️⃣ Respeitar limitações: substituir exercícios que possam causar dor por máquinas ou variações seguras.

====================================================================
DETERMINAÇÃO AUTOMÁTICA DO NÍVEL (OBRIGATÓRIO)
====================================================================
Nível baseado em idade, limitações e frequência:

- Idoso (60+): nível idoso  
- Limitação física relevante: iniciante adaptado  
- Frequência 1–3x: iniciante  
- Frequência 4–5x: intermediário  
- Frequência 6x: avançado  
- Atleta / Alto Rendimento: atleta  

====================================================================
VOLUME OBRIGATÓRIO por GRUPO MUSCULAR (NÃO PODE REDUZIR)
====================================================================

IDOSO / LIMITADO:
- Grupos grandes: 1 exercício
- Grupos pequenos: 1 exercício
- TOTAL POR DIA: 3–5 exercícios (máximo)

INICIANTE:
- Grupos grandes: 2 exercícios
- Grupos pequenos: 1–2 exercícios
- TOTAL POR DIA: 4–6 exercícios (máximo)

INTERMEDIÁRIO:
- Grupos grandes: 3–4 exercícios
- Grupos pequenos: 2 exercícios
- TOTAL POR DIA: 5–8 exercícios (máximo)

AVANÇADO:
- Grupos grandes: 4–6 exercícios
- Grupos pequenos: 2–3 exercícios
- TOTAL POR DIA: 6–10 exercícios (máximo)

ATLETA / ALTO RENDIMENTO:
- Grupos grandes: 5–7 exercícios
- Grupos pequenos: 3 exercícios
- TOTAL POR DIA: 8–12 exercícios (máximo)

⚠️ SE O USUÁRIO NÃO FOR IDOSO OU LIMITADO, NUNCA USE APENAS 1 EXERCÍCIO POR GRUPO.
⚠️ RESPEITE O LIMITE MÁXIMO DE EXERCÍCIOS POR DIA CONFORME O NÍVEL DETERMINADO.

====================================================================
LIMITES DIÁRIOS DE EXERCÍCIOS (OBRIGATÓRIO)
====================================================================

Cada dia de treino DEVE respeitar os seguintes limites totais de exercícios:

- IDOSO / LIMITADO: 3–5 exercícios por dia (máximo)
- INICIANTE: 4–6 exercícios por dia (máximo)
- INTERMEDIÁRIO: 5–8 exercícios por dia (máximo)
- AVANÇADO: 6–10 exercícios por dia (máximo)
- ATLETA / ALTO RENDIMENTO: 8–12 exercícios por dia (máximo)

⚠️ NUNCA exceda esses limites. Treinos muito longos comprometem a qualidade e recuperação.
⚠️ O número mínimo de exercícios por dia é 3 (exceto casos muito específicos de idosos/limitados).

====================================================================
ESTRUTURA DOS EXERCÍCIOS (OBRIGATÓRIO - NOVO FORMATO)
====================================================================

⚠️ MODELO DE EXERCÍCIO OBRIGATÓRIO:

Cada exercício DEVE conter:

{
  "name": "Nome do exercício",
  "primaryMuscle": "músculo principal",
  "secondaryMuscles": ["músculo secundário opcional"],
  "sets": number,
  "reps": "faixa de repetições",
  "rest": "tempo de descanso",
  "notes": "notas técnicas (opcional)"
}

REGRAS FISIOLÓGICAS CRÍTICAS:
- ❌ PROIBIDO usar muscleGroups genérico
- ✔️ Apenas 1 músculo primário por exercício (OBRIGATÓRIO)
- ✔️ Máximo de 2 músculos secundários (opcional)
- ✔️ O volume conta SOMENTE para o músculo primário
- ✔️ sets é um NÚMERO (não string)

Exemplos CORRETOS:
- Supino reto → { "primaryMuscle": "peitoral", "secondaryMuscles": ["tríceps"], "sets": 4, ... }
- Remada curvada → { "primaryMuscle": "costas", "secondaryMuscles": ["bíceps"], "sets": 3, ... }
- Agachamento → { "primaryMuscle": "quadríceps", "secondaryMuscles": ["glúteos", "posterior de coxa"], "sets": 4, ... }
- Levantamento terra → { "primaryMuscle": "posterior de coxa", "secondaryMuscles": ["costas", "glúteos"], "sets": 3, ... }

====================================================================
LIMITE DE VOLUME POR MÚSCULO PRIMÁRIO (REGRA CRÍTICA)
====================================================================

⚠️ O número de exercícios com o mesmo músculo primário no mesmo dia NÃO PODE EXCEDER:

- Idoso / Limitado: 3 exercícios por músculo/dia
- Iniciante: 4 exercícios por músculo/dia
- Moderado: 5 exercícios por músculo/dia
- Atleta: 6 exercícios por músculo/dia
- Atleta Alto Rendimento: 8 exercícios por músculo/dia

⚠️ Se ultrapassar → plano inválido.

====================================================================
DISTRIBUIÇÃO INTELIGENTE (OBRIGATÓRIO)
====================================================================

Dias Push:
- Alternar primaryMuscle entre: Peitoral, Ombros
- Tríceps NUNCA deve ser primário na maioria dos exercícios (máximo 30%)

Dias Pull:
- Alternar primaryMuscle entre: Costas (dorsal), Posterior de coxa
- Bíceps NUNCA deve dominar o dia (máximo 30%)

Lower / Legs:
- Distribuir primaryMuscle entre: Quadríceps, Posterior de coxa, Glúteos
- Não concentrar tudo em um único músculo (máximo 50% por músculo)

⏱️ TEMPO DE TREINO:
- O volume total (exercícios × séries × descanso) DEVE caber no tempo informado
- Priorizar exercícios compostos para objetivos de força e performance

====================================================================
ORDEM DOS EXERCÍCIOS (OBRIGATÓRIO)
====================================================================

- Exercícios compostos antes de isoladores
- Grupos grandes antes de grupos pequenos
- Bíceps sempre após costas
- Tríceps sempre após peito ou ombros
- Organize os exercícios agrupados por músculo, um abaixo do outro

====================================================================
SINERGIAS E RESTRIÇÕES (OBRIGATÓRIO)
====================================================================

Permitido:
- Peito + tríceps
- Costas + bíceps
- Ombros isolados OU com Pull

Evitar:
- Peito + ombros no mesmo dia
- Ombros no dia seguinte ao treino de peito
- Overlap excessivo de braços em dias consecutivos

====================================================================
VARIAÇÕES ENTRE DIAS A/B/C (OBRIGATÓRIO)
====================================================================
Quando o treino possui Push A / Push B etc:
- variar ângulo
- variar equipamento
- variar plano (inclinado/declinado)
- volume sempre dentro da faixa exigida
- nunca duplicar o mesmo exercício no mesmo dia

====================================================================
INTENSIDADE E DESCANSO
====================================================================

- Força: reps baixas, descanso maior
- Hipertrofia: reps moderadas, descanso moderado
- Resistência / Emagrecimento: reps mais altas, descanso curto
- Ajuste o descanso de acordo com o objetivo e o nível do usuário

====================================================================
REGRAS DE PROGRESSÃO (OBRIGATÓRIO)
====================================================================

- A progressão deve ocorrer aumentando carga ao atingir o topo da faixa de repetições com boa técnica
- Após 4 semanas, pode-se adicionar séries aos exercícios principais se a recuperação permitir
- Priorize técnica, segurança e consistência

====================================================================
FORMATO EXATO DO RETORNO (OBRIGATÓRIO)
====================================================================
Você deve retornar APENAS:

{
  "trainingPlan": {
    "overview": "...",
    "weeklySchedule": [...],
    "progression": "..."
  }
}

Nada fora disso.
`;

    const userPrompt = `
Gerar treino completo com base nos dados:

${JSON.stringify(userData, null, 2)}
`;

    // 5) Tentar gerar até 2 vezes
    let trainingPlan: TrainingPlan | null = null;

    for (let attempt = 1; attempt <= 2; attempt++) {
      const completion = await getOpenAI().chat.completions.create({
        model: "gpt-4o",
        temperature: 0.2,
        max_tokens: 12000,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_schema", json_schema: TRAINING_SCHEMA },
      });

      const content = completion.choices?.[0]?.message?.content;
      const parsed = safeParseJSON(
        typeof content === "string" ? content : null
      ) as TrainingResponseSchema | Record<string, unknown>;
      const candidate = (parsed as TrainingResponseSchema).trainingPlan;

      if (
        candidate &&
        isTrainingPlanUsable(
          candidate,
          trainingDays,
          profile?.nivel_atividade,
          availableTimeMinutes
        )
      ) {
        trainingPlan = candidate;
        break;
      }
    }

    if (!trainingPlan) {
      return NextResponse.json(
        { error: "Não foi possível gerar um treino válido" },
        { status: 500 }
      );
    }

    // 6) Salvar no Supabase
    const updated = {
      ...(activePlan.plan_data || {}),
      trainingPlan,
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from("user_plans")
      .update({ plan_data: updated })
      .eq("id", activePlan.id);

    if (updateError) {
      console.error("Erro ao atualizar plano:", updateError);
      return NextResponse.json(
        { error: "Erro ao salvar trainingPlan no plano", details: updateError },
        { status: 500 }
      );
    }

    // 7) Responder
    return NextResponse.json({
      success: true,
      trainingPlan,
      alreadyExists: false,
      planId: activePlan.id,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("Erro ao gerar trainingPlan:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

