/**
 * Gerador de Planos de Treino Baseado em Padrões
 *
 * Esta função gera a estrutura completa do plano de treino baseado em regras
 * pré-definidas, garantindo que todas as validações sejam atendidas desde o início.
 * Isso economiza tokens da API e garante consistência.
 */

import {
  type TrainingPlan,
  type TrainingDay,
  type Exercise,
  correctSameTypeDaysExercises,
} from "@/lib/validators/trainingPlanValidator";
import { getTrainingProfile } from "@/lib/profiles/trainingProfiles";
import { detectMotorPattern } from "@/lib/validators/advancedPlanValidator";
import { adaptUserProfileToConstraints } from "./trainingProfileAdapter";
import {
  initDayState,
  addExerciseSafely,
  type WeekState,
} from "./dayStateManager";
import type { GenerationConstraints } from "./trainingProfileAdapter";
import {
  buildApprovalContract,
  type ApprovalContract,
} from "./approvalContract";
import {
  validateContractIntegrity,
  validatePlanAgainstContract,
  validateInvariantProperties,
} from "./contractValidator";
import { PlanQualityAccumulator } from "@/lib/metrics/planQualityMetrics";
import { recordPlanQuality } from "@/lib/metrics/planQualityMetrics";

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

/* --------------------------------------------------------
   TIPOS E INTERFACES
-------------------------------------------------------- */

interface ExerciseTemplate {
  name: string;
  primaryMuscle: string;
  secondaryMuscles?: string[];
  sets: number;
  reps: string;
  rest: string;
  notes?: string;
  type?: "compound" | "isolation"; // Tipo de exercício
}

// DayConfig removido - não utilizado

/* --------------------------------------------------------
   BANCO DE EXERCÍCIOS POR GRUPO MUSCULAR
-------------------------------------------------------- */

const EXERCISE_DATABASE: Record<string, ExerciseTemplate[]> = {
  peitoral: [
    {
      name: "Supino reto com barra",
      primaryMuscle: "peitoral",
      secondaryMuscles: ["triceps"],
      sets: 4,
      reps: "6-10",
      rest: "90-120s",
      notes: "Focar na técnica e aumentar a carga gradualmente",
    },
    {
      name: "Supino inclinado com halteres",
      primaryMuscle: "peitoral",
      secondaryMuscles: ["triceps"],
      sets: 4,
      reps: "8-12",
      rest: "90-120s",
      notes: "Controlar a descida e evitar que os halteres se toquem",
      type: "compound",
    },
    {
      name: "Supino declinado com barra",
      primaryMuscle: "peitoral",
      secondaryMuscles: ["triceps"],
      sets: 3,
      reps: "8-12",
      rest: "90-120s",
      notes: "Manter a postura correta",
      type: "compound",
    },
    {
      name: "Supino com halteres",
      primaryMuscle: "peitoral",
      secondaryMuscles: ["triceps"],
      sets: 3,
      reps: "8-12",
      rest: "90-120s",
      notes: "Amplitude completa de movimento",
      type: "compound",
    },
    {
      name: "Crucifixo com halteres",
      primaryMuscle: "peitoral",
      sets: 3,
      reps: "12-15",
      rest: "60-90s",
      notes: "Foco na fase excêntrica",
      type: "isolation",
    },
    {
      name: "Crossover com cabos",
      primaryMuscle: "peitoral",
      sets: 3,
      reps: "12-15",
      rest: "60-90s",
      notes: "Contração no final do movimento",
      type: "isolation",
    },
    {
      name: "Supino inclinado com barra",
      primaryMuscle: "peitoral",
      secondaryMuscles: ["triceps"],
      sets: 4,
      reps: "6-10",
      rest: "90-120s",
      notes: "Angulação de 30-45 graus",
      type: "compound",
    },
    {
      name: "Flexão de braços",
      primaryMuscle: "peitoral",
      secondaryMuscles: ["triceps"],
      sets: 3,
      reps: "até a falha",
      rest: "60-90s",
      notes: "Pode ser feito com peso adicional",
      type: "compound",
    },
  ],

  costas: [
    {
      name: "Puxada na barra fixa",
      primaryMuscle: "costas",
      secondaryMuscles: ["biceps"],
      sets: 4,
      reps: "6-10",
      rest: "90-120s",
      notes: "Focar na ativação das costas, evitando usar impulso",
      type: "compound",
    },
    {
      name: "Barra fixa assistida",
      primaryMuscle: "costas",
      secondaryMuscles: ["biceps"],
      sets: 3,
      reps: "8-12",
      rest: "90-120s",
      notes:
        "Usar máquina assistida ou elástico para facilitar o movimento. Focar na técnica e progressão gradual",
      type: "compound",
    },
    {
      name: "Remada curvada com barra",
      primaryMuscle: "costas",
      secondaryMuscles: ["biceps"],
      sets: 4,
      reps: "6-10",
      rest: "90-120s",
      notes: "Manter a coluna neutra e puxar a barra em direção ao abdômen",
      type: "compound",
    },
    {
      name: "Remada unilateral com halteres",
      primaryMuscle: "costas",
      secondaryMuscles: ["biceps"],
      sets: 3,
      reps: "8-12",
      rest: "60-90s",
      notes: "Controlar o movimento e evitar torcer o tronco",
      type: "compound",
    },
    {
      name: "Puxada na frente com barra",
      primaryMuscle: "costas",
      secondaryMuscles: ["biceps"],
      sets: 3,
      reps: "8-12",
      rest: "90-120s",
      notes: "Puxar até o peito, não atrás do pescoço",
      type: "compound",
    },
    {
      name: "Remada baixa com polia",
      primaryMuscle: "costas",
      secondaryMuscles: ["biceps"],
      sets: 3,
      reps: "8-12",
      rest: "90-120s",
      notes: "Manter as escápulas em depressão",
      type: "compound",
    },
    {
      name: "Puxada aberta",
      primaryMuscle: "costas",
      secondaryMuscles: ["biceps"],
      sets: 3,
      reps: "10-12",
      rest: "90-120s",
      notes: "Foco na amplitude",
      type: "compound",
    },
    {
      name: "Puxada com pegada supinada",
      primaryMuscle: "costas",
      secondaryMuscles: ["biceps"],
      sets: 3,
      reps: "8-12",
      rest: "90-120s",
      notes: "Maior ativação de bíceps",
      type: "compound",
    },
  ],

  triceps: [
    {
      name: "Tríceps testa com barra EZ",
      primaryMuscle: "triceps",
      sets: 3,
      reps: "10-12",
      rest: "60-90s",
      notes: "Manter os cotovelos fixos e descer a barra até a testa",
      type: "isolation",
    },
    {
      name: "Tríceps na polia alta",
      primaryMuscle: "triceps",
      sets: 3,
      reps: "10-12",
      rest: "60-90s",
      notes: "Extensão completa dos braços",
      type: "isolation",
    },
    {
      name: "Tríceps francês",
      primaryMuscle: "triceps",
      sets: 3,
      reps: "10-12",
      rest: "60-90s",
      notes: "Controle na fase excêntrica",
      type: "isolation",
    },
    {
      name: "Mergulho entre bancos",
      primaryMuscle: "triceps",
      secondaryMuscles: ["peitoral"],
      sets: 3,
      reps: "8-12",
      rest: "60-90s",
      notes: "Manter os cotovelos próximos ao corpo",
      type: "compound",
    },
    {
      name: "Tríceps coice com halteres",
      primaryMuscle: "triceps",
      sets: 3,
      reps: "10-12",
      rest: "60-90s",
      notes: "Isolamento do tríceps",
      type: "isolation",
    },
  ],

  biceps: [
    {
      name: "Rosca direta com barra",
      primaryMuscle: "biceps",
      sets: 3,
      reps: "8-12",
      rest: "60-90s",
      notes: "Evitar balançar o corpo e manter os cotovelos fixos",
      type: "isolation",
    },
    {
      name: "Rosca martelo com halteres",
      primaryMuscle: "biceps",
      sets: 3,
      reps: "10-15",
      rest: "60-90s",
      notes: "Focar na contração do bíceps ao final do movimento",
      type: "isolation",
    },
    {
      name: "Rosca concentrada",
      primaryMuscle: "biceps",
      sets: 3,
      reps: "8-12",
      rest: "60-90s",
      notes: "Focar na contração do bíceps",
      type: "isolation",
    },
    {
      name: "Rosca alternada com halteres",
      primaryMuscle: "biceps",
      sets: 3,
      reps: "10-12",
      rest: "60-90s",
      notes: "Controle no movimento",
      type: "isolation",
    },
    {
      name: "Rosca com barra W",
      primaryMuscle: "biceps",
      sets: 3,
      reps: "8-12",
      rest: "60-90s",
      notes: "Pegada neutra",
      type: "isolation",
    },
  ],

  quadriceps: [
    {
      name: "Agachamento com barra",
      primaryMuscle: "quadriceps",
      secondaryMuscles: ["gluteos", "posterior de coxa"],
      sets: 4,
      reps: "6-10",
      rest: "90-120s",
      notes:
        "Manter a postura correta e descer até a coxa ficar paralela ao chão",
      type: "compound",
    },
    {
      name: "Leg press",
      primaryMuscle: "quadriceps",
      secondaryMuscles: ["gluteos"],
      sets: 4,
      reps: "8-12",
      rest: "90-120s",
      notes: "Controlar a descida e evitar estender completamente os joelhos",
      type: "compound",
    },
    {
      name: "Cadeira extensora",
      primaryMuscle: "quadriceps",
      sets: 3,
      reps: "10-15",
      rest: "60-90s",
      notes: "Focar na contração do quadríceps",
      type: "isolation",
    },
    {
      name: "Agachamento frontal",
      primaryMuscle: "quadriceps",
      secondaryMuscles: ["gluteos"],
      sets: 3,
      reps: "8-12",
      rest: "90-120s",
      notes: "Maior ativação do quadríceps",
      type: "compound",
    },
    {
      name: "Afundo com halteres",
      primaryMuscle: "quadriceps",
      secondaryMuscles: ["gluteos"],
      sets: 3,
      reps: "10-12",
      rest: "60-90s",
      notes: "Passo largo para maior ativação",
      type: "compound",
    },
    {
      name: "Agachamento búlgaro",
      primaryMuscle: "quadriceps",
      secondaryMuscles: ["gluteos"],
      sets: 3,
      reps: "10-12",
      rest: "60-90s",
      notes: "Unilateral, maior intensidade",
      type: "compound",
    },
    {
      name: "Hack squat",
      primaryMuscle: "quadriceps",
      secondaryMuscles: ["gluteos"],
      sets: 4,
      reps: "8-12",
      rest: "90-120s",
      notes: "Máquina, mais seguro",
      type: "compound",
    },
  ],

  "posterior de coxa": [
    {
      name: "Mesa flexora",
      primaryMuscle: "posterior de coxa",
      sets: 3,
      reps: "10-15",
      rest: "60-90s",
      notes: "Controlar o movimento e evitar usar impulso",
      type: "isolation",
    },
    {
      name: "Stiff com barra",
      primaryMuscle: "posterior de coxa",
      secondaryMuscles: ["gluteos"],
      sets: 3,
      reps: "8-12",
      rest: "90-120s",
      notes: "Manter as pernas levemente flexionadas",
      type: "compound",
    },
    {
      name: "Leg curl deitado",
      primaryMuscle: "posterior de coxa",
      sets: 3,
      reps: "10-15",
      rest: "60-90s",
      notes: "Isolamento do posterior",
      type: "isolation",
    },
    {
      name: "Leg curl sentado",
      primaryMuscle: "posterior de coxa",
      sets: 3,
      reps: "10-15",
      rest: "60-90s",
      notes: "Maior amplitude",
      type: "isolation",
    },
    {
      name: "Good morning",
      primaryMuscle: "posterior de coxa",
      secondaryMuscles: ["gluteos"],
      sets: 3,
      reps: "8-12",
      rest: "90-120s",
      notes: "Manter a coluna neutra",
      type: "compound",
    },
    {
      name: "RDL (Romanian Deadlift)",
      primaryMuscle: "posterior de coxa",
      secondaryMuscles: ["gluteos"],
      sets: 3,
      reps: "8-12",
      rest: "90-120s",
      notes: "Foco no posterior de coxa",
      type: "compound",
    },
  ],

  panturrilhas: [
    {
      name: "Elevação de panturrilha em pé",
      primaryMuscle: "panturrilhas",
      sets: 4,
      reps: "12-15",
      rest: "60-90s",
      notes: "Focar na amplitude do movimento",
      type: "isolation",
    },
    {
      name: "Elevação de panturrilha sentado",
      primaryMuscle: "panturrilhas",
      sets: 3,
      reps: "15-20",
      rest: "60-90s",
      notes: "Foco no sóleo",
      type: "isolation",
    },
    {
      name: "Elevação de panturrilha no leg press",
      primaryMuscle: "panturrilhas",
      sets: 3,
      reps: "12-15",
      rest: "60-90s",
      notes: "Com carga adicional",
      type: "isolation",
    },
  ],

  ombros: [
    {
      name: "Desenvolvimento militar com barra",
      primaryMuscle: "ombros",
      secondaryMuscles: ["triceps"],
      sets: 4,
      reps: "6-10",
      rest: "90-120s",
      notes: "Manter a postura correta e evitar arquear as costas",
      type: "compound",
    },
    {
      name: "Desenvolvimento com halteres",
      primaryMuscle: "ombros",
      secondaryMuscles: ["triceps"],
      sets: 4,
      reps: "6-10",
      rest: "90-120s",
      notes: "Maior amplitude de movimento",
      type: "compound",
    },
    {
      name: "Elevação lateral com halteres",
      primaryMuscle: "ombros",
      sets: 3,
      reps: "10-15",
      rest: "60-90s",
      notes:
        "Realizar o movimento de forma controlada, evitando balançar o corpo",
      type: "isolation",
    },
    {
      name: "Elevação frontal com halteres",
      primaryMuscle: "ombros",
      sets: 3,
      reps: "10-15",
      rest: "60-90s",
      notes: "Realizar o movimento de forma controlada",
      type: "isolation",
    },
    {
      name: "Face pull",
      primaryMuscle: "ombros",
      sets: 3,
      reps: "12-15",
      rest: "60-90s",
      notes: "Foco no deltoide posterior",
      type: "isolation",
    },
    {
      name: "Elevação lateral invertida",
      primaryMuscle: "ombros",
      sets: 3,
      reps: "12-15",
      rest: "60-90s",
      notes: "Deltoide posterior",
      type: "isolation",
    },
  ],

  trapezio: [
    {
      name: "Remada alta",
      primaryMuscle: "trapezio",
      secondaryMuscles: ["ombros"],
      sets: 3,
      reps: "8-12",
      rest: "90-120s",
      notes: "Cotovelos próximos ao corpo - foco em trapézio",
      type: "compound",
    },
    {
      name: "Encolhimento com halteres",
      primaryMuscle: "trapezio",
      sets: 3,
      reps: "10-15",
      rest: "60-90s",
      notes: "Isolamento do trapézio",
      type: "isolation",
    },
    {
      name: "Encolhimento com barra",
      primaryMuscle: "trapezio",
      sets: 3,
      reps: "10-15",
      rest: "60-90s",
      notes: "Foco na contração do trapézio",
      type: "isolation",
    },
  ],
};

