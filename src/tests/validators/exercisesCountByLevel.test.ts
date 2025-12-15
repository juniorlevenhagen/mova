import { describe, it, expect } from "vitest";
import { validateExercisesCountByLevel } from "@/lib/validators/exerciseCountValidator";

describe("Quantidade de exercícios por dia por nível", () => {
  it("Idoso não pode ter mais de 5 exercícios", () => {
    expect(validateExercisesCountByLevel(6, "Idoso")).toBe(false);
    expect(validateExercisesCountByLevel(5, "Idoso")).toBe(true);
  });

  it("Iniciante pode ter até 6 exercícios", () => {
    expect(validateExercisesCountByLevel(6, "Iniciante")).toBe(true);
    expect(validateExercisesCountByLevel(7, "Iniciante")).toBe(false);
  });

  it("Moderado pode ter até 8 exercícios", () => {
    expect(validateExercisesCountByLevel(8, "Moderado")).toBe(true);
    expect(validateExercisesCountByLevel(9, "Moderado")).toBe(false);
  });

  it("Atleta pode ter até 10 exercícios", () => {
    expect(validateExercisesCountByLevel(10, "Atleta")).toBe(true);
    expect(validateExercisesCountByLevel(11, "Atleta")).toBe(false);
  });

  it("Atleta alto rendimento pode ter até 12 exercícios", () => {
    expect(validateExercisesCountByLevel(12, "Atleta Alto Rendimento")).toBe(
      true
    );
    expect(validateExercisesCountByLevel(13, "Atleta Alto Rendimento")).toBe(
      false
    );
  });

  it("Nunca pode ter menos de 3 exercícios", () => {
    expect(validateExercisesCountByLevel(2, "Moderado")).toBe(false);
    expect(validateExercisesCountByLevel(3, "Moderado")).toBe(true);
  });

  it("Nunca pode ter mais de 12 exercícios (limite absoluto)", () => {
    expect(validateExercisesCountByLevel(13, "Atleta Alto Rendimento")).toBe(
      false
    );
  });
});
