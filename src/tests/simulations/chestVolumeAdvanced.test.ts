import { describe, it, expect } from "vitest";
import {
  isTrainingPlanUsable,
  type TrainingPlan,
} from "@/lib/validators/trainingPlanValidator";

describe("Simulação de Volume de Peitoral para Usuário Avançado", () => {
  const activityLevel = "Avançado";
  const trainingDays = 4; // Upper/Lower
  const availableTime = 70;

  const createChestWorkout = (chestCount: number): TrainingPlan => {
    const chestExercises = Array.from({ length: chestCount }, (_, i) => ({
      name: `Supino ${i + 1}`,
      primaryMuscle: "peitoral",
      sets: 3,
      reps: "10",
      rest: "60s",
    }));

    // Completar com outros músculos para ser um Upper válido (precisa de Costas e Ombros)
    const otherExercises = [
      {
        name: "Remada",
        primaryMuscle: "costas",
        sets: 3,
        reps: "10",
        rest: "60s",
      },
      {
        name: "Puxada",
        primaryMuscle: "costas",
        sets: 3,
        reps: "10",
        rest: "60s",
      },
      {
        name: "Desenvolvimento",
        primaryMuscle: "ombros",
        sets: 3,
        reps: "10",
        rest: "60s",
      },
    ];

    const allExercises = [...chestExercises, ...otherExercises];

    return {
      overview: `Teste com ${chestCount} exercícios de peito`,
      progression: "...",
      weeklySchedule: [
        { day: "Segunda", type: "Upper", exercises: allExercises },
        {
          day: "Terça",
          type: "Lower",
          exercises: [
            {
              name: "Agachamento",
              primaryMuscle: "quadriceps",
              sets: 3,
              reps: "10",
              rest: "60s",
            },
            {
              name: "Stiff",
              primaryMuscle: "posterior de coxa",
              sets: 3,
              reps: "10",
              rest: "60s",
            },
            {
              name: "Panturrilha",
              primaryMuscle: "panturrilhas",
              sets: 3,
              reps: "10",
              rest: "60s",
            },
          ],
        },
        { day: "Quinta", type: "Upper", exercises: allExercises },
        {
          day: "Sexta",
          type: "Lower",
          exercises: [
            {
              name: "Agachamento",
              primaryMuscle: "quadriceps",
              sets: 3,
              reps: "10",
              rest: "60s",
            },
            {
              name: "Stiff",
              primaryMuscle: "posterior de coxa",
              sets: 3,
              reps: "10",
              rest: "60s",
            },
            {
              name: "Panturrilha",
              primaryMuscle: "panturrilhas",
              sets: 3,
              reps: "10",
              rest: "60s",
            },
          ],
        },
      ],
    };
  };

  it("deve ACEITAR 3 exercícios de peito (Mínimo exigido para treinados)", () => {
    const plan = createChestWorkout(3);
    const result = isTrainingPlanUsable(
      plan,
      trainingDays,
      activityLevel,
      availableTime
    );
    expect(result).toBe(true);
  });

  it("deve ACEITAR 5 exercícios de peito (Ideal alto)", () => {
    const plan = createChestWorkout(5);
    const result = isTrainingPlanUsable(
      plan,
      trainingDays,
      activityLevel,
      availableTime
    );
    expect(result).toBe(true);
  });

  it("deve ACEITAR 6 exercícios de peito (Limite máximo para Avançado)", () => {
    const plan = createChestWorkout(6);
    const result = isTrainingPlanUsable(
      plan,
      trainingDays,
      activityLevel,
      availableTime
    );
    expect(result).toBe(true);
  });

  it("deve REJEITAR 7 exercícios de peito (Excede limite de 6 para Avançado)", () => {
    const plan = createChestWorkout(7);
    const result = isTrainingPlanUsable(
      plan,
      trainingDays,
      activityLevel,
      availableTime
    );
    expect(result).toBe(false);
  });

  it("deve REJEITAR se o total de exercícios no dia for 11 (Excede limite de 10 para Avançado)", () => {
    // 8 de peito + 3 outros = 11 total
    // Mas aqui vai falhar primeiro pelo limite de peito (8 > 6)
    const plan = createChestWorkout(8);
    const result = isTrainingPlanUsable(
      plan,
      trainingDays,
      activityLevel,
      availableTime
    );
    expect(result).toBe(false);
  });
});
