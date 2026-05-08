/**
 * ProfileAdapter - Transforma perfil do usuário em constraints técnicas
 *
 * Princípio: O gerador não precisa saber do perfil do usuário,
 * apenas recebe constraints claras e rígidas.
 */

import {
  getTrainingProfile,
  type TrainingProfile,
} from "@/lib/profiles/trainingProfiles";
import { getWeeklySeriesLimits } from "@/lib/validators/advancedPlanValidator";

// Função auxiliar para normalizar strings
function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

// Limites fixos de padrões motores por dia
const FIXED_MOTOR_PATTERN_LIMITS = {
  hinge: 2,
  horizontal_push: 4,
  vertical_push: 2,
  horizontal_pull: 4,
  vertical_pull: 2,
  squat: 3,
} as const;

export interface GenerationConstraints {
  // Divisão do treino
  division: "PPL" | "Upper/Lower" | "Full Body";

  // Nível operacional (pode ser diferente do declarado por causa do tempo)
  operationalLevel: string;

  // Frequência final (ajustada por segurança se necessário)
  frequency: number;

  // Feedback de Segurança (Mensagens para o usuário)
  safetyFeedback?: {
    type: "warning" | "requirement";
    message: string;
    suggestedChange?: {
      field: "availableTimeMinutes" | "frequency";
      value: number;
    };
  };

  // Limites de exercícios
  maxExercisesPerSession: number;
  maxExercisesPerMuscle: number;

  // Limites de séries semanais
  weeklySeriesLimits: {
    peito: number;
    costas: number;
    quadriceps: number;
    "posterior de coxa": number;
    posterior: number;
    ombro: number;
    triceps: number;
    biceps: number;
    gluteos: number;
    panturrilhas: number;
  };

  // Limites de padrões motores por dia
  motorPatternLimitsPerDay: typeof FIXED_MOTOR_PATTERN_LIMITS;

  // Volume mínimo por grupo muscular (por tipo de dia)
  minExercisesPerLargeMuscle: {
    push?: number;
    pull?: number;
    legs?: number;
    lower?: number;
    upper?: number;
    full?: number;
  };

  // Perfil completo (para referência)
  profile: TrainingProfile;

  // Restrição de tempo (ex: < 45 min)
  isTimeRestricted: boolean;

  // Flags
  allowAIFallback: boolean;
  jointLimitations?: boolean; // 🥇 Passo 1: Restrição de ombro
  kneeLimitations?: boolean; // 🔴 Restrição de joelho
}

export interface UserProfile {
  activityLevel: string;
  frequency: number; // trainingDays
  division?: "PPL" | "Upper/Lower" | "Full Body";
  availableTimeMinutes?: number;
  imc?: number;
  gender?: string;
  age?: number;
  objective?: string;
  jointLimitations?: boolean; // 🥇 Passo 1: Restrição de ombro
  kneeLimitations?: boolean; // 🔴 Restrição de joelho
  equipment?: string;
}

/**
 * Resolve a divisão do treino baseada na frequência e nível
 */
function resolveDivision(
  frequency: number
): "PPL" | "Upper/Lower" | "Full Body" {
  // REGRA OBRIGATÓRIA: Para 5 dias, SEMPRE usar PPL
  if (frequency === 5) {
    return "PPL";
  }

  // Para 3 dias ou menos, Full Body
  if (frequency <= 3) {
    return "Full Body";
  }

  // Para 4 dias, Upper/Lower
  if (frequency === 4) {
    return "Upper/Lower";
  }

  // Para 6+ dias, PPL
  return "PPL";
}

/**
 * Determina o nível operacional baseado no tempo disponível
 */