/* --------------------------------------------------------
   CONFIGURAÇÕES DE VOLUME POR NÍVEL
-------------------------------------------------------- */

function getVolumeConfig(activityLevel: string): {
  largeMuscleMin: number;
  largeMuscleMax: number;
  smallMuscleMin: number;
  smallMuscleMax: number;
  totalExercisesMax: number;
} {
  const level = activityLevel
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (level.includes("atleta") && level.includes("alto")) {
    return {
      largeMuscleMin: 4, // Reduzido de 5 para 4
      largeMuscleMax: 5, // Reduzido de 8 para 5 ⚠️ CRÍTICO
      smallMuscleMin: 2,
      smallMuscleMax: 3, // Reduzido de 4 para 3
      totalExercisesMax: 10, // Reduzido de 12 para 10 ⚠️ CRÍTICO
    };
  }

  if (level.includes("atleta") || level.includes("avancado")) {
    return {
      largeMuscleMin: 4, // Reduzido de 5 para 4
      largeMuscleMax: 5, // Reduzido de 7 para 5
      smallMuscleMin: 2,
      smallMuscleMax: 3,
      totalExercisesMax: 9, // Reduzido de 10 para 9
    };
  }

  if (level.includes("intermediario")) {
    return {
      largeMuscleMin: 3,
      largeMuscleMax: 4, // Reduzido de 5 para 4
      smallMuscleMin: 1,
      smallMuscleMax: 2,
      totalExercisesMax: 7, // Reduzido de 8 para 7
    };
  }

  if (level.includes("iniciante")) {
    return {
      largeMuscleMin: 2,
      largeMuscleMax: 3, // Reduzido de 4 para 3
      smallMuscleMin: 1,
      smallMuscleMax: 2,
      totalExercisesMax: 6,
    };
  }

  // Default: Moderado
  return {
    largeMuscleMin: 3,
    largeMuscleMax: 4, // Reduzido de 5 para 4
    smallMuscleMin: 1,
    smallMuscleMax: 2,
    totalExercisesMax: 7, // Reduzido de 8 para 7
  };
}

/* --------------------------------------------------------
   FUNÇÃO PRINCIPAL DE GERAÇÃO
-------------------------------------------------------- */

/**
 * Gera um plano de treino completo baseado em padrões pré-definidos
 *
 * @param trainingDays - Número de dias de treino por semana
 * @param activityLevel - Nível de atividade do usuário
 * @param division - Divisão do treino (PPL, Upper/Lower, Full Body)
 * @returns Plano de treino completo e válido
 */
// getOperationalLevel movido para trainingProfileAdapter.ts

export function generateTrainingPlanStructure(
  trainingDays: number,
  activityLevel: string,
  division?: "PPL" | "Upper/Lower" | "Full Body", // 🔴 Removido valor padrão para permitir resolução automática
  availableTimeMinutes?: number,
  imc?: number,
  objective?: string,
  jointLimitations?: boolean, // 🥇 Passo 1: Restrição de ombro
  kneeLimitations?: boolean // 🔴 Restrição de joelho
): TrainingPlan {
  // 📊 NOVO: Criar acumulador de qualidade para rastrear warnings SOFT/FLEXIBLE
  const qualityAccumulator = new PlanQualityAccumulator();
  // 🔥 NOVO: Obter constraints do ProfileAdapter (substitui lógica espalhada)
  // 🔴 Passar division apenas se fornecida explicitamente (não undefined)
  const constraints = adaptUserProfileToConstraints({
    activityLevel,
    frequency: trainingDays,
    ...(division !== undefined && { division }), // Só incluir division se não for undefined
    availableTimeMinutes,
    imc,
    objective,
    jointLimitations, // 🥇 Passo 1: Restrição de ombro
    kneeLimitations, // 🔴 Restrição de joelho
  });

  // 🎯 NOVO: Construir ApprovalContract ANTES de gerar qualquer exercício
  // O contrato consolida TODAS as regras do validador para consulta antecipada
  const approvalContract = buildApprovalContract(
    constraints,
    trainingDays,
    activityLevel,
    objective,
    imc,
    jointLimitations,
    kneeLimitations
  );

  // 🔒 VALIDAÇÃO DE INTEGRIDADE DO CONTRATO (antes de gerar)
  // ⚠️ IMPORTANTE: Esta validação apenas detecta bugs/inconsistências, não bloqueia geração
  const contractValidation = validateContractIntegrity(approvalContract);
  if (!contractValidation.valid) {
    console.error(
      `❌ [CONTRACT VALIDATION] Erros no ApprovalContract antes da geração (indicam bugs):`,
      contractValidation.errors
    );
    // Não bloquear geração - se o contrato está mal formado, o gerador pode tentar continuar
    // mas isso indica um bug que precisa ser corrigido
  }
  if (contractValidation.warnings.length > 0) {
    console.warn(
      `⚠️ [CONTRACT VALIDATION] Avisos no ApprovalContract (podem ser intencionais):`,
      contractValidation.warnings
    );
  }

  // Usar divisão do adapter (não mais fallback)
  const actualDivision = constraints.division;
  const operationalLevel = constraints.operationalLevel;
  const volumeConfig = getVolumeConfig(operationalLevel);
  const weeklySchedule: TrainingDay[] = [];

  // 🔴 CORREÇÃO ESTRUTURAL: Calcular limites semanais ANTES de gerar qualquer dia
  // Detectar déficit calórico para ajustar limites
  const obj = normalize(objective || "");
  const isEmagrecimento =
    obj.includes("emagrec") || obj.includes("perder") || obj.includes("queima");
  const isRecomposicao = !!(
    imc &&
    imc >= 25 &&
    (obj.includes("ganhar") || obj.includes("massa"))
  );
  const hasDeficit = isEmagrecimento || isRecomposicao;
  const deficitMultiplier = hasDeficit ? 0.7 : 1.0;

  // Criar weekState com limites semanais FIXADOS ANTES da geração
  const weeklySeriesLimitsAdjusted = {
    peito: Math.floor(constraints.weeklySeriesLimits.peito * deficitMultiplier),
    costas: Math.floor(
      constraints.weeklySeriesLimits.costas * deficitMultiplier
    ),
    quadriceps: Math.floor(
      constraints.weeklySeriesLimits.quadriceps * deficitMultiplier
    ),
    posterior: Math.floor(
      constraints.weeklySeriesLimits.posterior * deficitMultiplier
    ),
    ombro: Math.floor(constraints.weeklySeriesLimits.ombro * deficitMultiplier),
    triceps: Math.floor(
      constraints.weeklySeriesLimits.triceps * deficitMultiplier
    ),
    biceps: Math.floor(
      constraints.weeklySeriesLimits.biceps * deficitMultiplier
    ),
    gluteos: constraints.weeklySeriesLimits.gluteos
      ? Math.floor(constraints.weeklySeriesLimits.gluteos * deficitMultiplier)
      : 0,
    panturrilhas: constraints.weeklySeriesLimits.panturrilhas
      ? Math.floor(
          constraints.weeklySeriesLimits.panturrilhas * deficitMultiplier
        )
      : 0,
  };

  if (hasDeficit) {
    console.log(
      `🔴 [WEEKSTATE] Limites semanais ajustados para déficit (×${deficitMultiplier}):`,
      {
        peito: `${constraints.weeklySeriesLimits.peito} → ${weeklySeriesLimitsAdjusted.peito}`,
        costas: `${constraints.weeklySeriesLimits.costas} → ${weeklySeriesLimitsAdjusted.costas}`,
        quadriceps: `${constraints.weeklySeriesLimits.quadriceps} → ${weeklySeriesLimitsAdjusted.quadriceps}`,
        ombro: `${constraints.weeklySeriesLimits.ombro} → ${weeklySeriesLimitsAdjusted.ombro}`,
      }
    );
  }

  const weekState: WeekState = {
    muscleWeeklySeries: new Map<string, number>(),
    weeklySeriesLimits: weeklySeriesLimitsAdjusted,
  };

  // Gerar dias baseado na divisão
  if (actualDivision === "PPL") {
    // 🥉 Passo 3: PPL - Criar pplState para variação leve entre dias do mesmo tipo
    const days = ["Push", "Pull", "Legs"];

    // Rastrear exercícios já usados por tipo de dia (Push/Pull/Legs)
    const pplState: Record<string, Set<string>> = {
      Push: new Set(),
      Pull: new Set(),
      Legs: new Set(),
    };

    for (let i = 0; i < trainingDays; i++) {
      const dayType = days[i % days.length];
      const dayLabel =
        dayType === "Push"
          ? `Treino ${i < 3 ? "A" : "D"} – Peito/Tríceps`
          : dayType === "Pull"
            ? `Treino ${i < 3 ? "B" : "E"} – Costas/Bíceps`
            : `Treino ${i < 3 ? "C" : ""} – Pernas`;

      // 🥉 Passo 3: Contar quantas vezes este tipo de dia já foi gerado
      const dayTypeCount = Math.floor(i / days.length);
      const isFirstOccurrence = dayTypeCount === 0;

      const exercises = generateDayExercises(
        dayType,
        volumeConfig,
        i % days.length,
        availableTimeMinutes,
        operationalLevel,
        imc,
        objective,
        activityLevel,
        constraints,
        undefined, // weekState não usado em PPL (mas vamos usar o weekState semanal)
        pplState, // 🥉 Passo 3: Passar pplState para variação leve
        isFirstOccurrence, // 🥉 Passo 3: Indicar se é primeira ocorrência
        weekState, // 🔴 NOVO: Passar weekState para verificar limites semanais
        approvalContract, // 🎯 NOVO: Passar ApprovalContract para consulta antecipada
        qualityAccumulator // 📊 NOVO: Passar acumulador de qualidade
      );

      // 🥉 Passo 3: Atualizar pplState com exercícios adicionados (apenas se não for primeira ocorrência)
      if (!isFirstOccurrence) {
        for (const exercise of exercises) {
          pplState[dayType].add(exercise.name);
        }
      }

      weeklySchedule.push({
        day: dayLabel,
        type: dayType,
        exercises,
      });
    }
  } else if (actualDivision === "Upper/Lower") {
    // Upper/Lower
    const days = ["Upper", "Lower"];
    const dayNames = [
      "Segunda-feira",
      "Terça-feira",
      "Quarta-feira",
      "Quinta-feira",
    ];

    for (let i = 0; i < trainingDays; i++) {
      const dayType = days[i % days.length];
      const dayName = dayNames[i] || `Dia ${i + 1}`;
      const exercises = generateDayExercises(
        dayType,
        volumeConfig,
        i, // ✅ CORREÇÃO: Passar i (índice real) em vez de i % days.length para contar dias Lower corretamente
        availableTimeMinutes,
        operationalLevel,
        imc,
        objective,
        activityLevel,
        constraints,
        undefined, // weekState não usado em Upper/Lower
        undefined, // pplState não usado
        undefined, // isFirstOccurrence não usado
        weekState, // 🔴 NOVO: Passar weekState para verificar limites semanais
        approvalContract, // 🎯 NOVO: Passar ApprovalContract para consulta antecipada
        qualityAccumulator // 📊 NOVO: Passar acumulador de qualidade
      );

      weeklySchedule.push({
        day: `${dayName} – ${dayType === "Upper" ? "Superiores" : "Inferiores"}`,
        type: dayType,
        exercises,
      });
    }
  } else {
    // 🥈 Passo 2: Full Body - Criar weekState para evitar repetição
    const dayNames = ["Segunda-feira", "Terça-feira", "Quarta-feira"];

    // Rastrear exercícios já usados na semana por grupo muscular
    const exerciseWeekState: Record<string, Set<string>> = {
      peitoral: new Set(),
      costas: new Set(),
      quadriceps: new Set(),
      "posterior de coxa": new Set(),
      posterior: new Set(),
      ombros: new Set(),
      biceps: new Set(),
      triceps: new Set(),
    };

    for (let i = 0; i < trainingDays; i++) {
      const dayName = dayNames[i] || `Dia ${i + 1}`;
      const exercises = generateDayExercises(
        "Full Body",
        volumeConfig,
        i, // 🥈 Passo 2: Passar dayIndex correto
        availableTimeMinutes,
        operationalLevel,
        imc,
        objective,
        activityLevel,
        constraints,
        exerciseWeekState, // 🥈 Passo 2: Passar exerciseWeekState para evitar repetição (exercícios)
        undefined, // pplState não usado
        undefined, // isFirstOccurrence não usado
        weekState, // 🔴 NOVO: Passar weekState para verificar limites semanais (séries)
        approvalContract, // 🎯 NOVO: Passar ApprovalContract para consulta antecipada
        qualityAccumulator // 📊 NOVO: Passar acumulador de qualidade
      );

      // 🥈 Passo 2: Atualizar exerciseWeekState com exercícios adicionados
      for (const exercise of exercises) {
        const muscle = normalize(exercise.primaryMuscle);
        // Mapear variações de nomes para chaves do exerciseWeekState
        const muscleKey =
          muscle.includes("peito") || muscle.includes("peitoral")
            ? "peitoral"
            : muscle.includes("costa")
              ? "costas"
              : muscle.includes("quadricep")
                ? "quadriceps"
                : muscle.includes("posterior") || muscle.includes("coxa")
                  ? "posterior"
                  : muscle.includes("ombro")
                    ? "ombros"
                    : muscle.includes("biceps")
                      ? "biceps"
                      : muscle.includes("triceps")
                        ? "triceps"
                        : muscle;

        if (exerciseWeekState[muscleKey]) {
          exerciseWeekState[muscleKey].add(exercise.name);
        }
      }

      weeklySchedule.push({
        day: `${dayName} – Corpo Inteiro`,
        type: "Full Body",
        exercises,
      });
    }
  }

  // Garantir que dias do mesmo tipo tenham os mesmos exercícios
  const plan: TrainingPlan = {
    overview: `Plano de treino ${actualDivision} para ${trainingDays}x por semana, nível operacional ${operationalLevel}${operationalLevel !== activityLevel ? ` (rebaixado de ${activityLevel} por tempo insuficiente)` : ""}.`,
    weeklySchedule,
    progression:
      "Aumentar a carga em 2-5% quando conseguir realizar o topo da faixa de repetições em todas as séries. Após 4-6 semanas, considerar aumentar o número de séries para exercícios principais, se a recuperação permitir.",
  };

  // 🔒 Passar activityLevel para validar limites semanais antes de duplicar
  const { plan: correctedPlan } = correctSameTypeDaysExercises(
    plan,
    activityLevel
  );

  // 🔥 LIMITES SEMANAIS JÁ SÃO APLICADOS DURANTE A GERAÇÃO VIA addExerciseSafely
  // Não é necessário ajustar novamente após a geração

  // 🔒 VALIDAÇÃO DE INTEGRIDADE DO PLANO GERADO (após geração)
  // ⚠️ IMPORTANTE: Esta validação apenas detecta bugs, não substitui o validador principal
  // Se o ApprovalContract foi usado corretamente, essas violações indicam bugs no gerador
  const planIntegrity = validatePlanAgainstContract(
    correctedPlan,
    approvalContract,
    weekState
  );
  if (!planIntegrity.valid) {
    console.error(
      `❌ [PLAN INTEGRITY] Violações HARD detectadas (indicam bugs no gerador):`,
      planIntegrity.violations.filter((v) => v.type === "HARD")
    );
    // Não bloquear retorno - o validador principal fará a validação final
    // Estas violações são para debug/métricas, não para bloquear geração
  }

  // 🔒 VALIDAÇÃO DE PROPRIEDADES INVARIANTES (apenas matemáticas puras)
  // ⚠️ IMPORTANTE: Apenas detecta bugs matemáticos, não revalida regras de negócio
  const invariantValidation = validateInvariantProperties(
    correctedPlan,
    approvalContract
  );
  if (!invariantValidation.valid) {
    console.error(
      `❌ [INVARIANT VALIDATION] Bugs matemáticos detectados:`,
      invariantValidation.errors
    );
    // Não bloquear retorno - estas são propriedades matemáticas que não deveriam ser violadas
    // Se violadas, indicam bugs no código, não problemas de regras
  }
  if (invariantValidation.warnings.length > 0) {
    console.warn(
      `⚠️ [INVARIANT VALIDATION] Avisos FLEXIBLE (não bloqueiam):`,
      invariantValidation.warnings
    );
  }

  // 🔥 VALIDAÇÃO PÓS-GERAÇÃO OBRIGATÓRIA
  // Registrar métrica de rebaixamento se houve mudança de nível (async, não bloqueia retorno)
  if (operationalLevel !== activityLevel && availableTimeMinutes) {
    import("@/lib/metrics/planCorrectionMetrics")
      .then(({ recordPlanCorrection }) => {
        recordPlanCorrection(
          {
            reason: "rebaixamento_por_tempo_insuficiente",
            data: {
              declaredLevel: activityLevel,
              operationalLevel,
              availableTimeMinutes,
              timeRequired: operationalLevel.toLowerCase().includes("atleta")
                ? 75
                : operationalLevel.toLowerCase().includes("avancado")
                  ? 60
                  : operationalLevel.toLowerCase().includes("intermediario")
                    ? 45
                    : 30,
            },
          },
          {
            imc: 0, // Será preenchido pelo caller se disponível
            gender: "Não informado",
            activityLevel: operationalLevel,
            age: 0,
          }
        ).catch(() => {});
      })
      .catch(() => {});
  }

  // 📊 NOVO: Gerar e persistir métrica de qualidade (async, não bloqueia retorno)
  const qualityContext = {
    imc: imc || 0,
    gender: "Não informado", // Será preenchido pelo caller se disponível
    activityLevel: operationalLevel,
    age: 0, // Será preenchido pelo caller se disponível
    objective: objective || undefined,
    trainingDays,
  };
  const qualityMetric = qualityAccumulator.generateMetric(qualityContext);
  recordPlanQuality(qualityMetric).catch(() => {}); // Não bloquear retorno

  return correctedPlan;
}

