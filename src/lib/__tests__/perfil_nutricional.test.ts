import { describe, it, expect } from "vitest";

// Simulação das fórmulas do sistema
function calculateBMR(
  weight: number,
  height: number,
  age: number,
  gender: string
) {
  if (gender.toLowerCase().includes("feminino")) {
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }
  return 10 * weight + 6.25 * height - 5 * age + 5;
}

function calculateTDEE(bmr: number, activityLevel: string) {
  const multipliers: Record<string, number> = {
    sedentario: 1.2,
    moderado: 1.55,
    atleta: 1.725,
    atleta_alto_rendimento: 1.9,
  };
  const level = activityLevel.toLowerCase();
  return bmr * (multipliers[level] || 1.55);
}

function calculateDeficitRange(tdee: number, bmr: number) {
  const minDeficit = tdee - 300;
  const maxDeficit = tdee - 500;

  // Regra de segurança: Nunca abaixo da BMR
  const finalMin = Math.max(maxDeficit, bmr);
  const finalMax = Math.max(minDeficit, bmr);

  return {
    target: [Math.round(finalMin), Math.round(finalMax)],
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
  };
}

describe("Teste de Perfil Nutricional (perfil.txt)", () => {
  it("deve calcular as calorias corretas para uma mulher de 90kg, 170cm, 40 anos e nível moderado", () => {
    const weight = 90;
    const height = 170;
    const age = 40;
    const gender = "Feminino";
    const activityLevel = "Moderado";

    const bmr = calculateBMR(weight, height, age, gender);
    const tdee = calculateTDEE(bmr, activityLevel);
    const range = calculateDeficitRange(tdee, bmr);

    console.log("--- RESULTADOS DO TESTE ---");
    console.log(`BMR (Basal): ${range.bmr} kcal`);
    console.log(`TDEE (Gasto Total): ${range.tdee} kcal`);
    console.log(
      `Faixa de Déficit Recomendada: ${range.target[0]} - ${range.target[1]} kcal`
    );
    console.log("---------------------------");

    expect(range.bmr).toBe(1602); // 900 + 1062.5 - 200 - 161 = 1601.5 -> 1602
    expect(range.tdee).toBe(2482); // 1601.5 * 1.55 = 2482.325 -> 2482
    expect(range.target[0]).toBe(1982); // 2482 - 500 = 1982
    expect(range.target[1]).toBe(2182); // 2482 - 300 = 2182
  });
});
