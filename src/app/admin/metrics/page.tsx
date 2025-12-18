"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  Clock,
  BarChart2,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

type CorrectionReason =
  | "objetivo_convertido_fisiologico"
  | "proteina_ajustada_limite_seguranca"
  | "cardio_frequencia_reduzida_adaptacao"
  | "estimulos_totais_excedidos";

interface CorrectionMetric {
  id: string;
  reason: CorrectionReason;
  payload: Record<string, unknown>;
  context: Record<string, unknown>;
  created_at: string;
}

const CORRECTION_LABELS: Record<CorrectionReason, string> = {
  objetivo_convertido_fisiologico: "Objetivo Convertido (Fisiológico)",
  proteina_ajustada_limite_seguranca: "Proteína Ajustada (Segurança)",
  cardio_frequencia_reduzida_adaptacao: "Cardio Reduzido (Adaptação)",
  estimulos_totais_excedidos: "Estímulos Totais Excedidos",
};
import { useAuth } from "@/hooks/useAuth";
import { AdminNav } from "@/components/admin/AdminNav";

type RejectionReason =
  | "weeklySchedule_invalido"
  | "numero_dias_incompativel"
  | "divisao_incompativel_frequencia"
  | "dia_sem_exercicios"
  | "excesso_exercicios_nivel"
  | "exercicio_sem_primaryMuscle"
  | "grupo_muscular_proibido"
  | "lower_sem_grupos_obrigatorios"
  | "full_body_sem_grupos_obrigatorios"
  | "grupo_obrigatorio_ausente"
  | "ordem_exercicios_invalida"
  | "excesso_exercicios_musculo_primario"
  | "distribuicao_inteligente_invalida"
  | "secondaryMuscles_excede_limite"
  | "tempo_treino_excede_disponivel";

interface RejectionMetric {
  reason: RejectionReason;
  timestamp: number;
  context: {
    activityLevel?: string;
    trainingDays?: number;
    dayType?: string;
    exerciseCount?: number;
    muscle?: string;
    muscleCount?: number;
    maxAllowed?: number;
    [key: string]: unknown;
  };
}

interface RejectionStats {
  total: number;
  byReason: Record<RejectionReason, number>;
  byActivityLevel: Record<string, number>;
  byDayType: Record<string, number>;
  recent: RejectionMetric[];
}

interface MetricsResponse {
  success: boolean;
  period: "all" | "24h";
  statistics: RejectionStats;
  timestamp: number;
}

const REASON_LABELS: Record<RejectionReason, string> = {
  weeklySchedule_invalido: "WeeklySchedule inválido",
  numero_dias_incompativel: "Número de dias incompatível",
  divisao_incompativel_frequencia: "Divisão × frequência incompatível",
  dia_sem_exercicios: "Dia sem exercícios",
  excesso_exercicios_nivel: "Excesso de exercícios por nível",
  exercicio_sem_primaryMuscle: "Exercício sem primaryMuscle",
  grupo_muscular_proibido: "Grupo muscular proibido",
  lower_sem_grupos_obrigatorios: "Lower sem grupos obrigatórios",
  full_body_sem_grupos_obrigatorios: "Full Body sem grupos obrigatórios",
  grupo_obrigatorio_ausente: "Grupo obrigatório ausente",
  ordem_exercicios_invalida: "Ordem de exercícios inválida",
  excesso_exercicios_musculo_primario: "Excesso por músculo primário (volume)",
  distribuicao_inteligente_invalida: "Distribuição inteligente inválida",
  secondaryMuscles_excede_limite: "secondaryMuscles excede limite",
  tempo_treino_excede_disponivel: "Tempo de treino excede disponível",
};