function getOperationalLevel(
  declaredLevel: string,
  availableTimeMinutes?: number
): { level: string; feedback?: GenerationConstraints["safetyFeedback"] } {
  if (!availableTimeMinutes) {
    return { level: declaredLevel };
  }

  const level = declaredLevel
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  // Mapeamento obrigatório de tempo mínimo por nível
  if (level.includes("atleta")) {
    if (availableTimeMinutes <= 30) {
      return {
        level: "Intermediário",
        feedback: {
          type: "requirement",
          message:
            "Um perfil de Atleta exige alta intensidade e volume. 30 minutos são insuficientes para um treino eficiente nesta categoria. O sistema adaptou seu plano para o nível Intermediário focado em manutenção. Recomendamos pelo menos 75-90 min.",
          suggestedChange: { field: "availableTimeMinutes", value: 75 },
        },
      };
    }
    if (availableTimeMinutes < 75) {
      return {
        level: "Avançado",
        feedback: {
          type: "requirement",
          message:
            "Perfil de Atleta exige pelo menos 75 minutos para ser efetivo. O sistema gerará um treino Avançado (60 min) para sua segurança.",
          suggestedChange: { field: "availableTimeMinutes", value: 75 },
        },
      };
    }
    return { level: "Atleta" };
  }

  if (level.includes("avancado") || level.includes("avançado")) {
    if (availableTimeMinutes < 60) {
      return {
        level: "Intermediário",
        feedback: {
          type: "requirement",
          message:
            "Treinos avançados requerem volume que não cabe em 30-45 minutos. O sistema adaptou para Intermediário.",
          suggestedChange: { field: "availableTimeMinutes", value: 60 },
        },
      };
    }
    return { level: "Avançado" };
  }

  if (
    level.includes("intermediario") ||
    level.includes("intermediário") ||
    level.includes("moderado")
  ) {
    if (availableTimeMinutes < 45) {
      return {
        level: "Iniciante",
        feedback: {
          type: "requirement",
          message:
            "Tempo reduzido é ideal para adaptação (Iniciante). Para treinos moderados, sugerimos 45+ minutos.",
          suggestedChange: { field: "availableTimeMinutes", value: 45 },
        },
      };
    }
    return { level: "Intermediário" };
  }

  return { level: declaredLevel };
}

/**
 * Obtém volume mínimo por grupo grande baseado no tipo de dia e nível
 */
function getMinExercisesPerLargeMuscle(
  activityLevel: string,
  division: "PPL" | "Upper/Lower" | "Full Body"
): GenerationConstraints["minExercisesPerLargeMuscle"] {
  const normalizedLevel = activityLevel
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .replace("atleta_alto_rendimento", "atleta_altorendimento");

  const isBeginner =
    normalizedLevel === "iniciante" ||
    normalizedLevel === "idoso" ||
    normalizedLevel === "limitado" ||
    normalizedLevel === "sedentario";

  const isAdvanced =
    normalizedLevel === "atleta" ||
    normalizedLevel === "atleta_altorendimento" ||
    normalizedLevel === "avancado";

  const result: GenerationConstraints["minExercisesPerLargeMuscle"] = {};

  if (division === "PPL") {
    // Push, Pull, Legs
    if (isBeginner) {
      result.push = 2;
      result.pull = 2;
      result.legs = 2;
    } else if (isAdvanced) {
      result.push = 4;
      result.pull = 4;
      result.legs = 4;
    } else {
      // Moderado/Intermediário
      result.push = 3;
      result.pull = 3;
      result.legs = 3;
    }
  } else if (division === "Upper/Lower") {
    // Upper, Lower
    if (isBeginner) {
      result.upper = 2;
      result.lower = 2;
    } else if (isAdvanced) {
      result.upper = 3;
      result.lower = 3;
    } else {
      result.upper = 2;
      result.lower = 2;
    }
  } else {
    // Full Body
    if (isBeginner) {
      result.full = 1;
    } else if (isAdvanced) {
      result.full = 2;
    } else {
      result.full = 2;
    }
  }

  return result;
}

/**
 * Adapta o perfil do usuário em constraints técnicas para o gerador
 */
