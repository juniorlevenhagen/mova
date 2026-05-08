import { describe, it, expect } from "vitest";
import { generateTrainingPlanStructure } from "../generators/trainingPlanGenerator";
import { isTrainingPlanUsable } from "../validators/trainingPlanValidator";

describe("Comprehensive Profile and Time Testing", () => {
  const profiles = [
    "Sedentario",
    "Moderado",
    "Avançado",
    "Atleta",
    "Alto Rendimento",
    "Iniciante",
    "Idoso",
    "Limitado",
  ];

  const times = [30, 40, 60, 90];
  const frequencies = [3, 5, 6];

  // Cartesian product of tests
  const testCases = [];
  for (const profile of profiles) {
    for (const time of times) {
      for (const frequency of frequencies) {
        testCases.push({ profile, time, frequency });
      }
    }
  }

  it.each(testCases)(
    "should generate a valid plan for profile: $profile, time: $time min, frequency: $frequency days",
    ({ profile, time, frequency }) => {
      const imc = 24;
      const objective = "Saúde";
      const age = profile === "Idoso" ? 65 : 30;

      const plan = generateTrainingPlanStructure(
        frequency,
        profile,
        undefined, // division (auto-resolve)
        time,
        imc,
        objective,
        profile === "Limitado", // shoulder restriction
        false, // knee restriction
        "academia",
        age,
        "male"
      );

      const expectedFrequency =
        plan.safetyFeedback?.suggestedChange?.field === "frequency"
          ? plan.safetyFeedback.suggestedChange.value
          : frequency;

      expect(plan).toBeDefined();
      expect(plan.weeklySchedule).toBeDefined();
      expect(plan.weeklySchedule.length).toBe(expectedFrequency);

      // Detectar nível real usado na geração (pode ter sido rebaixado por segurança)
      const levelMatch = plan.overview.match(/Nível (.*?)\./);
      const operationalLevel = levelMatch ? levelMatch[1] : profile;

      const isValid = isTrainingPlanUsable(
        plan,
        expectedFrequency,
        operationalLevel,
        time,
        {
          imc,
          objective,
          age,
          hasShoulderRestriction: profile === "Limitado",
          equipment: "academia",
        }
      );

      if (!isValid) {
        console.error(
          `❌ Plan for ${profile} at ${time}min, ${expectedFrequency} days is INVALID.`
        );
        console.error(`Feedback: ${JSON.stringify(plan.safetyFeedback)}`);
        // The validator logs details to console.error/warn automatically.
      }

      expect(
        isValid,
        `Plan for ${profile} at ${time}min, ${expectedFrequency} days should be valid`
      ).toBe(true);
    }
  );
});
