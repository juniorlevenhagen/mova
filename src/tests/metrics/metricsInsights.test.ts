import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  generateInsights,
  type MetricsSummary,
} from "@/lib/metrics/metricsInsights";
import { recordPlanRejection } from "@/lib/metrics/planRejectionMetrics";
import { recordPlanCorrection } from "@/lib/metrics/planCorrectionMetrics";
import { recordPlanQuality } from "@/lib/metrics/planQualityMetrics";
import type { RejectionReason } from "@/lib/metrics/planRejectionMetrics";
import type { CorrectionReason } from "@/lib/metrics/types";

// Mock das funções de persistência para não depender do banco
vi.mock("@/lib/metrics/planCorrectionMetrics", () => ({
  recordPlanCorrection: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/metrics/planQualityMetrics", () => ({
  recordPlanQuality: vi.fn().mockResolvedValue(undefined),
  planQualityMetrics: {
    recordQuality: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("Sistema de Insights Automáticos - Simulação de Perfis", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Cenário 1: Perfil Atleta com Problema de Séries por Sessão", () => {
    it("deve gerar insight sobre excesso de séries por sessão para ombro", () => {
      const summary: MetricsSummary = {
        period: "weekly",
        current: {
          totalRejections: 50,
          totalCorrections: 45,
          totalQualityMetrics: 100,
          averageQualityScore: 85,
          topRejectionReasons: [
            {
              reason: "excesso_series_por_sessao",
              count: 25,
              percentage: 50, // 50% das rejeições
            },
            {
              reason: "excesso_series_semanais",
              count: 15,
              percentage: 30,
            },
          ],
          topCorrectionReasons: [
            {
              reason: "ajuste_volume_minimo_obrigatorio",
              count: 30,
              percentage: 66.7,
            },
          ],
          rejectionRate: 33.3, // 50 rejeições / 150 planos
          correctionSuccessRate: 90, // 45 correções / 50 rejeições
          byActivityLevel: {
            Atleta: {
              rejections: 35,
              corrections: 32,
              qualityScore: 88,
            },
            Moderado: {
              rejections: 10,
              corrections: 8,
              qualityScore: 82,
            },
          },
          byDayType: {
            push: {
              rejections: 20,
              corrections: 18,
            },
            pull: {
              rejections: 15,
              corrections: 14,
            },
          },
          byMuscle: {
            ombro: {
              rejections: 20, // 40% do total
              corrections: 18,
            },
            costas: {
              rejections: 10,
              corrections: 9,
            },
          },
        },
        previous: {
          totalRejections: 30,
          totalCorrections: 25,
          averageQualityScore: 87,
          rejectionRate: 20,
          correctionSuccessRate: 83.3,
        },
        trends: {
          rejectionRate: "increasing",
          qualityScore: "degrading",
          correctionRate: "increasing",
        },
        insights: [],
      };

      const insights = generateInsights(summary);

      // Deve gerar insight sobre taxa de rejeição alta
      const rejectionRateInsight = insights.find(
        (i) => i.title === "Taxa de rejeição alta"
      );
      expect(rejectionRateInsight).toBeDefined();
      expect(rejectionRateInsight?.severity).toBe("high");

      // Deve gerar insight sobre aumento de rejeições
      const increaseInsight = insights.find(
        (i) => i.title === "Aumento significativo de rejeições"
      );
      expect(increaseInsight).toBeDefined();
      expect(increaseInsight?.changePercent).toBeGreaterThan(30);

      // Deve gerar insight específico sobre excesso de séries por sessão
      const seriesInsight = insights.find((i) =>
        i.title.includes("Excesso de séries por sessão")
      );
      expect(seriesInsight).toBeDefined();
      expect(seriesInsight?.suggestion).toContain("validateFrequencyVolume");
      expect(seriesInsight?.suggestion).toContain(
        "PRIMARY_MUSCLE_SESSION_BONUS"
      );

      // Deve gerar insight sobre músculo ombro
      const muscleInsight = insights.find(
        (i) => i.title.includes("ombro") && i.affectedMuscles?.includes("ombro")
      );
      expect(muscleInsight).toBeDefined();
      expect(muscleInsight?.suggestion).toContain("ombro");
    });
  });

  describe("Cenário 2: Perfil Sedentário com Poucas Rejeições", () => {
    it("deve gerar insights positivos para sistema funcionando bem", () => {
      const summary: MetricsSummary = {
        period: "weekly",
        current: {
          totalRejections: 5,
          totalCorrections: 4,
          totalQualityMetrics: 95,
          averageQualityScore: 92,
          topRejectionReasons: [
            {
              reason: "excesso_exercicios_nivel",
              count: 3,
              percentage: 60,
            },
          ],
          topCorrectionReasons: [],
          rejectionRate: 5, // 5 rejeições / 100 planos
          correctionSuccessRate: 80,
          byActivityLevel: {
            Sedentário: {
              rejections: 3,
              corrections: 2,
              qualityScore: 90,
            },
          },
          byDayType: {},
          byMuscle: {},
        },
        previous: {
          totalRejections: 8,
          totalCorrections: 6,
          averageQualityScore: 89,
          rejectionRate: 8,
          correctionSuccessRate: 75,
        },
        trends: {
          rejectionRate: "decreasing",
          qualityScore: "improving",
          correctionRate: "increasing",
        },
        insights: [],
      };

      const insights = generateInsights(summary);

      // Deve gerar insight positivo sobre redução de rejeições
      const reductionInsight = insights.find(
        (i) => i.title === "Redução significativa de rejeições"
      );
      expect(reductionInsight).toBeDefined();
      expect(reductionInsight?.type).toBe("success");

      // Deve gerar insight positivo sobre score de qualidade
      const qualityInsight = insights.find(
        (i) => i.title === "Score de qualidade excelente"
      );
      expect(qualityInsight).toBeDefined();
      expect(qualityInsight?.type).toBe("success");
    });
  });

  describe("Cenário 3: Perfil Alto Rendimento com Problemas em Músculos Específicos", () => {
    it("deve identificar problemas específicos por músculo e nível", () => {
      const summary: MetricsSummary = {
        period: "weekly",
        current: {
          totalRejections: 40,
          totalCorrections: 35,
          totalQualityMetrics: 60,
          averageQualityScore: 75,
          topRejectionReasons: [
            {
              reason: "excesso_series_semanais",
              count: 20,
              percentage: 50,
            },
          ],
          topCorrectionReasons: [],
          rejectionRate: 40, // 40 rejeições / 100 planos
          correctionSuccessRate: 87.5,
          byActivityLevel: {
            "Alto Rendimento": {
              rejections: 30, // 75% do total
              corrections: 28,
              qualityScore: 72,
            },
          },
          byDayType: {
            push: {
              rejections: 15, // 37.5% do total
              corrections: 14,
            },
          },
          byMuscle: {
            quadriceps: {
              rejections: 12, // 30% do total
              corrections: 11,
            },
            posterior: {
              rejections: 10, // 25% do total
              corrections: 9,
            },
          },
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

      // Deve gerar insight sobre nível Alto Rendimento
      const levelInsight = insights.find(
        (i) =>
          i.title.includes("Alto Rendimento") &&
          i.affectedLevels?.includes("Alto Rendimento")
      );
      expect(levelInsight).toBeDefined();
      expect(levelInsight?.suggestion).toContain("Alto Rendimento");

      // Deve gerar insight sobre dias Push
      const dayTypeInsight = insights.find(
        (i) => i.title.includes("push") && i.affectedDayTypes?.includes("push")
      );
      expect(dayTypeInsight).toBeDefined();

      // Deve gerar insight sobre músculo quadríceps
      const quadInsight = insights.find(
        (i) =>
          i.title.includes("quadriceps") &&
          i.affectedMuscles?.includes("quadriceps")
      );
      expect(quadInsight).toBeDefined();
      expect(quadInsight?.suggestion).toContain("quadriceps");
    });
  });

  describe("Cenário 4: Problema de Inconsistência entre Dias", () => {
    it("deve gerar insight específico sobre dias do mesmo tipo diferentes", () => {
      const summary: MetricsSummary = {
        period: "weekly",
        current: {
          totalRejections: 30,
          totalCorrections: 25,
          totalQualityMetrics: 70,
          averageQualityScore: 80,
          topRejectionReasons: [
            {
              reason: "dias_mesmo_tipo_exercicios_diferentes",
              count: 18, // 60% das rejeições
              percentage: 60,
            },
          ],
          topCorrectionReasons: [],
          rejectionRate: 30,
          correctionSuccessRate: 83.3,
          byActivityLevel: {},
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

  describe("Cenário 5: Sistema Funcionando Perfeitamente", () => {
    it("deve gerar apenas insights positivos", () => {
      const summary: MetricsSummary = {
        period: "weekly",
        current: {
          totalRejections: 2,
          totalCorrections: 2,
          totalQualityMetrics: 98,
          averageQualityScore: 95,
          topRejectionReasons: [],
          topCorrectionReasons: [],
          rejectionRate: 2, // 2 rejeições / 100 planos
          correctionSuccessRate: 100,
          byActivityLevel: {},
          byDayType: {},
          byMuscle: {},
        },
        previous: {
          totalRejections: 5,
          totalCorrections: 4,
          averageQualityScore: 92,
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

      // Não deve ter insights de problema
      const problemInsights = insights.filter((i) => i.type === "problem");
      expect(problemInsights.length).toBe(0);

      // Deve ter insights de sucesso
      const successInsights = insights.filter((i) => i.type === "success");
      expect(successInsights.length).toBeGreaterThan(0);

      // Deve ter insight sobre correção funcionando bem
      const correctionInsight = insights.find((i) =>
        i.title.includes("Sistema de correção funcionando")
      );
      expect(correctionInsight).toBeDefined();
    });
  });

  describe("Cenário 6: Múltiplos Problemas Simultâneos", () => {
    it("deve gerar múltiplos insights para diferentes problemas", () => {
      const summary: MetricsSummary = {
        period: "monthly",
        current: {
          totalRejections: 100,
          totalCorrections: 70,
          totalQualityMetrics: 200,
          averageQualityScore: 65, // Score baixo
          topRejectionReasons: [
            {
              reason: "excesso_series_por_sessao",
              count: 45, // 45% das rejeições
              percentage: 45,
            },
            {
              reason: "excesso_padrao_motor",
              count: 30,
              percentage: 30,
            },
          ],
          topCorrectionReasons: [],
          rejectionRate: 33.3, // 100 rejeições / 300 planos
          correctionSuccessRate: 70, // Taxa baixa
          byActivityLevel: {
            Atleta: {
              rejections: 60, // 60% do total
              corrections: 40,
              qualityScore: 60, // Score baixo
            },
            Moderado: {
              rejections: 30,
              corrections: 25,
              qualityScore: 70,
            },
          },
          byDayType: {
            push: {
              rejections: 40, // 40% do total
              corrections: 30,
            },
          },
          byMuscle: {
            ombro: {
              rejections: 25, // 25% do total
              corrections: 20,
            },
            costas: {
              rejections: 20, // 20% do total
              corrections: 15,
            },
          },
        },
        previous: {
          totalRejections: 50,
          totalCorrections: 40,
          averageQualityScore: 75,
          rejectionRate: 16.7,
          correctionSuccessRate: 80,
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
      expect(insights.length).toBeGreaterThan(5);

      // Deve ter insight sobre taxa de rejeição alta
      expect(insights.some((i) => i.title === "Taxa de rejeição alta")).toBe(
        true
      );

      // Deve ter insight sobre aumento de rejeições
      expect(
        insights.some((i) => i.title === "Aumento significativo de rejeições")
      ).toBe(true);

      // Deve ter insight sobre score baixo
      expect(insights.some((i) => i.title === "Score de qualidade baixo")).toBe(
        true
      );

      // Deve ter insight sobre excesso de séries por sessão
      expect(
        insights.some((i) => i.title.includes("Excesso de séries por sessão"))
      ).toBe(true);

      // Deve ter insight sobre excesso de padrões motores (pode estar no top 2, não necessariamente gerando insight específico)
      // O insight específico só é gerado se o motivo estiver no top 1 com > 40%
      // Como está no top 2, pode não gerar insight específico, mas pode estar em outros insights

      // Deve ter insight sobre taxa de correção baixa
      expect(
        insights.some((i) => i.title.includes("Taxa de correção pode melhorar"))
      ).toBe(true);

      // Deve ter insight sobre nível Atleta
      expect(
        insights.some(
          (i) =>
            i.title.includes("Atleta") && i.affectedLevels?.includes("Atleta")
        )
      ).toBe(true);

      // Deve ter insight sobre dias Push
      expect(
        insights.some(
          (i) =>
            i.title.includes("push") && i.affectedDayTypes?.includes("push")
        )
      ).toBe(true);

      // Deve ter insights sobre músculos
      expect(
        insights.some(
          (i) =>
            i.title.includes("ombro") && i.affectedMuscles?.includes("ombro")
        )
      ).toBe(true);
    });
  });

  describe("Validação de Sugestões Específicas", () => {
    it("deve gerar sugestões específicas para cada tipo de problema", () => {
      const testCases = [
        {
          reason: "excesso_series_por_sessao" as RejectionReason,
          expectedSuggestions: [
            "validateFrequencyVolume",
            "PRIMARY_MUSCLE_SESSION_BONUS",
            "tipo de dia",
          ],
        },
        {
          reason: "excesso_series_semanais" as RejectionReason,
          expectedSuggestions: [
            "ApprovalContract",
            "getWeeklySeriesLimits",
            "correctSameTypeDaysExercises",
          ],
        },
        {
          reason: "dias_mesmo_tipo_exercicios_diferentes" as RejectionReason,
          expectedSuggestions: ["correctSameTypeDaysExercises"],
        },
        {
          reason: "excesso_padrao_motor" as RejectionReason,
          expectedSuggestions: ["ApprovalContract", "padrões motores"],
        },
      ];

      for (const testCase of testCases) {
        const summary: MetricsSummary = {
          period: "weekly",
          current: {
            totalRejections: 50,
            totalCorrections: 40,
            totalQualityMetrics: 100,
            averageQualityScore: 80,
            topRejectionReasons: [
              {
                reason: testCase.reason,
                count: 30,
                percentage: 60, // > 40%, deve gerar insight
              },
            ],
            topCorrectionReasons: [],
            rejectionRate: 33.3,
            correctionSuccessRate: 80,
            byActivityLevel: {},
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

        // Buscar insight específico pelo metric (gerado por analyzeRejectionReason)
        // ou pelo título que contenha o motivo
        const relevantInsight = insights.find(
          (i) =>
            i.metric === testCase.reason ||
            (i.suggestion?.includes(testCase.expectedSuggestions[0]) &&
              i.metric !== "rejection_rate") // Excluir insight genérico de taxa alta
        );

        expect(relevantInsight).toBeDefined();
        expect(relevantInsight?.metric).toBe(testCase.reason);

        // Validar que todas as sugestões esperadas estão presentes
        for (const suggestion of testCase.expectedSuggestions) {
          expect(relevantInsight?.suggestion).toContain(suggestion);
        }
      }
    });
  });
});
