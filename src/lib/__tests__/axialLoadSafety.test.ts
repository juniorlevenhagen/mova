import { describe, it, expect } from "vitest";
import { generateTrainingPlanStructure } from "../generators/trainingPlanGenerator";
import { EXERCISE_DATABASE } from "../generators/exerciseDatabase";

describe("Segurança Articular - Carga Axial (IMC >= 30)", () => {
  it("deve limitar a apenas 1 exercício de alta carga axial por dia para IMC 31.1", () => {
    // Perfil do usuário com IMC elevado
    const trainingDays = 4;
    const activityLevel = "Moderado";
    const availableTimeMinutes = 90;
    const imc = 31.1; // Obesidade
    const objective = "Emagrecimento";

    const plan = generateTrainingPlanStructure(
      trainingDays,
      activityLevel,
      undefined,
      availableTimeMinutes,
      imc,
      objective
    );

    // Mapear quais exercícios no banco de dados são de alta carga axial
    const highAxialExercises = new Set<string>();
    Object.values(EXERCISE_DATABASE).forEach((category) => {
      category.forEach((ex) => {
        if (ex.isHighAxialLoad) {
          highAxialExercises.add(ex.name);
        }
      });
    });

    console.log("--- VALIDAÇÃO DE CARGA AXIAL (IMC 31.1) ---");

    plan.weeklySchedule.forEach((day) => {
      const axialInDay = day.exercises.filter((ex) =>
        highAxialExercises.has(ex.name)
      );

      console.log(`Dia: ${day.day}`);
      console.log(
        `Exercícios Axiais (${axialInDay.length}):`,
        axialInDay.map((ex) => ex.name)
      );

      // VALIDAÇÃO CRÍTICA: Não pode ter mais de 1 por dia
      expect(axialInDay.length).toBeLessThanOrEqual(1);

      // Se for um dia de pernas (Lower), garantir que não misturou Agachamento + Stiff/RDL
      if (
        day.day.toLowerCase().includes("lower") ||
        day.day.toLowerCase().includes("legs")
      ) {
        const hasSquat = axialInDay.some((ex) =>
          ex.name.includes("Agachamento")
        );
        const hasHinge = axialInDay.some(
          (ex) =>
            ex.name.includes("Stiff") ||
            ex.name.includes("RDL") ||
            ex.name.includes("Terra")
        );

        // Se tem um, não pode ter o outro (se ambos forem axiais)
        if (hasSquat && hasHinge) {
          throw new Error(
            `VIOLAÇÃO: Dia de pernas com Agachamento e Stiff/RDL simultâneos para IMC ${imc}`
          );
        }
      }
    });

    console.log("-------------------------------------------");
  });

  it("deve fornecer feedback de segurança avisando sobre o ajuste de IMC", () => {
    const plan = generateTrainingPlanStructure(
      4,
      "Moderado",
      undefined,
      60,
      31.1,
      "Emagrecimento"
    );

    expect(plan.safetyFeedback).toBeDefined();
    expect(plan.safetyFeedback?.message).toContain(
      "proteger suas articulações"
    );
  });
});
