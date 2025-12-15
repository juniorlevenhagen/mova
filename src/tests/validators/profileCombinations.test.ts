import { describe, it, expect } from "vitest";
import {
  isTrainingPlanUsable,
  type TrainingPlan,
} from "@/app/api/generate-training-plan/route";

/**
 * Testes de combinações reais de perfil (nível + objetivo)
 * 
 * OBJETIVO: Mostrar os ERROS que aparecem quando planos reais
 * são validados, para identificar o que precisa ser corrigido.
 * 
 * Estes testes NÃO criam planos válidos - eles testam cenários
 * realistas e mostram os problemas encontrados.
 */

describe("Combinações de Perfil - Nível + Objetivo (Diagnóstico)", () => {
  /**
   * Cria um plano realista baseado em divisão comum
   * Não garante validação - apenas estrutura básica
   */
  const createRealisticPlan = (
    days: number,
    exerciseCountPerDay: number,
    division: "Full Body" | "Upper/Lower" | "PPL"
  ): TrainingPlan => {
    const weeklySchedule: TrainingPlan["weeklySchedule"] = [];

    if (division === "Full Body") {
      for (let i = 0; i < days; i++) {
        weeklySchedule.push({
          day: `Dia ${i + 1}`,
          type: "Full Body",
          exercises: Array.from({ length: exerciseCountPerDay }, (_, j) => ({
            name: `Exercício ${j + 1}`,
            primaryMuscle: j % 4 === 0 ? "peitoral" : j % 4 === 1 ? "costas" : j % 4 === 2 ? "quadriceps" : "ombros",
            secondaryMuscles: j % 4 === 0 ? ["triceps"] : j % 4 === 1 ? ["biceps"] : undefined,
            sets: 3,
            reps: "10-12",
            rest: "60s",
            notes: "Nota técnica",
          })),
        });
      }
    } else if (division === "Upper/Lower") {
      for (let i = 0; i < days; i++) {
        const isUpper = i % 2 === 0;
        weeklySchedule.push({
          day: `Dia ${i + 1}`,
          type: isUpper ? "Upper" : "Lower",
          exercises: Array.from({ length: exerciseCountPerDay }, (_, j) => ({
            name: `Exercício ${j + 1}`,
            primaryMuscle: isUpper
              ? (j % 3 === 0 ? "peitoral" : j % 3 === 1 ? "costas" : "ombros")
              : (j % 3 === 0 ? "quadriceps" : j % 3 === 1 ? "posterior de coxa" : "gluteos"),
            secondaryMuscles: isUpper
              ? (j % 3 === 0 ? ["triceps"] : j % 3 === 1 ? ["biceps"] : undefined)
              : (j % 3 === 1 ? ["gluteos"] : undefined),
            sets: 3,
            reps: "10-12",
            rest: "60s",
            notes: "Nota técnica",
          })),
        });
      }
    } else {
      // PPL
      const divisions = ["Push", "Pull", "Legs"];
      for (let i = 0; i < days; i++) {
        const div = divisions[i % 3];
        weeklySchedule.push({
          day: `Dia ${i + 1}`,
          type: div,
          exercises: Array.from({ length: exerciseCountPerDay }, (_, j) => {
            if (div === "Push") {
              const muscles = ["peitoral", "ombros", "triceps"];
              return {
                name: `Exercício ${j + 1}`,
                primaryMuscle: muscles[j % 3],
                secondaryMuscles: j % 3 === 0 ? ["triceps"] : undefined,
                sets: 3,
                reps: "10-12",
                rest: "60s",
                notes: "Nota técnica",
              };
            } else if (div === "Pull") {
              const muscles = ["costas", "biceps"];
              return {
                name: `Exercício ${j + 1}`,
                primaryMuscle: muscles[j % 2],
                secondaryMuscles: j % 2 === 0 ? ["biceps"] : undefined,
                sets: 3,
                reps: "10-12",
                rest: "60s",
                notes: "Nota técnica",
              };
            } else {
              const muscles = ["quadriceps", "posterior de coxa", "gluteos"];
              return {
                name: `Exercício ${j + 1}`,
                primaryMuscle: muscles[j % 3],
                secondaryMuscles: j % 3 === 1 ? ["gluteos"] : undefined,
                sets: 3,
                reps: "10-12",
                rest: "60s",
                notes: "Nota técnica",
              };
            }
          }),
        });
      }
    }

    return {
      overview: "Plano de treino realista",
      progression: "Progressão padrão",
      weeklySchedule,
    };
  };

  describe("Iniciante + Emagrecimento", () => {
    it("deve mostrar erro ao validar plano Full Body 3x/semana com 6 exercícios", () => {
      const plan = createRealisticPlan(3, 6, "Full Body");
      const result = isTrainingPlanUsable(plan, 3, "Iniciante");
      
      // Este teste mostra o erro real
      // Se falhar, o console.warn mostrará o motivo
      console.log("🔍 Iniciante + Emagrecimento (3x, 6 ex):", result);
      // Não fazemos expect - apenas documentamos o comportamento
    });

    it("deve mostrar erro ao validar plano Full Body 3x/semana com 4 exercícios", () => {
      const plan = createRealisticPlan(3, 4, "Full Body");
      const result = isTrainingPlanUsable(plan, 3, "Iniciante");
      
      console.log("🔍 Iniciante + Emagrecimento (3x, 4 ex):", result);
    });
  });

  describe("Moderado + Hipertrofia", () => {
    it("deve mostrar erro ao validar plano Upper/Lower 4x/semana com 8 exercícios", () => {
      const plan = createRealisticPlan(4, 8, "Upper/Lower");
      const result = isTrainingPlanUsable(plan, 4, "Moderado");
      
      console.log("🔍 Moderado + Hipertrofia (4x, 8 ex):", result);
    });

    it("deve mostrar erro ao validar plano Upper/Lower 4x/semana com 6 exercícios", () => {
      const plan = createRealisticPlan(4, 6, "Upper/Lower");
      const result = isTrainingPlanUsable(plan, 4, "Moderado");
      
      console.log("🔍 Moderado + Hipertrofia (4x, 6 ex):", result);
    });
  });

  describe("Atleta + Performance", () => {
    it("deve mostrar erro ao validar plano PPL 6x/semana com 12 exercícios", () => {
      const plan = createRealisticPlan(6, 12, "PPL");
      const result = isTrainingPlanUsable(plan, 6, "Atleta Alto Rendimento");
      
      console.log("🔍 Atleta + Performance (6x, 12 ex):", result);
    });

    it("deve mostrar erro ao validar plano PPL 6x/semana com 10 exercícios", () => {
      const plan = createRealisticPlan(6, 10, "PPL");
      const result = isTrainingPlanUsable(plan, 6, "Atleta");
      
      console.log("🔍 Atleta + Performance (6x, 10 ex):", result);
    });
  });

  describe("Idoso + Manutenção", () => {
    it("deve mostrar erro ao validar plano Full Body 2x/semana com 5 exercícios", () => {
      const plan = createRealisticPlan(2, 5, "Full Body");
      const result = isTrainingPlanUsable(plan, 2, "Idoso");
      
      console.log("🔍 Idoso + Manutenção (2x, 5 ex):", result);
    });

    it("deve mostrar erro ao validar plano Full Body 2x/semana com 3 exercícios", () => {
      const plan = createRealisticPlan(2, 3, "Full Body");
      const result = isTrainingPlanUsable(plan, 2, "Idoso");
      
      console.log("🔍 Idoso + Manutenção (2x, 3 ex):", result);
    });
  });

  describe("Intermediário + Força", () => {
    it("deve mostrar erro ao validar plano Upper/Lower 4x/semana com 8 exercícios", () => {
      const plan = createRealisticPlan(4, 8, "Upper/Lower");
      const result = isTrainingPlanUsable(plan, 4, "Intermediário");
      
      console.log("🔍 Intermediário + Força (4x, 8 ex):", result);
    });

    it("deve mostrar erro ao validar plano PPL 5x/semana com 8 exercícios", () => {
      const plan = createRealisticPlan(5, 8, "PPL");
      const result = isTrainingPlanUsable(plan, 5, "Intermediário");
      
      console.log("🔍 Intermediário + Força (5x, 8 ex):", result);
    });
  });

  describe("Avançado + Definição", () => {
    it("deve mostrar erro ao validar plano PPL 6x/semana com 10 exercícios", () => {
      const plan = createRealisticPlan(6, 10, "PPL");
      const result = isTrainingPlanUsable(plan, 6, "Avançado");
      
      console.log("🔍 Avançado + Definição (6x, 10 ex):", result);
    });

    it("deve mostrar erro ao validar plano PPL 6x/semana com 6 exercícios", () => {
      const plan = createRealisticPlan(6, 6, "PPL");
      const result = isTrainingPlanUsable(plan, 6, "Avançado");
      
      console.log("🔍 Avançado + Definição (6x, 6 ex):", result);
    });
  });
});

