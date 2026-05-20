import { describe, it, expect } from "vitest";

interface FoodOption {
  food: string;
  quantity: string;
  calories: number;
}

interface Meal {
  meal: string;
  timing: string;
  options: FoodOption[];
}

interface FullNutritionPlan {
  dailyCalories: number;
  macros: {
    protein: string;
    carbs: string;
    fats: string;
  };
  mealPlan: Meal[];
}

/**
 * Função de validação de consistência
 */
function validateConsistency(plan: FullNutritionPlan) {
  let totalCalculatedCalories = 0;
  const issues: string[] = [];

  plan.mealPlan.forEach((meal) => {
    meal.options.forEach((option) => {
      totalCalculatedCalories += option.calories;

      // Validar quantidades suspeitas
      const qtyMatch = option.quantity.match(/(\d+)/);
      if (qtyMatch) {
        const value = parseInt(qtyMatch[1]);
        if (value < 5 && option.quantity.toLowerCase().includes("g")) {
          issues.push(
            `Quantidade suspeita: ${option.food} com ${option.quantity}`
          );
        }
      }
    });
  });

  const diff = Math.abs(plan.dailyCalories - totalCalculatedCalories);

  return {
    dailyCalories: plan.dailyCalories,
    totalCalculatedCalories,
    diff,
    isConsistent: diff <= 5, // Tolerância de 5 kcal
    issues,
  };
}

describe("Validação de Consistência Nutricional", () => {
  it("deve detectar inconsistência entre a soma das refeições e o total diário", () => {
    // Exemplo do erro detectado no perfil.txt
    const faultyPlan: FullNutritionPlan = {
      dailyCalories: 1862,
      macros: { protein: "120g", carbs: "207g", fats: "61g" },
      mealPlan: [
        {
          meal: "Café da manhã",
          timing: "08:00",
          options: [
            { food: "Ovos cozidos", quantity: "2 unidades", calories: 140 },
            { food: "Pão integral", quantity: "100g", calories: 250 },
          ],
        },
        {
          meal: "Almoço",
          timing: "12:30",
          options: [
            { food: "Frango grelhado", quantity: "150g", calories: 250 },
            { food: "Arroz integral", quantity: "150g", calories: 180 },
            { food: "Brócolis", quantity: "100g", calories: 35 },
          ],
        },
        {
          meal: "Lanche",
          timing: "15:30",
          options: [
            { food: "Iogurte", quantity: "200g", calories: 120 },
            { food: "Banana", quantity: "1g", calories: 90 },
          ],
        },
        {
          meal: "Jantar",
          timing: "19:00",
          options: [
            { food: "Atum", quantity: "150g", calories: 200 },
            { food: "Batata doce", quantity: "150g", calories: 130 },
          ],
        },
      ],
    };

    const result = validateConsistency(faultyPlan);

    console.log("--- RESULTADO DA VALIDAÇÃO DE CONSISTÊNCIA ---");
    console.log(`Total Declarado: ${result.dailyCalories} kcal`);
    console.log(
      `Total Somado no Prato: ${result.totalCalculatedCalories} kcal`
    );
    console.log(`Diferença: ${result.diff} kcal`);
    console.log(`Consistente: ${result.isConsistent}`);
    console.log("Problemas encontrados:", result.issues);

    expect(result.isConsistent).toBe(false);
    expect(result.issues).toContain("Quantidade suspeita: Banana com 1g");
  });

  it("deve passar em um plano corretamente balanceado", () => {
    const perfectPlan: FullNutritionPlan = {
      dailyCalories: 500,
      macros: { protein: "50g", carbs: "50g", fats: "11g" },
      mealPlan: [
        {
          meal: "Refeição Única",
          timing: "12:00",
          options: [
            { food: "Frango", quantity: "200g", calories: 300 },
            { food: "Arroz", quantity: "150g", calories: 200 },
          ],
        },
      ],
    };

    const result = validateConsistency(perfectPlan);
    expect(result.isConsistent).toBe(true);
    expect(result.issues.length).toBe(0);
  });
});
