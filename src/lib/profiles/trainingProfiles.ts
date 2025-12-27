/**
 * Perfis Técnicos de Treino
 *
 * Sistema simplificado: 4 níveis de usuário mapeados para perfis técnicos internos
 * Flags de restrição modificam o perfil base, não criam novos níveis
 */

// ============================================
// TIPOS PÚBLICOS (expostos ao usuário)
// ============================================

export type UserLevel = "Sedentario" | "Moderado" | "Atleta" | "AltoRendimento";

export interface UserFlags {
  elderly?: boolean; // Idoso
  jointLimitations?: boolean; // Limitações articulares
  beginnerRestart?: boolean; // Reinício/Iniciante
}

// ============================================
// PERFIS TÉCNICOS INTERNOS (não expostos)
// ============================================

type TechnicalProfile =
  | "SEDENTARY_BASE"
  | "MODERATE_BASE"
  | "ATHLETE_BASE"
  | "ATHLETE_HIGH_VOLUME";

export interface TrainingProfile {
  volumeMultiplier: number;
  maxExercisesPerSession: number;
  maxExercisesPerMuscle: number;
  lowRepAllowed: boolean;
  maxLowRepExercises?: number; // Máximo de exercícios com reps baixas (3-5)
  allowRepsBelowFive?: boolean; // Permite reps abaixo de 5
  minReps: number;
  maxReps: number;
  weeklySets: {
    large: number; // Grupos grandes (peito, costas, quadríceps)
    small: number; // Grupos pequenos (bíceps, tríceps, ombros)
  };
  // Estrutura de Push Day por nível
  pushDayStructure?: {
    peito: number | [number, number]; // Min e max
    ombro: number | [number, number];
    triceps: number | [number, number];
    total: number | [number, number];
  };
  // Estrutura de Pull Day por nível
  pullDayStructure?: {
    costas: number | [number, number];
    ombro: number | [number, number];
    biceps: number | [number, number];
    total: number | [number, number];
  };
  // Estrutura de Legs Day por nível
  legsDayStructure?: {
    quadriceps: number | [number, number];
    posterior: number | [number, number];
    gluteos: number | [number, number];
    panturrilhas: number | [number, number];
    total: number | [number, number];
  };
}

// Perfis técnicos base (internos)
const technicalProfiles: Record<TechnicalProfile, TrainingProfile> = {
  SEDENTARY_BASE: {
    volumeMultiplier: 0.6,
    maxExercisesPerSession: 6,
    maxExercisesPerMuscle: 2,
    lowRepAllowed: false,
    minReps: 10,
    maxReps: 15,
    weeklySets: {
      large: 8,
      small: 6,
    },
    pushDayStructure: {
      peito: 2,
      ombro: 1,
      triceps: 1,
      total: [4, 5],
    },
    pullDayStructure: {
      costas: 2,
      ombro: 1,
      biceps: 1,
      total: [4, 5],
    },
    legsDayStructure: {
      quadriceps: 2,
      posterior: 1,
      gluteos: 1,
      panturrilhas: 1,
      total: [5, 6],
    },
  },

  MODERATE_BASE: {
    volumeMultiplier: 0.85,
    maxExercisesPerSession: 8,
    maxExercisesPerMuscle: 3,
    lowRepAllowed: false,
    minReps: 8,
    maxReps: 15,
    weeklySets: {
      large: 12,
      small: 8,
    },
    pushDayStructure: {
      peito: 3,
      ombro: [1, 2],
      triceps: [1, 2],
      total: [6, 7],
    },
    pullDayStructure: {
      costas: 3,
      ombro: [1, 2],
      biceps: [1, 2],
      total: [6, 7],
    },
    legsDayStructure: {
      quadriceps: 3,
      posterior: 2,
      gluteos: 1,
      panturrilhas: 1,
      total: [7, 8],
    },
  },

  ATHLETE_BASE: {
    volumeMultiplier: 1.0,
    maxExercisesPerSession: 9,
    maxExercisesPerMuscle: 4,
    lowRepAllowed: true,
    maxLowRepExercises: 2, // Máximo 2 exercícios com 3-5 reps, nunca isoladores
    minReps: 6,
    maxReps: 15,
    weeklySets: {
      large: 16,
      small: 12,
    },
    pushDayStructure: {
      peito: [3, 4],
      ombro: 2,
      triceps: 2,
      total: [7, 9],
    },
    pullDayStructure: {
      costas: [3, 4],
      ombro: 2,
      biceps: 2,
      total: [7, 9],
    },
    legsDayStructure: {
      quadriceps: [3, 4],
      posterior: [2, 3],
      gluteos: [1, 2],
      panturrilhas: [1, 2],
      total: [8, 10],
    },
  },

  ATHLETE_HIGH_VOLUME: {
    volumeMultiplier: 1.25,
    maxExercisesPerSession: 10,
    maxExercisesPerMuscle: 5,
    lowRepAllowed: true,
    maxLowRepExercises: 3, // Até 3 exercícios com reps baixas
    allowRepsBelowFive: true, // Permite reps abaixo de 5
    minReps: 3,
    maxReps: 20,
    weeklySets: {
      large: 20,
      small: 16,
    },
    pushDayStructure: {
      peito: [4, 5],
      ombro: 2,
      triceps: [2, 3],
      total: [8, 10],
    },
    pullDayStructure: {
      costas: [4, 5],
      ombro: 2,
      biceps: [2, 3],
      total: [8, 10],
    },
    legsDayStructure: {
      quadriceps: [4, 5],
      posterior: [3, 4],
      gluteos: [2, 3],
      panturrilhas: [1, 2],
      total: [10, 12],
    },
  },
};

