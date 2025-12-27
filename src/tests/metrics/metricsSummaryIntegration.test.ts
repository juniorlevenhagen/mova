import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  generateInsights,
  type MetricsSummary,
} from "@/lib/metrics/metricsInsights";

/**
 * Teste de Integração: Simula perfis reais e valida o sistema completo
 *
 * Este teste simula diferentes cenários de uso real do sistema,
 * gerando métricas como se fossem de usuários reais e validando
 * se os insights são gerados corretamente.
 */

describe("Integração: Sistema de Métricas e Insights - Simulação de Perfis Reais", () => {
  describe("Perfil 1: Atleta com Problema de Ombros em Push", () => {
    it("deve identificar e sugerir correção para problema específico", () => {
      // Simula uma semana de uso com problema recorrente
      const summary: MetricsSummary = {
        period: "weekly",
        current: {
          totalRejections: 45,
          totalCorrections: 40,
          totalQualityMetrics: 55,
          averageQualityScore: 82,
          topRejectionReasons: [
            {
              reason: "excesso_series_por_sessao",
              count: 20, // 44.4% das rejeições
              percentage: 44.4,
            },
            {
              reason: "excesso_series_semanais",
              count: 15,
              percentage: 33.3,
            },
          ],
          topCorrectionReasons: [
            {
              reason: "ajuste_volume_minimo_obrigatorio",
              count: 25,
              percentage: 62.5,
            },
          ],
          rejectionRate: 45, // 45 rejeições / 100 planos
          correctionSuccessRate: 88.9,
          byActivityLevel: {
            Atleta: {
              rejections: 35, // 77.8% das rejeições
              corrections: 32,
              qualityScore: 85,
            },
          },
          byDayType: {
            push: {
              rejections: 25, // 55.6% das rejeições
              corrections: 23,
            },
          },
          byMuscle: {
            ombro: {
              rejections: 18, // 40% das rejeições
              corrections: 16,
            },
          },
        },
        previous: {
          totalRejections: 20,
          totalCorrections: 18,
          averageQualityScore: 88,
          rejectionRate: 20,
          correctionSuccessRate: 90,
        },
        trends: {
          rejectionRate: "increasing",
          qualityScore: "degrading",
          correctionRate: "decreasing",
        },
        insights: [],
      };

      const insights = generateInsights(summary);

      // Validações específicas
      expect(insights.length).toBeGreaterThan(3);

      // 1. Deve detectar taxa de rejeição alta
      const highRejectionInsight = insights.find(
        (i) => i.title === "Taxa de rejeição alta"
      );
      expect(highRejectionInsight).toBeDefined();
      expect(highRejectionInsight?.severity).toBe("high");

      // 2. Deve detectar aumento significativo
      const increaseInsight = insights.find(
        (i) => i.title === "Aumento significativo de rejeições"
      );
      expect(increaseInsight).toBeDefined();
      expect(increaseInsight?.changePercent).toBeGreaterThan(30);

      // 3. Deve detectar problema específico de ombro
      const shoulderInsight = insights.find(
        (i) =>
          i.title.includes("ombro") &&
          i.affectedMuscles?.includes("ombro") &&
          i.suggestion?.includes("ombro")
      );
      expect(shoulderInsight).toBeDefined();
      expect(shoulderInsight?.suggestion).toContain("validação contextual");

      // 4. Deve detectar problema em dias Push
      const pushInsight = insights.find(
        (i) => i.title.includes("push") && i.affectedDayTypes?.includes("push")
      );
      expect(pushInsight).toBeDefined();

      // 5. Deve detectar problema no nível Atleta
      const athleteInsight = insights.find(
        (i) =>
          i.title.includes("Atleta") && i.affectedLevels?.includes("Atleta")
      );
      expect(athleteInsight).toBeDefined();
    });
  });

  describe("Perfil 2: Sedentário - Sistema Funcionando Bem", () => {
    it("deve gerar apenas insights positivos", () => {
      const summary: MetricsSummary = {
        period: "weekly",
        current: {
          totalRejections: 3,
          totalCorrections: 3,
          totalQualityMetrics: 97,
          averageQualityScore: 94,
          topRejectionReasons: [],
          topCorrectionReasons: [],
          rejectionRate: 3, // 3 rejeições / 100 planos
          correctionSuccessRate: 100,
          byActivityLevel: {
            Sedentário: {
              rejections: 2,
              corrections: 2,
              qualityScore: 95,
            },
          },
          byDayType: {},
          byMuscle: {},
        },
        previous: {
          totalRejections: 5,
          totalCorrections: 4,
          averageQualityScore: 91,
          rejectionRate: 5,
          correctionSuccessRate: 80,
        },
        trends: {
          rejectionRate: "decreasing",
          qualityScore: "improving",
          correctionRate: "increasing",
        },
        insights: [],
      };

      const insights = generateInsights(summary);

      // Não deve ter problemas
      const problems = insights.filter((i) => i.type === "problem");
      expect(problems.length).toBe(0);

      // Deve ter sucessos
      const successes = insights.filter((i) => i.type === "success");
      expect(successes.length).toBeGreaterThan(0);

      // Deve ter insight sobre correção funcionando
      const correctionInsight = insights.find((i) =>
        i.title.includes("Sistema de correção funcionando")
      );
      expect(correctionInsight).toBeDefined();
      expect(correctionInsight?.type).toBe("success");
    });
  });

  describe("Perfil 3: Alto Rendimento - Múltiplos Problemas", () => {
    it("deve identificar todos os problemas e gerar sugestões específicas", () => {
      const summary: MetricsSummary = {
        period: "monthly",
        current: {
          totalRejections: 80,
          totalCorrections: 60,
          totalQualityMetrics: 120,
          averageQualityScore: 68, // Score baixo
          topRejectionReasons: [
            {
              reason: "excesso_series_semanais",
              count: 35, // 43.75% das rejeições
              percentage: 43.75,
            },
            {
              reason: "excesso_padrao_motor",
              count: 25,
              percentage: 31.25,
            },
          ],
          topCorrectionReasons: [],
          rejectionRate: 40, // 80 rejeições / 200 planos
          correctionSuccessRate: 75, // Taxa baixa
          byActivityLevel: {
            "Alto Rendimento": {
              rejections: 65, // 81.25% das rejeições
              corrections: 48,
              qualityScore: 65, // Score baixo
            },
          },
          byDayType: {
            lower: {
              rejections: 35, // 43.75% das rejeições
              corrections: 28,
            },
          },
          byMuscle: {
            quadriceps: {
              rejections: 20, // 25% das rejeições
              corrections: 15,
            },
            posterior: {
              rejections: 18, // 22.5% das rejeições
              corrections: 14,
            },
          },
        },
        previous: {
          totalRejections: 50,
          totalCorrections: 42,
          averageQualityScore: 75,
          rejectionRate: 25,
          correctionSuccessRate: 84,
        },
        trends: {
          rejectionRate: "increasing",
          qualityScore: "degrading",
          correctionRate: "decreasing",
        },
        insights: [],
      };

      const insights = generateInsights(summary);

      // Deve gerar múltiplos insights
      expect(insights.length).toBeGreaterThan(6);

      // Validações específicas
      const validations = [
        {
          title: "Taxa de rejeição alta",
          type: "problem",
          severity: "high",
        },
        {
          title: "Aumento significativo de rejeições",
          type: "warning",
          severity: "high",
        },
        {
          title: "Score de qualidade baixo",
          type: "problem",
          severity: "high",
        },
        {
          title: "Excesso de séries semanais",
          type: "problem",
          severity: "high",
        },
        // "Excesso de padrões motores" só gera insight se estiver no top 1 com > 40%
        // Como está no top 2 (31.25%), não gera insight específico
        // Mas pode estar mencionado em outros insights
        {
          title: "Taxa de correção pode melhorar",
          type: "warning",
          severity: "medium",
        },
        {
          title: "Alto Rendimento",
          type: "warning",
          severity: "medium",
        },
        {
          title: "lower",
          type: "warning",
          severity: "medium",
        },
        {
          title: "quadriceps",
          type: "warning",
          severity: "medium",
        },
      ];

      for (const validation of validations) {
        const insight = insights.find((i) =>
          i.title.toLowerCase().includes(validation.title.toLowerCase())
        );
        expect(insight).toBeDefined();
        if (validation.type) {
          expect(insight?.type).toBe(validation.type);
        }
        if (validation.severity) {
          expect(insight?.severity).toBe(validation.severity);
        }
      }
    });
  });

  describe("Perfil 4: Moderado - Problema de Inconsistência", () => {
    it("deve detectar problema de dias inconsistentes", () => {
      const summary: MetricsSummary = {
        period: "weekly",
        current: {
          totalRejections: 25,
          totalCorrections: 20,
          totalQualityMetrics: 75,
          averageQualityScore: 78,
          topRejectionReasons: [
            {
              reason: "dias_mesmo_tipo_exercicios_diferentes",
              count: 15, // 60% das rejeições
              percentage: 60,
            },
          ],
          topCorrectionReasons: [],
          rejectionRate: 25,
          correctionSuccessRate: 80,
          byActivityLevel: {
            Moderado: {
              rejections: 20,
              corrections: 16,
              qualityScore: 78,
            },
          },
          byDayType: {},
          byMuscle: {},
        },
        previous: undefined,
        trends: {
          rejectionRate: "stable",
          qualityScore: "stable",
          correctionRate: "stable",
        },
        insights: [],
      };

      const insights = generateInsights(summary);

      // Deve gerar insight específico sobre inconsistência
      const consistencyInsight = insights.find((i) =>
        i.title.includes("Inconsistência entre dias")
      );
      expect(consistencyInsight).toBeDefined();
      expect(consistencyInsight?.suggestion).toContain(
        "correctSameTypeDaysExercises"
      );
      expect(consistencyInsight?.metric).toBe(
        "dias_mesmo_tipo_exercicios_diferentes"
      );
    });
  });

  describe("Validação de Thresholds", () => {
    it("deve respeitar thresholds configurados", () => {
      // Testa se os thresholds estão corretos
      const testCases = [
        {
          rejectionRate: 21, // > 20%
          shouldHaveHighRejection: true,
        },
        {
          rejectionRate: 19, // < 20%
          shouldHaveHighRejection: false,
        },
        {
          rejectionRate: 4, // < 5% e decreasing
          shouldHaveLowRejection: true,
        },
        {
          averageQualityScore: 69, // < 70
          shouldHaveLowQuality: true,
        },
        {
          averageQualityScore: 71, // > 70
          shouldHaveLowQuality: false,
        },
        {
          averageQualityScore: 91, // >= 90
          shouldHaveHighQuality: true,
        },
        {
          correctionSuccessRate: 96, // > 95%
          shouldHaveHighCorrection: true,
        },
        {
          correctionSuccessRate: 79, // < 80%
          shouldHaveLowCorrection: true,
        },
      ];

      for (const testCase of testCases) {
        const summary: MetricsSummary = {
          period: "weekly",
          current: {
            totalRejections: testCase.rejectionRate || 10,
            totalCorrections: 8,
            totalQualityMetrics: 90,
            averageQualityScore: testCase.averageQualityScore || 80,
            topRejectionReasons: [],
            topCorrectionReasons: [],
            rejectionRate: testCase.rejectionRate || 10,
            correctionSuccessRate: testCase.correctionSuccessRate || 80,
            byActivityLevel: {},
            byDayType: {},
            byMuscle: {},
          },
          previous:
            testCase.rejectionRate === 4
              ? {
                  totalRejections: 10,
                  totalCorrections: 8,
                  averageQualityScore: 85,
                  rejectionRate: 10,
                  correctionSuccessRate: 80,
                }
              : undefined,
          trends: {
            rejectionRate:
              testCase.rejectionRate === 4 ? "decreasing" : "stable",
            qualityScore: "stable",
            correctionRate: "stable",
          },
          insights: [],
        };

        const insights = generateInsights(summary);

        if (testCase.shouldHaveHighRejection) {
          expect(
            insights.some((i) => i.title === "Taxa de rejeição alta")
          ).toBe(true);
        }

        if (testCase.shouldHaveLowRejection) {
          expect(
            insights.some((i) => i.title === "Taxa de rejeição excelente")
          ).toBe(true);
        }

        if (testCase.shouldHaveLowQuality) {
          expect(
            insights.some((i) => i.title === "Score de qualidade baixo")
          ).toBe(true);
        }

        if (testCase.shouldHaveHighQuality) {
          expect(
            insights.some((i) => i.title === "Score de qualidade excelente")
          ).toBe(true);
        }

        if (testCase.shouldHaveHighCorrection) {
          expect(
            insights.some((i) =>
              i.title.includes("Sistema de correção funcionando muito bem")
            )
          ).toBe(true);
        }

        if (testCase.shouldHaveLowCorrection) {
          expect(
            insights.some((i) =>
              i.title.includes("Taxa de correção pode melhorar")
            )
          ).toBe(true);
        }
      }
    });
  });
});
