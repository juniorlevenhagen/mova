/**
 * Validação Nutricional com Limites Fisiológicos
 *
 * Implementa limites duros para macros baseados em ciência, especialmente proteína.
 * Corrige planos nutricionais metabolicamente inviáveis.
 */

export interface NutritionPlan {
  dailyCalories: number;
  macros: {
    protein: string | number; // Pode ser string "336g" ou number 336
    carbs: string | number;
    fats: string | number;
  };
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
 * Valida e corrige plano nutricional com limites fisiológicos
 *
 * REGRAS:
 * 1. Proteína baseada em massa magra estimada (1.6-2.2g/kg massa magra)
 * 2. Cap absoluto de proteína: Mulheres 160-180g/dia, Homens 180-220g/dia
 * 3. Se proteína exceder limite, redistribuir para carbs e gorduras
 * 4. Proteína não pode ser > 75% das calorias totais
 */
export function validateAndCorrectNutrition(
  plan: NutritionPlan,
  profile: UserProfile
): ValidatedNutritionPlan {
  const adjustments: string[] = [];
  const warnings: string[] = [];
  let wasAdjusted = false;

  const calories = plan.dailyCalories;
  const proteinGrams = extractNumericValue(plan.macros.protein);
  const carbsGrams = extractNumericValue(plan.macros.carbs);
  const fatsGrams = extractNumericValue(plan.macros.fats);

  // Calcular calorias dos macros
  const proteinCalories = proteinGrams * 4;

  // VALIDAÇÃO 1: Proteína como % das calorias totais
  const proteinPercent = (proteinCalories / calories) * 100;
  if (proteinPercent > 75) {
    warnings.push(
      `Proteína representa ${proteinPercent.toFixed(1)}% das calorias (meta: <75%). Metabolicamente inviável.`
    );
  }

  // VALIDAÇÃO 2: Proteína baseada em massa magra
  const leanMass = estimateLeanMass(
    profile.weight,
    profile.imc,
    profile.gender
  );
  const proteinPerLeanMass = proteinGrams / leanMass;

  // Faixa recomendada: 1.6-2.2g/kg massa magra
  const minProteinLeanMass = leanMass * 1.6;
  const maxProteinLeanMass = leanMass * 2.2;

  // VALIDAÇÃO 3: Cap absoluto de proteína por gênero
  const isFemale = profile.gender?.toLowerCase().includes("feminino");
  const maxProteinAbsolute = isFemale ? 180 : 220; // Mulheres: 180g, Homens: 220g
  const minProteinAbsolute = isFemale ? 100 : 120; // Mínimo seguro

  // CORREÇÃO: Se proteína exceder limites
  let correctedProtein = proteinGrams;

  if (proteinGrams > maxProteinAbsolute) {
    adjustments.push(
      `Proteína reduzida de ${proteinGrams.toFixed(0)}g para ${maxProteinAbsolute}g (cap absoluto ${isFemale ? "feminino" : "masculino"})`
    );
    correctedProtein = maxProteinAbsolute;
    wasAdjusted = true;
  } else if (proteinGrams < minProteinLeanMass) {
    // Se estiver abaixo do mínimo recomendado, ajustar para mínimo
    const targetProtein = Math.max(minProteinLeanMass, minProteinAbsolute);
    if (proteinGrams < targetProtein) {
      adjustments.push(
        `Proteína aumentada de ${proteinGrams.toFixed(0)}g para ${targetProtein.toFixed(0)}g (mínimo baseado em massa magra)`
      );
      correctedProtein = targetProtein;
      wasAdjusted = true;
    }
  } else if (proteinGrams > maxProteinLeanMass) {
    // Se exceder máximo recomendado por massa magra (mas não cap absoluto)
    const targetProtein = Math.min(maxProteinLeanMass, maxProteinAbsolute);
    adjustments.push(
      `Proteína reduzida de ${proteinGrams.toFixed(0)}g para ${targetProtein.toFixed(0)}g (máximo baseado em massa magra: ${maxProteinLeanMass.toFixed(0)}g)`
    );
    correctedProtein = targetProtein;
    wasAdjusted = true;
  }

  // Se proteína foi ajustada, redistribuir calorias
  let correctedCarbs = carbsGrams;
  let correctedFats = fatsGrams;

  if (wasAdjusted && correctedProtein !== proteinGrams) {
    const proteinDiff = proteinGrams - correctedProtein;
    const caloriesToRedistribute = proteinDiff * 4; // 4 kcal por grama de proteína

    // Redistribuir 60% para carbs, 40% para gorduras
    const carbsToAdd = (caloriesToRedistribute * 0.6) / 4;
    const fatsToAdd = (caloriesToRedistribute * 0.4) / 9;

    correctedCarbs = carbsGrams + carbsToAdd;
    correctedFats = fatsGrams + fatsToAdd;

    adjustments.push(
      `Calorias redistribuídas: +${carbsToAdd.toFixed(0)}g carboidratos, +${fatsToAdd.toFixed(0)}g gorduras`
    );
  }

  // VALIDAÇÃO 4: Verificar se proteína corrigida ainda está dentro dos limites
  const correctedProteinPercent = ((correctedProtein * 4) / calories) * 100;
  if (correctedProteinPercent > 75) {
    warnings.push(
      `Após correção, proteína ainda representa ${correctedProteinPercent.toFixed(1)}% das calorias. Considere aumentar calorias totais.`
    );
  }

  // Construir plano corrigido preservando campos originais (mealPlan, hydration, etc)
  const correctedPlan = {
    ...plan,
    dailyCalories: calories,
    macros: {
      protein: `${Math.round(correctedProtein)}g`,
      carbs: `${Math.round(correctedCarbs)}g`,
      fats: `${Math.round(correctedFats)}g`,
    },
  };

  // Log de validação
  if (wasAdjusted || warnings.length > 0) {
    console.log("🔧 Validação nutricional aplicada:", {
      original: {
        protein: `${proteinGrams.toFixed(0)}g`,
        proteinPercent: `${proteinPercent.toFixed(1)}%`,
        proteinPerLeanMass: `${proteinPerLeanMass.toFixed(2)}g/kg massa magra`,
      },
      corrected: {
        protein: `${correctedProtein.toFixed(0)}g`,
        proteinPercent: `${correctedProteinPercent.toFixed(1)}%`,
        proteinPerLeanMass: `${(correctedProtein / leanMass).toFixed(2)}g/kg massa magra`,
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
  };
}
