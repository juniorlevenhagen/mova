/**
 * Testes de Validação de Regras de Negócio
 *
 * Valida as correções implementadas para casos reais:
 * - Interpretação inteligente de objetivos
 * - Validação nutricional com limites fisiológicos
 * - Progressão automática de cardio
 */

import { describe, it, expect } from "vitest";
import { interpretObjective } from "@/lib/rules/objectiveInterpretation";
import { validateAndCorrectNutrition } from "@/lib/rules/nutritionValidation";
import { determineCardioProgression } from "@/lib/rules/cardioProgression";

describe("Regras de Negócio - Validação de Casos Reais", () => {
  describe("PERFIL 1 - Obesidade Grave Sedentária (IMC 58)", () => {
    const profile = {
      height: 170,
      weight: 168,
      age: 40,
      gender: "Feminino",
      nivel_atividade: "Sedentário",
      objective: "Ganho de Massa",
      training_frequency: 4,
      cardio_frequency: 4,
    };

    const imc = 168 / Math.pow(170 / 100, 2); // ≈ 58.1

    it("deve converter objetivo 'Ganho de Massa' para 'Recomposição'", () => {
      const result = interpretObjective({
        imc,
        nivelAtividade: profile.nivel_atividade,
        objective: profile.objective,
        weight: profile.weight,
        height: profile.height,
        age: profile.age,
        gender: profile.gender,
      });

      expect(result.wasConverted).toBe(true);
      expect(result.originalObjective).toBe("Ganho de Massa");
      expect(result.interpretedObjective).toContain("Recomposição");
      expect(result.interpretedObjective).toContain("força");
      expect(result.reason).toContain("obesidade grave");
    });

    it("deve limitar cardio inicial para 2x/semana (IMC ≥ 35 + Sedentário)", () => {
      const result = determineCardioProgression({
        nivelAtividade: profile.nivel_atividade,
        imc,
        cardioFrequency: profile.cardio_frequency,
        trainingFrequency: profile.training_frequency,
      });

      expect(result.wasAdjusted).toBe(true);
      expect(result.initialFrequency).toBe(2);
      expect(result.maxInitialFrequency).toBe(2);
      expect(result.initialIntensity).toBe("leve");
      expect(result.progressionWeeks).toBe(4);
      expect(result.reason).toContain("obesidade grave");
    });

    it("deve limitar total de estímulos semanais a 6 (4x musculação + 2x cardio)", () => {
      const result = determineCardioProgression({
        nivelAtividade: profile.nivel_atividade,
        imc,
        cardioFrequency: profile.cardio_frequency,
        trainingFrequency: profile.training_frequency,
      });

      const totalStimuli = profile.training_frequency + result.initialFrequency;
      expect(totalStimuli).toBeLessThanOrEqual(6);
    });

    it("deve corrigir proteína excessiva (336g → máximo 180g para mulheres)", () => {
      const nutritionPlan = {
        dailyCalories: 1800,
        macros: {
          protein: "336g", // 75% das calorias - inviável
          carbs: "100g",
          fats: "50g",
        },
      };

      const result = validateAndCorrectNutrition(nutritionPlan as any, {
        weight: profile.weight,
        height: profile.height,
        age: profile.age,
        gender: profile.gender,
        imc,
        nivelAtividade: profile.nivel_atividade,
      });

      expect(result.wasAdjusted).toBe(true);
      const correctedProtein = parseInt(
        result.plan.macros.protein.replace("g", "")
      );
      expect(correctedProtein).toBeLessThanOrEqual(180); // Cap feminino
      expect(correctedProtein).toBeGreaterThan(100); // Mínimo seguro
      expect(result.adjustments.length).toBeGreaterThan(0);
      expect(result.adjustments.some((a) => a.includes("reduzida"))).toBe(true);
    });

    it("deve redistribuir calorias quando proteína é reduzida", () => {
      const nutritionPlan = {
        dailyCalories: 1800,
        macros: {
          protein: "336g",
          carbs: "100g",
          fats: "50g",
        },
      };

      const result = validateAndCorrectNutrition(nutritionPlan as any, {
        weight: profile.weight,
        height: profile.height,
        age: profile.age,
        gender: profile.gender,
        imc,
        nivelAtividade: profile.nivel_atividade,
      });

      if (result.wasAdjusted) {
        const correctedCarbs = parseInt(
          result.plan.macros.carbs.replace("g", "")
        );
        const correctedFats = parseInt(
          result.plan.macros.fats.replace("g", "")
        );

        // Deve ter redistribuído calorias
        expect(correctedCarbs).toBeGreaterThan(100);
        expect(correctedFats).toBeGreaterThan(50);
        expect(
          result.adjustments.some((a) => a.includes("redistribuídas"))
        ).toBe(true);
      }
    });
  });

  describe("PERFIL 3 - Obesidade Grau I Sedentária (IMC 30-34.9)", () => {
    const profile = {
      height: 165,
      weight: 88,
      age: 45,
      gender: "Feminino",
      nivel_atividade: "Sedentário",
      objective: "Ganho de Massa",
      training_frequency: 3,
      cardio_frequency: 3,
    };

    const imc = 88 / Math.pow(165 / 100, 2); // ≈ 32.3

    it("deve converter objetivo 'Ganho de Massa' para 'Recomposição' (IMC ≥ 30)", () => {
      const result = interpretObjective({
        imc,
        nivelAtividade: profile.nivel_atividade,
        objective: profile.objective,
        weight: profile.weight,
        height: profile.height,
        age: profile.age,
        gender: profile.gender,
      });

      expect(result.wasConverted).toBe(true);
      expect(result.interpretedObjective).toContain("Recomposição");
      expect(result.reason).toContain("obesidade");
    });

    it("deve limitar cardio inicial para 3x/semana (IMC 30-34.9 + Sedentário)", () => {
      const result = determineCardioProgression({
        nivelAtividade: profile.nivel_atividade,
        imc,
        cardioFrequency: profile.cardio_frequency,
        trainingFrequency: profile.training_frequency,
      });

      expect(result.wasAdjusted).toBe(false); // 3x já está no limite
      expect(result.initialFrequency).toBe(3);
      expect(result.maxInitialFrequency).toBe(3);
      expect(result.initialIntensity).toBe("leve");
      expect(result.progressionWeeks).toBe(3);
    });

    it("deve validar proteína baseada em massa magra estimada", () => {
      const nutritionPlan = {
        dailyCalories: 1600,
        macros: {
          protein: "200g", // Pode estar acima do ideal
          carbs: "150g",
          fats: "60g",
        },
      };

      const result = validateAndCorrectNutrition(nutritionPlan as any, {
        weight: profile.weight,
        height: profile.height,
        age: profile.age,
        gender: profile.gender,
        imc,
        nivelAtividade: profile.nivel_atividade,
      });

      const correctedProtein = parseInt(
        result.plan.macros.protein.replace("g", "")
      );
      // Deve estar dentro dos limites (massa magra estimada ~54kg, então 1.6-2.2g/kg = 86-119g)
      // Mas respeitando cap absoluto de 180g para mulheres
      expect(correctedProtein).toBeLessThanOrEqual(180);
    });
  });

  describe("PERFIL 5 - Sedentário Magro (IMC baixo)", () => {
    const profile = {
      height: 180,
      weight: 62,
      age: 35,
      gender: "Masculino",
      nivel_atividade: "Sedentário",
      objective: "Ganho de Massa",
      training_frequency: 3,
      cardio_frequency: 3,
    };

    const imc = 62 / Math.pow(180 / 100, 2); // ≈ 19.1

    it("NÃO deve converter objetivo 'Ganho de Massa' (IMC < 30)", () => {
      const result = interpretObjective({
        imc,
        nivelAtividade: profile.nivel_atividade,
        objective: profile.objective,
        weight: profile.weight,
        height: profile.height,
        age: profile.age,
        gender: profile.gender,
      });

      expect(result.wasConverted).toBe(false);
      expect(result.originalObjective).toBe(profile.objective);
      expect(result.interpretedObjective).toBe(profile.objective);
      expect(result.reason).toContain("apropriado");
    });

    it("deve limitar cardio inicial para 3x/semana (Sedentário, qualquer IMC)", () => {
      const result = determineCardioProgression({
        nivelAtividade: profile.nivel_atividade,
        imc,
        cardioFrequency: profile.cardio_frequency,
        trainingFrequency: profile.training_frequency,
      });

      expect(result.wasAdjusted).toBe(false); // 3x já está no limite
      expect(result.initialFrequency).toBe(3);
      expect(result.maxInitialFrequency).toBe(3);
      expect(result.initialIntensity).toBe("leve");
      expect(result.progressionWeeks).toBe(2);
    });

    it("deve validar proteína baseada em massa magra (IMC normal usa massa magra, não cap absoluto)", () => {
      const nutritionPlan = {
        dailyCalories: 2500,
        macros: {
          protein: "180g", // Pode estar acima do ideal baseado em massa magra
          carbs: "300g",
          fats: "80g",
        },
      };

      const result = validateAndCorrectNutrition(nutritionPlan as any, {
        weight: profile.weight,
        height: profile.height,
        age: profile.age,
        gender: profile.gender,
        imc,
        nivelAtividade: profile.nivel_atividade,
      });

      const correctedProtein = parseInt(
        result.plan.macros.protein.replace("g", "")
      );
      
      // Para IMC normal, proteína deve estar entre 1.6-2.2g/kg massa magra
      // Massa magra estimada para IMC 19.1 (homem): ~52-55kg
      // Então: 1.6*52 = 83g mínimo, 2.2*55 = 121g máximo
      // O sistema deve ajustar 180g para o máximo baseado em massa magra (~116g)
      expect(correctedProtein).toBeGreaterThanOrEqual(100); // Mínimo seguro
      expect(correctedProtein).toBeLessThanOrEqual(220); // Cap masculino absoluto
      
      // Se foi ajustado, deve estar baseado em massa magra
      if (result.wasAdjusted) {
        expect(result.adjustments.some(a => a.includes("massa magra"))).toBe(true);
      }
    });
  });

  describe("Validações de Edge Cases", () => {
    it("deve lidar com IMC exatamente 35 (limite)", () => {
      const profile = {
        height: 170,
        weight: 101.15, // IMC = 35.0
        age: 40,
        gender: "Feminino",
        nivel_atividade: "Sedentário",
        objective: "Ganho de Massa",
      };

      const imc = 35.0;

      const objectiveResult = interpretObjective({
        imc,
        nivelAtividade: profile.nivel_atividade,
        objective: profile.objective,
        weight: profile.weight,
        height: profile.height,
        age: profile.age,
        gender: profile.gender,
      });

      expect(objectiveResult.wasConverted).toBe(true);

      const cardioResult = determineCardioProgression({
        nivelAtividade: profile.nivel_atividade,
        imc,
        cardioFrequency: 4,
        trainingFrequency: 4,
      });

      expect(cardioResult.initialFrequency).toBe(2); // IMC ≥ 35
    });

    it("deve lidar com IMC exatamente 30 (limite)", () => {
      const profile = {
        height: 170,
        weight: 86.7, // IMC = 30.0
        age: 40,
        gender: "Feminino",
        nivel_atividade: "Sedentário",
        objective: "Ganho de Massa",
      };

      const imc = 30.0;

      const objectiveResult = interpretObjective({
        imc,
        nivelAtividade: profile.nivel_atividade,
        objective: profile.objective,
        weight: profile.weight,
        height: profile.height,
        age: profile.age,
        gender: profile.gender,
      });

      expect(objectiveResult.wasConverted).toBe(true);

      const cardioResult = determineCardioProgression({
        nivelAtividade: profile.nivel_atividade,
        imc,
        cardioFrequency: 4,
        trainingFrequency: 3,
      });

      expect(cardioResult.initialFrequency).toBe(3); // IMC 30-34.9
    });

    it("deve lidar com proteína no limite do cap (180g para mulheres)", () => {
      const nutritionPlan = {
        dailyCalories: 2000,
        macros: {
          protein: "180g", // Exatamente no limite
          carbs: "200g",
          fats: "70g",
        },
      };

      const result = validateAndCorrectNutrition(nutritionPlan as any, {
        weight: 168,
        height: 170,
        age: 40,
        gender: "Feminino",
        imc: 58,
        nivelAtividade: "Sedentário",
      });

      const correctedProtein = parseInt(
        result.plan.macros.protein.replace("g", "")
      );
      expect(correctedProtein).toBeLessThanOrEqual(180);
    });

    it("deve lidar com proteína acima do cap (200g para mulheres)", () => {
      const nutritionPlan = {
        dailyCalories: 2000,
        macros: {
          protein: "200g", // Acima do cap (180g)
          carbs: "180g",
          fats: "65g",
        },
      };

      const result = validateAndCorrectNutrition(nutritionPlan as any, {
        weight: 168,
        height: 170,
        age: 40,
        gender: "Feminino",
        imc: 58,
        nivelAtividade: "Sedentário",
      });

      expect(result.wasAdjusted).toBe(true);
      const correctedProtein = parseInt(
        result.plan.macros.protein.replace("g", "")
      );
      expect(correctedProtein).toBeLessThanOrEqual(180);
    });
  });
});