/**
 * Gera exercícios para um dia específico
 * Garante que compostos venham antes de isoladores dentro de cada grupo
 *
 * NOVO: Usa DayState e constraints para validação em tempo real
 */
function generateDayExercises(
  dayType: string,
  volumeConfig: ReturnType<typeof getVolumeConfig>,
  dayIndex: number,
  availableTimeMinutes?: number,
  operationalLevel?: string,
  imc?: number,
  objective?: string,
  activityLevel?: string,
  constraints?: GenerationConstraints,
  weekState?: Record<string, Set<string>>, // 🥈 Passo 2: WeekState para Full Body (exercícios usados)
  pplState?: Record<string, Set<string>>, // 🥉 Passo 3: PPLState para variação leve
  isFirstOccurrence?: boolean, // 🥉 Passo 3: Se é primeira ocorrência do tipo de dia
  weeklySeriesState?: WeekState, // 🔴 NOVO: Estado semanal para limites de séries
  approvalContract?: ApprovalContract, // 🎯 NOVO: Contrato de aprovação para consulta antecipada
  qualityAccumulator?: PlanQualityAccumulator // 📊 NOVO: Acumulador de qualidade
): Exercise[] {
  let exercises: Exercise[] = [];

  // 🔥 NOVO: Inicializar DayState se constraints fornecidas
  const dayState = constraints ? initDayState(dayType, constraints) : null;

  // 🔒 Restrições articulares agora são validadas pelo ApprovalContract
  // As funções filterKneeExercises e filterShoulderExercises foram removidas
  // O ApprovalContract.canAddExercise verifica restrições por padrão motor

  // 🔴 Helper para normalizar músculo (usado em addTemplatesSafely)
  const normalizeMuscle = (muscle: string): string => {
    const normalized = muscle
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
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
  };

  // 🥉 Passo 3: Helper para seleção com variação leve em PPL
  const selectWithPPLVariation = (
    database: ExerciseTemplate[],
    count: number
  ): ExerciseTemplate[] => {
    // Se não há pplState ou é primeira ocorrência, usar seleção normal
    if (!pplState || !dayType || isFirstOccurrence) {
      return selectDiverseExercises(database, count);
    }

    // Se não há estado para este tipo de dia, usar seleção normal
    if (!pplState[dayType]) {
      return selectDiverseExercises(database, count);
    }

    // Filtrar exercícios já usados neste tipo de dia
    const usedNames = pplState[dayType];
    const available = database.filter((ex) => !usedNames.has(ex.name));

    // Se há exercícios disponíveis, usar eles (variação leve)
    if (available.length >= count) {
      return selectDiverseExercises(available, count);
    }

    // Se não há exercícios suficientes disponíveis, usar todos (permitir repetição)
    // Isso é "variação leve" - tenta variar, mas não é obrigatório
    if (available.length > 0) {
      // Usar os disponíveis + alguns já usados se necessário
      const selected = selectDiverseExercises(available, available.length);
      const stillNeeded = count - selected.length;
      if (stillNeeded > 0) {
        const used = database.filter((ex) => usedNames.has(ex.name));
        const additional = selectDiverseExercises(used, stillNeeded);
        return [...selected, ...additional];
      }
      return selected;
    }

    // Se não há nenhum disponível, usar todos (reset)
    return selectDiverseExercises(database, count);
  };

  // 🔥 NOVO: Helper para adicionar templates com validação
  // constraints e dayState são OBRIGATÓRIOS (sempre vêm do ProfileAdapter)
  // 🔴 NOVO: Verifica limites semanais ANTES de adicionar
  const addTemplatesSafely = (
    templates: ExerciseTemplate[],
    logGroup?: string
  ) => {
    if (!dayState || !constraints) {
      throw new Error(
        "DayState e constraints são obrigatórios. Verifique se adaptUserProfileToConstraints foi chamado."
      );
    }

    // 🎯 NOVO: Consultar ApprovalContract ANTES de processar templates
    // ✅ CORREÇÃO 1: Corte por sessão ANTES de processar templates
    if (dayState.exercises.length >= constraints.maxExercisesPerSession) {
      if (logGroup) {
        console.warn(
          `⚠️ [${logGroup}] Parando adição: limite de ${constraints.maxExercisesPerSession} exercícios por sessão atingido (atual: ${dayState.exercises.length})`
        );
      }
      return; // Parar imediatamente, não processar mais templates
    }

    // 🔴 Calcular minSetsPerExercise baseado em déficit calórico
    const obj = normalize(objective || "");
    const isEmagrecimento =
      obj.includes("emagrec") ||
      obj.includes("perder") ||
      obj.includes("queima");
    const isRecomposicao = !!(
      imc &&
      imc >= 25 &&
      (obj.includes("ganhar") || obj.includes("massa"))
    );
    const hasDeficit = isEmagrecimento || isRecomposicao;
    const minSetsPerExercise = hasDeficit ? 1 : 2; // 1 série em déficit, 2 normalmente

    // 🎯 NOVO: Consultar ApprovalContract ANTES de selecionar templates
    // ✅ CORREÇÃO 2: Verificar capacidade semanal ANTES de selecionar templates
    // Filtrar templates que não podem ser adicionados por falta de capacidade semanal
    const templatesWithCapacity: ExerciseTemplate[] = [];
    for (const template of templates) {
      if (weeklySeriesState && approvalContract) {
        const primaryMuscle = normalizeMuscle(template.primaryMuscle);

        // 🎯 Consultar ApprovalContract para verificar se pode adicionar exercício à semana
        const weekCheck = approvalContract.canAddExerciseToWeek(
          primaryMuscle,
          minSetsPerExercise, // Usar séries mínimas para verificação conservadora
          weeklySeriesState.muscleWeeklySeries
        );

        if (!weekCheck.allowed) {
          // Não há capacidade semanal suficiente, pular este template
          if (logGroup) {
            console.warn(
              `⚠️ [${logGroup}] Template ${template.name} pulado: ${weekCheck.reason || "capacidade semanal insuficiente"}`
            );
          }
          continue;
        }
      } else if (weeklySeriesState) {
        // Fallback para lógica antiga se não houver contrato
        const primaryMuscle = normalizeMuscle(template.primaryMuscle);
        const currentWeeklySeries =
          weeklySeriesState.muscleWeeklySeries.get(primaryMuscle) || 0;
        const weeklyLimit = weeklySeriesState.weeklySeriesLimits[primaryMuscle];

        if (weeklyLimit) {
          const remainingWeeklyCapacity = weeklyLimit - currentWeeklySeries;
          if (remainingWeeklyCapacity < minSetsPerExercise) {
            // Não há capacidade semanal suficiente, pular este template
            if (logGroup) {
              console.warn(
                `⚠️ [${logGroup}] Template ${template.name} pulado: capacidade semanal insuficiente (${remainingWeeklyCapacity} < ${minSetsPerExercise})`
              );
            }
            continue;
          }
        }
      }
      templatesWithCapacity.push(template);
    }

    // Processar apenas templates com capacidade semanal
    for (const template of templatesWithCapacity) {
      // ✅ CORREÇÃO 1 (repetida): Verificar limite de sessão antes de cada exercício
      if (dayState.exercises.length >= constraints.maxExercisesPerSession) {
        if (logGroup) {
          console.warn(
            `⚠️ [${logGroup}] Parando adição: limite de ${constraints.maxExercisesPerSession} exercícios por sessão atingido`
          );
        }
        break; // Parar loop, não adicionar mais exercícios
      }

      const exercise = convertTemplateToExercise(
        template,
        imc,
        objective,
        activityLevel,
        hasDeficit // ✅ CORREÇÃO 3: Passar hasDeficit para forçar séries = 1
      );

      // 🎯 NOVO: Consultar ApprovalContract ANTES de adicionar exercício
      // 🔒 HARD RULE: Verificar restrições articulares e limites semanais
      if (approvalContract && weeklySeriesState) {
        // 1. Verificar restrições articulares e limites de sessão/padrão motor
        const patternCounts = new Map<string, number>();
        for (const ex of dayState.exercises) {
          const pattern = detectMotorPattern(ex);
          if (pattern && pattern !== "unknown") {
            patternCounts.set(pattern, (patternCounts.get(pattern) || 0) + 1);
          }
        }

        const sessionCheck = approvalContract.canAddExercise(exercise, {
          currentDayExercises: dayState.exercises.length,
          currentPatternCounts: patternCounts,
        });

        // 🔒 HARD: Rejeitar (nunca permitir)
        if (!sessionCheck.allowed && sessionCheck.reasonType === "HARD") {
          if (logGroup) {
            console.warn(
              `⚠️ [${logGroup}] Exercício ${exercise.name} rejeitado pelo contrato (HARD): ${sessionCheck.reason}`
            );
          }
          continue; // Pular este exercício, não adicionar
        }

        // 📊 SOFT: Não bloqueia, mas indica preferência por evitar
        // O gerador deve PREFERIR exercícios alternativos quando possível
        // Se não houver alternativa, permite com warning (nunca bloqueia a geração)
        if (sessionCheck.allowed && sessionCheck.reasonType === "SOFT") {
          // ✅ SOFT permite adicionar, mas o gerador já prioriza alternativas
          // (separação por padrão motor já faz isso - ex: ombrosNonVerticalPush vs ombrosVerticalPush)
          // Se chegou aqui, não havia alternativa melhor disponível
          if (logGroup) {
            console.warn(
              `⚠️ [${logGroup}] ${sessionCheck.reason} (adicionando por falta de alternativa melhor)`
            );
          }
          // 📊 NOVO: Registrar warning SOFT no acumulador
          if (qualityAccumulator) {
            qualityAccumulator.register(sessionCheck, { exercise });
          }
          // Continuar adicionando (SOFT não bloqueia a geração do plano)
        }

        // 2. Verificar limites semanais
        const primaryMuscle = normalizeMuscle(exercise.primaryMuscle);
        const weekCheck = approvalContract.canAddExerciseToWeek(
          primaryMuscle,
          exercise.sets,
          weeklySeriesState.muscleWeeklySeries
        );

        if (!weekCheck.allowed) {
          if (logGroup) {
            console.warn(
              `⚠️ [${logGroup}] Exercício ${exercise.name} rejeitado pelo contrato (limite semanal): ${weekCheck.reason}`
            );
          }
          continue; // Pular este exercício, não adicionar
        }
      }

      const result = addExerciseSafely(
        exercise,
        dayState,
        constraints,
        exercises,
        {
          logRejections: true,
          logLevel: "warn",
          weekState: weeklySeriesState, // 🔴 NOVO: Passar weekState para verificar limites semanais
          minSetsPerExercise, // 🔴 NOVO: Passar minSetsPerExercise para considerar mínimo em déficit
        }
      );
      if (!result.allowed && logGroup) {
        console.warn(
          `⚠️ [${logGroup}] Exercício ${exercise.name} rejeitado: ${result.reason}`
        );
      }
    }
  };

  // Função auxiliar para ordenar: compostos primeiro, depois isoladores
  const sortByType = (templates: ExerciseTemplate[]): ExerciseTemplate[] => {
    const compounds = templates.filter((ex) => ex.type === "compound");
    const isolations = templates.filter(
      (ex) => ex.type === "isolation" || !ex.type
    );
    return [...compounds, ...isolations];
  };

  // Função auxiliar para detectar padrão motor vertical_push
  const isVerticalPush = (template: ExerciseTemplate): boolean => {
    const name = template.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    const primary = template.primaryMuscle
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    // Excluir leg press e outros presses horizontais
    if (
      name.includes("leg press") ||
      name.includes("bench press") ||
      name.includes("supino")
    ) {
      return false;
    }

    return (
      name.includes("desenvolvimento") ||
      (name.includes("press") && primary.includes("ombro")) ||
      name.includes("military") ||
      name.includes("overhead") ||
      (primary.includes("ombro") && name.includes("desenvolvimento"))
    );
  };

  // Função auxiliar para detectar padrão motor vertical_pull
  const isVerticalPull = (template: ExerciseTemplate): boolean => {
    const name = template.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    const primary = template.primaryMuscle
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    // Excluir "Face pull" que é horizontal, não vertical
    if (name.includes("face pull")) {
      return false;
    }

    return (
      name.includes("puxada") ||
      name.includes("pull") ||
      name.includes("chin-up") ||
      name.includes("lat pulldown") ||
      (primary.includes("costas") &&
        (name.includes("frente") ||
          name.includes("atras") ||
          name.includes("barra fixa")))
    );
  };

  // Função auxiliar para detectar padrão motor hinge
  const isHinge = (template: ExerciseTemplate): boolean => {
    const name = template.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

    return (
      name.includes("stiff") ||
      name.includes("rdl") ||
      name.includes("romanian") ||
      name.includes("good morning") ||
      name.includes("hip thrust") ||
      name.includes("glute bridge") ||
      (name.includes("deadlift") && !name.includes("romanian"))
    );
  };

  // Função auxiliar para detectar padrão motor squat
  const isSquat = (template: ExerciseTemplate): boolean => {
    const name = template.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

    return (
      name.includes("agachamento") ||
      name.includes("squat") ||
      name.includes("leg press") ||
      name.includes("hack squat") ||
      name.includes("bulgarian") ||
      name.includes("búlgaro") ||
      name.includes("afundo") ||
      name.includes("lunge")
    );
  };

  if (dayType === "Push") {
    // Push: Peito (PRIMÁRIO - 60-70% do volume) + Ombros (SECUNDÁRIO - mínimo 1) + Tríceps (PEQUENO - máximo 30%)
    // 🔴 Limitar totalExercises pelo maxExercisesPerSession se disponível
    const pushMaxAllowed =
      constraints?.maxExercisesPerSession || volumeConfig.totalExercisesMax;
    const totalExercises = Math.min(
      volumeConfig.totalExercisesMax,
      volumeConfig.largeMuscleMax + volumeConfig.smallMuscleMax,
      pushMaxAllowed // 🔴 Respeitar limite do perfil
    );

    // 🔥 PISO TÉCNICO: Grupos grandes mínimo 3, 4 quando nível operacional = Atleta
    const isOperationalAthlete =
      operationalLevel?.toLowerCase().includes("atleta") ?? false;
    const minLargeMuscle = isOperationalAthlete ? 4 : 3;

    // Peito recebe 60-70% do volume total (PRIMÁRIO)
    const peitoCount = Math.max(
      Math.max(volumeConfig.largeMuscleMin, minLargeMuscle), // Garantir piso técnico
      Math.min(
        volumeConfig.largeMuscleMax,
        Math.floor(totalExercises * 0.65) // 65% para peito
      )
    );
    // Limitar padrão motor horizontal: no máximo 2 exercícios de peito
    const peitoCountLimited = Math.min(peitoCount, 2);

    // 🔥 PISO TÉCNICO: Grupos médios mínimo 2 exercícios
    const minMediumMuscle = 2;
    let ombrosCount = isOperationalAthlete
      ? Math.max(minMediumMuscle, Math.min(4, Math.floor(totalExercises * 0.2))) // Atleta: mínimo 2, ideal 3-4
      : Math.max(
          minMediumMuscle,
          Math.min(2, Math.floor(totalExercises * 0.15))
        ); // Outros: mínimo 2

    // Tríceps: máximo 30% do total (PEQUENO)
    let tricepsCount = Math.min(
      volumeConfig.smallMuscleMax,
      Math.floor(totalExercises * 0.3)
    );

    // 🔴 Verificar se o total planejado excede maxExercisesPerSession
    const totalPlanned = peitoCountLimited + ombrosCount + tricepsCount;
    if (totalPlanned > pushMaxAllowed) {
      // Reduzir proporcionalmente, priorizando grupos grandes
      const excess = totalPlanned - pushMaxAllowed;
      // Reduzir ombros primeiro (grupo médio, pode ter 1 em vez de 2)
      if (ombrosCount > 1 && excess > 0) {
        ombrosCount = Math.max(1, ombrosCount - Math.min(excess, 1));
      }
      // Se ainda há excesso, reduzir tríceps
      const remainingExcess =
        totalPlanned - (peitoCountLimited + ombrosCount + tricepsCount);
      if (remainingExcess > 0 && tricepsCount > 0) {
        tricepsCount = Math.max(0, tricepsCount - remainingExcess);
      }
    }

    // Adicionar exercícios de peito (PRIMÁRIO - GRANDES PRIMEIRO)
    // 🥉 Passo 3: Selecionar com variação leve em PPL
    const peitoTemplates = selectWithPPLVariation(
      sortByType(EXERCISE_DATABASE.peitoral),
      peitoCountLimited
    );

    // 🔥 NOVO: Adicionar com validação em tempo real
    addTemplatesSafely(peitoTemplates, "Peito");

    // Adicionar exercícios de ombros (SECUNDÁRIO - mínimo 1)
    // 🔒 Restrições articulares agora são validadas pelo ApprovalContract
    const ombrosAvailable = EXERCISE_DATABASE.ombros;
    // Limitar padrão motor vertical_push: no máximo 1 exercício NO TOTAL
    const ombrosSorted = sortByType(ombrosAvailable);
    const ombrosVerticalPush = ombrosSorted.filter(isVerticalPush);
    const ombrosNonVerticalPush = ombrosSorted.filter(
      (t) => !isVerticalPush(t)
    );

    console.log(
      `🔍 [ANTES] Ombros disponíveis: ${ombrosVerticalPush.length} vertical_push, ${ombrosNonVerticalPush.length} não-vertical`
    );

    // Verificar quantos exercícios vertical_push já foram adicionados
    const currentVerticalPushCount = exercises.filter((ex) => {
      const name = ex.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      const primary = ex.primaryMuscle
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      // Excluir leg press e outros presses horizontais
      if (
        name.includes("leg press") ||
        name.includes("bench press") ||
        name.includes("supino")
      ) {
        return false;
      }

      return (
        name.includes("desenvolvimento") ||
        (name.includes("press") && primary.includes("ombro")) ||
        name.includes("military") ||
        name.includes("overhead") ||
        (primary.includes("ombro") && name.includes("desenvolvimento"))
      );
    }).length;

    // Limitar padrão motor vertical_push: no máximo 1 exercício no total
    const remainingVerticalPushSlots = Math.max(
      0,
      1 - currentVerticalPushCount
    );

    console.log(
      `🔍 [CONTAGEM] currentVerticalPush=${currentVerticalPushCount}, remainingSlots=${remainingVerticalPushSlots}, ombrosCount=${ombrosCount}`
    );

    // Selecionar no máximo 1 exercício vertical_push (se permitido)
    // GARANTIR: nunca selecionar mais que remainingVerticalPushSlots (máximo 1)
    const verticalPushSelected =
      remainingVerticalPushSlots > 0 && ombrosVerticalPush.length > 0
        ? selectDiverseExercises(
            ombrosVerticalPush,
            Math.min(remainingVerticalPushSlots, 1) // FORÇAR máximo 1
          ).slice(0, Math.min(remainingVerticalPushSlots, 1)) // DUPLA GARANTIA
        : [];

    console.log(
      `🔍 [SELEÇÃO] verticalPushSelected=${verticalPushSelected.length}, nomes=${verticalPushSelected.map((t) => t.name).join(", ")}`
    );

    // Garantir que sempre temos pelo menos 1 exercício de ombro
    // Se não há vertical_push disponível ou já temos 1, usar apenas non-vertical
    const minOmbrosNeeded = Math.max(1, ombrosCount);
    const remainingCount = Math.max(
      0,
      minOmbrosNeeded - verticalPushSelected.length
    );

    const nonVerticalPushSelected =
      remainingCount > 0 && ombrosNonVerticalPush.length > 0
        ? selectDiverseExercises(
            ombrosNonVerticalPush,
            Math.min(remainingCount, ombrosNonVerticalPush.length)
          )
        : [];

    // Se ainda precisamos de mais exercícios, adicionar apenas non-vertical
    let additionalTemplates: ExerciseTemplate[] = [];
    const totalSelected =
      verticalPushSelected.length + nonVerticalPushSelected.length;
    if (totalSelected < ombrosCount && ombrosNonVerticalPush.length > 0) {
      const stillNeeded = ombrosCount - totalSelected;
      const alreadySelectedNames = new Set([
        ...nonVerticalPushSelected.map((t) => t.name),
        ...verticalPushSelected.map((t) => t.name),
      ]);
      const available = ombrosNonVerticalPush.filter(
        (t) => !alreadySelectedNames.has(t.name)
      );
      if (available.length > 0) {
        additionalTemplates = selectDiverseExercises(
          available,
          Math.min(stillNeeded, available.length)
        );
      }
    }

    // Validação final CRÍTICA: garantir que não exceda o limite de vertical_push
    // Separar templates em vertical_push e não-vertical_push
    const allSelectedTemplates = [
      ...verticalPushSelected,
      ...nonVerticalPushSelected,
      ...additionalTemplates,
    ];

    const verticalPushTemplates = allSelectedTemplates.filter((t) =>
      isVerticalPush(t)
    );
    const nonVerticalTemplates = allSelectedTemplates.filter(
      (t) => !isVerticalPush(t)
    );

    // Calcular quantos vertical_push podemos adicionar (máximo 1 no total)
    const allowedVerticalPush = Math.max(0, 1 - currentVerticalPushCount);
    const verticalPushToAdd = verticalPushTemplates.slice(
      0,
      Math.min(allowedVerticalPush, 1) // FORÇAR máximo 1
    );

    // Adicionar todos os não-vertical disponíveis
    const nonVerticalToAdd = nonVerticalTemplates;

    // Combinar: vertical_push permitidos + todos os não-vertical
    const finalTemplates = [...verticalPushToAdd, ...nonVerticalToAdd];

    // Garantir pelo menos 1 exercício de ombro
    if (finalTemplates.length === 0 && allSelectedTemplates.length > 0) {
      // Fallback: se não há nenhum, pegar o primeiro não-vertical disponível
      const fallback =
        nonVerticalTemplates.length > 0
          ? nonVerticalTemplates[0]
          : allSelectedTemplates[0];
      if (fallback) {
        finalTemplates.push(fallback);
      }
    }

    console.log(
      `🔍 [FINAL] allSelectedTemplates=${allSelectedTemplates.length} (${verticalPushTemplates.length} vertical_push, ${nonVerticalTemplates.length} não-vertical)`
    );
    console.log(
      `🔍 [FINAL] allowedVerticalPush=${allowedVerticalPush}, verticalPushToAdd=${verticalPushToAdd.length}, nonVerticalToAdd=${nonVerticalToAdd.length}`
    );
    console.log(
      `🔍 [FINAL] finalTemplates=${finalTemplates.length}, nomes=${finalTemplates.map((t) => t.name).join(", ")}`
    );

    // VALIDAÇÃO FINAL ABSOLUTA: verificar quantos vertical_push teremos após adicionar
    const verticalPushInFinal = finalTemplates.filter((t) =>
      isVerticalPush(t)
    ).length;
    const totalVerticalPushAfter =
      currentVerticalPushCount + verticalPushInFinal;

    if (totalVerticalPushAfter > 1) {
      console.error(
        `❌ [ERRO CRÍTICO] Tentando adicionar ${verticalPushInFinal} vertical_push quando já temos ${currentVerticalPushCount}. Total seria ${totalVerticalPushAfter}, mas limite é 1!`
      );
      // Forçar apenas 1 vertical_push no máximo
      const safeVerticalPush = finalTemplates
        .filter((t) => isVerticalPush(t))
        .slice(0, Math.max(0, 1 - currentVerticalPushCount));
      const safeNonVertical = finalTemplates.filter((t) => !isVerticalPush(t));
      const safeFinal = [...safeVerticalPush, ...safeNonVertical];
      console.log(
        `🔧 [CORREÇÃO] Ajustando para ${safeFinal.length} templates (${safeVerticalPush.length} vertical_push, ${safeNonVertical.length} não-vertical)`
      );
      addTemplatesSafely(safeFinal, "Ombros (corrigido)");
    } else {
      addTemplatesSafely(finalTemplates, "Ombros");
    }

    // Adicionar exercícios de tríceps (PEQUENOS DEPOIS)
    // 🥉 Passo 3: Selecionar com variação leve em PPL
    const tricepsTemplates = selectWithPPLVariation(
      sortByType(EXERCISE_DATABASE.triceps),
      tricepsCount
    );
    addTemplatesSafely(tricepsTemplates, "Tríceps");
  } else if (dayType === "Pull") {
    // Pull: Costas (PRIMÁRIO - 60-70% do volume) + Posterior de ombro (SECUNDÁRIO - mínimo 1) + Bíceps (PEQUENO - máximo 30%)
    // 🔴 Limitar totalExercises pelo maxExercisesPerSession se disponível
    const pullMaxAllowed =
      constraints?.maxExercisesPerSession || volumeConfig.totalExercisesMax;
    const totalExercises = Math.min(
      volumeConfig.totalExercisesMax,
      volumeConfig.largeMuscleMax + volumeConfig.smallMuscleMax,
      pullMaxAllowed // 🔴 Respeitar limite do perfil
    );

    // 🔥 PISO TÉCNICO: Grupos grandes mínimo 3, 4 quando nível operacional = Atleta
    const isOperationalAthlete =
      operationalLevel?.toLowerCase().includes("atleta") ?? false;
    const minLargeMuscle = isOperationalAthlete ? 4 : 3;

    // Costas recebe 60-70% do volume total (PRIMÁRIO)
    const costasCount = Math.max(
      Math.max(volumeConfig.largeMuscleMin, minLargeMuscle), // Garantir piso técnico
      Math.min(
        volumeConfig.largeMuscleMax,
        Math.floor(totalExercises * 0.65) // 65% para costas
      )
    );

    // 🔥 PISO TÉCNICO: Grupos médios mínimo 2 exercícios
    const minMediumMuscle = 2;
    const ombrosPosteriorCount = Math.max(
      minMediumMuscle,
      Math.min(2, Math.floor(totalExercises * 0.15))
    );
    // Usar face pull e elevação lateral invertida para posterior
    // 🔒 Restrições articulares agora são validadas pelo ApprovalContract
    const ombrosAvailable = EXERCISE_DATABASE.ombros;
    const ombrosPosteriorExercises = ombrosAvailable
      .filter(
        (ex) => ex.name.includes("Face pull") || ex.name.includes("invertida")
      )
      .slice(0, ombrosPosteriorCount);

    // Bíceps: máximo 30% do total (PEQUENO)
    const bicepsCount = Math.min(
      volumeConfig.smallMuscleMax,
      Math.floor(totalExercises * 0.3)
    );

    // Adicionar exercícios de costas (PRIMÁRIO - GRANDES PRIMEIRO)
    // Limitar padrão motor vertical_pull: no máximo 1 exercício
    const costasSorted = sortByType(EXERCISE_DATABASE.costas);
    const costasVerticalPull = costasSorted.filter(isVerticalPull);
    const costasNonVerticalPull = costasSorted.filter(
      (t) => !isVerticalPull(t)
    );

    // Debug: listar exercícios detectados
    console.log(
      `🔍 [Pull Day] Exercícios de costas detectados como vertical_pull: ${costasVerticalPull.map((e) => e.name).join(", ")}`
    );
    console.log(
      `🔍 [Pull Day] Exercícios de costas NÃO vertical_pull: ${costasNonVerticalPull.map((e) => e.name).join(", ")}`
    );

    // Selecionar no máximo 1 exercício com padrão vertical_pull
    // 🥉 Passo 3: Aplicar variação leve
    const verticalPullSelected =
      costasVerticalPull.length > 0
        ? selectWithPPLVariation(costasVerticalPull, 1).slice(0, 1)
        : [];
    const remainingCostasCount = Math.max(
      0,
      costasCount - verticalPullSelected.length
    );
    const nonVerticalPullSelected =
      remainingCostasCount > 0
        ? selectWithPPLVariation(costasNonVerticalPull, remainingCostasCount)
        : [];

    let costasTemplates = [...verticalPullSelected, ...nonVerticalPullSelected];

    // Substituir "Puxada na barra fixa" por "Barra fixa assistida" para níveis Sedentário e Moderado
    const normalizedLevelForSubstitution = activityLevel
      ?.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
    const isBeginnerLevel =
      normalizedLevelForSubstitution?.includes("sedentario") ||
      normalizedLevelForSubstitution?.includes("moderado");

    console.log(
      `🔍 [Pull Day] ActivityLevel: "${activityLevel}", normalizado: "${normalizedLevelForSubstitution}", isBeginnerLevel: ${isBeginnerLevel}`
    );

    if (isBeginnerLevel) {
      const barraFixaIndex = costasTemplates.findIndex(
        (t) => t.name === "Puxada na barra fixa"
      );
      console.log(
        `🔍 [Pull Day] Índice de "Puxada na barra fixa": ${barraFixaIndex}`
      );
      if (barraFixaIndex !== -1) {
        const barraAssistida = EXERCISE_DATABASE.costas.find(
          (t) => t.name === "Barra fixa assistida"
        );
        console.log(
          `🔍 [Pull Day] "Barra fixa assistida" encontrada: ${!!barraAssistida}`
        );
        if (barraAssistida) {
          costasTemplates[barraFixaIndex] = barraAssistida;
          console.log(
            `🔧 [Pull Day] Substituído "Puxada na barra fixa" por "Barra fixa assistida" (nível: ${activityLevel})`
          );
        } else {
          console.warn(
            `⚠️ [Pull Day] "Barra fixa assistida" não encontrada no banco de exercícios!`
          );
        }
      } else {
        console.log(
          `ℹ️ [Pull Day] "Puxada na barra fixa" não encontrada nos templates selecionados`
        );
      }
    }

    // Verificação final: garantir que apenas 1 exercício vertical_pull seja mantido
    // Re-verificar todos os exercícios selecionados para garantir consistência
    const finalVerticalPull = costasTemplates.filter(isVerticalPull);
    if (finalVerticalPull.length > 1) {
      console.warn(
        `⚠️ [Pull Day] Detectados ${finalVerticalPull.length} exercícios vertical_pull após seleção: ${finalVerticalPull.map((e) => e.name).join(", ")}`
      );
      // Manter apenas o primeiro e remover os demais
      const toRemove = finalVerticalPull.slice(1);
      costasTemplates = costasTemplates.filter((t) => !toRemove.includes(t));
      console.log(
        `🔧 [Pull Day] Removidos exercícios extras vertical_pull. Mantido apenas: ${finalVerticalPull[0].name}`
      );
    }

    // Debug: verificar exercícios finais selecionados
    console.log(
      `🔍 [Pull Day] Exercícios de costas selecionados (final): ${costasTemplates.map((e) => e.name).join(", ")}`
    );
    console.log(
      `🔍 [Pull Day] vertical_pull selecionados: ${verticalPullSelected.map((e) => e.name).join(", ")} (total: ${verticalPullSelected.length})`
    );

    addTemplatesSafely(costasTemplates, "Costas");

    // Adicionar exercícios de ombros posteriores (SECUNDÁRIO - mínimo 1)
    // IMPORTANTE: Se já houver 1 exercício vertical_pull, não adicionar "Face pull"
    // porque o validador detecta "Face pull" como vertical_pull (contém "pull" no nome)
    const hasVerticalPull = costasTemplates.some((t) => isVerticalPull(t));
    const ombrosPosteriorFiltered = hasVerticalPull
      ? ombrosPosteriorExercises.filter((ex) => !ex.name.includes("Face pull"))
      : ombrosPosteriorExercises;

    // Se filtramos "Face pull" e não há outros exercícios de ombros posteriores,
    // adicionar um exercício alternativo de ombros
    if (hasVerticalPull && ombrosPosteriorFiltered.length === 0) {
      // 🔒 Restrições articulares agora são validadas pelo ApprovalContract
      const ombrosAvailable = EXERCISE_DATABASE.ombros;
      const alternativeOmbros = ombrosAvailable.filter(
        (ex) =>
          !ex.name.includes("Face pull") &&
          !ex.name.includes("desenvolvimento") &&
          !ex.name.includes("press") &&
          !ex.name.includes("military")
      );
      if (alternativeOmbros.length > 0) {
        ombrosPosteriorFiltered.push(
          ...selectDiverseExercises(alternativeOmbros, 1)
        );
      }
    }

    addTemplatesSafely(ombrosPosteriorFiltered, "Ombros Posterior");

    // Adicionar exercícios de bíceps (PEQUENOS DEPOIS)
    // 🥉 Passo 3: Selecionar com variação leve em PPL
    const bicepsTemplates = selectWithPPLVariation(
      sortByType(EXERCISE_DATABASE.biceps),
      bicepsCount
    );
    addTemplatesSafely(bicepsTemplates, "Bíceps");
  } else if (dayType === "Legs" || dayType === "Lower") {
    // Legs: Quadríceps (PRIMÁRIO) + Posterior (PRIMÁRIO) + Panturrilhas (PEQUENO)
    // Obter limite máximo de exercícios por músculo do perfil
    const profile = getTrainingProfile(activityLevel || "Moderado");
    const maxExercisesPerMuscle = profile.maxExercisesPerMuscle;
    // 🔴 Obter limite máximo de exercícios por sessão
    const maxExercisesPerSession =
      constraints?.maxExercisesPerSession || profile.maxExercisesPerSession;

    // Ajustar volume baseado no nível para evitar sobrecarga
    const isAthlete = volumeConfig.largeMuscleMin >= 5;
    const isAdvanced =
      volumeConfig.largeMuscleMin >= 4 && volumeConfig.largeMuscleMin < 5;

    let quadCount: number;
    let posteriorCount: number;

    if (isAthlete) {
      // Atleta: 9-11 exercícios totais (ajustado para caber em 60min)
      // Reduzir um pouco para garantir que cabe no tempo após ajuste de descanso
      quadCount = 4; // Reduzido de 5 para 4
      posteriorCount = 4; // Reduzido de 5 para 4
    } else if (isAdvanced) {
      // Avançado: 7-9 exercícios totais
      quadCount = 4;
      posteriorCount = 3;
    } else {
      // Intermediário/Iniciante: 5-7 exercícios totais
      quadCount = Math.max(volumeConfig.largeMuscleMin, 3);
      posteriorCount = Math.max(volumeConfig.largeMuscleMin - 1, 2);
    }

    // Ajustar para respeitar limite máximo de exercícios por músculo
    quadCount = Math.min(quadCount, maxExercisesPerMuscle);
    posteriorCount = Math.min(posteriorCount, maxExercisesPerMuscle);

    // 🎯 NOVO: Usar ApprovalContract para calcular quadCount baseado em limite semanal
    if (approvalContract && weeklySeriesState) {
      const primaryMuscle = "quadriceps";
      const currentWeeklySeries =
        weeklySeriesState.muscleWeeklySeries.get(primaryMuscle) || 0;
      const weeklyLimit = approvalContract.weeklySeriesLimits[primaryMuscle];

      if (weeklyLimit) {
        const remainingWeeklyCapacity = weeklyLimit - currentWeeklySeries;

        // ✅ CORREÇÃO: Calcular quantos dias Lower RESTAM para serem gerados
        // Para Upper/Lower com 4 dias, são 2 dias Lower no total
        // Contar quantos dias Lower já foram gerados baseado no dayIndex
        // Para Upper/Lower: dias 0,2 = Upper; dias 1,3 = Lower
        const totalLowerDays = 2; // Upper/Lower com 4 dias = 2 dias Lower

        // Contar quantos dias Lower já foram gerados (dayIndex ímpar = Lower)
        // dayIndex=0: Upper (0 Lower gerados)
        // dayIndex=1: Lower (1 Lower gerado)
        // dayIndex=2: Upper (1 Lower gerado)
        // dayIndex=3: Lower (2 Lower gerados)
        const lowerDaysGenerated = Math.floor((dayIndex + 1) / 2);

        const remainingLowerDays = Math.max(
          1,
          totalLowerDays - lowerDaysGenerated
        );

        // 🎯 Usar ApprovalContract para calcular máximo de exercícios
        const maxExercisesPerLowerDay =
          approvalContract.getMaxExercisesForMuscle(
            primaryMuscle,
            remainingWeeklyCapacity,
            remainingLowerDays
          );

        console.log(
          `🔍 [APPROVAL CONTRACT] dayIndex=${dayIndex}, dayType=${dayType}, currentWeeklySeries=${currentWeeklySeries}, weeklyLimit=${weeklyLimit}, remainingWeeklyCapacity=${remainingWeeklyCapacity}, lowerDaysGenerated=${lowerDaysGenerated}, remainingLowerDays=${remainingLowerDays}, maxExercisesPerLowerDay=${maxExercisesPerLowerDay}, quadCount atual=${quadCount}`
        );

        // Ajustar quadCount para não exceder capacidade semanal
        if (maxExercisesPerLowerDay < quadCount) {
          console.log(
            `🔴 [APPROVAL CONTRACT] Ajustando quadCount: ${quadCount} → ${maxExercisesPerLowerDay} (capacidade semanal restante: ${remainingWeeklyCapacity}, ${remainingLowerDays} dias Lower restantes, dayIndex=${dayIndex})`
          );
          quadCount = Math.max(1, maxExercisesPerLowerDay); // Mínimo 1 exercício
        }
      }
    }

    const panturrilhasCount = volumeConfig.smallMuscleMin;

    // 🔴 Verificar se o total planejado excede maxExercisesPerSession
    const totalPlanned = quadCount + posteriorCount + panturrilhasCount;
    if (totalPlanned > maxExercisesPerSession) {
      // Reduzir proporcionalmente, priorizando grupos grandes
      const excess = totalPlanned - maxExercisesPerSession;
      // Reduzir panturrilhas primeiro (grupo pequeno)
      if (panturrilhasCount > 0 && excess > 0) {
        const panturrilhasReduced = Math.max(0, panturrilhasCount - excess);
        // Se ainda há excesso, reduzir posterior
        const remainingExcess =
          excess - (panturrilhasCount - panturrilhasReduced);
        if (remainingExcess > 0 && posteriorCount > 2) {
          posteriorCount = Math.max(2, posteriorCount - remainingExcess);
        }
      }
    }

    // Adicionar exercícios de quadríceps (PRIMÁRIO - GRANDES PRIMEIRO)
    // 🔒 Restrições articulares agora são validadas pelo ApprovalContract
    const quadAvailable = EXERCISE_DATABASE.quadriceps;
    // Limitar padrão motor squat: no máximo 2 exercícios
    const quadSorted = sortByType(quadAvailable);
    const quadSquat = quadSorted.filter(isSquat);
    const quadNonSquat = quadSorted.filter((t) => !isSquat(t));

    // Selecionar no máximo 2 exercícios com padrão squat
    // 🥉 Passo 3: Aplicar variação leve
    const squatSelected =
      quadSquat.length > 0
        ? selectWithPPLVariation(quadSquat, 2).slice(0, 2)
        : [];
    const remainingQuadCount = Math.max(0, quadCount - squatSelected.length);
    const nonSquatSelected =
      remainingQuadCount > 0
        ? selectWithPPLVariation(quadNonSquat, remainingQuadCount)
        : [];

    const quadTemplates = [...squatSelected, ...nonSquatSelected];

    // Verificação final: garantir que apenas 2 exercícios squat sejam mantidos
    const finalSquat = quadTemplates.filter(isSquat);
    if (finalSquat.length > 2) {
      console.warn(
        `⚠️ [Legs Day] Detectados ${finalSquat.length} exercícios squat após seleção: ${finalSquat.map((e) => e.name).join(", ")}`
      );
      const toRemove = finalSquat.slice(2);
      const quadTemplatesFiltered = quadTemplates.filter(
        (t) => !toRemove.includes(t)
      );
      console.log(
        `🔧 [Legs Day] Removidos exercícios extras squat. Mantidos apenas: ${finalSquat
          .slice(0, 2)
          .map((e) => e.name)
          .join(", ")}`
      );
      addTemplatesSafely(quadTemplatesFiltered, "Quadríceps (corrigido)");
    } else {
      addTemplatesSafely(quadTemplates, "Quadríceps");
    }

    // Adicionar exercícios de posterior (PRIMÁRIO - GRANDES DEPOIS)
    // Verificar se já há 2 exercícios squat antes de adicionar mais
    const currentSquatCount = exercises.filter((ex) => {
      const name = ex.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
      return (
        name.includes("agachamento") ||
        name.includes("squat") ||
        name.includes("leg press") ||
        name.includes("hack squat") ||
        name.includes("bulgarian") ||
        name.includes("búlgaro") ||
        name.includes("afundo") ||
        name.includes("lunge")
      );
    }).length;

    // 🔒 Restrições articulares agora são validadas pelo ApprovalContract
    const posteriorAvailable = EXERCISE_DATABASE["posterior de coxa"];
    const posteriorSorted = sortByType(posteriorAvailable);
    const posteriorSquat = posteriorSorted.filter(isSquat);
    const posteriorHinge = posteriorSorted.filter(isHinge);
    const posteriorOther = posteriorSorted.filter(
      (t) => !isSquat(t) && !isHinge(t)
    );

    // Verificar quantos exercícios hinge já foram adicionados
    const currentHingeCount = exercises.filter((ex) => {
      const name = ex.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
      return (
        name.includes("stiff") ||
        name.includes("rdl") ||
        name.includes("romanian") ||
        name.includes("good morning") ||
        name.includes("hip thrust") ||
        name.includes("glute bridge") ||
        (name.includes("deadlift") && !name.includes("romanian"))
      );
    }).length;

    // Limitar padrão motor hinge: no máximo 1 exercício
    const remainingHingeSlots = Math.max(0, 1 - currentHingeCount);
    // 🥉 Passo 3: Aplicar variação leve
    const posteriorHingeSelected =
      remainingHingeSlots > 0 && posteriorHinge.length > 0
        ? selectWithPPLVariation(posteriorHinge, remainingHingeSlots).slice(
            0,
            remainingHingeSlots
          )
        : [];

    // Se já há 2 exercícios squat, não adicionar mais
    const remainingSquatSlots = Math.max(0, 2 - currentSquatCount);
    // 🥉 Passo 3: Aplicar variação leve
    const posteriorSquatSelected =
      remainingSquatSlots > 0 && posteriorSquat.length > 0
        ? selectWithPPLVariation(posteriorSquat, remainingSquatSlots).slice(
            0,
            remainingSquatSlots
          )
        : [];

    const remainingPosteriorCount = Math.max(
      0,
      posteriorCount -
        posteriorHingeSelected.length -
        posteriorSquatSelected.length
    );
    // 🥉 Passo 3: Aplicar variação leve
    const posteriorOtherSelected =
      remainingPosteriorCount > 0
        ? selectWithPPLVariation(posteriorOther, remainingPosteriorCount)
        : [];

    const posteriorTemplates = [
      ...posteriorHingeSelected,
      ...posteriorSquatSelected,
      ...posteriorOtherSelected,
    ];

    // Verificação final para posterior também
    const finalPosteriorSquat = posteriorTemplates.filter(isSquat);
    const totalSquatAfterPosterior =
      currentSquatCount + finalPosteriorSquat.length;
    if (totalSquatAfterPosterior > 2) {
      const excessSquat = totalSquatAfterPosterior - 2;
      const toRemove = finalPosteriorSquat.slice(0, excessSquat);
      const posteriorTemplatesFiltered = posteriorTemplates.filter(
        (t) => !toRemove.includes(t)
      );
      console.log(
        `🔧 [Legs Day] Removidos ${excessSquat} exercícios squat do posterior para respeitar limite de 2`
      );
      addTemplatesSafely(posteriorTemplatesFiltered, "Posterior (corrigido)");
    } else {
      addTemplatesSafely(posteriorTemplates, "Posterior");
    }

    // Adicionar exercícios de panturrilhas (PEQUENOS POR ÚLTIMO)
    const panturrilhasExercises = selectDiverseExercises(
      EXERCISE_DATABASE.panturrilhas,
      panturrilhasCount
    );
    addTemplatesSafely(panturrilhasExercises, "Panturrilhas");

    // Verificação final: garantir que os limites de padrões motores sejam respeitados
    const finalSquatCount = exercises.filter((ex) => {
      const name = ex.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
      return (
        name.includes("agachamento") ||
        name.includes("squat") ||
        name.includes("leg press") ||
        name.includes("hack squat") ||
        name.includes("bulgarian") ||
        name.includes("búlgaro") ||
        name.includes("afundo") ||
        name.includes("lunge")
      );
    }).length;

    const finalHingeCount = exercises.filter((ex) => {
      const name = ex.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
      return (
        name.includes("stiff") ||
        name.includes("rdl") ||
        name.includes("romanian") ||
        name.includes("good morning") ||
        name.includes("hip thrust") ||
        name.includes("glute bridge") ||
        (name.includes("deadlift") && !name.includes("romanian"))
      );
    }).length;

    if (finalSquatCount > 2) {
      console.warn(
        `⚠️ [Legs Day] Total de exercícios squat: ${finalSquatCount} (limite: 2). Removendo extras...`
      );
      const squatExercises = exercises.filter((ex) => {
        const name = ex.name
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .trim();
        return (
          name.includes("agachamento") ||
          name.includes("squat") ||
          name.includes("leg press") ||
          name.includes("hack squat") ||
          name.includes("bulgarian") ||
          name.includes("búlgaro") ||
          name.includes("afundo") ||
          name.includes("lunge")
        );
      });

      // Manter apenas os 2 primeiros exercícios squat e remover os demais
      const toKeep = squatExercises.slice(0, 2);
      const toRemove = squatExercises.slice(2);
      exercises = exercises.filter((ex) => !toRemove.includes(ex));

      console.log(
        `🔧 [Legs Day] Mantidos: ${toKeep.map((e) => e.name).join(", ")}. Removidos: ${toRemove.map((e) => e.name).join(", ")}`
      );
    }

    if (finalHingeCount > 1) {
      console.warn(
        `⚠️ [Legs Day] Total de exercícios hinge: ${finalHingeCount} (limite: 1). Removendo extras...`
      );
      const hingeExercises = exercises.filter((ex) => {
        const name = ex.name
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .trim();
        return (
          name.includes("stiff") ||
          name.includes("rdl") ||
          name.includes("romanian") ||
          name.includes("good morning") ||
          name.includes("hip thrust") ||
          name.includes("glute bridge") ||
          (name.includes("deadlift") && !name.includes("romanian"))
        );
      });

      // Manter apenas o primeiro exercício hinge e remover os demais
      const toKeep = hingeExercises.slice(0, 1);
      const toRemove = hingeExercises.slice(1);
      exercises = exercises.filter((ex) => !toRemove.includes(ex));

      console.log(
        `🔧 [Legs Day] Mantido: ${toKeep.map((e) => e.name).join(", ")}. Removidos: ${toRemove.map((e) => e.name).join(", ")}`
      );
    }
  } else if (dayType === "Upper") {
    // Upper: Peito + Costas + Ombros + Bíceps + Tríceps
    // 🔴 Usar constraints?.maxExercisesPerSession para respeitar ajustes (tempo limitado, restrições)
    const maxExercisesPerSession =
      constraints?.maxExercisesPerSession || volumeConfig.totalExercisesMax;

    // Garantir mínimo de 2 exercícios para grupos grandes (validador exige)
    let peitoCount = Math.max(2, Math.floor(volumeConfig.largeMuscleMin / 2));
    let costasCount = Math.max(2, Math.floor(volumeConfig.largeMuscleMin / 2));
    let ombrosCount = 2;
    let bicepsCount = 1;
    let tricepsCount = 1;

    // Ajustar para respeitar limite máximo de exercícios por sessão
    let totalPlanned =
      peitoCount + costasCount + ombrosCount + bicepsCount + tricepsCount;
    while (totalPlanned > maxExercisesPerSession) {
      // Reduzir proporcionalmente, priorizando grupos pequenos

      // Reduzir bíceps primeiro (menos crítico)
      if (bicepsCount > 0) {
        bicepsCount = 0;
        totalPlanned =
          peitoCount + costasCount + ombrosCount + bicepsCount + tricepsCount;
        continue;
      }

      // Se ainda houver excesso, remover tríceps
      if (tricepsCount > 0) {
        tricepsCount = 0;
        totalPlanned =
          peitoCount + costasCount + ombrosCount + bicepsCount + tricepsCount;
        continue;
      }

      // Se ainda houver excesso, reduzir ombros (grupo médio, pode ter 1 em vez de 2)
      if (ombrosCount > 1) {
        ombrosCount = Math.max(1, ombrosCount - 1);
        totalPlanned =
          peitoCount + costasCount + ombrosCount + bicepsCount + tricepsCount;
        continue;
      }

      // Se ainda houver excesso, reduzir um dos grupos grandes (peito ou costas)
      // Isso só deve acontecer em casos extremos (limite muito baixo)
      if (peitoCount > 1) {
        peitoCount = Math.max(1, peitoCount - 1);
        totalPlanned =
          peitoCount + costasCount + ombrosCount + bicepsCount + tricepsCount;
        continue;
      }

      if (costasCount > 1) {
        costasCount = Math.max(1, costasCount - 1);
        totalPlanned =
          peitoCount + costasCount + ombrosCount + bicepsCount + tricepsCount;
        continue;
      }

      // Último recurso: se ainda houver excesso, quebrar o loop
      break;
    }

    addTemplatesSafely(
      selectDiverseExercises(EXERCISE_DATABASE.peitoral, peitoCount),
      "Peito (Upper)"
    );

    // Adicionar exercícios de costas com validação de padrão motor vertical_pull
    const costasSorted = sortByType(EXERCISE_DATABASE.costas);
    const costasVerticalPull = costasSorted.filter(isVerticalPull);
    const costasNonVerticalPull = costasSorted.filter(
      (t) => !isVerticalPull(t)
    );

    // Verificar quantos exercícios vertical_pull já foram adicionados
    const currentVerticalPullCount = exercises.filter((ex) => {
      const name = ex.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      const primary = ex.primaryMuscle
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      if (name.includes("face pull")) {
        return false;
      }

      return (
        name.includes("puxada") ||
        name.includes("pull") ||
        name.includes("chin-up") ||
        name.includes("lat pulldown") ||
        (primary.includes("costas") &&
          (name.includes("frente") ||
            name.includes("atras") ||
            name.includes("barra fixa")))
      );
    }).length;

    const remainingVerticalPullSlots = Math.max(
      0,
      1 - currentVerticalPullCount
    );

    // Selecionar no máximo 1 exercício vertical_pull
    const verticalPullSelected =
      remainingVerticalPullSlots > 0 && costasVerticalPull.length > 0
        ? selectDiverseExercises(
            costasVerticalPull,
            Math.min(remainingVerticalPullSlots, 1)
          ).slice(0, Math.min(remainingVerticalPullSlots, 1))
        : [];

    // Selecionar exercícios não-vertical para completar costasCount
    const remainingCostasCount = Math.max(
      0,
      costasCount - verticalPullSelected.length
    );
    const nonVerticalPullSelected =
      remainingCostasCount > 0 && costasNonVerticalPull.length > 0
        ? selectDiverseExercises(
            costasNonVerticalPull,
            Math.min(remainingCostasCount, costasNonVerticalPull.length)
          )
        : [];

    // Combinar e adicionar
    const costasTemplates = [
      ...verticalPullSelected,
      ...nonVerticalPullSelected,
    ];
    addTemplatesSafely(costasTemplates, "Costas (Upper)");

    // Adicionar exercícios de ombros com validação de padrão motor vertical_push
    // 🔒 Restrições articulares agora são validadas pelo ApprovalContract
    const ombrosAvailable = EXERCISE_DATABASE.ombros;
    const ombrosSorted = sortByType(ombrosAvailable);
    const ombrosVerticalPush = ombrosSorted.filter(isVerticalPush);
    const ombrosNonVerticalPush = ombrosSorted.filter(
      (t) => !isVerticalPush(t)
    );

    // Verificar quantos exercícios vertical_push já foram adicionados
    const currentVerticalPushCount = exercises.filter((ex) => {
      const name = ex.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      const primary = ex.primaryMuscle
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      if (
        name.includes("leg press") ||
        name.includes("bench press") ||
        name.includes("supino")
      ) {
        return false;
      }

      return (
        name.includes("desenvolvimento") ||
        (name.includes("press") && primary.includes("ombro")) ||
        name.includes("military") ||
        name.includes("overhead") ||
        (primary.includes("ombro") && name.includes("desenvolvimento"))
      );
    }).length;

    const remainingVerticalPushSlots = Math.max(
      0,
      1 - currentVerticalPushCount
    );

    // Selecionar no máximo 1 exercício vertical_push
    const verticalPushSelected =
      remainingVerticalPushSlots > 0 && ombrosVerticalPush.length > 0
        ? selectDiverseExercises(
            ombrosVerticalPush,
            Math.min(remainingVerticalPushSlots, 1)
          ).slice(0, Math.min(remainingVerticalPushSlots, 1))
        : [];

    // Selecionar exercícios não-vertical para completar ombrosCount
    const remainingCount = Math.max(
      0,
      ombrosCount - verticalPushSelected.length
    );
    const nonVerticalPushSelected =
      remainingCount > 0 && ombrosNonVerticalPush.length > 0
        ? selectDiverseExercises(
            ombrosNonVerticalPush,
            Math.min(remainingCount, ombrosNonVerticalPush.length)
          )
        : [];

    // Combinar e adicionar
    const ombrosTemplates = [
      ...verticalPushSelected,
      ...nonVerticalPushSelected,
    ];
    addTemplatesSafely(ombrosTemplates, "Ombros (Upper)");

    addTemplatesSafely(
      selectDiverseExercises(EXERCISE_DATABASE.biceps, bicepsCount),
      "Bíceps (Upper)"
    );
    addTemplatesSafely(
      selectDiverseExercises(EXERCISE_DATABASE.triceps, tricepsCount),
      "Tríceps (Upper)"
    );

    // 🔴 Verificação final: garantir que não exceda maxExercisesPerSession
    if (constraints?.maxExercisesPerSession) {
      const maxAllowed = constraints.maxExercisesPerSession;
      while (exercises.length > maxAllowed) {
        // Remover exercícios isolados primeiro (bíceps/tríceps)
        const isolatedExercises = exercises.filter(
          (ex) =>
            ex.primaryMuscle.toLowerCase().includes("biceps") ||
            ex.primaryMuscle.toLowerCase().includes("triceps")
        );
        if (isolatedExercises.length > 0) {
          exercises = exercises.filter((ex) => !isolatedExercises.includes(ex));
          continue;
        }
        // Se ainda há excesso, remover ombros
        const shoulderExercises = exercises.filter((ex) =>
          ex.primaryMuscle.toLowerCase().includes("ombro")
        );
        if (shoulderExercises.length > 0) {
          exercises = exercises.filter((ex) => !shoulderExercises.includes(ex));
          continue;
        }
        // Se ainda há excesso, remover um exercício de peito ou costas (último recurso)
        if (exercises.length > maxAllowed) {
          exercises = exercises.slice(0, maxAllowed);
          break;
        }
      }
    }
  } else {
    // 🥈 Passo 2: Full Body - Evitar repetição usando weekState
    // 1 Peito + 1 Costas + 1 Quadríceps OU Posterior + 1 Ombros + 1 Core/Braço

    // Helper para selecionar exercício não usado ainda
    const selectUnusedExercise = (
      database: ExerciseTemplate[],
      muscleGroup: string,
      count: number = 1
    ): ExerciseTemplate[] => {
      if (!weekState || !weekState[muscleGroup]) {
        // Se não há weekState, usar seleção normal
        return selectDiverseExercises(database, count);
      }

      // Filtrar exercícios já usados
      const usedNames = weekState[muscleGroup];
      const available = database.filter((ex) => !usedNames.has(ex.name));

      if (available.length === 0) {
        // Se todos foram usados, resetar e usar todos
        console.warn(
          `⚠️ [Full Body] Todos os exercícios de ${muscleGroup} já foram usados. Resetando...`
        );
        return selectDiverseExercises(database, count);
      }

      // Selecionar dos disponíveis
      return selectDiverseExercises(
        available,
        Math.min(count, available.length)
      );
    };

    // Peito - evitar repetição
    addTemplatesSafely(
      selectUnusedExercise(EXERCISE_DATABASE.peitoral, "peitoral", 1),
      "Peito (Full Body)"
    );

    // Costas - evitar repetição
    addTemplatesSafely(
      selectUnusedExercise(EXERCISE_DATABASE.costas, "costas", 1),
      "Costas (Full Body)"
    );

    // Alternar entre quadríceps e posterior a cada treino
    // 🔒 Restrições articulares agora são validadas pelo ApprovalContract
    const quadAvailable = EXERCISE_DATABASE.quadriceps;
    const posteriorAvailable = EXERCISE_DATABASE["posterior de coxa"];
    if (dayIndex % 2 === 0) {
      addTemplatesSafely(
        selectUnusedExercise(quadAvailable, "quadriceps", 1),
        "Quadríceps (Full Body)"
      );
    } else {
      addTemplatesSafely(
        selectUnusedExercise(posteriorAvailable, "posterior", 1),
        "Posterior (Full Body)"
      );
    }

    // Ombros - evitar repetição
    // 🔒 Restrições articulares agora são validadas pelo ApprovalContract
    const ombrosAvailable = EXERCISE_DATABASE.ombros;
    addTemplatesSafely(
      selectUnusedExercise(ombrosAvailable, "ombros", 1),
      "Ombros (Full Body)"
    );

    // Alternar entre bíceps e tríceps - evitar repetição
    if (dayIndex % 2 === 0) {
      addTemplatesSafely(
        selectUnusedExercise(EXERCISE_DATABASE.biceps, "biceps", 1),
        "Bíceps (Full Body)"
      );
    } else {
      addTemplatesSafely(
        selectUnusedExercise(EXERCISE_DATABASE.triceps, "triceps", 1),
        "Tríceps (Full Body)"
      );
    }

    // 🔴 Verificar se o total de exercícios excede maxExercisesPerSession (Full Body)
    if (constraints?.maxExercisesPerSession) {
      const maxAllowed = constraints.maxExercisesPerSession;
      while (exercises.length > maxAllowed) {
        // Remover exercícios isolados primeiro (bíceps/tríceps)
        const isolatedExercises = exercises.filter(
          (ex) =>
            ex.primaryMuscle.toLowerCase().includes("biceps") ||
            ex.primaryMuscle.toLowerCase().includes("triceps")
        );
        if (isolatedExercises.length > 0) {
          exercises = exercises.filter((ex) => !isolatedExercises.includes(ex));
          continue;
        }
        // Se ainda há excesso, remover ombros
        const shoulderExercises = exercises.filter((ex) =>
          ex.primaryMuscle.toLowerCase().includes("ombro")
        );
        if (shoulderExercises.length > 0) {
          exercises = exercises.filter((ex) => !shoulderExercises.includes(ex));
          continue;
        }
        // Se ainda há excesso, remover um exercício de pernas (quadríceps/posterior)
        const legExercises = exercises.filter(
          (ex) =>
            ex.primaryMuscle.toLowerCase().includes("quadriceps") ||
            ex.primaryMuscle.toLowerCase().includes("posterior") ||
            ex.primaryMuscle.toLowerCase().includes("coxa")
        );
        if (legExercises.length > 0) {
          exercises = exercises.filter(
            (ex) => !legExercises.slice(0, 1).includes(ex)
          );
          continue;
        }
        // Último recurso: remover qualquer exercício até o limite
        exercises = exercises.slice(0, maxAllowed);
        break;
      }
    }
  }

  // Se tempo disponível foi fornecido, ajustar exercícios para respeitar o limite
  if (availableTimeMinutes) {
    const adjustedExercises = adjustExercisesForTime(
      exercises,
      availableTimeMinutes
    );
    return adjustedExercises;
  }

  return exercises;
}

