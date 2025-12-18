import { describe, it, expect } from "vitest";
import {
  isTrainingPlanUsable,
  type TrainingPlan,
} from "@/lib/validators/trainingPlanValidator";

describe("Simulação de Volume de Músculos Pequenos para Usuário Avançado", () => {
  const activityLevel = "Avançado";
  const trainingDays = 5; // PPL + Var
  const availableTime = 60;

  const createPullWorkout = (
    bicepsCount: number,
    totalCount: number
  ): TrainingPlan => {
    const costasCount = totalCount - bicepsCount;

    const costasExercises = Array.from({ length: costasCount }, (_, i) => ({
      name: `Remada ${i + 1}`,
      primaryMuscle: "costas",
      sets: 3,
      reps: "10",
      rest: "60s",
    }));

    const bicepsExercises = Array.from({ length: bicepsCount }, (_, i) => ({
      name: `Rosca ${i + 1}`,
      primaryMuscle: "biceps",
      sets: 3,
      reps: "10",
      rest: "60s",
    }));

    const allExercises = [...costasExercises, ...bicepsExercises];

    return {
      overview: `Teste Pull com ${bicepsCount} roscas e ${costasCount} remadas`,
      progression: "...",
      weeklySchedule: [
        { day: "Segunda", type: "Pull", exercises: allExercises },
        {
          day: "Terça",
          type: "Push",
          exercises: [
            {
              name: "Supino",
              primaryMuscle: "peitoral",
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
            {
              name: "Triceps",
              primaryMuscle: "triceps",
              sets: 3,
              reps: "10",
              rest: "60s",
            },
          ],
        },
        {
          day: "Quarta",
          type: "Legs",
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
        { day: "Quinta", type: "Push", exercises: [] }, // Simplificado para o teste focar na Segunda
        { day: "Sexta", type: "Pull", exercises: [] },
      ],
    };
  };

  it("deve ACEITAR 3 exercícios de bíceps em um treino de 10 exercícios (30% - limite exato)", () => {
    // 7 costas + 3 bíceps = 10 total. 3/10 = 30%.
    const plan = createPullWorkout(3, 10);
    const result = isTrainingPlanUsable(
      plan,
      trainingDays,
      activityLevel,
      availableTime
    );
    expect(result).toBe(true);
  });

  it("deve REJEITAR 4 exercícios de bíceps em um treino de 10 exercícios (40% - excede regra de 30%)", () => {
    // 6 costas + 4 bíceps = 10 total. 4/10 = 40%.
    const plan = createPullWorkout(4, 10);
    const result = isTrainingPlanUsable(
      plan,
      trainingDays,
      activityLevel,
      availableTime
    );
    expect(result).toBe(false); // Falha pela Distribuição Inteligente (Pull)
  });

  it("deve ACEITAR até 6 exercícios de bíceps se o treino for do tipo 'Shoulders & Arms' (onde braço é o foco)", () => {
    const plan: TrainingPlan = {
      overview: "Treino de braços foco total",
      progression: "...",
      weeklySchedule: [
        {
          day: "Segunda",
          type: "shouldersarms",
          exercises: [
            {
              name: "Rosca 1",
              primaryMuscle: "biceps",
              sets: 3,
              reps: "10",
              rest: "60s",
            },
            {
              name: "Rosca 2",
              primaryMuscle: "biceps",
              sets: 3,
              reps: "10",
              rest: "60s",
            },
            {
              name: "Rosca 3",
              primaryMuscle: "biceps",
              sets: 3,
              reps: "10",
              rest: "60s",
            },
            {
              name: "Rosca 4",
              primaryMuscle: "biceps",
              sets: 3,
              reps: "10",
              rest: "60s",
            },
            {
              name: "Rosca 5",
              primaryMuscle: "biceps",
              sets: 3,
              reps: "10",
              rest: "60s",
            },
            {
              name: "Rosca 6",
              primaryMuscle: "biceps",
              sets: 3,
              reps: "10",
              rest: "60s",
            },
            {
              name: "Lateral",
              primaryMuscle: "ombros",
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
          ],
        },
      ],
    };
    // Testamos apenas 1 dia para simplificar a lógica de frequência
    const result = isTrainingPlanUsable(plan, 1, activityLevel, availableTime);
    expect(result).toBe(true); // Aceita 6 bíceps pois é o limite para Avançado e não é Pull
  });

  it("deve REJEITAR 7 exercícios de bíceps mesmo em dia de braço (Excede limite de 6 para Avançado)", () => {
    const plan: TrainingPlan = {
      overview: "Excesso de bíceps",
      progression: "...",
      weeklySchedule: [
        {
          day: "Segunda",
          type: "shouldersarms",
          exercises: Array.from({ length: 7 }, (_, i) => ({
            name: `Rosca ${i + 1}`,
            primaryMuscle: "biceps",
            sets: 3,
            reps: "10",
            rest: "60s",
          })),
        },
      ],
    };
    const result = isTrainingPlanUsable(plan, 1, activityLevel, availableTime);
    expect(result).toBe(false); // Falha pelo limite por músculo (7 > 6)
  });
});
