import { describe, it, expect } from "vitest";
import { generateTrainingPlanStructure } from "../generators/trainingPlanGenerator";

describe("Elderly Biomechanical Safety (Age 60+)", () => {
  it("should limit high axial load exercises to 1 per day for users aged 60+ even with low IMC", () => {
    const plan = generateTrainingPlanStructure(
      4, // trainingDays
      "Moderado", // activityLevel
      "Upper/Lower", // division
      60, // availableTimeMinutes
      22, // imc (low imc)
      "Saúde", // objective
      false, // hasShoulderRestriction
      false, // hasKneeRestriction
      "completa", // equipment
      65 // age (>= 60)
    );

    // Verificar cada dia do plano
    plan.weeklySchedule.forEach((day) => {
      const highAxialExercises = day.exercises.filter((ex) => {
        const highAxialNames = [
          "Agachamento Livre com Barra",
          "Stiff com Halteres",
          "Levantamento Terra Romeno (RDL)",
          "Agachamento Sumô com Halter",
          "Remada Curvada com Barra",
        ];
        return highAxialNames.includes(ex.name);
      });

      expect(highAxialExercises.length).toBeLessThanOrEqual(1);
    });
  });

  it("should prioritize machine and dumbbell exercises over free barbells for elderly users", () => {
    const plan = generateTrainingPlanStructure(
      2, // trainingDays
      "Moderado",
      "Full Body",
      60,
      22,
      "Saúde",
      false,
      false,
      "completa",
      70 // age
    );

    plan.weeklySchedule.forEach((day) => {
      day.exercises.forEach((ex) => {
        if (ex.name.toLowerCase().includes("supino")) {
          expect(ex.name.toLowerCase()).not.toContain("barra");
        }
        if (
          ex.name.toLowerCase().includes("agachamento") &&
          !ex.name.toLowerCase().includes("sumo")
        ) {
          expect(ex.name.toLowerCase()).not.toContain("barra");
        }
      });
    });
  });
});
