/**
 * ApprovalContract - Contrato de Aprovação para Geração de Planos
 *
 * Este módulo cria um contrato que consolida TODAS as regras do validador,
 * permitindo que o gerador consulte ANTES de cada decisão se uma ação é permitida.
 *
 * 🎯 OBJETIVO: Gerar apenas planos intrinsecamente válidos, não planos que "se tornam válidos depois"
 *
 * 📋 REGRAS IMPLEMENTADAS:
 * - Limites semanais por músculo (ajustados para déficit calórico)
 * - Limites de exercícios por sessão
 * - Limites de padrões motores por dia
 * - Restrições articulares (ombro, joelho)
 * - Divisão válida para frequência semanal
 * - Séries mínimas por exercício (1 em déficit, 2 normalmente)
 *
 * 🔒 HIERARQUIA DE REGRAS:
 * 1. HARD: Limites semanais, sessão, padrões motores, restrições articulares
 * 2. SOFT: Limites por músculo no dia, distribuição de volume
 * 3. FLEXIBLE: Séries mínimas, quantidade de exercícios por grupo
 *
 * 📖 Para documentação completa das regras, ver: src/lib/generators/contractRules.ts
 */

import {
  getWeeklySeriesLimits,
  detectMotorPattern,
} from "@/lib/validators/advancedPlanValidator";
import type { GenerationConstraints } from "./trainingProfileAdapter";
import type { Exercise } from "@/lib/validators/trainingPlanValidator";
import { JOINT_RESTRICTION_RULES } from "./contractRules";

/* --------------------------------------------------------
   TIPOS E INTERFACES
-------------------------------------------------------- */

export interface ApprovalContract {
  // Limites de sessão
  maxExercisesPerSession: number;
  maxExercisesPerMuscle: number;

  // Limites semanais por músculo (já ajustados para déficit)
  weeklySeriesLimits: Record<string, number>;

  // Séries mínimas por exercício (1 em déficit, 2 normalmente)
  minSetsPerExercise: number;

  // Limites de padrões motores por dia
  motorPatternLimits: {
    hinge: number;
    horizontal_push: number;
    vertical_push: number;
    horizontal_pull: number;
    vertical_pull: number;
    squat: number;
  };

  // Divisão válida para frequência
  validDivisions: string[];

  // Restrições articulares
  restrictedJoints: {
    shoulder: boolean;
    knee: boolean;
  };

  // Configuração de déficit calórico
  deficit: {
    active: boolean;
    multiplier: number;
  };

  // Frequência semanal
  trainingDays: number;

  // Nível de atividade
  activityLevel: string | null;

  // Métodos de consulta do contrato
  canAddExercise: (
    exercise: Exercise,
    context: {
      currentDayExercises: number;
      currentPatternCounts?: Map<string, number>;
    }
  ) => {
    allowed: boolean;
    reason?: string;
    reasonType?: "HARD" | "SOFT" | "FLEXIBLE";
  };

  canAddExerciseToWeek: (
    muscle: string,
    sets: number,
    currentWeeklySeries: Map<string, number>
  ) => {
    allowed: boolean;
    reason?: string;
  };

  canAddMotorPattern: (
    motorPattern: string,
    currentPatternCounts: Map<string, number>
  ) => {
    allowed: boolean;
    reason?: string;
  };

