/**
 * ContractRules - Documentação Explícita das Regras do ApprovalContract
 *
 * Este módulo documenta TODAS as regras que o ApprovalContract implementa,
 * tornando-as explícitas e testáveis.
 *
 * 🎯 OBJETIVO: Fonte única de verdade para todas as regras de geração
 */

/* --------------------------------------------------------
   REGRAS DE HIERARQUIA (ORDEM DE PRIORIDADE)
-------------------------------------------------------- */

/**
 * Hierarquia de regras (da mais rígida para a mais flexível):
 *
 * 1. HARD RULES (nunca podem ser violadas):
 *    - Limites semanais por músculo (ajustados para déficit)
 *    - Limites de exercícios por sessão
 *    - Limites de padrões motores por dia
 *    - Restrições articulares (ombro, joelho)
 *    - Divisão válida para frequência
 *    - Comportamento: BLOQUEIAM geração se violadas
 *
 * 2. SOFT RULES (podem ser flexibilizadas em casos extremos):
 *    - Limites de exercícios por músculo no dia
 *    - Distribuição de volume entre músculos
 *    - Comportamento: Podem gerar warnings, mas não bloqueiam obrigatoriamente
 *
 * 3. FLEXIBLE RULES (podem ser ajustadas baseado em contexto):
 *    - Séries mínimas por exercício (1 em déficit, 2 normalmente)
 *    - Quantidade de exercícios por grupo muscular
 *    - Comportamento: NUNCA bloqueiam, apenas geram warnings/recomendações
 *    - 🔒 REGRA DE OURO: Se FLEXIBLE bloqueia, vira SOFT disfarçado
 */

export const RULE_HIERARCHY = {
  HARD: [
    "weekly_series_limit",
    "max_exercises_per_session",
    "motor_pattern_limit",
    "joint_restriction",
    "valid_division",
  ],
  SOFT: ["max_exercises_per_muscle", "volume_distribution"],
  FLEXIBLE: ["min_sets_per_exercise", "exercises_per_muscle_group"],
} as const;

/* --------------------------------------------------------
   REGRAS DE DÉFICIT CALÓRICO
-------------------------------------------------------- */

/**
 * Regras específicas para déficit calórico:
 *
 * 1. Volume total é HARD (nunca pode exceder limite ajustado) → BLOQUEIA se violado
 * 2. Séries mínimas são FLEXIBLE (podem ser 1 em déficit) → NUNCA bloqueia, apenas recomenda
 * 3. Quantidade de exercícios é SOFT (pode ser reduzida se necessário) → Pode gerar warning
 * 4. Prioridade: Séries > Quantidade (em déficit)
 *
 * 🔒 COMPORTAMENTO FLEXIBLE:
 * - minSetsPerExercise = 1 em déficit é uma RECOMENDAÇÃO, não obrigação
 * - Se um exercício tiver 2 séries em déficit, é apenas um WARNING, não erro
 * - O ApprovalContract pode permitir séries > 1 se necessário para respeitar volume HARD
 */
export const DEFICIT_RULES = {
  volumeMultiplier: 1.0, // Reduz volume em 30% (HARD)
  minSetsPerExercise: 3, // Permite 1 série por exercício (FLEXIBLE - recomendação)
  priority: "series_over_quantity" as const, // Séries têm prioridade sobre quantidade
  maxExercisesPerMuscleReduction: true, // Pode reduzir exercícios por músculo (SOFT)
} as const;

/* --------------------------------------------------------
   REGRAS DE RESTRIÇÕES ARTICULARES
-------------------------------------------------------- */

/**
 * Regras para restrições articulares:
 *
 * 1. Restrições são HARD (nunca podem ser violadas)
 * 2. Restrições removem padrões de movimento, não apenas exercícios isolados
 * 3. Se não há exercícios válidos suficientes, reduzir volume do dia (não violar restrição)
 */
