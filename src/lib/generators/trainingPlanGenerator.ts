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

interface MuscleGroupConfig {
  minExercises: number;
  maxExercises: number;
  exercises: ExerciseTemplate[];
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
/**
 * Determina o nível operacional baseado no tempo disponível
 * REGRA-MÃE: O nível não é o declarado, mas sim o possível dentro do tempo
 */
function getOperationalLevel(
  declaredLevel: string,
  availableTimeMinutes?: number
): string {
  if (!availableTimeMinutes) {
    // Se não há tempo informado, usar nível declarado
    return declaredLevel;
  }

  const level = declaredLevel.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Mapeamento obrigatório de tempo mínimo por nível
  if (level.includes("atleta")) {
    // Atleta exige ≥ 75 minutos
    if (availableTimeMinutes < 75) {
      console.log(
        `⚠️ Nível rebaixado: Atleta declarado, mas tempo disponível (${availableTimeMinutes}min) < 75min necessário. Usando nível Avançado.`
      );
      return "Avançado";
    }
    return "Atleta";
  }

  if (level.includes("avancado") || level.includes("avançado")) {
    // Avançado exige ≥ 60 minutos
    if (availableTimeMinutes < 60) {
      console.log(
        `⚠️ Nível rebaixado: Avançado declarado, mas tempo disponível (${availableTimeMinutes}min) < 60min necessário. Usando nível Intermediário.`
      );
      return "Intermediário";
    }
    return "Avançado";
  }

  if (level.includes("intermediario") || level.includes("intermediário")) {
    // Intermediário exige ≥ 45 minutos
    if (availableTimeMinutes < 45) {
      console.log(
        `⚠️ Nível rebaixado: Intermediário declarado, mas tempo disponível (${availableTimeMinutes}min) < 45min necessário. Usando nível Iniciante.`
      );
      return "Iniciante";
    }
    return "Intermediário";
  }

  // Para outros níveis, retornar como está
  return declaredLevel;
}

export function generateTrainingPlanStructure(
  trainingDays: number,
  activityLevel: string,
  division: "PPL" | "Upper/Lower" | "Full Body" = "PPL",
  availableTimeMinutes?: number,
  imc?: number,
  objective?: string
): TrainingPlan {
  // 🔥 REGRA-MÃE: Determinar nível operacional baseado em tempo
  const operationalLevel = getOperationalLevel(activityLevel, availableTimeMinutes);
  const volumeConfig = getVolumeConfig(operationalLevel);
  const weeklySchedule: TrainingDay[] = [];

  // Determinar divisão baseada na frequência e nível operacional
  let actualDivision = division;
  if (trainingDays === 5 && operationalLevel.toLowerCase().includes("atleta")) {
    actualDivision = "PPL"; // PPL 5x para atletas
  } else if (trainingDays <= 3) {
    actualDivision = "Full Body";
  } else if (trainingDays === 4) {
    actualDivision = "Upper/Lower";
  }

  // Gerar dias baseado na divisão
  if (actualDivision === "PPL") {
    // PPL: Push, Pull, Legs (repetir conforme necessário)
    const days = ["Push", "Pull", "Legs"];

    for (let i = 0; i < trainingDays; i++) {
      const dayType = days[i % days.length];
      const dayLabel =
        dayType === "Push"
          ? `Treino ${i < 3 ? "A" : "D"} – Peito/Tríceps`
          : dayType === "Pull"
            ? `Treino ${i < 3 ? "B" : "E"} – Costas/Bíceps`
            : `Treino ${i < 3 ? "C" : ""} – Pernas`;

      const exercises = generateDayExercises(
        dayType,
        volumeConfig,
        i % days.length, // Usar o índice do tipo para garantir repetição
        availableTimeMinutes,
        operationalLevel,
        imc,
        objective
      );

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
        i % days.length,
        availableTimeMinutes,
        operationalLevel,
        imc,
        objective
      );

      weeklySchedule.push({
        day: `${dayName} – ${dayType === "Upper" ? "Superiores" : "Inferiores"}`,
        type: dayType,
        exercises,
      });
    }
  } else {
    // Full Body
    const dayNames = ["Segunda-feira", "Terça-feira", "Quarta-feira"];

    for (let i = 0; i < trainingDays; i++) {
      const dayName = dayNames[i] || `Dia ${i + 1}`;
      const exercises = generateDayExercises(
        "Full Body",
        volumeConfig,
        0,
        availableTimeMinutes,
        operationalLevel,
        imc,
        objective
      );

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
  
  const { plan: correctedPlan } = correctSameTypeDaysExercises(plan);
  
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
              timeRequired: operationalLevel.toLowerCase().includes("atleta") ? 75 :
                            operationalLevel.toLowerCase().includes("avancado") ? 60 :
                            operationalLevel.toLowerCase().includes("intermediario") ? 45 : 30,
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
  
  return correctedPlan;
}

/**
 * Gera exercícios para um dia específico
 * Garante que compostos venham antes de isoladores dentro de cada grupo
 */
function generateDayExercises(
  dayType: string,
  volumeConfig: ReturnType<typeof getVolumeConfig>,
  dayIndex: number,
  availableTimeMinutes?: number,
  operationalLevel?: string,
  imc?: number,
  objective?: string
): Exercise[] {
  const exercises: Exercise[] = [];

  // Função auxiliar para ordenar: compostos primeiro, depois isoladores
  const sortByType = (templates: ExerciseTemplate[]): ExerciseTemplate[] => {
    const compounds = templates.filter((ex) => ex.type === "compound");
    const isolations = templates.filter(
      (ex) => ex.type === "isolation" || !ex.type
    );
    return [...compounds, ...isolations];
  };

  if (dayType === "Push") {
    // Push: Peito (PRIMÁRIO - 60-70% do volume) + Ombros (SECUNDÁRIO - mínimo 1) + Tríceps (PEQUENO - máximo 30%)
    const totalExercises = Math.min(
      volumeConfig.totalExercisesMax,
      volumeConfig.largeMuscleMax + volumeConfig.smallMuscleMax
    );

    // 🔥 PISO TÉCNICO: Grupos grandes mínimo 3, 4 quando nível operacional = Atleta
    const isOperationalAthlete = operationalLevel?.toLowerCase().includes("atleta") ?? false;
    const minLargeMuscle = isOperationalAthlete ? 4 : 3;
    
    // Peito recebe 60-70% do volume total (PRIMÁRIO)
    const peitoCount = Math.max(
      Math.max(volumeConfig.largeMuscleMin, minLargeMuscle), // Garantir piso técnico
      Math.min(
        volumeConfig.largeMuscleMax,
        Math.floor(totalExercises * 0.65) // 65% para peito
      )
    );

    // 🔥 PISO TÉCNICO: Grupos médios mínimo 2 exercícios
    const minMediumMuscle = 2;
    const ombrosCount = isOperationalAthlete
      ? Math.max(minMediumMuscle, Math.min(4, Math.floor(totalExercises * 0.2))) // Atleta: mínimo 2, ideal 3-4
      : Math.max(minMediumMuscle, Math.min(2, Math.floor(totalExercises * 0.15))); // Outros: mínimo 2

    // Tríceps: máximo 30% do total (PEQUENO)
    const tricepsCount = Math.min(
      volumeConfig.smallMuscleMax,
      Math.floor(totalExercises * 0.3)
    );

    // Adicionar exercícios de peito (PRIMÁRIO - GRANDES PRIMEIRO)
    // Selecionar exercícios diversos para evitar múltiplas variações similares
    const peitoTemplates = selectDiverseExercises(
      sortByType(EXERCISE_DATABASE.peitoral),
      peitoCount
    );
    exercises.push(
      ...peitoTemplates.map((t) => convertTemplateToExercise(t, imc, objective))
    );

    // Adicionar exercícios de ombros (SECUNDÁRIO - mínimo 1)
    // Priorizar compostos (desenvolvimento) primeiro
    const ombrosTemplates = selectDiverseExercises(
      sortByType(EXERCISE_DATABASE.ombros),
      ombrosCount
    );
    exercises.push(
      ...ombrosTemplates.map((t) => convertTemplateToExercise(t, imc, objective))
    );

    // Adicionar exercícios de tríceps (PEQUENOS DEPOIS)
    const tricepsTemplates = selectDiverseExercises(
      sortByType(EXERCISE_DATABASE.triceps),
      tricepsCount
    );
    exercises.push(
      ...tricepsTemplates.map((t) => convertTemplateToExercise(t, imc, objective))
    );
  } else if (dayType === "Pull") {
    // Pull: Costas (PRIMÁRIO - 60-70% do volume) + Posterior de ombro (SECUNDÁRIO - mínimo 1) + Bíceps (PEQUENO - máximo 30%)
    const totalExercises = Math.min(
      volumeConfig.totalExercisesMax,
      volumeConfig.largeMuscleMax + volumeConfig.smallMuscleMax
    );

    // 🔥 PISO TÉCNICO: Grupos grandes mínimo 3, 4 quando nível operacional = Atleta
    const isOperationalAthlete = operationalLevel?.toLowerCase().includes("atleta") ?? false;
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
    const ombrosPosteriorExercises = EXERCISE_DATABASE.ombros
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
    // Selecionar exercícios diversos para evitar múltiplas variações similares
    const costasTemplates = selectDiverseExercises(
      sortByType(EXERCISE_DATABASE.costas),
      costasCount
    );
    exercises.push(
      ...costasTemplates.map((t) => convertTemplateToExercise(t, imc, objective))
    );

    // Adicionar exercícios de ombros posteriores (SECUNDÁRIO - mínimo 1)
    exercises.push(
      ...ombrosPosteriorExercises.map((t) =>
        convertTemplateToExercise(t, imc, objective)
      )
    );

    // Adicionar exercícios de bíceps (PEQUENOS DEPOIS)
    const bicepsTemplates = selectDiverseExercises(
      sortByType(EXERCISE_DATABASE.biceps),
      bicepsCount
    );
    exercises.push(
      ...bicepsTemplates.map((t) => convertTemplateToExercise(t, imc, objective))
    );
  } else if (dayType === "Legs" || dayType === "Lower") {
    // Legs: Quadríceps (PRIMÁRIO) + Posterior (PRIMÁRIO) + Panturrilhas (PEQUENO)
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

    const panturrilhasCount = volumeConfig.smallMuscleMin;

    // Adicionar exercícios de quadríceps (PRIMÁRIO - GRANDES PRIMEIRO)
    // Selecionar exercícios diversos para evitar múltiplas variações similares
    const quadTemplates = selectDiverseExercises(
      sortByType(EXERCISE_DATABASE.quadriceps),
      quadCount
    );
    exercises.push(
      ...quadTemplates.map((t) => convertTemplateToExercise(t, imc, objective))
    );

    // Adicionar exercícios de posterior (PRIMÁRIO - GRANDES DEPOIS)
    // Selecionar exercícios diversos para evitar múltiplas variações similares
    const posteriorTemplates = selectDiverseExercises(
      sortByType(EXERCISE_DATABASE["posterior de coxa"]),
      posteriorCount
    );
    exercises.push(
      ...posteriorTemplates.map((t) => convertTemplateToExercise(t, imc, objective))
    );

    // Adicionar exercícios de panturrilhas (PEQUENOS POR ÚLTIMO)
    const panturrilhasExercises = selectDiverseExercises(
      EXERCISE_DATABASE.panturrilhas,
      panturrilhasCount
    );
    exercises.push(
      ...panturrilhasExercises.map((t) => convertTemplateToExercise(t, imc, objective))
    );
  } else if (dayType === "Upper") {
    // Upper: Peito + Costas + Ombros + Bíceps + Tríceps
    const peitoCount = Math.floor(volumeConfig.largeMuscleMin / 2);
    const costasCount = Math.floor(volumeConfig.largeMuscleMin / 2);
    const ombrosCount = 2;
    const bicepsCount = 1;
    const tricepsCount = 1;

    exercises.push(
      ...selectDiverseExercises(EXERCISE_DATABASE.peitoral, peitoCount).map(
        (t) => convertTemplateToExercise(t, imc, objective)
      )
    );
    exercises.push(
      ...selectDiverseExercises(EXERCISE_DATABASE.costas, costasCount).map(
        (t) => convertTemplateToExercise(t, imc, objective)
      )
    );
    exercises.push(
      ...selectDiverseExercises(EXERCISE_DATABASE.ombros, ombrosCount).map(
        (t) => convertTemplateToExercise(t, imc, objective)
      )
    );
    exercises.push(
      ...selectDiverseExercises(EXERCISE_DATABASE.biceps, bicepsCount).map(
        (t) => convertTemplateToExercise(t, imc, objective)
      )
    );
    exercises.push(
      ...selectDiverseExercises(EXERCISE_DATABASE.triceps, tricepsCount).map(
        (t) => convertTemplateToExercise(t, imc, objective)
      )
    );
  } else {
    // Full Body: 5 exercícios fixos e bem definidos
    // 1 Peito + 1 Costas + 1 Quadríceps OU Posterior + 1 Ombros + 1 Core/Braço
    exercises.push(
      ...selectDiverseExercises(EXERCISE_DATABASE.peitoral, 1).map(
        (t) => convertTemplateToExercise(t, imc, objective)
      )
    );
    exercises.push(
      ...selectDiverseExercises(EXERCISE_DATABASE.costas, 1).map(
        (t) => convertTemplateToExercise(t, imc, objective)
      )
    );
    // Alternar entre quadríceps e posterior a cada treino
    if (dayIndex % 2 === 0) {
      exercises.push(
        ...selectDiverseExercises(EXERCISE_DATABASE.quadriceps, 1).map(
          (t) => convertTemplateToExercise(t, imc, objective)
        )
      );
    } else {
      exercises.push(
        ...selectDiverseExercises(EXERCISE_DATABASE["posterior de coxa"], 1).map(
          (t) => convertTemplateToExercise(t, imc, objective)
        )
      );
    }
    exercises.push(
      ...selectDiverseExercises(EXERCISE_DATABASE.ombros, 1).map(
        (t) => convertTemplateToExercise(t, imc, objective)
      )
    );
    // Alternar entre bíceps e tríceps
    if (dayIndex % 2 === 0) {
      exercises.push(
        ...selectDiverseExercises(EXERCISE_DATABASE.biceps, 1).map(
          (t) => convertTemplateToExercise(t, imc, objective)
        )
      );
    } else {
      exercises.push(
        ...selectDiverseExercises(EXERCISE_DATABASE.triceps, 1).map(
          (t) => convertTemplateToExercise(t, imc, objective)
        )
      );
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
    const sets = typeof ex.sets === "number" ? ex.sets : parseInt(String(ex.sets), 10) || 3;
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
    const sets = typeof ex.sets === "number" ? ex.sets : parseInt(String(ex.sets), 10) || 3;
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
      const sets = typeof ex.sets === "number" ? ex.sets : parseInt(String(ex.sets), 10) || 3;
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
    const normalized = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    // Padrões conhecidos
    if (normalized.includes("supino")) return "supino";
    if (normalized.includes("remada")) return "remada";
    if (normalized.includes("puxada")) return "puxada";
    if (normalized.includes("agachamento")) return "agachamento";
    if (normalized.includes("leg press")) return "leg press";
    if (normalized.includes("desenvolvimento")) return "desenvolvimento";
    if (normalized.includes("rosca")) return "rosca";
    if (normalized.includes("triceps") || normalized.includes("tríceps")) return "triceps";
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
 * Converte template de exercício para Exercise
 * Agora aceita IMC e objetivo para ajustar reps (com limite de 30% e log)
 */
function convertTemplateToExercise(
  template: ExerciseTemplate,
  imc?: number,
  objective?: string
): Exercise {
  const { reps, adjustmentReason } = adjustRepsForIMCAndObjective(
    template.reps,
    imc,
    objective
  );

  // Log do ajuste se houver
  if (adjustmentReason) {
    console.log(
      `  🔧 ${template.name}: ${adjustmentReason}`
    );
  }

  return {
    name: template.name,
    primaryMuscle: template.primaryMuscle,
    secondaryMuscles: template.secondaryMuscles,
    sets: template.sets,
    reps,
    rest: template.rest,
    notes: template.notes || "",
  };
}
