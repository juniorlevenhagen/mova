import { describe, test, expect } from "vitest";
import { interpretObjective } from "@/lib/rules/objectiveInterpretation";
import { validateAndCorrectNutrition } from "@/lib/rules/nutritionValidation";
import { determineCardioProgression } from "@/lib/rules/cardioProgression";
import { PersonalizedPlan } from "@/types/personalized-plan";

describe("Regras de Negócio - Validação de Casos Reais", () => {
  describe("PERFIL 1 - Obesidade Grave Sedentária (IMC 58)", () => {
    const profile = {
      weight: 168,
      height: 170,
      age: 40,
      gender: "Feminino",
      imc: 58.1,
      nivelAtividade: "Sedentário",
      objective: "Ganho de Massa",
    };

    test("deve converter objetivo 'Ganho de Massa' para 'Recomposição'", () => {
      const result = interpretObjective(profile);
      expect(result.wasConverted).toBe(true);
      expect(result.interpretedObjective).toContain("Recomposição");
    });

    test("deve limitar cardio inicial para 2x/semana (IMC ≥ 35 + Sedentário)", () => {
      const result = determineCardioProgression({
        ...profile,
        cardioFrequency: 4,
      });
      expect(result.initialFrequency).toBe(2);
      expect(result.initialIntensity).toBe("leve");
    });

    test("deve limitar total de estímulos semanais a 6 (4x musculação + 2x cardio)", () => {
      const result = determineCardioProgression({
        ...profile,
        trainingFrequency: 4,
        cardioFrequency: 4,
      });
      expect(result.initialFrequency).toBe(2);
      expect(result.initialFrequency + 4).toBe(6);
    });

    test("deve corrigir proteína excessiva (336g → máximo 180g para mulheres)", () => {
      const nutritionPlan = {
        dailyCalories: 1800,
        macros: { protein: "336g", carbs: "50g", fats: "30g" },
      };
      const result = validateAndCorrectNutrition(nutritionPlan as any, profile);
      expect(result.wasAdjusted).toBe(true);
      expect(result.plan.macros.protein).toBe("180g");
    });
  });

  describe("PERFIL 5 - Sedentário Magro (IMC baixo)", () => {
    const profile = {
      weight: 62,
      height: 180,
      age: 35,
      gender: "Masculino",
      imc: 19.1,
      nivelAtividade: "Sedentário",
      objective: "Ganho de Massa",
    };

    test("deve validar proteína baseada em massa magra (IMC normal usa massa magra, não cap absoluto)", () => {
      const nutritionPlan = {
        dailyCalories: 2500,
        macros: { protein: "180g", carbs: "300g", fats: "70g" },
      };
      const result = validateAndCorrectNutrition(nutritionPlan as any, profile);
      // Homem IMC 19, BF est ~15%. Massa magra ~52.7kg. Protein max (2.2) ~116g.
      expect(result.wasAdjusted).toBe(true);
      expect(result.plan.macros.protein).toBe("116g");
    });
  });

  describe("PERFIL SIMULADO - Atleta 83kg (Caso de Sucesso)", () => {
    const profile = {
      weight: 83,
      height: 187,
      age: 40,
      gender: "Masculino",
      imc: 23.7,
      nivelAtividade: "Atleta",
      objective: "Ganho de Massa",
    };

    test("deve validar plano nutricional preservando campos após correção de proteína", () => {
      const nutritionPlan = {
        dailyCalories: 3000,
        macros: { protein: "165g", carbs: "400g", fats: "80g" },
        mealPlan: [
          {
            meal: "Café",
            timing: "08:00",
            options: [{ food: "Ovo", quantity: "3" }],
          },
        ],
        hydration: "3L por dia",
      };

      const result = validateAndCorrectNutrition(nutritionPlan as any, profile);

      expect(result.wasAdjusted).toBe(true);
      expect(result.plan.macros.protein).toBe("155g"); // Capped by lean mass
      expect((result.plan as any).mealPlan).toBeDefined();
      expect((result.plan as any).mealPlan?.length).toBe(1);
      expect((result.plan as any).hydration).toBe("3L por dia");
    });
  });
});