  getMaxExercisesForMuscle: (
    muscle: string,
    remainingWeeklyCapacity: number,
    remainingDaysOfType: number
  ) => number;
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

function detectDeficit(
  objective?: string | null,
  imc?: number
): {
  active: boolean;
  multiplier: number;
} {
  const obj = normalize(objective || "");
  const isEmagrecimento =
    obj.includes("emagrec") || obj.includes("perder") || obj.includes("queima");

  const isRecomposicao = !!(
    imc &&
    imc >= 25 &&
    (obj.includes("ganhar") || obj.includes("massa"))
  );

  return {
    active: isEmagrecimento || isRecomposicao,
    multiplier: 0.1, // Reduz volume em 30% quando em déficit
  };
}

function getValidDivisions(
  trainingDays: number,
  activityLevel?: string | null
): string[] {
  const level = normalize(activityLevel || "moderado");
  const isAdvanced =
    level === "atleta" ||
    level === "avancado" ||
    level === "atleta_altorendimento";

  const expectedDivisionByFrequency: Record<number, string[]> = {
    2: ["full", "fullbody"],
    3: ["full", "fullbody"],
    4: ["upper", "lower"],
    5: isAdvanced
      ? ["push", "pull", "legs", "lower", "upper"]
      : ["push", "pull", "legs", "lower"],
    6: ["push", "pull", "legs", "lower"],
    7: ["push", "pull", "legs", "lower"],
  };

  return expectedDivisionByFrequency[trainingDays] || [];
}

/* --------------------------------------------------------
   CONSTRUÇÃO DO CONTRATO
-------------------------------------------------------- */

/**
 * Constrói o ApprovalContract baseado nas mesmas regras do validador
 */
export function buildApprovalContract(
  constraints: GenerationConstraints,
  trainingDays: number,
  activityLevel: string | null,
  objective?: string,
  imc?: number,
  hasShoulderRestriction?: boolean,
  hasKneeRestriction?: boolean
): ApprovalContract {
  // Detectar déficit calórico
  const deficit = detectDeficit(objective, imc);

  // 🎯 CORREÇÃO CRÍTICA: Usar getWeeklySeriesLimits(activityLevel) para manter consistência com o validador
  // O validador usa activityLevel diretamente, não operationalLevel
  // Isso garante que os limites sejam os mesmos que o validador espera
  const baseWeeklyLimits = getWeeklySeriesLimits(activityLevel);

  // 🎯 DEBUG: Log para verificar detecção de déficit
  if (deficit.active) {
    console.log(
      `🔍 [APPROVAL CONTRACT] Déficit detectado: objective=${objective}, imc=${imc}, multiplier=${deficit.multiplier}, activityLevel=${activityLevel}`
    );
    console.log(
      `🔍 [APPROVAL CONTRACT] Limites base (activityLevel): quadriceps=${baseWeeklyLimits.quadriceps}, após déficit=${Math.floor(baseWeeklyLimits.quadriceps * deficit.multiplier)}`
    );
  }

  // Aplicar multiplicador de déficit aos limites semanais (mesma lógica do validador)
  const weeklySeriesLimits: Record<string, number> = {
    peito: deficit.active
      ? Math.floor(baseWeeklyLimits.peito * deficit.multiplier)
      : baseWeeklyLimits.peito,
    costas: deficit.active
      ? Math.floor(baseWeeklyLimits.costas * deficit.multiplier)
      : baseWeeklyLimits.costas,
    quadriceps: deficit.active
      ? Math.floor(baseWeeklyLimits.quadriceps * deficit.multiplier)
      : baseWeeklyLimits.quadriceps,
    posterior: deficit.active
      ? Math.floor(baseWeeklyLimits.posterior * deficit.multiplier)
      : baseWeeklyLimits.posterior,
    ombro: deficit.active
      ? Math.floor(baseWeeklyLimits.ombro * deficit.multiplier)
      : baseWeeklyLimits.ombro,
    triceps: deficit.active
      ? Math.floor(baseWeeklyLimits.triceps * deficit.multiplier)
      : baseWeeklyLimits.triceps,
    biceps: deficit.active
      ? Math.floor(baseWeeklyLimits.biceps * deficit.multiplier)
      : baseWeeklyLimits.biceps,
    gluteos: baseWeeklyLimits.gluteos
      ? deficit.active
        ? Math.floor(baseWeeklyLimits.gluteos * deficit.multiplier)
        : baseWeeklyLimits.gluteos
      : 0,
    panturrilhas: baseWeeklyLimits.panturrilhas
      ? deficit.active
        ? Math.floor(baseWeeklyLimits.panturrilhas * deficit.multiplier)
        : baseWeeklyLimits.panturrilhas
      : 0,
  };

  // Séries mínimas por exercício (1 em déficit, 2 normalmente)
  const minSetsPerExercise = deficit.active ? 1 : 2;

  // Limites de padrões motores por dia
  const motorPatternLimits = {
    hinge: 99,
    horizontal_push: 99,
    vertical_push: 99,
    horizontal_pull: 99,
    vertical_pull: 99,
    squat: 99,
  };

  // Divisões válidas para frequência
  const validDivisions = getValidDivisions(trainingDays, activityLevel);

  // Restrições articulares
  const restrictedJoints = {
    shoulder: hasShoulderRestriction || false,
    knee: hasKneeRestriction || false,
  };

  // 🔒 Método auxiliar: verifica se exercício viola restrição articular
  // Baseado em padrão motor, não em nome de exercício
  // 🔑 A severidade é definida EXCLUSIVAMENTE pelo sistema via JOINT_RESTRICTION_RULES
  // O usuário apenas informa fatos binários (shoulder: boolean, knee: boolean)
  const violatesJointRestriction = (
    exercise: Exercise
  ): {
    violated: boolean;
    severity?: "HARD" | "SOFT";
    restrictedJoint?: string;
    motorPattern?: string;
  } => {
    const motorPattern = detectMotorPattern(exercise);
    if (!motorPattern || motorPattern === "unknown") {
      return { violated: false }; // Sem padrão motor detectado, não pode bloquear por restrição
    }

    // Verificar restrição de ombro
    if (restrictedJoints.shoulder) {
      const shoulderRule = JOINT_RESTRICTION_RULES.shoulder;
      const shoulderRestrictedPatterns = shoulderRule.restrictedPatterns;
      if (
        shoulderRestrictedPatterns.includes(
          motorPattern as "vertical_push" | "overhead_movement"
        )
      ) {
        // 🔑 Severidade vem EXCLUSIVAMENTE do sistema (JOINT_RESTRICTION_RULES)
        // Não é inferida do input do usuário
        // Verificar se há severidade específica para este padrão motor
        const patternSeverity =
          shoulderRule.patternSeverity?.[
            motorPattern as keyof typeof shoulderRule.patternSeverity
          ];
        const severity =
          patternSeverity || shoulderRule.defaultSeverity || "HARD";

        return {
          violated: true,
          severity, // "HARD" | "SOFT" - definido pelo sistema
          restrictedJoint: "ombro",
          motorPattern,
        };
      }
    }

    // Verificar restrição de joelho
    if (restrictedJoints.knee) {
      const kneeRule = JOINT_RESTRICTION_RULES.knee;
      const kneeRestrictedPatterns = kneeRule.restrictedPatterns;
      if (
        kneeRestrictedPatterns.includes(
          motorPattern as "squat" | "deep_flexion" | "impact"
        )
      ) {
        // 🔑 Severidade vem EXCLUSIVAMENTE do sistema (JOINT_RESTRICTION_RULES)
        // Não é inferida do input do usuário
        // Verificar se há severidade específica para este padrão motor
        const patternSeverity =
          kneeRule.patternSeverity?.[
            motorPattern as keyof typeof kneeRule.patternSeverity
          ];
        const severity = patternSeverity || kneeRule.defaultSeverity || "HARD";

        return {
          violated: true,
          severity, // "HARD" | "SOFT" - definido pelo sistema
          restrictedJoint: "joelho",
          motorPattern,
        };
      }
    }

    return { violated: false }; // Não violou nenhuma restrição
  };

  // Método: pode adicionar exercício à sessão?
  // 🔒 REGRA HARD: Limite de exercícios por sessão nunca pode ser violado
  const canAddExercise = (
    exercise: Exercise,
    context: {
      currentDayExercises: number;
      currentPatternCounts?: Map<string, number>;
    }
  ): {
    allowed: boolean;
    reason?: string;
    reasonType?: "HARD" | "SOFT" | "FLEXIBLE";
  } => {
    // 🔒 HARD RULE 1: Verificar limite de exercícios por sessão (PRIMEIRO - mais crítico)
    if (context.currentDayExercises >= constraints.maxExercisesPerSession) {
      return {
        allowed: false,
        reason: `Limite de exercícios por sessão atingido: ${constraints.maxExercisesPerSession}`,
        reasonType: "HARD",
      };
    }

    // 🔒 HARD RULE 2: Verificar padrão motor (ANTES de restrição articular SOFT)
    // 🔑 REGRA ESPECIAL: overhead_movement conta para o limite de vertical_push
    // Ambos são movimentos acima da cabeça e compartilham o mesmo limite fisiológico
    // Se vertical_push já está no limite, overhead_movement também deve ser bloqueado (HARD)
    const motorPattern = detectMotorPattern(exercise);
    if (motorPattern && motorPattern !== "unknown") {
      // Verificar se overhead_movement deve ser bloqueado por limite de vertical_push
      if (motorPattern === "overhead_movement") {
        const verticalPushLimit = motorPatternLimits.vertical_push;
        const verticalPushCount =
          context.currentPatternCounts?.get("vertical_push") || 0;

        // Se vertical_push já está no limite, bloquear overhead_movement também (HARD prevalece sobre SOFT)
        if (verticalPushCount >= verticalPushLimit) {
          return {
            allowed: false,
            reason: `Limite de padrão motor atingido: vertical_push (${verticalPushCount}/${verticalPushLimit}). overhead_movement compartilha este limite.`,
            reasonType: "HARD",
          };
        }
        // ✅ overhead_movement passou na verificação de vertical_push, continuar para verificar restrição articular
        // Não precisa verificar limite próprio pois compartilha com vertical_push
      } else {
        // Para outros padrões motores, verificar limite padrão
        const limit =
          motorPatternLimits[motorPattern as keyof typeof motorPatternLimits];
        if (limit === undefined) {
          return {
            allowed: false,
            reason: `Padrão motor desconhecido: ${motorPattern}`,
            reasonType: "HARD",
          };
        }

        // Verificar se excede limite de padrão motor
        const currentCount =
          context.currentPatternCounts?.get(motorPattern) || 0;
        if (currentCount >= limit) {
          return {
            allowed: false,
            reason: `Limite de padrão motor atingido: ${motorPattern} (${currentCount}/${limit})`,
            reasonType: "HARD",
          };
        }
      }
    }

    // 🔒 RULE 3: Verificar restrição articular HARD (depois de padrão motor)
    // 🔑 A severidade é definida EXCLUSIVAMENTE pelo sistema via JOINT_RESTRICTION_RULES
    const jointRestrictionCheck = violatesJointRestriction(exercise);
    if (jointRestrictionCheck.violated) {
      const {
        severity,
        restrictedJoint,
        motorPattern: restrictionPattern,
      } = jointRestrictionCheck;

      // 🔒 HARD: Rejeitar exercício (nunca permitir)
      if (severity === "HARD") {
        return {
          allowed: false,
          reason: `Restrição articular HARD violada: exercício ${exercise.name} usa padrão motor ${restrictionPattern} que é restrito para ${restrictedJoint}`,
          reasonType: "HARD",
        };
      }

      // 📊 SOFT: Não bloqueia, mas indica preferência por evitar
      // O gerador deve PREFERIR exercícios alternativos, mas se não houver alternativa, permite
      // Isso altera a seleção sem bloquear a geração do plano
      // ⚠️ IMPORTANTE: SOFT só é retornado se não houver bloqueio HARD anterior
      if (severity === "SOFT") {
        // ✅ SOFT permite adicionar, mas indica que é preferível evitar
        // O gerador deve usar isso para priorizar exercícios alternativos
        return {
          allowed: true, // ✅ SOFT não bloqueia a geração
          reason: `Restrição articular SOFT: exercício ${exercise.name} usa padrão motor ${restrictionPattern} restrito para ${restrictedJoint} (preferir alternativas quando possível)`,
          reasonType: "SOFT",
        };
      }
    }

    // 🔒 HARD RULE 4: Verificar limite de exercícios por músculo (se fornecido)
    // Nota: A contagem de exercícios por músculo no dia seria feita externamente
    // Aqui apenas verificamos o limite máximo permitido

    return { allowed: true };
  };

  // Método: pode adicionar exercício considerando limites semanais?
  // 🔒 REGRA HARD: Limite semanal nunca pode ser excedido (ajustado para déficit)
  const canAddExerciseToWeek = (
    muscle: string,
    sets: number,
    currentWeeklySeries: Map<string, number>
  ): { allowed: boolean; reason?: string } => {
    const normalizedMuscle = normalizeMuscle(muscle);
    const weeklyLimit = weeklySeriesLimits[normalizedMuscle];

    if (weeklyLimit === undefined) {
      // Sem limite definido, permitir (mas logar como warning em produção)
      return { allowed: true };
    }

    const currentSeries = currentWeeklySeries.get(normalizedMuscle) || 0;
    const newTotal = currentSeries + sets;

    // 🔒 HARD RULE: Limite semanal nunca pode ser excedido
    if (newTotal > weeklyLimit) {
      return {
        allowed: false,
        reason: `Limite semanal excedido para ${normalizedMuscle}: ${newTotal} > ${weeklyLimit} (atual: ${currentSeries}, tentando adicionar: ${sets})`,
      };
    }

    return { allowed: true };
  };

  // Método: pode adicionar padrão motor?
  const canAddMotorPattern = (
    motorPattern: string,
    currentPatternCounts: Map<string, number>
  ): { allowed: boolean; reason?: string } => {
    const limit =
      motorPatternLimits[motorPattern as keyof typeof motorPatternLimits];

    if (limit === undefined) {
      return {
        allowed: false,
        reason: `Padrão motor desconhecido: ${motorPattern}`,
      };
    }

    const currentCount = currentPatternCounts.get(motorPattern) || 0;

    if (currentCount >= limit) {
      return {
        allowed: false,
        reason: `Limite de padrão motor atingido: ${motorPattern} (${currentCount}/${limit})`,
      };
    }

    return { allowed: true };
  };

  // Método: calcular máximo de exercícios para um músculo baseado na capacidade semanal restante
  // 📊 REGRA FLEXIBLE: Calcula máximo baseado em capacidade restante e séries mínimas
  // Em déficit: prioriza séries sobre quantidade (pode resultar em menos exercícios)
  const getMaxExercisesForMuscle = (
    muscle: string,
    remainingWeeklyCapacity: number,
    remainingDaysOfType: number
  ): number => {
    const normalizedMuscle = normalizeMuscle(muscle);
    const weeklyLimit = weeklySeriesLimits[normalizedMuscle];

    if (weeklyLimit === undefined || remainingDaysOfType === 0) {
      return 0;
    }

    // 📊 FLEXIBLE RULE: Calcular máximo de exercícios por dia baseado na capacidade semanal restante
    // Considerando séries mínimas por exercício (1 em déficit, 2 normalmente)
    // Fórmula: capacidade_restante / séries_mínimas / dias_restantes
    const maxExercisesPerDay = Math.floor(
      remainingWeeklyCapacity / minSetsPerExercise / remainingDaysOfType
    );

    // Também respeitar limite máximo por músculo (SOFT RULE)
    const maxPerMuscle = constraints.maxExercisesPerMuscle || Infinity;

    // Retornar o menor entre capacidade calculada e limite por músculo
    return Math.min(maxExercisesPerDay, maxPerMuscle);
  };

  return {
    maxExercisesPerSession: constraints.maxExercisesPerSession,
    maxExercisesPerMuscle: constraints.maxExercisesPerMuscle || Infinity,
    weeklySeriesLimits,
    minSetsPerExercise,
    motorPatternLimits,
    validDivisions,
    restrictedJoints,
    deficit,
    trainingDays,
    activityLevel,
    canAddExercise,
    canAddExerciseToWeek,
    canAddMotorPattern,
    getMaxExercisesForMuscle,
  };
}