/**
 * Ajusta a lista de exercícios para respeitar o tempo disponível
 * PRIORIDADE: Reduzir descanso primeiro, manter todos os exercícios e séries
 */
function adjustExercisesForTime(
  exercises: Exercise[],
  availableTimeMinutes: number
): Exercise[] {
  const executionTimePerSet = 30; // 30s por série (fixo)
  const minRestSeconds = 45; // Mínimo de descanso (45s)
  const availableTimeSeconds = availableTimeMinutes * 60;

  // Calcular tempo total atual e extrair descansos
  let totalTimeSeconds = 0;
  const exerciseData: Array<{
    exercise: Exercise;
    sets: number;
    currentRestSeconds: number;
    totalTime: number;
  }> = [];

  for (const ex of exercises) {
    const sets =
      typeof ex.sets === "number"
        ? ex.sets
        : parseInt(String(ex.sets), 10) || 3;
    let restSeconds = 60; // default
    const restStr = ex.rest?.toLowerCase() || "60s";

    // Parsear descanso (ex: "90-120s" → 90, "60s" → 60)
    if (restStr.includes("min")) {
      restSeconds = parseInt(restStr, 10) * 60;
    } else if (restStr.includes("s")) {
      // Pegar primeiro número (ex: "90-120s" → 90)
      const match = restStr.match(/(\d+)/);
      restSeconds = match ? parseInt(match[1], 10) : 60;
    }

    const totalTime = sets * (executionTimePerSet + restSeconds);
    totalTimeSeconds += totalTime;

    exerciseData.push({
      exercise: ex,
      sets,
      currentRestSeconds: restSeconds,
      totalTime,
    });
  }

  const totalTimeMinutes = totalTimeSeconds / 60;

  // Se já cabe no tempo, retornar como está
  if (totalTimeSeconds <= availableTimeSeconds) {
    return exercises;
  }

  const excessTimeSeconds = totalTimeSeconds - availableTimeSeconds;
  const excessTimeMinutes = excessTimeSeconds / 60;

  console.log(
    `⏱️ Ajustando descanso para respeitar tempo: ${totalTimeMinutes.toFixed(1)}min → ${availableTimeMinutes}min (excesso: ${excessTimeMinutes.toFixed(1)}min)`
  );

  // ESTRATÉGIA 1: Reduzir descanso proporcionalmente
  // Calcular quanto precisamos reduzir do descanso total
  const totalRestSeconds = exerciseData.reduce(
    (sum, data) => sum + data.sets * data.currentRestSeconds,
    0
  );
  const totalExecutionSeconds = exerciseData.reduce(
    (sum, data) => sum + data.sets * executionTimePerSet,
    0
  );

  // Tempo disponível para descanso = tempo total disponível - tempo de execução
  const availableRestSeconds = availableTimeSeconds - totalExecutionSeconds;

  if (availableRestSeconds < 0) {
    console.warn(
      `⚠️ Tempo de execução (${(totalExecutionSeconds / 60).toFixed(1)}min) já excede o disponível (${availableTimeMinutes}min). Removendo exercícios...`
    );
    // Se o tempo de execução já excede, precisamos remover exercícios
    return removeExercisesToFitTime(exercises, availableTimeMinutes);
  }

  // Calcular fator de redução do descanso
  const restReductionFactor = availableRestSeconds / totalRestSeconds;
  let adjustedTimeSeconds = totalExecutionSeconds;

  // Aplicar redução proporcional ao descanso de cada exercício
  for (const data of exerciseData) {
    let newRestSeconds = Math.max(
      minRestSeconds,
      Math.floor(data.currentRestSeconds * restReductionFactor)
    );

    // Garantir que não ultrapasse o descanso original (não aumentar)
    newRestSeconds = Math.min(newRestSeconds, data.currentRestSeconds);

    const newTotalTime = data.sets * (executionTimePerSet + newRestSeconds);
    adjustedTimeSeconds += newTotalTime;

    // Atualizar o descanso no exercício
    data.exercise.rest = `${newRestSeconds}s`;

    if (newRestSeconds < data.currentRestSeconds) {
      console.log(
        `  ⬇️ Reduzido descanso de ${data.exercise.name}: ${data.currentRestSeconds}s → ${newRestSeconds}s (${data.sets} séries)`
      );
    }
  }

  // Se ainda não couber após reduzir descanso ao mínimo, remover exercícios isolados
  if (adjustedTimeSeconds > availableTimeSeconds) {
    const stillExcess = adjustedTimeSeconds - availableTimeSeconds;
    console.log(
      `⚠️ Ainda excede ${(stillExcess / 60).toFixed(1)}min após reduzir descanso. Removendo exercícios isolados...`
    );
    return removeExercisesToFitTime(exercises, availableTimeMinutes);
  }

  const finalTimeMinutes = adjustedTimeSeconds / 60;
  console.log(
    `✅ Descanso ajustado: ${finalTimeMinutes.toFixed(1)}min (dentro do limite de ${availableTimeMinutes}min)`
  );

  return exercises;
}

