import { describe, it, expect } from "vitest";

/**
 * Regra:
 * 2–3x → Full Body
 * 4x   → Upper/Lower
 * 5x   → PPL
 * 6x   → PPL 2x
 */

function expectedDivisionByFrequency(frequency: number) {
  if (frequency <= 3) return "FULL_BODY";
  if (frequency === 4) return "UPPER_LOWER";
  if (frequency === 5) return "PPL";
  if (frequency >= 6) return "PPL_2X";
  return "UNKNOWN";
}

describe("Divisão correta baseada na frequência semanal", () => {
  it("2x por semana deve ser Full Body", () => {
    expect(expectedDivisionByFrequency(2)).toBe("FULL_BODY");
  });

  it("3x por semana deve ser Full Body", () => {
    expect(expectedDivisionByFrequency(3)).toBe("FULL_BODY");
  });

  it("4x por semana deve ser Upper/Lower", () => {
    expect(expectedDivisionByFrequency(4)).toBe("UPPER_LOWER");
  });

  it("5x por semana deve ser PPL", () => {
    expect(expectedDivisionByFrequency(5)).toBe("PPL");
  });

  it("6x por semana deve ser PPL 2x", () => {
    expect(expectedDivisionByFrequency(6)).toBe("PPL_2X");
  });
});
