import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  planRejectionMetrics,
  recordPlanRejection,
  type RejectionReason,
} from "@/lib/metrics/planRejectionMetrics";

describe("PlanRejectionMetrics - Persistência", () => {
  beforeEach(() => {
    // Limpar métricas antes de cada teste
    planRejectionMetrics.clear();
  });

  describe("Registro de Rejeições", () => {
    it("deve registrar uma rejeição em memória", async () => {
      await recordPlanRejection("excesso_exercicios_nivel", {
        activityLevel: "Iniciante",
        exerciseCount: 9,
      });

      const stats = planRejectionMetrics.getStatistics();
      expect(stats.total).toBe(1);
      expect(stats.byReason["excesso_exercicios_nivel"]).toBe(1);
    });

    it("deve registrar múltiplas rejeições", async () => {
      await recordPlanRejection("excesso_exercicios_nivel", {
        activityLevel: "Iniciante",
      });
      await recordPlanRejection("divisao_incompativel_frequencia", {
        trainingDays: 3,
      });
      await recordPlanRejection("excesso_exercicios_nivel", {
        activityLevel: "Moderado",
      });

      const stats = planRejectionMetrics.getStatistics();
      expect(stats.total).toBe(3);
      expect(stats.byReason["excesso_exercicios_nivel"]).toBe(2);
      expect(stats.byReason["divisao_incompativel_frequencia"]).toBe(1);
    });

    it("deve armazenar contexto completo", async () => {
      const context = {
        activityLevel: "Atleta",
        trainingDays: 6,
        dayType: "Push",
        exerciseCount: 12,
        muscle: "peitoral",
        muscleCount: 8,
        maxAllowed: 6,
      };

      await recordPlanRejection("excesso_exercicios_musculo_primario", context);

      const metrics = planRejectionMetrics.getAllMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].context).toEqual(context);
      expect(metrics[0].reason).toBe("excesso_exercicios_musculo_primario");
    });
  });

  describe("Estatísticas", () => {
    it("deve calcular estatísticas por motivo", async () => {
      await recordPlanRejection("excesso_exercicios_nivel", {
        activityLevel: "Iniciante",
      });
      await recordPlanRejection("excesso_exercicios_nivel", {
        activityLevel: "Moderado",
      });
      await recordPlanRejection("divisao_incompativel_frequencia", {
        trainingDays: 3,
      });

      const stats = planRejectionMetrics.getStatistics();
      expect(stats.byReason["excesso_exercicios_nivel"]).toBe(2);
      expect(stats.byReason["divisao_incompativel_frequencia"]).toBe(1);
    });

    it("deve calcular estatísticas por nível de atividade", async () => {
      await recordPlanRejection("excesso_exercicios_nivel", {
        activityLevel: "Iniciante",
      });
      await recordPlanRejection("excesso_exercicios_nivel", {
        activityLevel: "Iniciante",
      });
      await recordPlanRejection("excesso_exercicios_nivel", {
        activityLevel: "Moderado",
      });

      const stats = planRejectionMetrics.getStatistics();
      expect(stats.byActivityLevel["Iniciante"]).toBe(2);
      expect(stats.byActivityLevel["Moderado"]).toBe(1);
    });

    it("deve calcular estatísticas por tipo de dia", async () => {
      await recordPlanRejection("grupo_muscular_proibido", {
        dayType: "Upper",
      });
      await recordPlanRejection("grupo_muscular_proibido", {
        dayType: "Upper",
      });
      await recordPlanRejection("grupo_muscular_proibido", {
        dayType: "Lower",
      });

      const stats = planRejectionMetrics.getStatistics();
      expect(stats.byDayType["Upper"]).toBe(2);
      expect(stats.byDayType["Lower"]).toBe(1);
    });

    it("deve retornar últimas rejeições ordenadas", async () => {
      // Registrar 5 rejeições com pequeno delay
      for (let i = 0; i < 5; i++) {
        await recordPlanRejection("excesso_exercicios_nivel", {
          activityLevel: `Nível ${i}`,
        });
        // Pequeno delay para garantir timestamps diferentes
        await new Promise((resolve) => setTimeout(resolve, 1));
      }

      const stats = planRejectionMetrics.getStatistics();
      expect(stats.recent).toHaveLength(5);
      // Últimas devem estar em ordem decrescente (mais recente primeiro)
      expect(stats.recent[0].timestamp).toBeGreaterThanOrEqual(
        stats.recent[1].timestamp
      );
    });
  });

  describe("Filtros por Período", () => {
    it("deve filtrar métricas das últimas 24 horas", async () => {
      const now = Date.now();
      const yesterday = now - 25 * 60 * 60 * 1000; // 25 horas atrás

      // Simular métrica antiga (não será incluída)
      const oldMetric = {
        reason: "excesso_exercicios_nivel" as RejectionReason,
        timestamp: yesterday,
        context: { activityLevel: "Iniciante" },
      };
      // Adicionar diretamente (bypass do método para simular métrica antiga)
      planRejectionMetrics["metrics"].push(oldMetric);

      // Adicionar métrica recente
      await recordPlanRejection("excesso_exercicios_nivel", {
        activityLevel: "Moderado",
      });

      const stats24h = planRejectionMetrics.getLast24HoursStatistics();
      // Deve ter apenas 1 (a recente)
      expect(stats24h.total).toBe(1);
    });

    it("deve filtrar métricas por período customizado", async () => {
      const now = Date.now();
      const startTime = now - 2 * 60 * 60 * 1000; // 2 horas atrás
      const endTime = now;

      // Adicionar algumas métricas
      await recordPlanRejection("excesso_exercicios_nivel", {
        activityLevel: "Iniciante",
      });
      await recordPlanRejection("divisao_incompativel_frequencia", {
        trainingDays: 3,
      });

      const metrics = planRejectionMetrics.getMetricsByPeriod(
        startTime,
        endTime
      );
      expect(metrics.length).toBeGreaterThanOrEqual(2);
      metrics.forEach((metric) => {
        expect(metric.timestamp).toBeGreaterThanOrEqual(startTime);
        expect(metric.timestamp).toBeLessThanOrEqual(endTime);
      });
    });
  });

  describe("Limite de Memória", () => {
    it("deve limitar número de métricas em memória", async () => {
      // Registrar mais métricas que o limite
      const maxMetrics = 10000;
      const excessMetrics = 100;

      for (let i = 0; i < maxMetrics + excessMetrics; i++) {
        await recordPlanRejection("excesso_exercicios_nivel", {
          activityLevel: "Iniciante",
        });
      }

      const stats = planRejectionMetrics.getStatistics();
      // Deve ter no máximo maxMetrics
      expect(stats.total).toBeLessThanOrEqual(maxMetrics);
    });
  });

  describe("Persistência", () => {
    it("deve verificar se persistência está habilitada", () => {
      const isEnabled = planRejectionMetrics.isPersistenceEnabled();
      // Pode ser true ou false dependendo das variáveis de ambiente
      expect(typeof isEnabled).toBe("boolean");
    });

    it("deve registrar rejeição mesmo se persistência falhar", async () => {
      // Mock do console.error para não poluir os logs
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // Registrar uma rejeição
      await recordPlanRejection("excesso_exercicios_nivel", {
        activityLevel: "Iniciante",
      });

      // Deve estar em memória mesmo se persistência falhar
      const stats = planRejectionMetrics.getStatistics();
      expect(stats.total).toBe(1);

      consoleErrorSpy.mockRestore();
    });
  });

  describe("Tipos de Rejeição", () => {
    const allReasons: RejectionReason[] = [
      "weeklySchedule_invalido",
      "numero_dias_incompativel",
      "divisao_incompativel_frequencia",
      "dia_sem_exercicios",
      "excesso_exercicios_nivel",
      "exercicio_sem_primaryMuscle",
      "grupo_muscular_proibido",
      "lower_sem_grupos_obrigatorios",
      "full_body_sem_grupos_obrigatorios",
      "grupo_obrigatorio_ausente",
      "ordem_exercicios_invalida",
      "excesso_exercicios_musculo_primario",
      "distribuicao_inteligente_invalida",
      "secondaryMuscles_excede_limite",
      "tempo_treino_excede_disponivel",
    ];

    it("deve aceitar todos os tipos de rejeição válidos", async () => {
      for (const reason of allReasons) {
        await recordPlanRejection(reason, {
          activityLevel: "Iniciante",
        });
      }

      const stats = planRejectionMetrics.getStatistics();
      expect(stats.total).toBe(allReasons.length);
      allReasons.forEach((reason) => {
        expect(stats.byReason[reason]).toBe(1);
      });
    });
  });
});
