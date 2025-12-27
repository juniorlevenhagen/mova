import { describe, it, expect } from "vitest";
import { generateTrainingPlanStructure } from "@/lib/generators/trainingPlanGenerator";
import { isTrainingPlanUsable } from "@/lib/validators/trainingPlanValidator";
import type { TrainingPlan } from "@/lib/validators/trainingPlanValidator";

/**
 * Testes de Integração - Cenários Reais de Treino
 *
 * Baseados em perfis reais de usuários com todas as nuances:
 * - Combinações complexas de restrições
 * - Diferentes objetivos e contextos
 * - Validação de usabilidade prática
 * - Casos edge que acontecem no mundo real
 */

describe("Cenários Reais de Treino - Integração Completa", () => {
  describe("Cenário 1: Iniciante com Sobrepeso e Tempo Limitado", () => {
    /**
     * Perfil: Maria, 35 anos
     * - Sedentária, IMC 31 (obesidade grau 1)
     * - Treina em casa, apenas 30min disponíveis
     * - Objetivo: Emagrecimento
     * - Sem equipamentos sofisticados
     */
    it("deve gerar plano adequado para iniciante com sobrepeso em casa", () => {
      const plan = generateTrainingPlanStructure(
        3, // 3x por semana
        "Sedentário",
        "Full Body",
        30, // Apenas 30 minutos
        31, // IMC 31
        "Perder peso", // Objetivo padronizado
        false,
        false,
        "casa"
      );

      expect(plan).toBeDefined();
      expect(plan.weeklySchedule.length).toBe(3);

      // Validar que o plano é usável
      const isValid = isTrainingPlanUsable(plan, 3, "Sedentário", 30, {
        imc: 31,
        objective: "Perder peso",
      });
      expect(isValid).toBe(true);

      // Validar características específicas
      plan.weeklySchedule.forEach((day) => {
        // Deve ter poucos exercícios (iniciante + tempo limitado)
        expect(day.exercises.length).toBeLessThanOrEqual(5);

        day.exercises.forEach((ex) => {
          // Não deve ter exercícios complexos demais
          const name = ex.name.toLowerCase();
          const isComplexExercise =
            name.includes("olímpico") ||
            name.includes("clean") ||
            name.includes("snatch");
          expect(isComplexExercise).toBe(false);

          // Séries reduzidas (déficit + iniciante)
          expect(ex.sets).toBeLessThanOrEqual(3);
        });
      });
    });

    it("deve respeitar tempo de 30min com exercícios enxutos", () => {
      const plan = generateTrainingPlanStructure(
        3,
        "Sedentário",
        "Full Body",
        30,
        31,
        "Perder peso"
      );

      // Calcular tempo estimado de cada dia
      plan.weeklySchedule.forEach((day) => {
        let estimatedTime = 0;
        day.exercises.forEach((ex) => {
          // ~30s por série + descanso
          const restTime = ex.rest.includes("60") ? 60 : 90;
          estimatedTime += ex.sets * (30 + restTime);
        });

        const timeInMinutes = estimatedTime / 60;
        // Deve caber em 30min com margem
        expect(timeInMinutes).toBeLessThanOrEqual(35);
      });
    });
  });

  describe("Cenário 2: Atleta com Restrições Articulares Múltiplas", () => {
    /**
     * Perfil: João, 42 anos
     * - Atleta experiente, IMC 24
     * - Treina na academia, 90min disponíveis
     * - Objetivo: Ganho de massa
     * - Restrições: Ombro E Joelho
     */
    it("deve gerar plano avançado sem sobrecarregar articulações", () => {
      const plan = generateTrainingPlanStructure(
        6, // PPL 2x
        "Atleta",
        "PPL",
        90,
        24,
        "Ganho de massa",
        true, // Restrição de ombro
        true, // Restrição de joelho
        "academia"
      );

      expect(plan.weeklySchedule.length).toBe(6);

      const isValid = isTrainingPlanUsable(plan, 6, "Atleta", 90, {
        imc: 24,
        objective: "Ganho de massa",
        hasShoulderRestriction: true,
        hasKneeRestriction: true,
      });
      expect(isValid).toBe(true);

      // Validar que minimiza exercícios problemáticos
      let shoulderStressCount = 0;
      let kneeStressCount = 0;

      plan.weeklySchedule.forEach((day) => {
        day.exercises.forEach((ex) => {
          const name = ex.name.toLowerCase();

          // Contar exercícios que sobrecarregam ombro
          if (
            name.includes("desenvolvimento militar") ||
            name.includes("military press") ||
            (name.includes("elevação") && name.includes("lateral"))
          ) {
            shoulderStressCount++;
          }

          // Contar exercícios que sobrecarregam joelho
          if (
            name.includes("agachamento") ||
            name.includes("squat") ||
            name.includes("leg press") ||
            name.includes("afundo")
          ) {
            kneeStressCount++;
          }
        });
      });

      // Com restrições, deve haver poucos ou nenhum exercício problemático
      expect(shoulderStressCount).toBeLessThanOrEqual(2);
      expect(kneeStressCount).toBeLessThanOrEqual(2);
    });

    it("deve manter volume adequado mesmo com restrições", () => {
      const plan = generateTrainingPlanStructure(
        6,
        "Atleta",
        "PPL",
        90,
        24,
        "Ganho de massa",
        true,
        true,
        "academia"
      );

      // Contar séries semanais
      let totalWeeklySeries = 0;
      plan.weeklySchedule.forEach((day) => {
        day.exercises.forEach((ex) => {
          totalWeeklySeries += ex.sets;
        });
      });

      // Atleta deve ter volume significativo mesmo com restrições
      // Mínimo de 60 séries semanais (10 por dia em média)
      expect(totalWeeklySeries).toBeGreaterThanOrEqual(60);
    });
  });

  describe("Cenário 3: Mãe com Rotina Variável", () => {
    /**
     * Perfil: Ana, 38 anos
     * - Moderadamente ativa, IMC 26
     * - Treina em casa E academia (depende do dia)
     * - Objetivo: Recomposição
     * - Tempo variável: 45min
     */
    it("deve gerar plano versátil para treino em ambos ambientes", () => {
      const plan = generateTrainingPlanStructure(
        4, // Upper/Lower
        "Moderado",
        "Upper/Lower",
        45,
        26,
        "Ganho de massa", // Com IMC 26 vira recomposição
        false,
        false,
        "ambos"
      );

      expect(plan.weeklySchedule.length).toBe(4);

      const isValid = isTrainingPlanUsable(plan, 4, "Moderado", 45, {
        imc: 26,
        objective: "Ganho de massa",
      });
      expect(isValid).toBe(true);

      // Validar que minimiza equipamentos exclusivos de academia
      let gymOnlyCount = 0;

      plan.weeklySchedule.forEach((day) => {
        day.exercises.forEach((ex) => {
          const name = ex.name.toLowerCase();

          // Equipamentos exclusivos de academia
          if (
            name.includes("leg press") ||
            name.includes("cadeira extensora") ||
            name.includes("mesa flexora") ||
            name.includes("crossover") ||
            name.includes("lat pulldown") ||
            name.includes("polia")
          ) {
            gymOnlyCount++;
          }
        });
      });

      // "Ambos" deve minimizar equipamentos exclusivos
      expect(gymOnlyCount).toBeLessThanOrEqual(3);
    });
  });

  describe("Cenário 4: Idoso com Objetivo de Saúde", () => {
    /**
     * Perfil: Carlos, 68 anos
     * - Sedentário, IMC 28
     * - Treina na academia com acompanhamento
     * - Objetivo: Manutenção e qualidade de vida
     * - Tempo: 50min, 2x por semana
     */
    it("deve gerar plano conservador e seguro para idoso", () => {
      const plan = generateTrainingPlanStructure(
        2, // Apenas 2x por semana
        "Sedentário",
        "Full Body",
        50,
        28,
        "Ganhar massa", // Objetivo padronizado
        false,
        false,
        "academia",
        68 // 🛡️ Idade para validação de risco (idoso)
      );

      expect(plan.weeklySchedule.length).toBe(2);

      const isValid = isTrainingPlanUsable(plan, 2, "Sedentário", 50, {
        imc: 28,
        objective: "Ganhar massa",
        age: 68,
      });
      expect(isValid).toBe(true);

      // Validar características de segurança
      let highRiskCount = 0;
      let highSetsCount = 0;

      plan.weeklySchedule.forEach((day) => {
        day.exercises.forEach((ex) => {
          // Contar séries excessivas
          if (ex.sets > 4) {
            highSetsCount++;
          }

          // Contar exercícios de alto risco
          const name = ex.name.toLowerCase();
          if (
            name.includes("deadlift") ||
            name.includes("terra") ||
            name.includes("clean") ||
            name.includes("snatch")
          ) {
            highRiskCount++;
          }
        });
      });

      // Idoso deve ter poucas séries excessivas e poucos exercícios de alto risco
      expect(highSetsCount).toBeLessThanOrEqual(2);
      expect(highRiskCount).toBeLessThanOrEqual(1);
    });
  });

  describe("Cenário 5: Jovem Atleta de Alto Rendimento", () => {
    /**
     * Perfil: Lucas, 22 anos
     * - Atleta de alto rendimento, IMC 23
     * - Treina na academia, 2h disponíveis
     * - Objetivo: Hipertrofia máxima
     * - Sem restrições
     */
    it("deve gerar plano intenso para atleta de alto rendimento", () => {
      const plan = generateTrainingPlanStructure(
        6, // PPL 2x
        "Atleta Alto Rendimento",
        "PPL",
        120, // 2 horas
        23,
        "Ganho de massa",
        false,
        false,
        "academia"
      );

      expect(plan.weeklySchedule.length).toBe(6);

      const isValid = isTrainingPlanUsable(
        plan,
        6,
        "Atleta Alto Rendimento",
        120,
        {
          imc: 23,
          objective: "Ganho de massa",
          age: 22,
        }
      );
      expect(isValid).toBe(true);

      // Validar volume elevado (mais flexível)
      let totalExercises = 0;
      const totalSetsPerDay: number[] = [];

      plan.weeklySchedule.forEach((day) => {
        totalExercises += day.exercises.length;

        const daySets = day.exercises.reduce((sum, ex) => sum + ex.sets, 0);
        totalSetsPerDay.push(daySets);
      });

      // Média de exercícios por dia deve ser significativa para alto rendimento
      const avgExercisesPerDay = totalExercises / plan.weeklySchedule.length;
      expect(avgExercisesPerDay).toBeGreaterThanOrEqual(4);

      // Cada dia deve ter volume significativo
      totalSetsPerDay.forEach((sets) => {
        expect(sets).toBeGreaterThanOrEqual(12);
      });

      // Contar séries totais semanais
      let totalSeries = 0;
      plan.weeklySchedule.forEach((day) => {
        day.exercises.forEach((ex) => {
          totalSeries += ex.sets;
        });
      });

      // Alto rendimento deve ter volume substancial
      expect(totalSeries).toBeGreaterThanOrEqual(90);
    });
  });

  describe("Cenário 6: Trabalhador com Treino ao Ar Livre", () => {
    /**
     * Perfil: Pedro, 30 anos
     * - Moderadamente ativo, IMC 24
     * - Treina ao ar livre (parque/praia)
     * - Objetivo: Condicionamento geral
     * - Tempo: 60min, 4x por semana
     */
    it("deve gerar plano adaptado para ar livre com peso corporal", () => {
      const plan = generateTrainingPlanStructure(
        4,
        "Moderado",
        "Upper/Lower",
        60,
        24,
        "Ganhar massa", // Objetivo padronizado
        false,
        false,
        "ar_livre"
      );

      expect(plan.weeklySchedule.length).toBe(4);

      const isValid = isTrainingPlanUsable(plan, 4, "Moderado", 60, {
        imc: 24,
        objective: "Ganhar massa",
      });
      expect(isValid).toBe(true);

      // Validar que minimiza equipamentos pesados
      let heavyEquipmentCount = 0;
      let bodyweightCount = 0;

      plan.weeklySchedule.forEach((day) => {
        day.exercises.forEach((ex) => {
          const name = ex.name.toLowerCase();

          // Equipamentos pesados/complexos
          if (
            name.includes("máquina") ||
            name.includes("leg press") ||
            name.includes("polia") ||
            name.includes("cabo")
          ) {
            heavyEquipmentCount++;
          }

          // Exercícios de peso corporal ou halteres
          if (
            name.includes("flexão") ||
            name.includes("barra fixa") ||
            name.includes("paralelas") ||
            name.includes("prancha") ||
            name.includes("agachamento livre") ||
            name.includes("afundo")
          ) {
            bodyweightCount++;
          }
        });
      });

      // Ar livre deve minimizar equipamentos pesados
      expect(heavyEquipmentCount).toBeLessThanOrEqual(2);
      // Deve ter predominância de peso corporal
      expect(bodyweightCount).toBeGreaterThan(0);
    });
  });

  describe("Cenário 7: Mulher Pós-Gestação", () => {
    /**
     * Perfil: Juliana, 32 anos
     * - Sedentária (pós-parto 4 meses), IMC 29
     * - Treina em casa, 25min disponíveis
     * - Objetivo: Retomar forma e fortalecer core
     * - Restrição: Evitar impacto/sobrecarga
     */
    it("deve gerar plano seguro pós-gestação focado em recuperação", () => {
      const plan = generateTrainingPlanStructure(
        3,
        "Sedentário",
        "Full Body",
        25, // Pouco tempo
        29,
        "Ganhar massa", // Objetivo padronizado
        false,
        false,
        "casa"
      );

      expect(plan.weeklySchedule.length).toBe(3);

      const isValid = isTrainingPlanUsable(plan, 3, "Sedentário", 25, {
        imc: 29,
        objective: "Ganhar massa",
        gender: "Feminino",
      });
      expect(isValid).toBe(true);

      // Validar segurança
      plan.weeklySchedule.forEach((day) => {
        // Volume moderado
        expect(day.exercises.length).toBeLessThanOrEqual(5);

        day.exercises.forEach((ex) => {
          // Séries conservadoras
          expect(ex.sets).toBeLessThanOrEqual(3);

          // Evitar exercícios de alto impacto
          const name = ex.name.toLowerCase();
          const isHighImpact =
            name.includes("salto") ||
            name.includes("pliométrico") ||
            name.includes("jump");
          expect(isHighImpact).toBe(false);
        });
      });
    });
  });

  describe("Cenário 8: Executivo com Agenda Apertada", () => {
    /**
     * Perfil: Roberto, 45 anos
     * - Sedentário, IMC 27
     * - Treina na academia corporativa, 40min
     * - Objetivo: Saúde e reduzir estresse
     * - Disponível apenas 3x por semana
     */
    it("deve gerar plano eficiente para tempo limitado", () => {
      const plan = generateTrainingPlanStructure(
        3,
        "Sedentário",
        "Full Body",
        40,
        27,
        "Ganhar massa", // Objetivo padronizado
        false,
        false,
        "academia"
      );

      expect(plan.weeklySchedule.length).toBe(3);

      const isValid = isTrainingPlanUsable(plan, 3, "Sedentário", 40, {
        imc: 27,
        objective: "Ganhar massa",
        age: 45,
      });
      expect(isValid).toBe(true);

      // Validar eficiência (exercícios compostos)
      plan.weeklySchedule.forEach((day) => {
        let compoundExercises = 0;
        day.exercises.forEach((ex) => {
          const name = ex.name.toLowerCase();
          const isCompound =
            name.includes("supino") ||
            name.includes("agachamento") ||
            name.includes("terra") ||
            name.includes("remada") ||
            name.includes("puxada") ||
            name.includes("desenvolvimento");

          if (isCompound) compoundExercises++;
        });

        // Maioria deve ser compostos para eficiência
        expect(compoundExercises).toBeGreaterThanOrEqual(
          Math.floor(day.exercises.length * 0.6)
        );
      });
    });
  });

  describe("Cenário 9: Estudante com Orçamento Limitado", () => {
    /**
     * Perfil: Beatriz, 21 anos
     * - Moderada, IMC 22
     * - Treina em casa (sem equipamentos caros)
     * - Objetivo: Tonificação
     * - Tempo: 45min, 4x por semana
     */
    it("deve gerar plano efetivo com equipamento mínimo", () => {
      const plan = generateTrainingPlanStructure(
        4,
        "Moderado",
        "Upper/Lower",
        45,
        22,
        "Ganhar massa", // Objetivo padronizado
        false,
        false,
        "casa"
      );

      expect(plan.weeklySchedule.length).toBe(4);

      const isValid = isTrainingPlanUsable(plan, 4, "Moderado", 45, {
        imc: 22,
        objective: "Ganhar massa",
        age: 21,
      });
      expect(isValid).toBe(true);

      // Validar que minimiza equipamentos caros
      let expensiveEquipmentCount = 0;

      plan.weeklySchedule.forEach((day) => {
        day.exercises.forEach((ex) => {
          const name = ex.name.toLowerCase();

          // Equipamentos caros
          if (
            name.includes("máquina") ||
            name.includes("leg press") ||
            name.includes("crossover") ||
            name.includes("cabo") ||
            name.includes("polia")
          ) {
            expensiveEquipmentCount++;
          }
        });
      });

      // Casa deve minimizar equipamentos caros
      expect(expensiveEquipmentCount).toBeLessThanOrEqual(2);
    });
  });

  describe("Cenário 10: Híbrido - Transição Academia para Casa", () => {
    /**
     * Perfil: Felipe, 28 anos
     * - Atleta, IMC 24
     * - Mudança de rotina: saindo da academia para casa
     * - Objetivo: Manter massa muscular
     * - Equipamento: Par de halteres e barra fixa
     */
    it("deve gerar plano que mantém qualidade em casa", () => {
      const plan = generateTrainingPlanStructure(
        5,
        "Atleta",
        "PPL", // Tentará adaptar PPL para casa
        60,
        24,
        "Ganho de massa",
        false,
        false,
        "casa"
      );

      expect(plan.weeklySchedule.length).toBe(5);

      const isValid = isTrainingPlanUsable(plan, 5, "Atleta", 60, {
        imc: 24,
        objective: "Ganho de massa",
        equipment: "casa",
      });
      expect(isValid).toBe(true);

      // Verificar volume adequado para atleta mesmo em casa
      let totalSeries = 0;
      plan.weeklySchedule.forEach((day) => {
        day.exercises.forEach((ex) => {
          totalSeries += ex.sets;
        });
      });

      // Atleta em casa deve manter volume substancial
      expect(totalSeries).toBeGreaterThanOrEqual(70);

      // Verificar que usa exercícios domésticos eficientes
      const allExercises: string[] = [];
      plan.weeklySchedule.forEach((day) => {
        day.exercises.forEach((ex) => {
          allExercises.push(ex.name.toLowerCase());
        });
      });

      // Deve incluir exercícios compostos eficientes (os 3 fundamentais)
      const hasEffectiveExercises =
        allExercises.some((e) => e.includes("flexão")) &&
        allExercises.some(
          (e) => e.includes("barra fixa") || e.includes("pull")
        ) &&
        allExercises.some(
          (e) => e.includes("agachamento") || e.includes("afundo")
        );

      expect(hasEffectiveExercises).toBe(true);
    });
  });

  describe("Validação de Consistência Entre Cenários", () => {
    it("deve gerar planos progressivamente mais volumosos conforme nível avança", () => {
      const sedentarioPlan = generateTrainingPlanStructure(
        3,
        "Sedentário",
        "Full Body",
        60
      );

      const moderadoPlan = generateTrainingPlanStructure(
        4,
        "Moderado",
        "Upper/Lower",
        60
      );

      const atletaPlan = generateTrainingPlanStructure(6, "Atleta", "PPL", 90);

      // Calcular séries totais
      const getSeries = (plan: TrainingPlan) => {
        return plan.weeklySchedule.reduce((total, day) => {
          return (
            total +
            day.exercises.reduce((dayTotal, ex) => dayTotal + ex.sets, 0)
          );
        }, 0);
      };

      const sedentarioSeries = getSeries(sedentarioPlan);
      const moderadoSeries = getSeries(moderadoPlan);
      const atletaSeries = getSeries(atletaPlan);

      // Progressão lógica de volume
      expect(sedentarioSeries).toBeLessThan(moderadoSeries);
      expect(moderadoSeries).toBeLessThan(atletaSeries);
    });

    it("deve respeitar restrições de tempo em todos os níveis", () => {
      const levels = ["Sedentário", "Moderado", "Atleta"];
      const timeLimit = 45;

      levels.forEach((level) => {
        const plan = generateTrainingPlanStructure(
          3,
          level,
          "Full Body",
          timeLimit
        );

        const isValid = isTrainingPlanUsable(plan, 3, level, timeLimit);
        expect(isValid).toBe(true);
      });
    });
  });
});