/**
 * Remove exercícios isolados para respeitar o tempo (último recurso)
 */
function removeExercisesToFitTime(
  exercises: Exercise[],
  availableTimeMinutes: number
): Exercise[] {
  const executionTimePerSet = 30;
  const availableTimeSeconds = availableTimeMinutes * 60;
  const adjustedExercises = [...exercises];
  let currentTimeSeconds = 0;

  // Calcular tempo atual
  for (const ex of adjustedExercises) {
    const sets =
      typeof ex.sets === "number"
        ? ex.sets
        : parseInt(String(ex.sets), 10) || 3;
    let restSeconds = 45; // Usar mínimo após ajuste
    const restStr = ex.rest?.toLowerCase() || "60s";
    if (restStr.includes("min")) {
      restSeconds = parseInt(restStr, 10) * 60;
    } else if (restStr.includes("s")) {
      const match = restStr.match(/(\d+)/);
      restSeconds = match ? parseInt(match[1], 10) : 45;
    }
    currentTimeSeconds += sets * (executionTimePerSet + restSeconds);
  }

  // Remover exercícios isolados do final até caber no tempo
  for (let i = adjustedExercises.length - 1; i >= 0; i--) {
    if (currentTimeSeconds <= availableTimeSeconds) break;
    if (adjustedExercises.length <= 3) break; // Manter mínimo de 3 exercícios

    const ex = adjustedExercises[i];
    const isIsolation =
      ex.name.toLowerCase().includes("curl") ||
      ex.name.toLowerCase().includes("extensao") ||
      ex.name.toLowerCase().includes("extensão") ||
      ex.name.toLowerCase().includes("elevacao") ||
      ex.name.toLowerCase().includes("elevação") ||
      ex.name.toLowerCase().includes("lateral") ||
      ex.name.toLowerCase().includes("panturrilha");

    if (isIsolation) {
      const sets =
        typeof ex.sets === "number"
          ? ex.sets
          : parseInt(String(ex.sets), 10) || 3;
      let restSeconds = 45;
      const restStr = ex.rest?.toLowerCase() || "60s";
      if (restStr.includes("min")) {
        restSeconds = parseInt(restStr, 10) * 60;
      } else if (restStr.includes("s")) {
        const match = restStr.match(/(\d+)/);
        restSeconds = match ? parseInt(match[1], 10) : 45;
      }
      const exerciseTime = sets * (executionTimePerSet + restSeconds);

      adjustedExercises.splice(i, 1);
      currentTimeSeconds -= exerciseTime;
      console.log(
        `  ➖ Removido exercício isolado: ${ex.name} (economizou ${(exerciseTime / 60).toFixed(1)}min)`
      );
    }
  }

  const finalTimeMinutes = currentTimeSeconds / 60;
  console.log(
    `✅ Exercícios ajustados: ${finalTimeMinutes.toFixed(1)}min (dentro do limite de ${availableTimeMinutes}min)`
  );

  return adjustedExercises;
}