// ============================================
// MAPEAMENTO SIMPLES
// ============================================

const userLevelToProfile: Record<UserLevel, TechnicalProfile> = {
  Sedentario: "SEDENTARY_BASE",
  Moderado: "MODERATE_BASE",
  Atleta: "ATHLETE_BASE",
  AltoRendimento: "ATHLETE_HIGH_VOLUME",
};

// ============================================
// APLICAÇÃO DE FLAGS DE RESTRIÇÃO
// ============================================

/**
 * Aplica flags de restrição ao perfil base
 */
function applyRestrictionFlags(
  profile: TrainingProfile,
  flags: UserFlags
): TrainingProfile {
  const adjusted = { ...profile };

  // Flag: Idoso
  if (flags.elderly) {
    adjusted.volumeMultiplier *= 0.7; // Reduz volume em 30%
    adjusted.maxExercisesPerSession = Math.max(
      5,
      adjusted.maxExercisesPerSession - 1
    );
    adjusted.minReps = Math.max(8, adjusted.minReps); // Mínimo 8 reps
    adjusted.lowRepAllowed = false; // Bloqueia reps baixas
    adjusted.weeklySets = {
      large: Math.floor(adjusted.weeklySets.large * 0.7),
      small: Math.floor(adjusted.weeklySets.small * 0.7),
    };
  }

  // Flag: Limitações articulares
  if (flags.jointLimitations) {
    adjusted.volumeMultiplier *= 0.8; // Reduz volume em 20%
    adjusted.maxExercisesPerSession = Math.max(
      4,
      adjusted.maxExercisesPerSession - 1
    ); // Reduz exercícios por sessão
    adjusted.minReps = Math.max(10, adjusted.minReps); // Mínimo 10 reps
    adjusted.lowRepAllowed = false; // Bloqueia reps baixas
    // Bloqueia exercícios complexos (será validado em outro lugar)
  }

  // Flag: Reinício/Iniciante
  if (flags.beginnerRestart) {
    adjusted.volumeMultiplier *= 0.75; // Reduz volume em 25%
    adjusted.maxExercisesPerMuscle = Math.max(
      2,
      adjusted.maxExercisesPerMuscle - 1
    );
    adjusted.minReps = Math.max(8, adjusted.minReps); // Mínimo 8 reps
    adjusted.lowRepAllowed = false; // Bloqueia reps baixas
  }

  return adjusted;
}

/**
 * Normaliza o nível do usuário para o tipo UserLevel
 */