export const JOINT_RESTRICTION_RULES = {
  shoulder: {
    restrictedPatterns: ["vertical_push", "overhead_movement"],
    // Severidade por padrão motor: padrões específicos podem ter severidade diferente
    patternSeverity: {
      vertical_push: "HARD" as const,
      overhead_movement: "SOFT" as const, // Elevação lateral acima de 90° é SOFT
    },
    // Severidade padrão para padrões não especificados em patternSeverity
    defaultSeverity: "HARD" as const,
    fallback: "reduce_day_volume" as const,
  },
  knee: {
    restrictedPatterns: ["squat", "deep_flexion", "impact"],
    patternSeverity: {},
    defaultSeverity: "HARD" as const,
    fallback: "reduce_day_volume" as const,
  },
} as const;

/* --------------------------------------------------------
   REGRAS DE LIMITES POR FREQUÊNCIA
-------------------------------------------------------- */

/**
 * Limites de exercícios por sessão baseado em frequência e nível:
 *
 * - 2-3 dias/semana: Full Body (até 6-8 exercícios)
 * - 4 dias/semana: Upper/Lower (até 5-7 exercícios por sessão)
 * - 5-6 dias/semana: PPL (até 6-9 exercícios por sessão)
 * - 7 dias/semana: PPL com ajustes (até 5-7 exercícios por sessão)
 */
export const FREQUENCY_LIMITS: Record<number, { min: number; max: number }> = {
  2: { min: 4, max: 6 },
  3: { min: 5, max: 7 },
  4: { min: 4, max: 6 },
  5: { min: 5, max: 8 },
  6: { min: 6, max: 9 },
  7: { min: 5, max: 7 },
};

/* --------------------------------------------------------
   REGRAS DE LIMITES SEMANAIS POR MÚSCULO
-------------------------------------------------------- */

/**
 * Limites semanais base por nível de atividade (antes do ajuste de déficit):
 *
 * - Sedentário: 8 séries (grandes), 6 séries (pequenos)
 * - Moderado: 12 séries (grandes), 8 séries (pequenos)
 * - Atleta: 16 séries (grandes), 12 séries (pequenos)
 * - Alto Rendimento: 20 séries (grandes), 16 séries (pequenos)
 *
 * ⚠️ IMPORTANTE: Use `getWeeklySeriesLimits(activityLevel)` para obter os limites reais.
 * Esta função faz o mapeamento correto dos níveis normalizados:
 * - "Sedentario" → SEDENTARY_BASE → 8/6
 * - "Moderado" → MODERATE_BASE → 12/8
 * - "Atleta" → ATHLETE_BASE → 16/12
 * - "AltoRendimento" → ATHLETE_HIGH_VOLUME → 20/16
 *
 * Os valores acima são apenas para referência/documentação.
 * Não crie objetos com chaves em inglês - sempre use getWeeklySeriesLimits().
 */

/* --------------------------------------------------------
   REGRAS DE PADRÕES MOTORES
-------------------------------------------------------- */

/**
 * Limites de padrões motores por dia:
 *
 * - hinge: 1 (ex: RDL, Stiff)
 * - horizontal_push: 2 (ex: Supino, Flexão)
 * - vertical_push: 1 (ex: Desenvolvimento)
 * - horizontal_pull: 2 (ex: Remada, Puxada horizontal)
 * - vertical_pull: 1 (ex: Puxada, Barra fixa)
 * - squat: 2 (ex: Agachamento, Leg Press)
 */
export const MOTOR_PATTERN_LIMITS = {
  hinge: 2,
  horizontal_push: 4,
  vertical_push: 2,
  horizontal_pull: 4,
  vertical_pull: 4,
  squat: 3,
} as const;

/* --------------------------------------------------------
   REGRAS DE VALIDAÇÃO DE INTEGRIDADE
-------------------------------------------------------- */

/**
 * Propriedades que devem SEMPRE ser verdadeiras:
 *
 * 1. Total de séries semanais ≤ soma dos limites por músculo
 * 2. Exercícios por sessão ≤ maxExercisesPerSession
 * 3. Padrões motores por dia ≤ limites definidos
 * 4. Em déficit: séries por exercício ≥ minSetsPerExercise (1)
 * 5. Restrições articulares nunca violadas
 */