/**
 * Ajusta repetições baseado em IMC e objetivo
 * REGRA DE OURO: IMC é heurística, não verdade absoluta
 * - IMC só influencia quando objetivo NÃO é força máxima
 * - Limita alteração a máximo 30% da faixa original
 * - Evita treinos "cardio disfarçados" e reps absurdamente altas
 */
function adjustRepsForIMCAndObjective(
  baseReps: string,
  imc?: number,
  objective?: string
): { reps: string; adjustmentReason?: string } {
  // Se não há IMC ou objetivo, manter reps originais
  if (!imc || !objective) {
    return { reps: baseReps };
  }

  const normalizedObjective = objective.toLowerCase();

  // REGRA DE OURO: IMC não influencia força máxima
  if (
    normalizedObjective.includes("força") ||
    normalizedObjective.includes("forca") ||
    normalizedObjective.includes("força máxima") ||
    normalizedObjective.includes("forca maxima")
  ) {
    return { reps: baseReps };
  }

  // Extrair faixa de reps (ex: "8-12" → {min: 8, max: 12})
  const repsMatch = baseReps.match(/(\d+)\s*-\s*(\d+)/);
  if (!repsMatch) {
    // Se não conseguir parsear, manter original
    return { reps: baseReps };
  }

  const baseMin = parseInt(repsMatch[1], 10);
  const baseMax = parseInt(repsMatch[2], 10);
  const baseRange = baseMax - baseMin;

  // Limite de alteração: máximo 30% da faixa original (arredondado para cima)
  const imcRepAdjustmentCap = 0.3;
  const maxAdjustment = Math.ceil(baseRange * imcRepAdjustmentCap);

  let adjustedMin = baseMin;
  let adjustedMax = baseMax;
  let adjustmentReason: string | undefined;

  // Regras por IMC e objetivo (com limite de 30%)
  if (imc >= 25 && imc < 30) {
    // Sobrepeso
    if (
      normalizedObjective.includes("emagrec") ||
      normalizedObjective.includes("perder")
    ) {
      // Ajustar para 10-15, mas respeitando limite de 30%
      const targetMin = 10;
      const targetMax = 15;
      const desiredMinAdjustment = targetMin - baseMin;
      const desiredMaxAdjustment = targetMax - baseMax;

      // Aplicar limite de 30% em cada direção
      const minAdjustment = Math.min(
        maxAdjustment,
        Math.max(0, desiredMinAdjustment)
      );
      const maxAdjustmentValue = Math.min(
        maxAdjustment,
        Math.max(0, desiredMaxAdjustment)
      );

      adjustedMin = baseMin + minAdjustment;
      adjustedMax = baseMax + maxAdjustmentValue;

      if (minAdjustment > 0 || maxAdjustmentValue > 0) {
        adjustmentReason = `IMC ${imc.toFixed(1)} (sobrepeso) + Emagrecimento → ajuste de ${baseReps} para ${adjustedMin}-${adjustedMax} (limite 30%: +${minAdjustment}/+${maxAdjustmentValue})`;
      }
    } else if (
      normalizedObjective.includes("ganhar") ||
      normalizedObjective.includes("massa")
    ) {
      // Recomposição: ajustar apenas se baseMax <= 8, respeitando limite de 30%
      if (baseMax <= 8) {
        const targetMax = 12;
        const desiredMaxAdjustment = targetMax - baseMax;
        const maxAdjustmentValue = Math.min(
          maxAdjustment,
          Math.max(0, desiredMaxAdjustment)
        );

        adjustedMin = baseMin;
        adjustedMax = baseMax + maxAdjustmentValue;

        if (maxAdjustmentValue > 0) {
          adjustmentReason = `IMC ${imc.toFixed(1)} (sobrepeso) + Ganhar Massa (recomposição) → ajuste de ${baseReps} para ${adjustedMin}-${adjustedMax} (limite 30%: +${maxAdjustmentValue})`;
        }
      }
    }
  } else if (imc >= 30 && imc < 35) {
    // Obesidade Grau I
    if (
      normalizedObjective.includes("emagrec") ||
      normalizedObjective.includes("perder")
    ) {
      // Ajustar para 12-18, mas respeitando limite de 30%
      const targetMin = 12;
      const targetMax = 18;
      const desiredMinAdjustment = targetMin - baseMin;
      const desiredMaxAdjustment = targetMax - baseMax;

      const minAdjustment = Math.min(
        maxAdjustment,
        Math.max(0, desiredMinAdjustment)
      );
      const maxAdjustmentValue = Math.min(
        maxAdjustment,
        Math.max(0, desiredMaxAdjustment)
      );

      adjustedMin = baseMin + minAdjustment;
      adjustedMax = baseMax + maxAdjustmentValue;

      if (minAdjustment > 0 || maxAdjustmentValue > 0) {
        adjustmentReason = `IMC ${imc.toFixed(1)} (obesidade grau I) + Emagrecimento → ajuste de ${baseReps} para ${adjustedMin}-${adjustedMax} (limite 30%: +${minAdjustment}/+${maxAdjustmentValue})`;
      }
    } else if (
      normalizedObjective.includes("ganhar") ||
      normalizedObjective.includes("massa")
    ) {
      // Recomposição: ajustar apenas se baseMax < 10, respeitando limite de 30%
      if (baseMax < 10) {
        const targetMax = 15;
        const desiredMaxAdjustment = targetMax - baseMax;
        const maxAdjustmentValue = Math.min(
          maxAdjustment,
          Math.max(0, desiredMaxAdjustment)
        );

        adjustedMin = baseMin;
        adjustedMax = baseMax + maxAdjustmentValue;

        if (maxAdjustmentValue > 0) {
          adjustmentReason = `IMC ${imc.toFixed(1)} (obesidade grau I) + Ganhar Massa (recomposição) → ajuste de ${baseReps} para ${adjustedMin}-${adjustedMax} (limite 30%: +${maxAdjustmentValue})`;
        }
      }
    }
  } else if (imc >= 35) {
    // Obesidade Grau II/III
    if (
      normalizedObjective.includes("emagrec") ||
      normalizedObjective.includes("perder")
    ) {
      // Ajustar para 15-20, mas respeitando limite de 30%
      const targetMin = 15;
      const targetMax = 20;
      const desiredMinAdjustment = targetMin - baseMin;
      const desiredMaxAdjustment = targetMax - baseMax;

      const minAdjustment = Math.min(
        maxAdjustment,
        Math.max(0, desiredMinAdjustment)
      );
      const maxAdjustmentValue = Math.min(
        maxAdjustment,
        Math.max(0, desiredMaxAdjustment)
      );

      adjustedMin = baseMin + minAdjustment;
      adjustedMax = baseMax + maxAdjustmentValue;

      if (minAdjustment > 0 || maxAdjustmentValue > 0) {
        adjustmentReason = `IMC ${imc.toFixed(1)} (obesidade grau II/III) + Emagrecimento → ajuste de ${baseReps} para ${adjustedMin}-${adjustedMax} (limite 30%: +${minAdjustment}/+${maxAdjustmentValue})`;
      }
    } else if (
      normalizedObjective.includes("ganhar") ||
      normalizedObjective.includes("massa")
    ) {
      // Recomposição: ajustar apenas se baseMax < 12, respeitando limite de 30%
      if (baseMax < 12) {
        const targetMax = 18;
        const desiredMaxAdjustment = targetMax - baseMax;
        const maxAdjustmentValue = Math.min(
          maxAdjustment,
          Math.max(0, desiredMaxAdjustment)
        );

        adjustedMin = baseMin;
        adjustedMax = baseMax + maxAdjustmentValue;

        if (maxAdjustmentValue > 0) {
          adjustmentReason = `IMC ${imc.toFixed(1)} (obesidade grau II/III) + Ganhar Massa (recomposição) → ajuste de ${baseReps} para ${adjustedMin}-${adjustedMax} (limite 30%: +${maxAdjustmentValue})`;
        }
      }
    }
  }

  // Se houve ajuste, retornar com log
  if (adjustmentReason) {
    console.log(`📊 Ajuste de reps por IMC: ${adjustmentReason}`);
    return {
      reps: `${adjustedMin}-${adjustedMax}`,
      adjustmentReason,
    };
  }

  // Se não precisar ajustar, manter original
  return { reps: baseReps };
}