function formatDateTime(ts: number) {
  return new Date(ts).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminMetricsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"rejections" | "corrections">(
    "rejections"
  );
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"all" | "24h">("24h");
  const [rejectionData, setRejectionData] = useState<MetricsResponse | null>(
    null
  );
  const [correctionData, setCorrectionData] = useState<{
    stats: {
      total: number;
      byReason: Record<string, number>;
      byActivityLevel: Record<string, number>;
    };
    corrections: CorrectionMetric[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login?redirect=/admin/metrics");
      return;
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      if (activeTab === "rejections") {
        fetchRejectionMetrics(period);
      } else {
        fetchCorrectionMetrics();
      }
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading, period, activeTab]);

  async function fetchRejectionMetrics(selectedPeriod: "all" | "24h") {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(
        `/api/metrics/plan-rejections?period=${selectedPeriod}`
      );
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const json = await res.json();
      setRejectionData(json);
    } catch (err) {
      console.error("Erro ao buscar métricas de rejeição:", err);
      setError("Não foi possível carregar as métricas de rejeição.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchCorrectionMetrics() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/metrics/plan-corrections`);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const json = await res.json();
      setCorrectionData(json);
    } catch (err) {
      console.error("Erro ao buscar métricas de correção:", err);
      setError("Não foi possível carregar as métricas de correção.");
    } finally {
      setLoading(false);
    }
  }

  if (!authLoading && !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-white to-gray-100 py-10 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto">
        <AdminNav />

        <header className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">
              Dashboard de Inteligência
            </h1>
            <p className="text-sm text-gray-600 mt-1 max-w-2xl">
              Monitore a eficácia do sistema: onde a IA falha (rejeições) e onde
              o código corrige (defesa).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-gray-100 p-1 rounded-lg flex mr-4">
              <button
                onClick={() => setActiveTab("rejections")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === "rejections" ? "bg-white shadow-sm text-black" : "text-gray-500 hover:text-gray-700"}`}
              >
                Rejeições
              </button>
              <button
                onClick={() => setActiveTab("corrections")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === "corrections" ? "bg-white shadow-sm text-black" : "text-gray-500 hover:text-gray-700"}`}
              >
                Correções Aplicadas
              </button>
            </div>

            <button
              type="button"
              onClick={() =>
                activeTab === "rejections"
                  ? fetchRejectionMetrics(period)
                  : fetchCorrectionMetrics()
              }
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm hover:bg-gray-50"
            >
              <Activity className="h-4 w-4" />
              Atualizar
            </button>

            {activeTab === "rejections" && (
              <select
                value={period}
                onChange={(e) =>
                  setPeriod(e.target.value === "24h" ? "24h" : "all")
                }
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-black/80"
              >
                <option value="24h">Últimas 24h</option>
                <option value="all">Histórico completo</option>
              </select>
            )}
          </div>
        </header>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-b-2 border-black" />
              <p className="text-gray-600 text-sm">Carregando métricas...</p>
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 flex items-start gap-2 mb-6">
            <AlertTriangle className="h-4 w-4 mt-0.5" />
            <div>
              <p className="font-medium">Erro ao carregar métricas</p>
              <p className="mt-1 text-xs text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* VISÃO DE REJEIÇÕES */}
        {!loading && !error && activeTab === "rejections" && rejectionData && (
          <>
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
              <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Rejeições totais
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {rejectionData.statistics.total}
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-gray-600">
                  <BarChart2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Eficiência da IA
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {rejectionData.statistics.total === 0
                      ? "100%"
                      : `${Math.max(0, 100 - rejectionData.statistics.total)}%`}
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Última ocorrência
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {rejectionData.statistics.recent.length > 0
                      ? formatDateTime(
                          rejectionData.statistics.recent[0].timestamp
                        )
                      : "—"}
                  </p>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-4">
                <h2 className="text-sm font-semibold text-gray-900 mb-3">
                  Distribuição por motivo
                </h2>
                <ul className="space-y-2">
                  {Object.entries(rejectionData.statistics.byReason)
                    .sort((a, b) => b[1] - a[1])
                    .map(([reason, count]) => (
                      <li
                        key={reason}
                        className="flex items-center justify-between gap-3"
                      >
                        <span className="text-xs text-gray-700">
                          {REASON_LABELS[reason as RejectionReason] || reason}
                        </span>
                        <span className="text-xs font-bold">{count}</span>
                      </li>
                    ))}
                </ul>
              </div>
              <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-4">
                <h2 className="text-sm font-semibold text-gray-900 mb-3">
                  Últimos Logs de Rejeição
                </h2>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {rejectionData.statistics.recent.map((r, i) => (
                    <div
                      key={i}
                      className="text-[11px] p-2 bg-gray-50 rounded border border-gray-100"
                    >
                      <div className="flex justify-between font-bold mb-1">
                        <span>{REASON_LABELS[r.reason] || r.reason}</span>
                        <span>{formatDateTime(r.timestamp)}</span>
                      </div>
                      <div className="text-gray-500 truncate">
                        {JSON.stringify(r.context)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}

        {/* VISÃO DE CORREÇÕES (NOVA!) */}
        {!loading &&
          !error &&
          activeTab === "corrections" &&
          correctionData && (
            <>
              <section className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
                <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50 text-green-600">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Planos Salvos pelo Código
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {correctionData.stats.total}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-50 text-purple-600">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Principal Ajuste
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {Object.entries(correctionData.stats.byReason).sort(
                        (a, b) => b[1] - a[1]
                      )[0]?.[0]
                        ? CORRECTION_LABELS[
                            Object.entries(correctionData.stats.byReason).sort(
                              (a, b) => b[1] - a[1]
                            )[0][0] as CorrectionReason
                          ]
                        : "—"}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-gray-600">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Última Correção
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {correctionData.corrections.length > 0
                        ? formatDateTime(
                            new Date(
                              correctionData.corrections[0].created_at
                            ).getTime()
                          )
                        : "—"}
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-xl bg-white border border-gray-200 shadow-sm p-4 overflow-hidden">
                <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-green-600" />
                  Logs de Correção em Tempo Real
                </h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">
                          Data
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">
                          Ajuste Realizado
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">
                          De (IA) ➜ Para (Código)
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">
                          Contexto
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {correctionData.corrections.map((c) => (
                        <tr key={c.id}>
                          <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                            {formatDateTime(new Date(c.created_at).getTime())}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-medium text-gray-900">
                              {CORRECTION_LABELS[c.reason]}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="px-1.5 py-0.5 bg-red-50 text-red-700 rounded border border-red-100">
                                {c.reason === "objetivo_convertido_fisiologico"
                                  ? (c.payload as { originalObjective: string })
                                      .originalObjective
                                  : c.reason ===
                                      "proteina_ajustada_limite_seguranca"
                                    ? `${(c.payload as { originalProtein: number }).originalProtein}g prot`
                                    : c.reason ===
                                        "cardio_frequencia_reduzida_adaptacao"
                                      ? `${(c.payload as { originalFrequency: number }).originalFrequency}x cardio`
                                      : "—"}
                              </span>
                              <ArrowRight className="h-3 w-3 text-gray-400" />
                              <span className="px-1.5 py-0.5 bg-green-50 text-green-700 rounded border border-green-100 font-bold">
                                {c.reason === "objetivo_convertido_fisiologico"
                                  ? (
                                      c.payload as {
                                        correctedObjective: string;
                                      }
                                    ).correctedObjective
                                  : c.reason ===
                                      "proteina_ajustada_limite_seguranca"
                                    ? `${(c.payload as { correctedProtein: number }).correctedProtein}g prot`
                                    : c.reason ===
                                        "cardio_frequencia_reduzida_adaptacao"
                                      ? `${(c.payload as { correctedFrequency: number }).correctedFrequency}x cardio`
                                      : "—"}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-500 italic">
                            IMC:{" "}
                            {(c.context as { imc?: number }).imc?.toFixed(1)} |{" "}
                            {(c.context as { gender?: string }).gender} |{" "}
                            {
                              (c.context as { activityLevel?: string })
                                .activityLevel
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
      </div>
    </div>
  );
}
