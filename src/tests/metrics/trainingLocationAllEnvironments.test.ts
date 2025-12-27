import { describe, it, expect } from "vitest";
import { generateTrainingPlanStructure } from "@/lib/generators/trainingPlanGenerator";

/**
 * Teste Completo: Todos os Ambientes Disponíveis
 *
 * Este teste gera planos para cada ambiente e mostra exatamente
 * quais exercícios são gerados, permitindo validação visual.
 */

describe("Teste Completo: Todos os Ambientes de Treino", () => {
  const environments: Array<"academia" | "casa" | "ambos" | "ar_livre"> = [
    "academia",
    "casa",
    "ambos",
    "ar_livre",
  ];

  const testConfig = {
    trainingDays: 3,
    activityLevel: "Moderado",
    division: "Full Body" as const,
    availableTimeMinutes: 60,
    imc: 25,
    objective: "Ganhar massa",
    jointLimitations: false,
    kneeLimitations: false,
  };

  describe("Análise Detalhada por Ambiente", () => {
    environments.forEach((environment) => {
      it(`deve gerar plano para ambiente "${environment}" e mostrar exercícios gerados`, () => {
        const plan = generateTrainingPlanStructure(
          testConfig.trainingDays,
          testConfig.activityLevel,
          testConfig.division,
          testConfig.availableTimeMinutes,
          testConfig.imc,
          testConfig.objective,
          testConfig.jointLimitations,
          testConfig.kneeLimitations,
          environment
        );

        // Validar que o plano foi gerado
        expect(plan).toBeDefined();
        expect(plan.weeklySchedule).toBeDefined();
        expect(plan.weeklySchedule.length).toBe(testConfig.trainingDays);

        // Coletar todos os exercícios gerados
        const allExercises: Array<{
          day: string;
          exercise: string;
          primaryMuscle: string;
        }> = [];

        plan.weeklySchedule.forEach((day) => {
          day.exercises.forEach((exercise) => {
            allExercises.push({
              day: day.day,
              exercise: exercise.name,
              primaryMuscle: exercise.primaryMuscle,
            });
          });
        });

        // Exercícios que requerem academia (máquinas, polias, barras pesadas)
        const gymOnlyExercises = [
          "Leg press",
          "Crossover",
          "Mesa flexora",
          "Cadeira extensora",
          "Hack squat",
          "Puxada na frente com barra",
          "Remada baixa com polia",
          "Puxada aberta",
          "Puxada com pegada supinada",
        ];

        // Exercícios de peso corporal puro
        const bodyweightExercises = [
          "Flexão",
          "Agachamento livre",
          "Agachamento com salto",
          "Afundo livre",
          "Remada invertida",
          "Superman",
          "Stiff com peso corporal",
          "Ponte de glúteo",
          "Flexão pike",
          "Prancha",
        ];

        // Exercícios que funcionam em ambos (halteres, barra fixa)
        const bothExercises = [
          "halteres",
          "barra fixa",
          "Barra fixa assistida",
        ];

        // Analisar exercícios gerados
        const foundGymOnly = allExercises.filter((ex) =>
          gymOnlyExercises.some((gym) => ex.exercise.includes(gym))
        );
        const foundBodyweight = allExercises.filter((ex) =>
          bodyweightExercises.some((bw) => ex.exercise.includes(bw))
        );
        const foundBoth = allExercises.filter((ex) =>
          bothExercises.some((both) => ex.exercise.includes(both))
        );

        // Log detalhado para análise
        console.log(`\n🏋️ AMBIENTE: ${environment.toUpperCase()}`);
        console.log(`📊 Total de exercícios: ${allExercises.length}`);
        console.log(`\n📋 EXERCÍCIOS GERADOS:`);
        plan.weeklySchedule.forEach((day, index) => {
          console.log(`\n  Dia ${index + 1}: ${day.day}`);
          day.exercises.forEach((ex) => {
            console.log(`    - ${ex.name} (${ex.primaryMuscle})`);
          });
        });

        console.log(`\n📊 ANÁLISE:`);
        console.log(`  - Exercícios de academia: ${foundGymOnly.length}`);
        console.log(
          `  - Exercícios de peso corporal: ${foundBodyweight.length}`
        );
        console.log(
          `  - Exercícios compatíveis com ambos: ${foundBoth.length}`
        );

        // Validações específicas por ambiente
        if (environment === "casa") {
          console.log(`\n✅ VALIDAÇÃO CASA:`);
          console.log(
            `  - Não deve ter exercícios de máquina: ${foundGymOnly.length === 0 ? "✅ PASSOU" : "❌ FALHOU"}`
          );
          expect(foundGymOnly.length).toBe(0);
        }

        if (environment === "ar_livre") {
          console.log(`\n✅ VALIDAÇÃO AR LIVRE:`);
          console.log(
            `  - Não deve ter exercícios de máquina: ${foundGymOnly.length === 0 ? "✅ PASSOU" : "❌ FALHOU"}`
          );
          expect(foundGymOnly.length).toBe(0);
        }

        if (environment === "ambos") {
          console.log(`\n✅ VALIDAÇÃO AMBOS:`);
          console.log(
            `  - Deve priorizar exercícios compatíveis: ${foundBoth.length > 0 || foundBodyweight.length > 0 ? "✅ PASSOU" : "⚠️ AVISO"}`
          );
          // Ambos pode ter qualquer exercício, mas deve priorizar
        }

        if (environment === "academia" || !environment) {
          console.log(`\n✅ VALIDAÇÃO ACADEMIA:`);
          console.log(`  - Pode ter qualquer tipo de exercício: ✅ PASSOU`);
          // Academia não tem restrições
        }

        // Validar que pelo menos alguns exercícios foram gerados
        expect(allExercises.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Comparação entre Ambientes", () => {
    it("deve mostrar diferenças entre ambientes", () => {
      const plansByEnvironment: Record<
        string,
        {
          exercises: string[];
          gymOnlyCount: number;
          bodyweightCount: number;
          bothCount: number;
        }
      > = {};

      environments.forEach((env) => {
        const plan = generateTrainingPlanStructure(
          testConfig.trainingDays,
          testConfig.activityLevel,
          testConfig.division,
          testConfig.availableTimeMinutes,
          testConfig.imc,
          testConfig.objective,
          testConfig.jointLimitations,
          testConfig.kneeLimitations,
          env
        );

        const allExercises: string[] = [];
        plan.weeklySchedule.forEach((day) => {
          day.exercises.forEach((ex) => {
            allExercises.push(ex.name);
          });
        });

        const gymOnly = allExercises.filter((ex) =>
          ["Leg press", "Crossover", "Mesa flexora", "Cadeira extensora"].some(
            (gym) => ex.includes(gym)
          )
        ).length;

        const bodyweight = allExercises.filter((ex) =>
          ["Flexão", "Agachamento livre", "Remada invertida", "Superman"].some(
            (bw) => ex.includes(bw)
          )
        ).length;

        const both = allExercises.filter((ex) =>
          ["halteres", "barra fixa"].some((b) => ex.includes(b))
        ).length;

        plansByEnvironment[env] = {
          exercises: allExercises,
          gymOnlyCount: gymOnly,
          bodyweightCount: bodyweight,
          bothCount: both,
        };
      });

      // Log comparativo
      console.log(`\n📊 COMPARAÇÃO ENTRE AMBIENTES:`);
      console.log(`\n${"=".repeat(80)}`);
      Object.entries(plansByEnvironment).forEach(([env, data]) => {
        console.log(`\n🏋️ ${env.toUpperCase()}:`);
        console.log(
          `  Total de exercícios únicos: ${new Set(data.exercises).size}`
        );
        console.log(`  Exercícios de máquina: ${data.gymOnlyCount}`);
        console.log(`  Exercícios de peso corporal: ${data.bodyweightCount}`);
        console.log(
          `  Exercícios compatíveis (halteres/barra fixa): ${data.bothCount}`
        );
        console.log(`  Lista: ${[...new Set(data.exercises)].join(", ")}`);
      });
      console.log(`\n${"=".repeat(80)}\n`);

      // Validações
      // Casa e ar livre não devem ter exercícios de máquina
      expect(plansByEnvironment["casa"].gymOnlyCount).toBe(0);
      expect(plansByEnvironment["ar_livre"].gymOnlyCount).toBe(0);

      // Academia pode ter exercícios de máquina
      // (não validamos que DEVE ter, apenas que PODE ter)

      // Ambos deve ter uma mistura
      // (não validamos quantidade específica)
    });
  });

  describe("Validação de Consistência", () => {
    it("deve gerar planos válidos para todos os ambientes", () => {
      environments.forEach((env) => {
        const plan = generateTrainingPlanStructure(
          testConfig.trainingDays,
          testConfig.activityLevel,
          testConfig.division,
          testConfig.availableTimeMinutes,
          testConfig.imc,
          testConfig.objective,
          testConfig.jointLimitations,
          testConfig.kneeLimitations,
          env
        );

        // Validar estrutura básica
        expect(plan).toBeDefined();
        expect(plan.weeklySchedule).toBeDefined();
        expect(plan.weeklySchedule.length).toBe(testConfig.trainingDays);

        // Validar que cada dia tem exercícios
        plan.weeklySchedule.forEach((day) => {
          expect(day.exercises.length).toBeGreaterThan(0);
          expect(day.exercises.every((ex) => ex.name && ex.primaryMuscle)).toBe(
            true
          );
        });

        console.log(
          `✅ Ambiente "${env}": Plano válido com ${plan.weeklySchedule.reduce((sum, day) => sum + day.exercises.length, 0)} exercícios totais`
        );
      });
    });
  });
});