/**
 * Seleciona exercícios diversos, evitando múltiplas variações similares
 */
function selectDiverseExercises(
  templates: ExerciseTemplate[],
  count: number
): ExerciseTemplate[] {
  const selected: ExerciseTemplate[] = [];
  const usedBaseTypes = new Set<string>();

  // Função para extrair tipo base (ex: "supino" de "supino inclinado")
  const getBaseType = (name: string): string => {
    const normalized = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    // Padrões conhecidos
    if (normalized.includes("supino")) return "supino";
    if (normalized.includes("remada")) return "remada";
    if (normalized.includes("puxada")) return "puxada";
    if (normalized.includes("agachamento")) return "agachamento";
    if (normalized.includes("leg press")) return "leg press";
    if (normalized.includes("desenvolvimento")) return "desenvolvimento";
    if (normalized.includes("rosca")) return "rosca";
    if (normalized.includes("triceps") || normalized.includes("tríceps"))
      return "triceps";
    if (normalized.includes("crucifixo")) return "crucifixo";
    if (normalized.includes("stiff")) return "stiff";
    if (normalized.includes("rdl")) return "rdl";
    if (normalized.includes("good morning")) return "good morning";

    // Fallback: primeira palavra
    return normalized.split(" ")[0] || normalized;
  };

  // Priorizar compostos primeiro
  const compounds = templates.filter((ex) => ex.type === "compound");
  const isolations = templates.filter(
    (ex) => ex.type === "isolation" || !ex.type
  );

  // Selecionar compostos diversos (máximo 3 do mesmo tipo base)
  for (const ex of compounds) {
    if (selected.length >= count) break;
    const baseType = getBaseType(ex.name);
    const countOfBaseType = Array.from(selected).filter(
      (s) => getBaseType(s.name) === baseType
    ).length;

    // Permitir até 2 variações do mesmo tipo base (ex: supino reto + supino inclinado)
    if (countOfBaseType < 2) {
      selected.push(ex);
      usedBaseTypes.add(baseType);
    }
  }

  // Completar com isolados se necessário
  for (const ex of isolations) {
    if (selected.length >= count) break;
    const baseType = getBaseType(ex.name);
    const countOfBaseType = Array.from(selected).filter(
      (s) => getBaseType(s.name) === baseType
    ).length;

    // Permitir até 1 isolado do mesmo tipo base
    if (countOfBaseType < 1) {
      selected.push(ex);
    }
  }

  // Se ainda não tiver o suficiente, completar com qualquer exercício restante
  const allTemplates = [...compounds, ...isolations];
  for (const ex of allTemplates) {
    if (selected.length >= count) break;
    if (!selected.includes(ex)) {
      selected.push(ex);
    }
  }

  return selected.slice(0, count);
}

