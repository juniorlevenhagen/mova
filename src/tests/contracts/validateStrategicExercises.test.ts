import { describe, it, expect } from "vitest";
import { EXERCISE_DATABASE } from "@/lib/generators/trainingPlanGenerator";

describe("Validação de Exercícios Estratégicos Adicionados", () => {
  it("deve ter os grupos estratégicos criados", () => {
    expect(EXERCISE_DATABASE.gluteos).toBeDefined();
    expect(EXERCISE_DATABASE.abdomen).toBeDefined();
  });

  it("deve ter exercícios fundamentais de prioridade ALTA", () => {
    // Deadlift
    const deadlift = EXERCISE_DATABASE.costas.find(
      (ex) => ex.name.includes("Deadlift") || ex.name.includes("Terra")
    );
    expect(deadlift).toBeDefined();
    expect(deadlift?.role).toBe("structural");
    expect(deadlift?.pattern).toBe("hip_dominant");

    // Hip Thrust
    const hipThrust = EXERCISE_DATABASE.gluteos?.find(
      (ex) => ex.name.includes("Hip Thrust") && !ex.name.includes("barra")
    );
    expect(hipThrust).toBeDefined();
    expect(hipThrust?.role).toBe("structural");
    expect(hipThrust?.pattern).toBe("hip_dominant");

    // Paralelas (Dips)
    const dips = EXERCISE_DATABASE.peitoral.find(
      (ex) => ex.name.includes("Paralelas") || ex.name.includes("Dips")
    );
    expect(dips).toBeDefined();
    expect(dips?.role).toBe("structural");
    expect(dips?.pattern).toBe("horizontal_push");

    // Plank
    const plank = EXERCISE_DATABASE.abdomen?.find((ex) => ex.name === "Plank");
    expect(plank).toBeDefined();
    expect(plank?.role).toBe("structural");
  });

  it("deve ter exercícios de prioridade MÉDIA", () => {
    // Lat Pulldown
    const latPulldown = EXERCISE_DATABASE.costas.find((ex) =>
      ex.name.includes("Lat Pulldown")
    );
    expect(latPulldown).toBeDefined();
    expect(latPulldown?.role).toBe("structural");
    expect(latPulldown?.pattern).toBe("vertical_pull");

    // Seated Cable Row
    const seatedRow = EXERCISE_DATABASE.costas.find((ex) =>
      ex.name.includes("Seated Cable Row")
    );
    expect(seatedRow).toBeDefined();
    expect(seatedRow?.role).toBe("structural");
    expect(seatedRow?.pattern).toBe("horizontal_pull");

    // T-Bar Row
    const tBarRow = EXERCISE_DATABASE.costas.find((ex) =>
      ex.name.includes("T-Bar Row")
    );
    expect(tBarRow).toBeDefined();
    expect(tBarRow?.role).toBe("structural");
    expect(tBarRow?.pattern).toBe("horizontal_pull");

    // Cable Fly
    const cableFly = EXERCISE_DATABASE.peitoral.find((ex) =>
      ex.name.includes("Cable Fly")
    );
    expect(cableFly).toBeDefined();
    expect(cableFly?.role).toBe("isolated");
    expect(cableFly?.pattern).toBe("horizontal_push");

    // Nordic Curl
    const nordicCurl = EXERCISE_DATABASE["posterior de coxa"].find((ex) =>
      ex.name.includes("Nordic Curl")
    );
    expect(nordicCurl).toBeDefined();
    expect(nordicCurl?.role).toBe("structural");
  });

  it("deve ter exercícios de core/abdômen completos", () => {
    const coreExercises = EXERCISE_DATABASE.abdomen || [];
    expect(coreExercises.length).toBeGreaterThanOrEqual(7);

    const exerciseNames = coreExercises.map((ex) => ex.name);
    expect(exerciseNames).toContain("Plank");
    expect(exerciseNames).toContain("Abdominal Crunch");
    expect(exerciseNames).toContain("Russian Twist");
    expect(exerciseNames).toContain("Leg Raises");
    expect(exerciseNames).toContain("Dead Bug");
  });

  it("deve ter exercícios de glúteos completos", () => {
    const gluteExercises = EXERCISE_DATABASE.gluteos || [];
    expect(gluteExercises.length).toBeGreaterThanOrEqual(6);

    const exerciseNames = gluteExercises.map((ex) => ex.name);
    expect(exerciseNames).toContain("Hip Thrust");
    expect(exerciseNames).toContain("Ponte de glúteo");
    expect(exerciseNames).toContain("Clamshell");
  });

  it("deve ter metadados explícitos nos exercícios estruturais principais", () => {
    // Peitoral - Supino reto
    const supino = EXERCISE_DATABASE.peitoral.find(
      (ex) => ex.name.includes("Supino reto") && ex.name.includes("barra")
    );
    expect(supino?.role).toBe("structural");
    expect(supino?.pattern).toBe("horizontal_push");

    // Costas - Deadlift
    const deadlift = EXERCISE_DATABASE.costas.find((ex) =>
      ex.name.includes("Deadlift")
    );
    expect(deadlift?.role).toBe("structural");
    expect(deadlift?.pattern).toBe("hip_dominant");

    // Quadríceps - Agachamento
    const agachamento = EXERCISE_DATABASE.quadriceps.find((ex) =>
      ex.name.includes("Agachamento com barra")
    );
    expect(agachamento?.role).toBe("structural");
    expect(agachamento?.pattern).toBe("knee_dominant");

    // Posterior - Stiff
    const stiff = EXERCISE_DATABASE["posterior de coxa"].find((ex) =>
      ex.name.includes("Stiff com barra")
    );
    expect(stiff?.role).toBe("structural");
    expect(stiff?.pattern).toBe("hip_dominant");

    // Ombros - Desenvolvimento
    const desenvolvimento = EXERCISE_DATABASE.ombros.find((ex) =>
      ex.name.includes("Desenvolvimento militar")
    );
    expect(desenvolvimento?.role).toBe("structural");
    expect(desenvolvimento?.pattern).toBe("vertical_push");
  });

  it("deve ter variações de ombros com cabo", () => {
    const ombroExercises = EXERCISE_DATABASE.ombros;
    const cableExercises = ombroExercises.filter(
      (ex) => ex.name.includes("cabo") || ex.name.includes("Cable")
    );
    expect(cableExercises.length).toBeGreaterThanOrEqual(2);
  });
});
