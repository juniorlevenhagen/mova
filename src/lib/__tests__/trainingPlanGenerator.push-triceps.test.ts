import { describe, it, expect } from "vitest";
import { generateTrainingPlanStructure } from "../generators/trainingPlanGenerator";

describe("generateTrainingPlanStructure - Push days (when present) always have triceps", () => {
  it("should include at least one triceps exercise on every Push day for sedentary 5x/week weight loss profile", async () => {
    const plan = generateTrainingPlanStructure(
      5, // trainingDays
      "Sedentário",
      "PPL",
      60, // availableTimeMinutes
      27, // imc
      "Emagrecimento", // objective
      false, // hasJointLimitations
      false, // hasKneeLimitations
      "academia", // trainingLocation
      30, // age
      "male" // gender
    );

    const pushDays = plan.weeklySchedule.filter((day) => day.type === "Push");

    for (const day of pushDays) {
      const primaryMuscles = day.exercises.map((ex) =>
        ex.primaryMuscle
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
      );

      const hasTriceps = primaryMuscles.some((m) => m === "triceps");

      expect(
        hasTriceps,
        `Push day "${day.day}" should have at least one triceps exercise`
      ).toBe(true);
    }
  });
});