/**
 * Ajusta reps para respeitar os limites do perfil do usuário
 */
function adjustRepsForProfile(
  baseReps: string,
  activityLevel?: string
): string {
  if (!activityLevel) {
    return baseReps;
  }

  const profile = getTrainingProfile(activityLevel);
  const repsMatch = baseReps.match(/(\d+)\s*-\s*(\d+)/);
  if (!repsMatch) {
    return baseReps;
  }

  let minRep = parseInt(repsMatch[1], 10);
  let maxRep = parseInt(repsMatch[2], 10);

  // Ajustar mínimo se estiver abaixo do limite do perfil
  if (minRep < profile.minReps) {
    minRep = profile.minReps;
  }

  // Ajustar máximo se estiver acima do limite do perfil
  if (maxRep > profile.maxReps) {
    maxRep = profile.maxReps;
  }

  // Se não permite reps baixas e o mínimo está abaixo de 6, ajustar
  if (!profile.lowRepAllowed && minRep <= 5) {
    minRep = 6;
    // Garantir que maxRep também seja ajustado se necessário
    if (maxRep < minRep) {
      maxRep = minRep;
    }
  }

  // Se houve ajuste, retornar nova faixa
  if (
    minRep !== parseInt(repsMatch[1], 10) ||
    maxRep !== parseInt(repsMatch[2], 10)
  ) {
    return `${minRep}-${maxRep}`;
  }

  return baseReps;
}

/**
 * Converte template de exercício para Exercise
 * Agora aceita IMC, objetivo e activityLevel para ajustar reps
 */
function convertTemplateToExercise(
  template: ExerciseTemplate,
  imc?: number,
  objective?: string,
  activityLevel?: string,
  hasDeficit?: boolean // ✅ CORREÇÃO 3: Parâmetro para déficit calórico
): Exercise {
  // Primeiro ajustar por IMC/objetivo
  let { reps, adjustmentReason } = adjustRepsForIMCAndObjective(
    template.reps,
    imc,
    objective
  );

  // Depois ajustar para respeitar limites do perfil
  const adjustedReps = adjustRepsForProfile(reps, activityLevel);
  if (adjustedReps !== reps) {
    adjustmentReason = adjustmentReason
      ? `${adjustmentReason} + ajuste para perfil (${reps} → ${adjustedReps})`
      : `Ajuste para perfil: ${reps} → ${adjustedReps}`;
    reps = adjustedReps;
  }

  // ✅ CORREÇÃO 3: Déficit força séries = 1 na geração (sem ajuste depois)
  let sets = template.sets;
  if (hasDeficit) {
    sets = 1; // Forçar 1 série em déficit calórico
    if (adjustmentReason) {
      adjustmentReason = `${adjustmentReason} + déficit: séries = 1`;
    } else {
      adjustmentReason = `Déficit calórico: séries = 1`;
    }
  }

  // Log do ajuste se houver
  if (adjustmentReason) {
    console.log(`  🔧 ${template.name}: ${adjustmentReason}`);
  }

  return {
    name: template.name,
    primaryMuscle: template.primaryMuscle,
    secondaryMuscles: template.secondaryMuscles,
    sets: sets, // ✅ CORREÇÃO 3: Usar sets ajustado (1 em déficit)
    reps,
    rest: template.rest,
    notes: template.notes || "",
  };
}
