/**
 * Validação Nutricional com Limites Fisiológicos
 *
 * Implementa limites duros para macros baseados em ciência, especialmente proteína.
 * Corrige planos nutricionais metabolicamente inviáveis.
 */

export interface MealOption {
  food: string;
  quantity: string;
  calories: number;
}

export interface Meal {
  meal: string;
  timing: string;
  options: MealOption[];
}

export interface NutritionPlan {
  dailyCalories: number;
  macros: {
    protein: string | number; // Pode ser string "336g" ou number 336
    carbs: string | number;
    fats: string | number;
  };
  mealPlan: Meal[];
  hydration: string;
}

export interface UserProfile {
  weight: number; // kg
  height: number; // cm
  age: number;
  gender: "Masculino" | "Feminino" | "masculino" | "feminino" | string;
  imc: number;
  nivelAtividade?: string;
}

export interface ValidatedNutritionPlan {
  plan: NutritionPlan;
  wasAdjusted: boolean;
  adjustments: string[];
  warnings: string[];
  leanMass: number; // Adicionado para métricas
  isConsistent: boolean; // 🆕 Nova flag para consistência matemática
}

/**
 * Extrai valor numérico de string (ex: "336g" → 336)
 */
function extractNumericValue(value: string | number): number {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return 0;

  // Remove "g", espaços e converte
  const cleaned = value.replace(/[^\d.,]/g, "").replace(",", ".");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Estima massa magra baseada em IMC e peso
 * Fórmula simplificada: massa magra ≈ peso × (1 - %gordura estimada)
 * Para obesidade: %gordura estimada baseada em IMC
 */
function estimateLeanMass(weight: number, imc: number, gender: string): number {
  // Estimativa de % gordura baseada em IMC (aproximação)
  let bodyFatPercent = 0;

  if (imc < 18.5) {
    bodyFatPercent = gender.toLowerCase().includes("feminino") ? 15 : 10;
  } else if (imc < 25) {
    bodyFatPercent = gender.toLowerCase().includes("feminino") ? 22 : 15;
  } else if (imc < 30) {
    bodyFatPercent = gender.toLowerCase().includes("feminino") ? 30 : 25;
  } else if (imc < 35) {
    bodyFatPercent = gender.toLowerCase().includes("feminino") ? 38 : 32;
  } else if (imc < 40) {
    bodyFatPercent = gender.toLowerCase().includes("feminino") ? 42 : 36;
  } else {
    bodyFatPercent = gender.toLowerCase().includes("feminino") ? 45 : 40;
  }

  const leanMass = weight * (1 - bodyFatPercent / 100);
  return Math.max(leanMass, weight * 0.4); // Mínimo 40% do peso (proteção)
}

/**
 * Calcula a soma total de calorias no plano de refeições
 */
export function calculateMealPlanTotalCalories(mealPlan: Meal[]): number {
  if (!mealPlan || !Array.isArray(mealPlan)) return 0;

  return mealPlan.reduce((total, meal) => {
    const mealSum = meal.options.reduce(
      (sum, opt) => sum + (opt.calories || 0),
      0
    );
    return total + mealSum;
  }, 0);
}

/**
 * Valida se existem quantidades irreais no plano
 * Ex: "1g de banana", "2g de arroz"
 */
export function hasUnrealisticQuantities(mealPlan: Meal[]): boolean {
  if (!mealPlan || !Array.isArray(mealPlan)) return false;

  for (const meal of mealPlan) {
    for (const opt of meal.options) {
      const quantity = extractNumericValue(opt.quantity);
      // Se for em gramas e for muito baixo (menos de 10g), é provavelmente erro da IA
      if (
        opt.quantity.toLowerCase().includes("g") &&
        quantity > 0 &&
        quantity < 10
      ) {
        return true;
      }
    }
  }
  return false;
}

import { recordPlanCorrection } from "../metrics/planCorrectionMetrics";

/**
 * Registra correções nutricionais para métricas/logs
 */
export function logNutritionCorrection(
  validated: ValidatedNutritionPlan,
  profile: UserProfile,
  originalProtein: number,
  correctedProtein: number,
  leanMass: number
): void {
  if (validated.wasAdjusted) {
    // 1. Métrica de ajuste de proteína (Filtro de Ruído: ignoramos a redistribuição calórica técnica)
    recordPlanCorrection(
      {
        reason: "proteina_ajustada_limite_seguranca",
        data: {
          originalProtein,
          correctedProtein,
          leanMass,
          reason:
            Math.abs(
              correctedProtein -
                (profile.gender.toLowerCase().includes("feminino") ? 180 : 220)
            ) < 1
              ? "cap_absoluto"
              : "massa_magra",
        },
      },
      {
        imc: profile.imc,
        gender: profile.gender,
        activityLevel: profile.nivelAtividade || "Moderado",
        age: profile.age,
      }
    );
  }
}

/**
 * Calcula a BMR usando Mifflin-St Jeor
 */
function calculateBMR(
  weight: number,
  height: number,
  age: number,
  gender: string
): number {
  if (gender.toLowerCase().includes("feminino")) {
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }
  return 10 * weight + 6.25 * height - 5 * age + 5;
}

/**
 * Calcula o TDEE baseado no nível de atividade
 */
function calculateTDEE(bmr: number, activityLevel?: string): number {
  const level = (activityLevel || "moderado").toLowerCase();
  let multiplier = 1.55; // Padrão

  if (level.includes("sedentario") || level.includes("sedentário"))
    multiplier = 1.2;
  else if (level.includes("moderado")) multiplier = 1.55;
  else if (level.includes("atleta") && !level.includes("alto"))
    multiplier = 1.725;
  else if (level.includes("alto") || level.includes("rendimento"))
    multiplier = 1.9;

  return bmr * multiplier;
}

/**
 * Valida e corrige plano nutricional com limites fisiológicos
 *
 * REGRAS:
 * 1. Proteína baseada em massa magra estimada (1.6-2.2g/kg massa magra)
 * 2. Cap absoluto de proteína: Mulheres 180g/dia, Homens 220g/dia
 * 3. Calorias: Nunca abaixo da BMR (Basal)
 * 4. Déficit: Máximo de 500-700 kcal do TDEE (dependendo do peso)
 */
export function validateAndCorrectNutrition(
  plan: NutritionPlan,
  profile: UserProfile
): ValidatedNutritionPlan {
  const adjustments: string[] = [];
  const warnings: string[] = [];
  let wasAdjusted = false;

  let calories = plan.dailyCalories;
  const proteinGrams = extractNumericValue(plan.macros.protein);
  const carbsGrams = extractNumericValue(plan.macros.carbs);
  const fatsGrams = extractNumericValue(plan.macros.fats);

  // --- 1. VALIDAÇÃO DE CONSISTÊNCIA INTERNA ---
  const mealSum = calculateMealPlanTotalCalories(plan.mealPlan);
  const unrealistic = hasUnrealisticQuantities(plan.mealPlan);

  // Margem de erro de 2% ou 50kcal
  const diff = Math.abs(mealSum - calories);
  const isConsistent = diff <= Math.max(50, calories * 0.02) && !unrealistic;

  if (!isConsistent) {
    warnings.push(
      `Inconsistência detectada: Soma das refeições (${mealSum} kcal) vs Meta (${calories} kcal).`
    );
    if (unrealistic) warnings.push("Quantidades irreais detectadas no plano.");
  }

  // --- 2. VALIDAÇÃO DE CALORIAS (METABOLISMO) ---
  const bmr = calculateBMR(
    profile.weight,
    profile.height,
    profile.age,
    profile.gender
  );
  const tdee = calculateTDEE(bmr, profile.nivelAtividade);

  // Regra de Ouro: Nunca abaixo da BMR
  if (calories < bmr) {
    const oldCalories = calories;
    calories = Math.round(bmr + 100); // BMR + pequena margem de segurança
    adjustments.push(
      `Calorias aumentadas de ${oldCalories} para ${calories} (Abaixo do basal: ${Math.round(
        bmr
      )} kcal)`
    );
    wasAdjusted = true;
  }

  // Verificar se o déficit é agressivo demais (> 30% do TDEE)
  const deficit = tdee - calories;
  if (deficit > tdee * 0.3) {
    const oldCalories = calories;
    calories = Math.round(tdee * 0.75); // Limitar déficit a 25%
    adjustments.push(
      `Calorias ajustadas de ${oldCalories} para ${calories} (Déficit agressivo demais: ${Math.round(
        deficit
      )} kcal)`
    );
    wasAdjusted = true;
  }

  // --- 3. VALIDAÇÃO DE PROTEÍNA ---
  const leanMass = estimateLeanMass(
    profile.weight,
    profile.imc,
    profile.gender
  );

  // Faixa recomendada: 1.6-2.2g/kg massa magra
  const minProteinLeanMass = leanMass * 1.6;

  // Cap absoluto de proteína por gênero
  const isFemale = profile.gender?.toLowerCase().includes("feminino");
  const maxProteinAbsolute = isFemale ? 180 : 220;
  const minProteinAbsolute = isFemale ? 100 : 120;

  let correctedProtein = proteinGrams;

  if (proteinGrams > maxProteinAbsolute) {
    adjustments.push(
      `Proteína reduzida de ${proteinGrams.toFixed(
        0
      )}g para ${maxProteinAbsolute}g (cap absoluto)`
    );
    correctedProtein = maxProteinAbsolute;
    wasAdjusted = true;
  } else if (proteinGrams < minProteinLeanMass) {
    const targetProtein = Math.max(minProteinLeanMass, minProteinAbsolute);
    if (proteinGrams < targetProtein) {
      adjustments.push(
        `Proteína aumentada de ${proteinGrams.toFixed(
          0
        )}g para ${targetProtein.toFixed(0)}g`
      );
      correctedProtein = targetProtein;
      wasAdjusted = true;
    }
  }

  // --- 4. REDISTRIBUIÇÃO DE MACROS ---
  // Se houve ajuste de calorias ou proteína, precisamos recalcular os carbs e gorduras
  let correctedCarbs = carbsGrams;
  let correctedFats = fatsGrams;

  if (wasAdjusted) {
    const remainingCalories = calories - correctedProtein * 4;
    // Padrão: 60% Carbs, 40% Gorduras do que restou
    correctedCarbs = (remainingCalories * 0.6) / 4;
    correctedFats = (remainingCalories * 0.4) / 9;

    if (!adjustments.some((a) => a.includes("redistribuídas"))) {
      adjustments.push(
        `Macronutrientes recalculados para a nova meta calórica`
      );
    }
  }

  const correctedPlan = {
    ...plan,
    dailyCalories: calories,
    macros: {
      protein: `${Math.round(correctedProtein)}g`,
      carbs: `${Math.round(correctedCarbs)}g`,
      fats: `${Math.round(correctedFats)}g`,
    },
  };

  const proteinPercent = ((proteinGrams * 4) / calories) * 100;
  const correctedProteinPercent = ((correctedProtein * 4) / calories) * 100;

  // Log de validação
  if (wasAdjusted || warnings.length > 0) {
    console.log("🔧 Validação nutricional aplicada:", {
      original: {
        protein: `${proteinGrams.toFixed(0)}g`,
        proteinPercent: `${proteinPercent.toFixed(1)}%`,
        proteinPerLeanMass: `${(proteinGrams / leanMass).toFixed(
          2
        )}g/kg massa magra`,
      },
      corrected: {
        protein: `${correctedProtein.toFixed(0)}g`,
        proteinPercent: `${correctedProteinPercent.toFixed(1)}%`,
        proteinPerLeanMass: `${(correctedProtein / leanMass).toFixed(
          2
        )}g/kg massa magra`,
      },
      leanMass: `${leanMass.toFixed(1)}kg`,
      adjustments,
      warnings,
      timestamp: new Date().toISOString(),
    });
  }

  return {
    plan: correctedPlan,
    wasAdjusted,
    adjustments,
    warnings,
    leanMass,
    isConsistent,
  };
}
