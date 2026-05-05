import { describe, it, expect } from "vitest";
import { generateTrainingPlanStructure } from "../generators/trainingPlanGenerator";
import {
  isTrainingPlanUsable,
  sanitizeTrainingPlan,
  type TrainingPlan,
} from "../validators/trainingPlanValidator";

describe("Training Time Optimization - Atleta 30min", () => {
  it("should generate a valid plan for Atleta with only 30 minutes and respect the exercise cap", () => {
    const activityLevel = "Atleta";
    const trainingDays = 3;
    const availableTimeMinutes = 30;
    const objective = "Ganho de Massa";

    const plan = generateTrainingPlanStructure(
      trainingDays,
      activityLevel,
      "Full Body",
      availableTimeMinutes,
      24, // imc
      objective
    );

    // 1. Check if the plan was generated
    expect(plan).toBeDefined();
    expect(plan.weeklySchedule.length).toBe(trainingDays);

    // 2. Check if the exercise cap (4) is respected for 30min
    for (const day of plan.weeklySchedule) {
      expect(day.exercises.length).toBeLessThanOrEqual(4);

      // 3. Check if isolation exercises were avoided/minimized
      const isolationMuscles = ["biceps", "triceps", "panturrilhas"];
      const isolationCount = day.exercises.filter((ex) =>
        isolationMuscles.includes(
          ex.primaryMuscle
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
        )
      ).length;

      // In a 30min Atleta Full Body, we expect 0 isolation exercises if the cap is 4
      // because Full Body structure is: peito, costas, quadriceps, posterior, ombro, triceps, biceps
      // With cap 4, it should stop at peito, costas, quadriceps, posterior.
      expect(isolationCount).toBe(0);
    }

    // 4. Validate with the official validator
    const isValid = isTrainingPlanUsable(
      plan,
      trainingDays,
      activityLevel,
      availableTimeMinutes,
      {
        objective,
        imc: 24,
      }
    );

    expect(isValid).toBe(true);
  });

  it("should allow more exercises and include isolation when time is 60 minutes for the same profile", () => {
    const plan = generateTrainingPlanStructure(
      3,
      "Atleta",
      "Full Body",
      60,
      24,
      "Ganho de Massa"
    );

    for (const day of plan.weeklySchedule) {
      // For Atleta 60min, we expect more than 4 exercises
      expect(day.exercises.length).toBeGreaterThan(4);

      // Check if isolation exercises are present
      const isolationMuscles = ["biceps", "triceps", "panturrilhas"];
      const isolationCount = day.exercises.filter((ex) =>
        isolationMuscles.includes(
          ex.primaryMuscle
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
        )
      ).length;

      expect(isolationCount).toBeGreaterThan(0);
    }
  });

  it("should sanitize a plan by substituting forbidden exercises for elderly users", () => {
    const elderlyAge = 65;
    const activityLevel = "Iniciante";

    const planWithForbidden = {
      weeklySchedule: [
        {
          day: "Segunda",
          type: "Full Body",
          exercises: [
            {
              name: "Pike Push Up",
              primaryMuscle: "Ombro",
              sets: 3,
              reps: "12",
              rest: "60s",
              notes: "Foco no ombro",
            },
          ],
        },
      ],
    };

    const { plan: sanitizedPlan, corrections } = sanitizeTrainingPlan(
      planWithForbidden as unknown as TrainingPlan,
      elderlyAge,
      activityLevel
    );

    // 1. Deve ter feito a correção
    expect(corrections.length).toBeGreaterThan(0);
    expect(sanitizedPlan.weeklySchedule[0].exercises[0].name).toContain(
      "Desenvolvimento"
    );
    expect(sanitizedPlan.weeklySchedule[0].exercises[0].notes).toContain(
      "[SUBSTITUIÇÃO DE SEGURANÇA]"
    );

    // 2. O plano sanitizado deve ser válido
    const isValid = isTrainingPlanUsable(sanitizedPlan, 1, activityLevel, 30, {
      age: elderlyAge,
      objective: "Saúde",
    });

    expect(isValid).toBe(true);
  });
});
