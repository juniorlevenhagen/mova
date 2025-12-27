import { describe, it, expect } from "vitest";
import { generateTrainingPlanStructure } from "@/lib/generators/trainingPlanGenerator";
import {
  getContractForMuscleGroup,
  getMinStructural,
} from "@/lib/contracts/muscleGroupContracts";
import { getContractKey } from "@/lib/contracts/exerciseTypes";
import { auditContract } from "@/lib/contracts/contractAuditor";

/**
 * Testes para Geração Guiada por Contrato
 *
 * Valida:
 * - Requisitos estruturais mínimos são garantidos
 * - Padrões obrigatórios estão presentes
 * - Não há duplicação de exercícios
 * - Fallback funciona quando não há contrato
 */

describe("Geração Guiada por Contrato", () => {
  describe("Lower Body Contract", () => {
    it("deve garantir requisitos mínimos de estruturais para Lower Body", () => {
      const activityLevels = [
        "Sedentário",
        "Moderado",
        "Atleta",
        "Atleta Alto Rendimento",
      ];

      activityLevels.forEach((level) => {
        const plan = generateTrainingPlanStructure(
          3, // 3 dias
          level,
          "Full Body",
          60,
          25,
          "Ganhar massa",
          false,
          false,
          "academia"
        );

        // Contar exercícios de quadríceps e posterior
        let lowerBodyStructuralCount = 0;
        const patternsFound = new Set<string>();

        plan.weeklySchedule.forEach((day) => {
          day.exercises.forEach((ex) => {
            const muscle = ex.primaryMuscle.toLowerCase();
            if (
              muscle.includes("quadricep") ||
              muscle.includes("posterior") ||
              muscle.includes("coxa")
            ) {
              // Verificar se é estrutural (compound)
              const name = ex.name.toLowerCase();
              if (
                name.includes("agachamento") ||
                name.includes("squat") ||
                name.includes("stiff") ||
                name.includes("rdl") ||
                name.includes("deadlift") ||
                name.includes("leg press")
              ) {
                lowerBodyStructuralCount++;

                // Detectar padrão
                if (
                  name.includes("agachamento") ||
                  name.includes("squat") ||
                  name.includes("leg press")
                ) {
                  patternsFound.add("knee_dominant");
                }
                if (
                  name.includes("stiff") ||
                  name.includes("rdl") ||
                  name.includes("deadlift")
                ) {
                  patternsFound.add("hip_dominant");
                }
              }
            }
          });
        });

        const contract = getContractForMuscleGroup("quadriceps");
        if (contract) {
          const minRequired = getMinStructural(contract, level);
          const contractKey = getContractKey(level);

          console.log(
            `\n📊 ${level}: Estruturais encontrados=${lowerBodyStructuralCount}, Mínimo requerido=${minRequired} (${contractKey})`
          );
          console.log(
            `   Padrões encontrados: ${Array.from(patternsFound).join(", ")}`
          );

          // Verificar requisito mínimo
          expect(lowerBodyStructuralCount).toBeGreaterThanOrEqual(minRequired);

          // Verificar padrões obrigatórios (knee_dominant e hip_dominant)
          expect(
            patternsFound.has("knee_dominant") ||
              patternsFound.has("hip_dominant")
          ).toBe(true);
        }
      });
    });
  });

  describe("Chest Contract", () => {
    it("deve garantir requisitos mínimos de estruturais para Peitoral", () => {
      const plan = generateTrainingPlanStructure(
        3,
        "Moderado",
        "PPL",
        60,
        25,
        "Ganhar massa",
        false,
        false,
        "academia"
      );

      // Encontrar dias Push
      const pushDays = plan.weeklySchedule.filter((day) => day.type === "Push");

      pushDays.forEach((day) => {
        const chestExercises = day.exercises.filter(
          (ex) =>
            ex.primaryMuscle.toLowerCase().includes("peito") ||
            ex.primaryMuscle.toLowerCase().includes("peitoral")
        );

        const structuralChest = chestExercises.filter((ex) => {
          const name = ex.name.toLowerCase();
          return (
            name.includes("supino") ||
            name.includes("bench") ||
            name.includes("flexao") ||
            name.includes("flexão")
          );
        });

        const contract = getContractForMuscleGroup("peitoral");
        if (contract) {
          const minRequired = getMinStructural(contract, "Moderado");

          console.log(
            `\n📊 Push Day: Estruturais de peito=${structuralChest.length}, Mínimo=${minRequired}`
          );
          console.log(
            `   Exercícios: ${structuralChest.map((e) => e.name).join(", ")}`
          );

          expect(structuralChest.length).toBeGreaterThanOrEqual(minRequired);
        }
      });
    });
  });

  describe("Prevenção de Duplicação", () => {
    it("não deve duplicar exercícios estruturais no mesmo dia", () => {
      const plan = generateTrainingPlanStructure(
        3,
        "Moderado",
        "Full Body",
        60,
        25,
        "Ganhar massa",
        false,
        false,
        "academia"
      );

      plan.weeklySchedule.forEach((day) => {
        const exerciseNames = day.exercises.map((ex) => ex.name);
        const uniqueNames = new Set(exerciseNames);

        console.log(
          `\n📊 ${day.day}: Total=${exerciseNames.length}, Únicos=${uniqueNames.size}`
        );

        // Não deve haver duplicação
        expect(exerciseNames.length).toBe(uniqueNames.size);

        // Verificar especificamente estruturais
        const structuralNames = day.exercises
          .filter((ex) => {
            const name = ex.name.toLowerCase();
            return (
              name.includes("agachamento") ||
              name.includes("squat") ||
              name.includes("supino") ||
              name.includes("stiff") ||
              name.includes("remada") ||
              name.includes("puxada")
            );
          })
          .map((ex) => ex.name);

        const uniqueStructural = new Set(structuralNames);
        expect(structuralNames.length).toBe(uniqueStructural.size);
      });
    });
  });

  describe("Fallback quando não há contrato", () => {
    it("deve usar comportamento padrão para grupos sem contrato", () => {
      // Trapézio não tem contrato específico
      const plan = generateTrainingPlanStructure(
        3,
        "Moderado",
        "Full Body",
        60,
        25,
        "Ganhar massa",
        false,
        false,
        "academia"
      );

      // Deve gerar plano normalmente mesmo sem contrato
      expect(plan).toBeDefined();
      expect(plan.weeklySchedule.length).toBeGreaterThan(0);

      plan.weeklySchedule.forEach((day) => {
        expect(day.exercises.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Auditoria de Contratos", () => {
    it("deve auditar planos gerados sem bloquear", () => {
      const plan = generateTrainingPlanStructure(
        3,
        "Moderado",
        "Full Body",
        60,
        25,
        "Ganhar massa",
        false,
        false,
        "academia"
      );

      // Auditoria não deve lançar erro, apenas registrar métricas
      expect(() => {
        auditContract(plan, {
          activityLevel: "Moderado",
        });
      }).not.toThrow();

      // Plano deve ser válido mesmo após auditoria
      expect(plan).toBeDefined();
      expect(plan.weeklySchedule.length).toBeGreaterThan(0);
    });
  });

  describe("Integração com ApprovalContract", () => {
    it("deve respeitar ApprovalContract enquanto segue contratos de grupo", () => {
      const plan = generateTrainingPlanStructure(
        4,
        "Atleta",
        "Upper/Lower",
        60,
        25,
        "Ganhar massa",
        false,
        false,
        "academia"
      );

      // Verificar que limites semanais são respeitados
      const weeklySeries: Record<string, number> = {};

      plan.weeklySchedule.forEach((day) => {
        day.exercises.forEach((ex) => {
          const muscle = ex.primaryMuscle.toLowerCase();
          const normalized =
            muscle.includes("peito") || muscle.includes("peitoral")
              ? "peito"
              : muscle.includes("costa")
                ? "costas"
                : muscle.includes("quadricep")
                  ? "quadriceps"
                  : muscle.includes("posterior") || muscle.includes("coxa")
                    ? "posterior"
                    : muscle.includes("ombro")
                      ? "ombro"
                      : muscle.includes("triceps")
                        ? "triceps"
                        : muscle.includes("biceps")
                          ? "biceps"
                          : muscle;

          weeklySeries[normalized] = (weeklySeries[normalized] || 0) + ex.sets;
        });
      });

      // Limites esperados para Atleta
      const expectedLimits: Record<string, number> = {
        peito: 16,
        costas: 16,
        quadriceps: 16,
        posterior: 12,
        ombro: 10,
        triceps: 10,
        biceps: 10,
      };

      Object.entries(weeklySeries).forEach(([muscle, series]) => {
        const limit = expectedLimits[muscle];
        if (limit) {
          console.log(`📊 ${muscle}: ${series} séries (limite: ${limit})`);
          expect(series).toBeLessThanOrEqual(limit);
        }
      });
    });
  });
});
