import { describe, it, expect } from "vitest";
import { generateTrainingPlanStructure } from "@/lib/generators/trainingPlanGenerator";
import { isTrainingPlanUsable } from "@/lib/validators/trainingPlanValidator";
import type {
  TrainingPlan,
  TrainingDay,
  Exercise,
} from "@/lib/validators/trainingPlanValidator";

/**
 * Testes para Geração de Planos de Treino
 *
 * Valida:
 * - Geração de planos válidos para diferentes configurações
 * - Respeito a limites semanais de séries
 * - Validação de divisões (PPL, Upper/Lower, Full Body)
 * - Respeito a restrições articulares
 * - Respeito a ambiente de treino
 * - Ajuste para déficit calórico
 * - Validação de tempo disponível
 */

describe("Geração de Planos de Treino", () => {
  describe("Geração Básica - Full Body", () => {
    it("deve gerar plano Full Body válido para 3 dias", () => {
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

      expect(plan).toBeDefined();
      expect(plan.weeklySchedule).toBeDefined();
      expect(plan.weeklySchedule.length).toBe(3);
      expect(plan.overview).toBeDefined();
      expect(plan.progression).toBeDefined();

      // Validar que o plano é válido
      const isValid = isTrainingPlanUsable(plan, 3, "Moderado", 60, {
        imc: 25,
        objective: "Ganhar massa",
      });
      expect(isValid).toBe(true);
    });

    it("deve gerar plano Full Body com todos os dias tendo o mesmo tipo", () => {
      const plan = generateTrainingPlanStructure(
        3,
        "Moderado",
        "Full Body",
        60,
        25,
        "Ganhar massa"
      );

      const dayTypes = plan.weeklySchedule.map((day) => day.type);
      const uniqueTypes = new Set(dayTypes);

      // Todos os dias devem ser do tipo "Full Body" ou similar
      expect(uniqueTypes.size).toBeLessThanOrEqual(1);
    });

    it("deve gerar plano Full Body com exercícios variados por grupo muscular", () => {
      const plan = generateTrainingPlanStructure(
        3,
        "Moderado",
        "Full Body",
        60
      );

      // Verificar que cada dia tem exercícios
      plan.weeklySchedule.forEach((day) => {
        expect(day.exercises.length).toBeGreaterThan(0);
        expect(day.exercises.length).toBeLessThanOrEqual(7); // Limite máximo
      });

      // Verificar que há exercícios para diferentes grupos musculares
      const allMuscles = new Set<string>();
      plan.weeklySchedule.forEach((day) => {
        day.exercises.forEach((ex) => {
          allMuscles.add(ex.primaryMuscle.toLowerCase());
        });
      });

      // Deve ter pelo menos alguns grupos musculares diferentes
      expect(allMuscles.size).toBeGreaterThan(3);
    });
  });

  describe("Geração PPL (Push/Pull/Legs)", () => {
    it("deve gerar plano PPL válido para 6 dias", () => {
      const plan = generateTrainingPlanStructure(
        6,
        "Atleta",
        "PPL",
        90,
        23,
        "Ganhar massa"
      );

      expect(plan.weeklySchedule.length).toBe(6);

      // Verificar padrão PPL (Push, Pull, Legs repetido)
      const dayTypes = plan.weeklySchedule.map((day) => day.type);
      const pushDays = dayTypes.filter((t) => t === "Push");
      const pullDays = dayTypes.filter((t) => t === "Pull");
      const legsDays = dayTypes.filter((t) => t === "Legs");

      expect(pushDays.length).toBe(2);
      expect(pullDays.length).toBe(2);
      expect(legsDays.length).toBe(2);

      // Validar plano
      const isValid = isTrainingPlanUsable(plan, 6, "Atleta", 90);
      expect(isValid).toBe(true);
    });

    it("deve gerar plano PPL com exercícios específicos por tipo de dia", () => {
      const plan = generateTrainingPlanStructure(6, "Atleta", "PPL", 90);

      // Verificar Push Days têm exercícios de peito/tríceps/ombros
      const pushDays = plan.weeklySchedule.filter((day) => day.type === "Push");
      pushDays.forEach((day) => {
        const muscles = day.exercises.map((ex) =>
          ex.primaryMuscle.toLowerCase()
        );
        const hasChest = muscles.some(
          (m) => m.includes("peito") || m.includes("peitoral")
        );
        const hasShoulders = muscles.some((m) => m.includes("ombro"));
        expect(hasChest || hasShoulders).toBe(true);
      });

      // Verificar Pull Days têm exercícios de costas/bíceps
      const pullDays = plan.weeklySchedule.filter((day) => day.type === "Pull");
      pullDays.forEach((day) => {
        const muscles = day.exercises.map((ex) =>
          ex.primaryMuscle.toLowerCase()
        );
        const hasBack = muscles.some(
          (m) => m.includes("costa") || m.includes("costas")
        );
        expect(hasBack).toBe(true);
      });

      // Verificar Legs Days têm exercícios de pernas
      const legsDays = plan.weeklySchedule.filter((day) => day.type === "Legs");
      legsDays.forEach((day) => {
        const muscles = day.exercises.map((ex) =>
          ex.primaryMuscle.toLowerCase()
        );
        const hasLegs = muscles.some(
          (m) =>
            m.includes("quadricep") ||
            m.includes("posterior") ||
            m.includes("coxa") ||
            m.includes("panturrilha")
        );
        expect(hasLegs).toBe(true);
      });
    });
  });

  describe("Geração Upper/Lower", () => {
    it("deve gerar plano Upper/Lower válido para 4 dias", () => {
      const plan = generateTrainingPlanStructure(
        4,
        "Moderado",
        "Upper/Lower",
        75,
        24,
        "Ganhar massa"
      );

      expect(plan.weeklySchedule.length).toBe(4);

      const dayTypes = plan.weeklySchedule.map((day) => day.type);
      const upperDays = dayTypes.filter((t) => t === "Upper");
      const lowerDays = dayTypes.filter((t) => t === "Lower");

      expect(upperDays.length).toBe(2);
      expect(lowerDays.length).toBe(2);

      const isValid = isTrainingPlanUsable(plan, 4, "Moderado", 75);
      expect(isValid).toBe(true);
    });

    it("deve gerar Upper/Lower com exercícios corretos por tipo", () => {
      const plan = generateTrainingPlanStructure(
        4,
        "Moderado",
        "Upper/Lower",
        75
      );

      // Verificar Upper Days
      const upperDays = plan.weeklySchedule.filter(
        (day) => day.type === "Upper"
      );
      upperDays.forEach((day) => {
        const muscles = day.exercises.map((ex) =>
          ex.primaryMuscle.toLowerCase()
        );
        const hasUpperBody = muscles.some(
          (m) =>
            m.includes("peito") ||
            m.includes("costa") ||
            m.includes("ombro") ||
            m.includes("triceps") ||
            m.includes("biceps")
        );
        expect(hasUpperBody).toBe(true);
      });

      // Verificar Lower Days
      const lowerDays = plan.weeklySchedule.filter(
        (day) => day.type === "Lower"
      );
      lowerDays.forEach((day) => {
        const muscles = day.exercises.map((ex) =>
          ex.primaryMuscle.toLowerCase()
        );
        const hasLowerBody = muscles.some(
          (m) =>
            m.includes("quadricep") ||
            m.includes("posterior") ||
            m.includes("coxa") ||
            m.includes("panturrilha") ||
            m.includes("gluteo")
        );
        expect(hasLowerBody).toBe(true);
      });
    });
  });

  describe("Validação de Limites Semanais", () => {
    it("deve respeitar limites semanais de séries por grupo muscular", () => {
      const plan = generateTrainingPlanStructure(
        4,
        "Moderado",
        "Upper/Lower",
        75
      );

      // Contar séries semanais por grupo muscular
      const weeklySeries: Record<string, number> = {};

      plan.weeklySchedule.forEach((day) => {
        day.exercises.forEach((ex) => {
          const muscle = normalizeMuscleName(ex.primaryMuscle);
          if (muscle) {
            weeklySeries[muscle] = (weeklySeries[muscle] || 0) + ex.sets;
          }
        });
      });

      // Limites esperados para Moderado (sem déficit)
      const expectedLimits: Record<string, number> = {
        peito: 12,
        costas: 12,
        quadriceps: 12,
        posterior: 10,
        ombro: 8,
        triceps: 8,
        biceps: 8,
      };

      Object.entries(weeklySeries).forEach(([muscle, series]) => {
        const limit = expectedLimits[muscle];
        if (limit) {
          expect(series).toBeLessThanOrEqual(limit);
        }
      });
    });

    it("deve ajustar limites semanais para déficit calórico", () => {
      const plan = generateTrainingPlanStructure(
        4,
        "Moderado",
        "Upper/Lower",
        75,
        28, // IMC alto
        "Ganhar massa" // Objetivo com IMC alto = recomposição = déficit
      );

      const weeklySeries: Record<string, number> = {};

      plan.weeklySchedule.forEach((day) => {
        day.exercises.forEach((ex) => {
          const muscle = normalizeMuscleName(ex.primaryMuscle);
          if (muscle) {
            weeklySeries[muscle] = (weeklySeries[muscle] || 0) + ex.sets;
          }
        });
      });

      // Limites esperados para Moderado COM déficit (×0.7)
      const expectedLimitsWithDeficit: Record<string, number> = {
        peito: 8, // 12 * 0.7 = 8.4 → 8
        costas: 8,
        quadriceps: 8,
        posterior: 7, // 10 * 0.7 = 7
        ombro: 5, // 8 * 0.7 = 5.6 → 5
        triceps: 5,
        biceps: 5,
      };

      Object.entries(weeklySeries).forEach(([muscle, series]) => {
        const limit = expectedLimitsWithDeficit[muscle];
        if (limit) {
          expect(series).toBeLessThanOrEqual(limit);
        }
      });
    });
  });

  describe("Restrições Articulares", () => {
    it("deve evitar exercícios de ombro quando há restrição de ombro", () => {
      const plan = generateTrainingPlanStructure(
        3,
        "Moderado",
        "Full Body",
        60,
        25,
        "Ganhar massa",
        true, // Restrição de ombro
        false
      );

      plan.weeklySchedule.forEach((day) => {
        day.exercises.forEach((ex) => {
          const exerciseName = ex.name.toLowerCase();
          const primaryMuscle = ex.primaryMuscle.toLowerCase();

          // Não deve ter exercícios que focam ombro
          const isShoulderExercise =
            primaryMuscle.includes("ombro") ||
            exerciseName.includes("desenvolvimento") ||
            exerciseName.includes("elevação lateral") ||
            exerciseName.includes("elevação frontal");

          expect(isShoulderExercise).toBe(false);
        });
      });
    });

    it("deve evitar exercícios de joelho quando há restrição de joelho", () => {
      const plan = generateTrainingPlanStructure(
        3,
        "Moderado",
        "Full Body",
        60,
        25,
        "Ganhar massa",
        false,
        true // Restrição de joelho
      );

      plan.weeklySchedule.forEach((day) => {
        day.exercises.forEach((ex) => {
          const exerciseName = ex.name.toLowerCase();

          // Não deve ter exercícios que focam joelho
          const isKneeExercise =
            exerciseName.includes("agachamento") ||
            exerciseName.includes("squat") ||
            exerciseName.includes("leg press") ||
            exerciseName.includes("cadeira extensora") ||
            exerciseName.includes("afundo");

          expect(isKneeExercise).toBe(false);
        });
      });
    });
  });

  describe("Ambiente de Treino", () => {
    it("deve gerar exercícios compatíveis com treino em casa", () => {
      const plan = generateTrainingPlanStructure(
        3,
        "Moderado",
        "Full Body",
        60,
        25,
        "Ganhar massa",
        false,
        false,
        "casa"
      );

      plan.weeklySchedule.forEach((day) => {
        day.exercises.forEach((ex) => {
          const exerciseName = ex.name.toLowerCase();

          // Não deve ter exercícios que requerem máquinas de academia
          const requiresGym =
            exerciseName.includes("leg press") ||
            exerciseName.includes("cadeira extensora") ||
            exerciseName.includes("mesa flexora") ||
            exerciseName.includes("crossover") ||
            exerciseName.includes("puxada na frente") ||
            exerciseName.includes("lat pulldown");

          expect(requiresGym).toBe(false);
        });
      });
    });

    it("deve gerar exercícios compatíveis com treino na academia", () => {
      const plan = generateTrainingPlanStructure(
        4,
        "Moderado",
        "Upper/Lower",
        75,
        25,
        "Ganhar massa",
        false,
        false,
        "academia"
      );

      // Academia pode ter qualquer tipo de exercício
      // Apenas verificar que o plano foi gerado corretamente
      expect(plan.weeklySchedule.length).toBe(4);
      plan.weeklySchedule.forEach((day) => {
        expect(day.exercises.length).toBeGreaterThan(0);
      });
    });

    it("deve gerar exercícios compatíveis com treino em ambos os ambientes", () => {
      const plan = generateTrainingPlanStructure(
        3,
        "Moderado",
        "Full Body",
        60,
        25,
        "Ganhar massa",
        false,
        false,
        "ambos"
      );

      plan.weeklySchedule.forEach((day) => {
        day.exercises.forEach((ex) => {
          const exerciseName = ex.name.toLowerCase();

          // Não deve ter exercícios que requerem máquinas específicas
          const requiresSpecificMachine =
            exerciseName.includes("leg press") ||
            exerciseName.includes("cadeira extensora") ||
            exerciseName.includes("mesa flexora") ||
            exerciseName.includes("crossover") ||
            exerciseName.includes("lat pulldown");

          expect(requiresSpecificMachine).toBe(false);
        });
      });
    });
  });

  describe("Validação de Tempo", () => {
    it("deve gerar plano que cabe no tempo disponível", () => {
      const availableTime = 45; // 45 minutos
      const plan = generateTrainingPlanStructure(
        3,
        "Moderado",
        "Full Body",
        availableTime
      );

      // Validar que o plano respeita o tempo
      const isValid = isTrainingPlanUsable(plan, 3, "Moderado", availableTime);
      expect(isValid).toBe(true);
    });

    it("deve gerar plano que cabe em tempo maior", () => {
      const availableTime = 120; // 2 horas
      const plan = generateTrainingPlanStructure(
        4,
        "Atleta",
        "Upper/Lower",
        availableTime
      );

      const isValid = isTrainingPlanUsable(plan, 4, "Atleta", availableTime);
      expect(isValid).toBe(true);
    });
  });

  describe("Diferentes Níveis de Atividade", () => {
    it("deve gerar plano adequado para Sedentário", () => {
      const plan = generateTrainingPlanStructure(
        3,
        "Sedentário",
        "Full Body",
        45
      );

      expect(plan.weeklySchedule.length).toBe(3);

      // Sedentário deve ter menos exercícios por dia
      plan.weeklySchedule.forEach((day) => {
        expect(day.exercises.length).toBeLessThanOrEqual(6);
      });

      const isValid = isTrainingPlanUsable(plan, 3, "Sedentário", 45);
      expect(isValid).toBe(true);
    });

    it("deve gerar plano adequado para Atleta", () => {
      const plan = generateTrainingPlanStructure(6, "Atleta", "PPL", 90);

      expect(plan.weeklySchedule.length).toBe(6);

      // Atleta pode ter mais exercícios por dia
      plan.weeklySchedule.forEach((day) => {
        expect(day.exercises.length).toBeGreaterThan(0);
        expect(day.exercises.length).toBeLessThanOrEqual(8);
      });

      const isValid = isTrainingPlanUsable(plan, 6, "Atleta", 90);
      expect(isValid).toBe(true);
    });

    it("deve gerar plano adequado para Atleta Alto Rendimento", () => {
      const plan = generateTrainingPlanStructure(
        6,
        "Atleta Alto Rendimento",
        "PPL",
        120
      );

      expect(plan.weeklySchedule.length).toBe(6);

      const isValid = isTrainingPlanUsable(
        plan,
        6,
        "Atleta Alto Rendimento",
        120
      );
      expect(isValid).toBe(true);
    });
  });

  describe("Validação de Estrutura do Plano", () => {
    it("deve gerar plano com estrutura completa", () => {
      const plan = generateTrainingPlanStructure(
        3,
        "Moderado",
        "Full Body",
        60
      );

      expect(plan).toHaveProperty("overview");
      expect(plan).toHaveProperty("weeklySchedule");
      expect(plan).toHaveProperty("progression");

      expect(typeof plan.overview).toBe("string");
      expect(Array.isArray(plan.weeklySchedule)).toBe(true);
      expect(typeof plan.progression).toBe("string");
    });

    it("deve gerar dias com estrutura completa", () => {
      const plan = generateTrainingPlanStructure(
        3,
        "Moderado",
        "Full Body",
        60
      );

      plan.weeklySchedule.forEach((day) => {
        expect(day).toHaveProperty("day");
        expect(day).toHaveProperty("exercises");
        expect(Array.isArray(day.exercises)).toBe(true);
        expect(day.exercises.length).toBeGreaterThan(0);

        day.exercises.forEach((ex) => {
          expect(ex).toHaveProperty("name");
          expect(ex).toHaveProperty("primaryMuscle");
          expect(ex).toHaveProperty("sets");
          expect(ex).toHaveProperty("reps");
          expect(ex).toHaveProperty("rest");

          expect(typeof ex.name).toBe("string");
          expect(typeof ex.primaryMuscle).toBe("string");
          expect(typeof ex.sets).toBe("number");
          expect(typeof ex.reps).toBe("string");
          expect(typeof ex.rest).toBe("string");

          expect(ex.sets).toBeGreaterThan(0);
          expect(ex.reps.length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe("Casos Especiais", () => {
    it("deve gerar plano válido sem especificar divisão (deve inferir)", () => {
      const plan = generateTrainingPlanStructure(
        3,
        "Moderado",
        undefined, // Divisão não especificada
        60
      );

      expect(plan.weeklySchedule.length).toBe(3);
      const isValid = isTrainingPlanUsable(plan, 3, "Moderado", 60);
      expect(isValid).toBe(true);
    });

    it("deve gerar plano válido sem especificar tempo", () => {
      const plan = generateTrainingPlanStructure(3, "Moderado", "Full Body");

      expect(plan.weeklySchedule.length).toBe(3);
      const isValid = isTrainingPlanUsable(plan, 3, "Moderado");
      expect(isValid).toBe(true);
    });

    it("deve gerar plano válido com objetivo de emagrecimento", () => {
      const plan = generateTrainingPlanStructure(
        4,
        "Moderado",
        "Upper/Lower",
        60,
        30,
        "Emagrecimento"
      );

      expect(plan.weeklySchedule.length).toBe(4);
      const isValid = isTrainingPlanUsable(plan, 4, "Moderado", 60, {
        imc: 30,
        objective: "Emagrecimento",
      });
      expect(isValid).toBe(true);
    });
  });
});

/**
 * Função auxiliar para normalizar nomes de músculos
 */
function normalizeMuscleName(muscle: string): string | null {
  const normalized = muscle.toLowerCase();

  if (normalized.includes("peito") || normalized.includes("peitoral")) {
    return "peito";
  }
  if (normalized.includes("costa")) {
    return "costas";
  }
  if (normalized.includes("quadricep")) {
    return "quadriceps";
  }
  if (normalized.includes("posterior") || normalized.includes("coxa")) {
    return "posterior";
  }
  if (normalized.includes("ombro")) {
    return "ombro";
  }
  if (normalized.includes("triceps")) {
    return "triceps";
  }
  if (normalized.includes("biceps")) {
    return "biceps";
  }
  if (normalized.includes("panturrilha")) {
    return "panturrilhas";
  }
  if (normalized.includes("gluteo")) {
    return "gluteos";
  }

  return null;
}
