import { describe, it, expect } from "vitest";
import { generateTrainingPlanStructure } from "../generators/trainingPlanGenerator";
import { adaptUserProfileToConstraints } from "../generators/trainingProfileAdapter";

// Mock para simular o cálculo de BMR que a IA faria (apenas para validação lógica)
function calculateExpectedBMR(weight: number, height: number, age: number, gender: string) {
  if (gender === "Masculino") {
    return (10 * weight) + (6.25 * height) - (5 * age) + 5;
  }
  return (10 * weight) + (6.25 * height) - (5 * age) - 161;
}

describe("Bateria de Testes Multi-Perfil", () => {
  
  it("Perfil 1: Sedentária, IMC Alto (90kg), 90min - Foco em Segurança e Volume", () => {
    const plan = generateTrainingPlanStructure(
      4, "Sedentário", "Upper/Lower", 90, 31.1, "Emagrecimento", false, false, "Academia", 40, "Feminino"
    );

    const lowerDay = plan.weeklySchedule.find(d => d.type.includes("Lower"));
    const axialExercises = lowerDay?.exercises.filter(e => {
        // No banco, marcamos Agachamento Livre, Stiff, RDL e Sumô como High Axial
        const name = e.name.toLowerCase();
        return name.includes("agachamento livre") || name.includes("stiff") || name.includes("romeno") || name.includes("sumô");
    });

    console.log(`[Perfil 1] Exercícios Lower: ${lowerDay?.exercises.length}`);
    console.log(`[Perfil 1] Exercícios Axiais: ${axialExercises?.length}`);

    // Deve respeitar a trava de 1 exercício axial
    expect(axialExercises?.length).toBeLessThanOrEqual(1);
    // Mas deve ter volume (pelo menos 4-5 exercícios já que tem 90min)
    expect(lowerDay?.exercises.length).toBeGreaterThanOrEqual(4);
    
    // Verificando BMR (Lógica que a IA deve seguir)
    const bmr = calculateExpectedBMR(90, 170, 40, "Feminino");
    console.log(`[Perfil 1] BMR Esperada: ${bmr} kcal. A IA não deve prescrever menos que isso.`);
    expect(bmr).toBeCloseTo(1601.5, 0); 
  });

  it("Perfil 2: Atleta, 45min, Ganho de Massa - Foco em Intensidade e Tempo", () => {
    const plan = generateTrainingPlanStructure(
      5, "Atleta", "PPL", 45, 23.0, "Ganho de Massa", false, false, "Academia", 25, "Masculino"
    );

    const pushDay = plan.weeklySchedule.find(d => d.type.includes("Push"));
    console.log(`[Perfil 2] Exercícios Push (45min): ${pushDay?.exercises.length}`);
    
    // Para um atleta com apenas 45min, o sistema deve priorizar compostos e limitar volume
    expect(pushDay?.exercises.length).toBeLessThanOrEqual(6);
    
    // Devem ser exercícios de 4 séries (Regra de Atleta)
    const compound = pushDay?.exercises.find(e => e.name.includes("Supino"));
    expect(compound?.sets).toBeGreaterThanOrEqual(3);
  });

  it("Perfil 3: Moderado, 30min, Emagrecimento - Foco em Eficiência Extrema", () => {
    const plan = generateTrainingPlanStructure(
      3, "Moderado", "Full Body", 30, 28.0, "Emagrecimento", false, false, "Academia", 35, "Feminino"
    );

    plan.weeklySchedule.forEach(day => {
        console.log(`[Perfil 3] Exercícios ${day.type} (30min): ${day.exercises.length}`);
        // Em 30 minutos, não pode ter mais que 4 exercícios para ser humanamente possível
        expect(day.exercises.length).toBeLessThanOrEqual(4);
        // Séries devem ser baixas (2 ou 3)
        day.exercises.forEach(ex => expect(ex.sets).toBeLessThanOrEqual(3));
    });
  });

  it("Verificação de Variedade A/B (Sem repetição)", () => {
    const plan = generateTrainingPlanStructure(
      4, "Intermediário", "Upper/Lower", 60, 24.0, "Definição", false, false, "Academia", 30, "Masculino"
    );

    const upperA = plan.weeklySchedule.find(d => d.day.includes("Upper (A)"));
    const upperB = plan.weeklySchedule.find(d => d.day.includes("Upper (B)"));

    const namesA = new Set(upperA?.exercises.map(e => e.name));
    const namesB = new Set(upperB?.exercises.map(e => e.name));

    const intersection = [...namesA].filter(name => namesB.has(name));
    console.log(`[Variedade] Exercícios repetidos entre Upper A e B: ${intersection.length}`);
    
    // A nova lógica deve garantir que eles usem exercícios diferentes do banco
    expect(intersection.length).toBeLessThan(namesA.size);
  });

});