export function normalizeUserLevel(
  level: string | null | undefined
): UserLevel {
  if (!level) return "Moderado";

  const normalized = level
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "");

  // Mapear para os 4 níveis válidos
  // Verificar se começa com "sedent" para cobrir casos como "Sedentária" que podem ser normalizados incorretamente
  if (
    normalized.startsWith("sedent") ||
    normalized.includes("sedentario") ||
    normalized.includes("sedentary")
  ) {
    return "Sedentario";
  }
  if (
    normalized.includes("atleta") &&
    (normalized.includes("alto") || normalized.includes("rendimento"))
  ) {
    return "AltoRendimento";
  }
  if (normalized.includes("atleta") || normalized.includes("athlete")) {
    return "Atleta";
  }
  // Default: Moderado
  return "Moderado";
}

/**
 * Detecta flags de restrição a partir do nível antigo (compatibilidade)
 */
export function detectRestrictionFlags(
  level: string | null | undefined
): UserFlags {
  if (!level) return {};

  const normalized = level
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_");

  const flags: UserFlags = {};

  // Detectar flags
  if (normalized.includes("idoso") || normalized.includes("senior")) {
    flags.elderly = true;
  }
  if (normalized.includes("limitado") || normalized.includes("limitation")) {
    flags.jointLimitations = true;
  }
  if (normalized.includes("iniciante") || normalized.includes("beginner")) {
    flags.beginnerRestart = true;
  }

  return flags;
}

/**
 * Obtém o perfil de treino para um nível de usuário
 * Aplica flags de restrição se fornecidas
 */
export function getTrainingProfile(
  level: string | null | undefined,
  flags?: UserFlags
): TrainingProfile {
  // Normalizar nível do usuário
  const userLevel = normalizeUserLevel(level);

  // Obter perfil técnico base
  const technicalProfile = userLevelToProfile[userLevel];
  const baseProfile = technicalProfiles[technicalProfile];

  // Detectar flags se não fornecidas (compatibilidade com sistema antigo)
  const detectedFlags = flags || detectRestrictionFlags(level);

  // Aplicar flags de restrição
  return applyRestrictionFlags(baseProfile, detectedFlags);
}

/**
 * Verifica se um número de repetições é válido para o perfil
 */
export function isValidRepsForProfile(
  reps: string | number,
  profile: TrainingProfile
): boolean {
  // Parsear reps (ex: "8-12", "10", "6-10")
  let minRep = 0;
  let maxRep = 0;

  if (typeof reps === "number") {
    minRep = maxRep = reps;
  } else {
    // Aceitar formatos especiais válidos
    const specialFormats = [
      "até a falha",
      "até falha",
      "falha",
      "máximo de repetições",
      "amrap",
    ];

    const normalizedReps = reps.toLowerCase().trim();
    if (specialFormats.some((format) => normalizedReps.includes(format))) {
      // Formato especial é sempre válido (não há como violar limites)
      return true;
    }

    const match = reps.match(/(\d+)(?:-(\d+))?/);
    if (match) {
      minRep = parseInt(match[1]);
      maxRep = match[2] ? parseInt(match[2]) : minRep;
    } else {
      // Se não é número nem formato especial, rejeitar
      return false;
    }
  }

  // Verificar limites
  if (minRep < profile.minReps || maxRep > profile.maxReps) {
    return false;
  }

  // Verificar reps baixas (3-5)
  const isLowRep = minRep <= 5;
  if (isLowRep && !profile.lowRepAllowed) {
    return false;
  }

  // Verificar reps abaixo de 5
  if (minRep < 5 && !profile.allowRepsBelowFive) {
    return false;
  }

  return true;
}

/**
 * Verifica se um exercício é isolador
 */
export function isIsolationExercise(exerciseName: string): boolean {
  const name = exerciseName.toLowerCase();
  const isolationKeywords = [
    "crucifixo",
    "crossover",
    "rosca",
    "triceps testa",
    "triceps na polia",
    "elevação",
    "lateral",
    "concentrado",
    "isolation",
  ];

  return isolationKeywords.some((keyword) => name.includes(keyword));
}