export const INVARIANT_PROPERTIES = {
  totalWeeklySeries: "≤ sum(weeklySeriesLimits)",
  exercisesPerSession: "≤ maxExercisesPerSession",
  motorPatternsPerDay: "≤ motorPatternLimits",
  minSetsInDeficit: "≥ 1",
  jointRestrictions: "never_violated",
} as const;

/* --------------------------------------------------------
   REGRAS DE CONSISTÊNCIA
-------------------------------------------------------- */

/**
 * Regras que garantem consistência entre ApprovalContract e Validador:
 *
 * 1. Limites semanais devem ser idênticos (mesma fonte: getWeeklySeriesLimits)
 * 2. Multiplicador de déficit deve ser o mesmo (0.7)
 * 3. Séries mínimas devem ser consistentes (1 em déficit, 2 normalmente)
 * 4. Limites de padrões motores devem ser idênticos
 */
export const CONSISTENCY_RULES = {
  weeklyLimitsSource: "getWeeklySeriesLimits(activityLevel)",
  deficitMultiplier: 1.0,
  minSetsInDeficit: 1,
  minSetsNormal: 3,
  motorPatternLimits: "same_as_validator",
} as const;

/* --------------------------------------------------------
   REGRAS DE IMC (SEGURANÇA ARTICULAR)
-------------------------------------------------------- */

/**
 * Regras para IMC elevado (Sobrepeso/Obesidade):
 *
 * 1. IMC >= 30: Aplicar restrições de "Joint Overload"
 * 2. Limitar padrões motores de alta compressão (squat, hinge) por sessão
 * 3. Evitar combinações redundantes de alta carga no mesmo dia
 */
export const IMC_RESTRICTION_RULES = {
  highIMCThreshold: 30,
  restrictions: {
    squat: 1, // 🚨 RESTRITO: Apenas 1 padrão de agachamento (evita redundância axial)
    hinge: 1, // 🚨 RESTRITO: Apenas 1 padrão de dobradiça (evita redundância axial)
    maxHighAxialLoadPerDay: 1, // 🚨 RIGOROSO: Apenas 1 exercício de alta carga axial por dia para IMC >= 30
  },
  safetyWarnings: {
    highIMC:
      "Devido ao IMC, o plano foi ajustado para proteger suas articulações (joelhos e coluna), evitando volume excessivo de carga axial.",
  },
} as const;

/* --------------------------------------------------------
   REGRAS DE PRESCRIÇÃO NUTRICIONAL
-------------------------------------------------------- */

/**
 * Diretrizes para cálculo de calorias e macros:
 *
 * 1. Fórmulas Metabólicas:
 *    - Use Mifflin-St Jeor para BMR (Taxa Metabólica Basal).
 *    - Multiplicadores de Atividade (TDEE): Sedentário (1.2), Moderado (1.55), Atleta (1.725).
 *
 * 2. Limites de Déficit (Emagrecimento):
 *    - Déficit Sugerido: 300 a 500 kcal abaixo do TDEE.
 *    - Limite de Segurança: NUNCA prescrever calorias abaixo da BMR (Basal).
 *    - Déficit Máximo: 20% a 25% do TDEE.
 *
 * 3. Distribuição de Macros (Sugestão):
 *    - Proteína: 1.6g a 2.2g por kg de peso corporal.
 *    - Gorduras: 0.8g a 1.0g por kg de peso corporal.
 *    - Carboidratos: Restante das calorias.
 */
export const NUTRITION_RULES = {
  formulas: {
    bmr: "Mifflin-St Jeor",
    tdeeMultipliers: {
      sedentary: 1.2,
      moderate: 1.55,
      athlete: 1.725,
      high_performance: 1.9,
    },
  },
  limits: {
    maxDeficitPercentage: 0.25, // 25% do TDEE
    minCaloriesFloor: "BMR", // Nunca abaixo do basal
    targetDeficitKcal: { min: 300, max: 500 },
  },
  macros: {
    proteinPerKg: { min: 1.6, max: 2.2 },
    fatPerKg: { min: 0.7, max: 1.0 },
  },
} as const;
