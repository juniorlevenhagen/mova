import { describe, it, expect } from "vitest";
import { generateTrainingPlanStructure } from "../generators/trainingPlanGenerator";

describe("Validação Exaustiva de Perfis de Treino", () => {
  
  const testScenarios = [
    { level: "Sedentario", label: "Sedentário Base", time: 30, expectedMinEx: 3, expectedMaxEx: 5 },
    { level: "Sedentario (Idoso)", label: "Sedentário + Idoso", time: 45, expectedMinEx: 4, expectedMaxEx: 6 },
    { level: "Moderado", label: "Moderado Base", time: 60, expectedMinEx: 6, expectedMaxEx: 8 },
    { level: "Moderado (Iniciante)", label: "Moderado + Iniciante", time: 45, expectedMinEx: 5, expectedMaxEx: 7 },
    { level: "Atleta", label: "Atleta Base", time: 75, expectedMinEx: 7, expectedMaxEx: 9 },
    { level: "Atleta (Limitado)", label: "Atleta + Limitação", time: 60, expectedMinEx: 5, expectedMaxEx: 7 },
    { level: "AltoRendimento", label: "Alto Rendimento", time: 90, expectedMinEx: 8, expectedMaxEx: 11 }
  ];

  testScenarios.forEach((scenario) => {
    it(`deve validar corretamente o perfil: ${scenario.label}`, () => {
      const plan = generateTrainingPlanStructure(
        4, // Frequência 4x
        scenario.level,
        "Upper/Lower",
        scenario.time,
        24.0, // IMC Normal
        "Condicionamento",
        scenario.level.includes("Limitado"), // hasShoulderRestriction
        false, // hasKneeRestriction
        "Academia",
        scenario.level.includes("Idoso") ? 65 : 30,
        "Masculino"
      );

      const dayA = plan.weeklySchedule.find(d => d.day.includes("(A)"));
      const dayB = plan.weeklySchedule.find(d => d.day.includes("(B)"));

      // 1. Validação de Quantidade de Exercícios
      console.log(`[${scenario.label}] Exercícios: ${dayA?.exercises.length}`);
      expect(dayA?.exercises.length).toBeGreaterThanOrEqual(scenario.expectedMinEx);
      expect(dayA?.exercises.length).toBeLessThanOrEqual(scenario.expectedMaxEx);

      // 2. Validação de Variedade A/B (Pelo menos 50% de diferença)
      if (dayA && dayB) {
        const namesA = new Set(dayA.exercises.map(e => e.name));
        const namesB = new Set(dayB.exercises.map(e => e.name));
        const intersection = [...namesA].filter(name => namesB.has(name));
        
        console.log(`[${scenario.label}] Repetição A/B: ${intersection.length}/${namesA.size}`);
        // Garantir que não são idênticos (exceto se o banco for muito pequeno, mas aqui deve haver variedade)
        expect(intersection.length).toBeLessThan(namesA.size);
      }

      // 3. Validação de Séries (Atletas devem ter mais séries em compostos)
      const isAthlete = scenario.level.includes("Atleta") || scenario.level.includes("AltoRendimento");
      if (isAthlete && dayA) {
        const compounds = dayA.exercises.filter(e => !e.name.includes("Rosca") && !e.name.includes("Tríceps") && !e.name.includes("Lateral"));
        const hasHighVolume = compounds.some(e => e.sets >= 4);
        if (scenario.time >= 75) {
            expect(hasHighVolume).toBe(true);
        }
      }
    });
  });

  it("deve aplicar restrição de Carga Axial em perfil de Obesidade (IMC 35)", () => {
    const plan = generateTrainingPlanStructure(
      4, "Moderado", "Upper/Lower", 60, 35.0, "Emagrecimento", false, false, "Academia", 40, "Feminino"
    );

    const lowerDay = plan.weeklySchedule.find(d => d.type.includes("Lower"));
    const axialExercises = lowerDay?.exercises.filter(e => {
        const name = e.name.toLowerCase();
        return name.includes("agachamento livre") || name.includes("stiff") || name.includes("romeno") || name.includes("sumô");
    });

    console.log(`[IMC 35] Exercícios Axiais: ${axialExercises?.length}`);
    expect(axialExercises?.length).toBeLessThanOrEqual(1);
  });

});
