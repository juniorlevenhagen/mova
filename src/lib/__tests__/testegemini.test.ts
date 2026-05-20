import { describe, it, expect } from "vitest";
import { generateTrainingPlanStructure } from "../generators/trainingPlanGenerator";
import { EXERCISE_DATABASE } from "../generators/exerciseDatabase";

describe("Training Plan Generator - Business Rules & Safety (Gemini Test)", () => {
  it("deve aplicar restrição de carga axial para usuários com IMC elevado (Obesidade)", async () => {
    // Perfil: Feminino, 40 anos, IMC ~31.1 (90kg, 170cm)
    const plan = generateTrainingPlanStructure(
      4, // frequency
      "Intermediário", // level
      "Upper/Lower", // division
      60, // availableTime
      31.1, // imc
      "Emagrecimento", // objective
      false, // shoulder
      false, // knee
      "academia", // equipment
      40, // age
      "female" // gender
    );

    // Regra: Exercícios de alta carga axial (ex: Agachamento Livre) devem ser limitados a no máximo 1 por dia para IMC >= 30
    for (const day of plan.weeklySchedule) {
      const highAxialExercises = day.exercises.filter((ex) => {
        // Encontrar o template original para ver se é high axial load
        const muscleKey = Object.keys(EXERCISE_DATABASE).find((k) =>
          EXERCISE_DATABASE[k].some((t) => t.name === ex.name)
        );
        if (muscleKey) {
          const template = EXERCISE_DATABASE[muscleKey].find(
            (t) => t.name === ex.name
          );
          return template?.isHighAxialLoad === true;
        }
        return false;
      });

      expect(
        highAxialExercises.length,
        `Dia ${day.day} excedeu limite de carga axial`
      ).toBeLessThanOrEqual(1);
    }
  });

  it("deve garantir variabilidade biomecânica entre Upper A e Upper B", async () => {
    const plan = generateTrainingPlanStructure(
      4, // frequency
      "Intermediário", // level
      "Upper/Lower", // division
      90, // availableTime
      24, // imc
      "Emagrecimento", // objective
      false, // shoulder
      false, // knee
      "academia", // equipment
      30, // age
      "male" // gender
    );

    const upperA = plan.weeklySchedule.find((d) =>
      (d.type || "").includes("Upper (A)")
    );
    const upperB = plan.weeklySchedule.find((d) =>
      (d.type || "").includes("Upper (B)")
    );

    if (upperA && upperB) {
      const exercisesA = upperA.exercises.map((e) => e.name);
      const exercisesB = upperB.exercises.map((e) => e.name);

      // Regra: O plano B não deve ser uma cópia do plano A.
      const commonExercises = exercisesA.filter((ex) =>
        exercisesB.includes(ex)
      );
      const similarityRatio = commonExercises.length / exercisesA.length;

      // Esperamos que haja variação significativa (menos de 70% de similaridade)
      expect(
        similarityRatio,
        "Upper A e Upper B estão muito parecidos"
      ).toBeLessThan(0.7);
    }
  });

  it("deve manter a neutralidade e evitar nomes de outros contextos", async () => {
    const plan = generateTrainingPlanStructure(
      3,
      "Moderado",
      "Full Body",
      60,
      25,
      "Saúde",
      false,
      false,
      "academia",
      30,
      "female"
    );

    const planString = JSON.stringify(plan);

    // Regra: O sistema não deve injetar nomes de outros contextos (Ex: Júnior) no texto gerado
    expect(planString).not.toContain("Júnior");
  });

  it("deve respeitar a hierarquia de grupamentos musculares no dia de Upper", async () => {
    const plan = generateTrainingPlanStructure(
      4,
      "Intermediário",
      "Upper/Lower",
      60,
      25,
      "Hipertrofia",
      false,
      false,
      "academia",
      30,
      "male"
    );

    const upperDay = plan.weeklySchedule.find((d) =>
      (d.type || "").includes("Upper")
    );

    if (upperDay) {
      // Regra: Grandes grupamentos (Peito/Costas) devem vir antes de pequenos (Bíceps/Tríceps)
      const muscles = upperDay.exercises.map((ex) =>
        ex.primaryMuscle.toLowerCase()
      );

      const lastBigMuscleIndex = Math.max(
        muscles.lastIndexOf("peito"),
        muscles.lastIndexOf("costas"),
        muscles.lastIndexOf("peitoral")
      );

      const firstSmallMuscleIndex = muscles.findIndex(
        (m) =>
          m === "biceps" || m === "triceps" || m === "bíceps" || m === "tríceps"
      );

      // Se houver ambos, o primeiro pequeno deve vir após o último grande
      if (lastBigMuscleIndex !== -1 && firstSmallMuscleIndex !== -1) {
        expect(
          firstSmallMuscleIndex,
          "Exercício de músculo pequeno veio antes de um grande"
        ).toBeGreaterThan(lastBigMuscleIndex);
      }
    }
  });

  it("deve aplicar regras de segurança para idosos (60+ anos)", async () => {
    const plan = generateTrainingPlanStructure(
      3, // frequency
      "Moderado", // level
      "Full Body", // division
      60, // availableTime
      25, // imc
      "Saúde", // objective
      false, // shoulder
      false, // knee
      "academia", // equipment
      65, // age
      "male" // gender
    );

    // 1. Deve ter 2 séries por exercício (regra para Idoso via profile reduction)
    // Se falhar (vier 3 ou 4), significa que a flag 'elderly' não está sendo ativada corretamente pelo age
    for (const day of plan.weeklySchedule) {
      for (const ex of day.exercises) {
        expect(
          ex.sets,
          `Exercício ${ex.name} deveria ter 2 séries para idoso`
        ).toBeLessThanOrEqual(2);
      }
    }

    // 2. Deve ter variedade entre os dias de Full Body (A vs B)
    if (plan.weeklySchedule.length >= 2) {
      const day1Exercises = plan.weeklySchedule[0].exercises.map((e) => e.name);
      const day2Exercises = plan.weeklySchedule[1].exercises.map((e) => e.name);

      const common = day1Exercises.filter((e) => day2Exercises.includes(e));
      expect(
        common.length,
        "Dias de Full Body para idosos devem ter variedade significativa"
      ).toBeLessThan(day1Exercises.length);
    }
  });

  it("deve respeitar restrições articulares de ombro", async () => {
    const plan = generateTrainingPlanStructure(
      4,
      "Moderado",
      "Upper/Lower",
      60,
      25,
      "Hipertrofia",
      true, // shoulder restriction
      false, // knee
      "academia",
      30,
      "male"
    );

    for (const day of plan.weeklySchedule) {
      for (const ex of day.exercises) {
        // Encontrar o template para ver o motorPattern
        const muscleKey = Object.keys(EXERCISE_DATABASE).find((k) =>
          EXERCISE_DATABASE[k].some((t) => t.name === ex.name)
        );
        if (muscleKey) {
          const template = EXERCISE_DATABASE[muscleKey].find(
            (t) => t.name === ex.name
          );
          // "vertical_push" e "overhead_movement" são proibidos para ombro
          expect(["vertical_push", "overhead_movement"]).not.toContain(
            template?.motorPattern
          );
        }
      }
    }
  });

  it("deve respeitar restrições articulares de joelho", async () => {
    const plan = generateTrainingPlanStructure(
      4,
      "Moderado",
      "Upper/Lower",
      60,
      25,
      "Hipertrofia",
      false,
      true, // knee restriction
      "academia",
      30,
      "male"
    );

    for (const day of plan.weeklySchedule) {
      for (const ex of day.exercises) {
        const muscleKey = Object.keys(EXERCISE_DATABASE).find((k) =>
          EXERCISE_DATABASE[k].some((t) => t.name === ex.name)
        );
        if (muscleKey) {
          const template = EXERCISE_DATABASE[muscleKey].find(
            (t) => t.name === ex.name
          );
          // "squat" é proibido para joelho (simplificado no gerador)
          expect(template?.motorPattern).not.toBe("squat");
        }
      }
    }
  });

  it("deve evitar uso consecutivo de equipamentos raros (Máquina, Smith, Polia)", async () => {
    const plan = generateTrainingPlanStructure(
      6, // Alta frequência para gerar muitos exercícios
      "Atleta",
      "PPL",
      90,
      24,
      "Hipertrofia",
      false,
      false,
      "academia",
      30,
      "male"
    );

    const rareEquipment = ["maquina", "smith", "polia"];

    for (const day of plan.weeklySchedule) {
      let lastEquip: string | undefined = undefined;

      for (const ex of day.exercises) {
        // Encontrar template para ver o equipamento
        const muscleKey = Object.keys(EXERCISE_DATABASE).find((k) =>
          EXERCISE_DATABASE[k].some((t) => t.name === ex.name)
        );
        const template = muscleKey
          ? EXERCISE_DATABASE[muscleKey].find((t) => t.name === ex.name)
          : null;
        const currentEquip = template?.equipment;

        if (lastEquip && rareEquipment.includes(lastEquip)) {
          expect(
            currentEquip,
            `Exercício consecutivo ${ex.name} usa o mesmo equipamento raro: ${lastEquip}`
          ).not.toBe(lastEquip);
        }

        lastEquip = currentEquip;
      }
    }
  });
});
