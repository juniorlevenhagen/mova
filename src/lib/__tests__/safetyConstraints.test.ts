import { describe, it, expect } from "vitest";
import { generateTrainingPlanStructure } from "../generators/trainingPlanGenerator";

describe("Safety Constraints Verification", () => {
  it("should downgrade Atleta profile with 30min and provide feedback", () => {
    const plan = generateTrainingPlanStructure(
      5,
      "Atleta",
      undefined,
      30, // 30 min is too short for Atleta
      24,
      "Saúde"
    );

    expect(plan.overview).toContain("Nível Avançado"); // Downgraded from Atleta
    expect(plan.safetyFeedback).toBeDefined();
    expect(plan.safetyFeedback?.type).toBe("requirement");
    expect(plan.safetyFeedback?.message).toContain(
      "Perfil de Atleta exige pelo menos 75 minutos"
    );
    expect(plan.safetyFeedback?.suggestedChange?.field).toBe(
      "availableTimeMinutes"
    );
    expect(plan.safetyFeedback?.suggestedChange?.value).toBe(75);
  });

  it("should cap Sedentário frequency to 4 days and provide feedback", () => {
    const plan = generateTrainingPlanStructure(
      6, // 6 days is too much for Sedentario
      "Sedentário",
      undefined,
      60,
      24,
      "Saúde"
    );

    expect(plan.weeklySchedule.length).toBe(4); // Capped at 4
    expect(plan.safetyFeedback).toBeDefined();
    expect(plan.safetyFeedback?.type).toBe("warning");
    expect(plan.safetyFeedback?.message).toContain(
      "Para quem está começando (Sedentário), treinar 5-6x por semana aumenta o risco de lesão"
    );
    expect(plan.safetyFeedback?.suggestedChange?.field).toBe("frequency");
    expect(plan.safetyFeedback?.suggestedChange?.value).toBe(4);
  });
});