export function adaptUserProfileToConstraints(
  userProfile: UserProfile
): GenerationConstraints {
  // 1. Determinar nível operacional (considerando tempo disponível)
  const { level: operationalLevel, feedback: timeFeedback } =
    getOperationalLevel(
      userProfile.activityLevel,
      userProfile.availableTimeMinutes
    );

  let finalFeedback = timeFeedback;

  // 🛑 [SEGURANÇA] Validar frequência para sedentários
  const isSedentary = normalize(userProfile.activityLevel).includes(
    "sedentario"
  );

  let finalFrequency = userProfile.frequency;
  if (isSedentary && userProfile.frequency > 4) {
    finalFrequency = 4;
    finalFeedback = {
      type: "warning",
      message:
        "Para quem está começando (Sedentário), treinar 5-6x por semana aumenta o risco de lesão e fadiga excessiva. O sistema limitou seu plano a 4 dias para uma adaptação segura.",
      suggestedChange: { field: "frequency", value: 4 },
    };
  }

  // 2. Obter perfil técnico
  const profile = getTrainingProfile(operationalLevel);

  // 🕒 [OTIMIZAÇÃO] Detectar restrição de tempo e aplicar Heurística de Volume
  const isTimeRestricted = !!(
    userProfile.availableTimeMinutes && userProfile.availableTimeMinutes < 45
  );
  const adjustedProfile = { ...profile };

  if (isTimeRestricted && userProfile.availableTimeMinutes) {
    const time = userProfile.availableTimeMinutes;
    const normalizedOpLevel = operationalLevel
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    const isHighLevel =
      normalizedOpLevel.includes("atleta") ||
      normalizedOpLevel.includes("avancado");

    // Janelas Fixas de Segurança
    if (time <= 30) {
      // Atletas fazem 4 sets + 90s rest = 8min/ex. 3 ex = 24min. 4 ex = 32min (rejeita).
      adjustedProfile.maxExercisesPerSession = Math.min(
        adjustedProfile.maxExercisesPerSession,
        isHighLevel ? 3 : 4
      );
    } else if (time <= 40) {
      adjustedProfile.maxExercisesPerSession = Math.min(
        adjustedProfile.maxExercisesPerSession,
        isHighLevel ? 4 : 5
      );
    } else {
      // 40-44 min
      adjustedProfile.maxExercisesPerSession = Math.min(
        adjustedProfile.maxExercisesPerSession,
        isHighLevel ? 5 : 6
      );
    }

    console.log(
      `🕒 [TEMPO] Restrição ativa (${time} min). Limite de exercícios ajustado para ${adjustedProfile.maxExercisesPerSession}`
    );
  }

  // 🔴 Ajustar limite de exercícios para perfis sedentários com tempo limitado
  if (
    isSedentary &&
    userProfile.availableTimeMinutes &&
    userProfile.availableTimeMinutes <= 40
  ) {
    adjustedProfile.maxExercisesPerSession = Math.min(
      adjustedProfile.maxExercisesPerSession,
      4
    ); // Limitar a 4 exercícios para sedentários com pouco tempo
  }

  // 3. Resolver divisão
  // 🔴 IMPORTANTE: Usar activityLevel original, não operationalLevel, para resolução de divisão
  // A divisão é baseada apenas na frequência, não no nível operacional
  // Se division for undefined, null ou string vazia, resolver automaticamente
  const division =
    userProfile.division && userProfile.division.trim() !== ""
      ? userProfile.division
      : resolveDivision(finalFrequency);

  // 🔍 Debug: Log da resolução de divisão
  if (!userProfile.division || userProfile.division.trim() === "") {
    console.log(
      `🔍 [Divisão] Resolvida automaticamente: frequency=${finalFrequency}, activityLevel=${userProfile.activityLevel} → ${division}`
    );
  }

  // 🔴 Detectar déficit calórico para ajustes antecipados
  const obj = normalize(userProfile.objective || "");
  const isEmagrecimento =
    obj.includes("emagrec") || obj.includes("perder") || obj.includes("queima");
  const isRecomposicao = !!(
    userProfile.imc &&
    userProfile.imc >= 25 &&
    (obj.includes("ganhar") || obj.includes("massa"))
  );
  const hasDeficit = isEmagrecimento || isRecomposicao;

  // Debug: verificar se profile tem weeklySets
  if (hasDeficit) {
    console.log(
      `🔍 [DEBUG DÉFICIT] hasDeficit=${hasDeficit}, profile.weeklySets=`,
      profile.weeklySets
    );
  }

  // 🔴 REGRA CRÍTICA: Em déficit calórico, reduzir quantidade de exercícios ANTES da validação
  // Volume total é HARD, quantidade de exercícios é SOFT em déficit
  // Para mulheres sedentárias + déficit: segurança > variedade
  const DEBUG_RELAXED_APPROVAL = false;
  if (!DEBUG_RELAXED_APPROVAL && hasDeficit && profile.weeklySets) {
    // Usar profile.weeklySets diretamente (não getWeeklySeriesLimits que retorna formato diferente)
    const deficitMultiplier = 1.0;

    // Calcular limite ajustado para grupos grandes e pequenos
    const adjustedLargeLimit = Math.floor(
      profile.weeklySets.large * deficitMultiplier
    );
    const adjustedSmallLimit = Math.floor(
      profile.weeklySets.small * deficitMultiplier
    );

    // Em déficit, calcular maxExercisesPerMuscle baseado no limite semanal ajustado
    // Máximo = limite ajustado / 1 série mínima
    // Mas nunca mais que 2 para grupos pequenos e 3 para grupos grandes
    // Garantir que o limite seja pelo menos 2 para grupos grandes e 1 para grupos pequenos
    const maxForLargeMuscles = adjustedLargeLimit; // Peito, costas, quadríceps

    // Aplicar limite mais restritivo: usar o menor entre o atual e o calculado para grupos grandes
    // Isso garante que mesmo grupos pequenos respeitem o limite quando necessário
    // Mas não ser muito restritivo - usar 2 como mínimo para grupos grandes
    adjustedProfile.maxExercisesPerMuscle = Math.min(
      adjustedProfile.maxExercisesPerMuscle,
      maxForLargeMuscles // Usar limite de grupos grandes como padrão (mais restritivo)
    );

    console.log(
      `🔴 [DÉFICIT] Ajustando maxExercisesPerMuscle para ${adjustedProfile.maxExercisesPerMuscle} (déficit ativo, limite ajustado: grandes=${adjustedLargeLimit}, pequenos=${adjustedSmallLimit})`
    );
  }

  // 🔴 Ajustar limite de exercícios baseado em tempo disponível e objetivo
  // Para emagrecimento com pouco tempo (≤50min) e Upper/Lower, limitar a 5 exercícios
  const hasLimitedTime =
    userProfile.availableTimeMinutes && userProfile.availableTimeMinutes <= 50;
  const isUpperLower = division === "Upper/Lower";

  if (isEmagrecimento && hasLimitedTime && isUpperLower) {
    adjustedProfile.maxExercisesPerSession = Math.min(
      adjustedProfile.maxExercisesPerSession,
      5
    ); // Limitar a 5 exercícios para emagrecimento com pouco tempo em Upper/Lower
  }

  // 4. Obter limites de séries semanais
  const weeklySeriesLimits = getWeeklySeriesLimits(operationalLevel);

  // 5. Obter volume mínimo por grupo grande
  const minExercisesPerLargeMuscle = getMinExercisesPerLargeMuscle(
    operationalLevel,
    division
  );

  return {
    division,
    operationalLevel,
    frequency: finalFrequency,
    safetyFeedback: finalFeedback,
    maxExercisesPerSession: adjustedProfile.maxExercisesPerSession,
    maxExercisesPerMuscle: adjustedProfile.maxExercisesPerMuscle,
    weeklySeriesLimits: {
      peito: weeklySeriesLimits.peito,
      costas: weeklySeriesLimits.costas,
      quadriceps: weeklySeriesLimits.quadriceps,
      "posterior de coxa": weeklySeriesLimits.posterior,
      posterior: weeklySeriesLimits.posterior,
      ombro: weeklySeriesLimits.ombro,
      triceps: weeklySeriesLimits.triceps,
      biceps: weeklySeriesLimits.biceps,
      gluteos: weeklySeriesLimits.gluteos ?? 0,
      panturrilhas: weeklySeriesLimits.panturrilhas ?? 0,
    },
    motorPatternLimitsPerDay: FIXED_MOTOR_PATTERN_LIMITS,
    minExercisesPerLargeMuscle,
    profile,
    isTimeRestricted,
    allowAIFallback: false,
    jointLimitations: userProfile.jointLimitations, // 🥇 Passo 1: Restrição de ombro
    kneeLimitations: userProfile.kneeLimitations, // 🔴 Restrição de joelho
  };
}
