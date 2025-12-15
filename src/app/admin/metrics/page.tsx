"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, AlertTriangle, Clock, BarChart2 } from "lucide-react";
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
  excesso_exercicios_musculo_primario:
    "Excesso por músculo primário (volume)",
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
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"all" | "24h">("24h");
  const [data, setData] = useState<MetricsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login?redirect=/admin/metrics");
      return;
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchMetrics(period);
    } else if (!authLoading) {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, period]);

  async function fetchMetrics(selectedPeriod: "all" | "24h") {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(
        `/api/metrics/plan-rejections?period=${selectedPeriod}`,
      );
      if (!res.ok) {
        throw new Error(`Status ${res.status}`);
      }
      const json = (await res.json()) as MetricsResponse;
      setData(json);
    } catch (err) {
      console.error("Erro ao buscar métricas de rejeição:", err);
      setError("Não foi possível carregar as métricas de rejeição.");
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
        {/* Navigation */}
        <AdminNav />

        <header className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">
              Métricas de Rejeição de Planos
            </h1>
            <p className="text-sm text-gray-600 mt-1 max-w-2xl">
              Visão administrativa dos motivos pelos quais planos de treino são
              rejeitados pela validação de regras de negócio.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fetchMetrics(period)}
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm hover:bg-gray-50"
            >
              <Activity className="h-4 w-4" />
              Atualizar
            </button>
            <select
              value={period}
              onChange={(e) =>
                setPeriod(e.target.value === "24h" ? "24h" : "all")
              }
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-black/80"
            >
              <option value="24h">Últimas 24h</option>
              <option value="all">Desde inicialização</option>
            </select>
          </div>
        </header>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-b-2 border-black" />
              <p className="text-gray-600 text-sm">
                Carregando métricas de rejeição...
              </p>
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

        {!loading && !error && data && (
          <>
            {/* Cards principais */}
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
              <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Rejeições totais
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {data.statistics.total}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Período: {data.period === "24h" ? "24h" : "completo"}
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-900 text-white">
                  <BarChart2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Motivo mais comum
                  </p>
                  {Object.keys(data.statistics.byReason).length === 0 ? (
                    <p className="text-sm text-gray-500 mt-1">
                      Ainda não há dados suficientes.
                    </p>
                  ) : (
                    <>
                      {(() => {
                        const entries = Object.entries(
                          data.statistics.byReason,
                        ) as [RejectionReason, number][];
                        const [reason, count] =
                          entries.sort((a, b) => b[1] - a[1])[0];
                        return (
                          <>
                            <p className="text-sm font-medium text-gray-900">
                              {REASON_LABELS[reason]}
                            </p>
                            <p className="text-[11px] text-gray-500 mt-0.5">
                              {count} rejeição{count !== 1 ? "es" : ""}
                            </p>
                          </>
                        );
                      })()}
                    </>
                  )}
                </div>
              </div>

              <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-800 text-white">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Última rejeição
                  </p>
                  {data.statistics.recent.length === 0 ? (
                    <p className="text-sm text-gray-500 mt-1">
                      Nenhuma rejeição registrada.
                    </p>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-gray-900">
                        {formatDateTime(data.statistics.recent[0].timestamp)}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {REASON_LABELS[data.statistics.recent[0].reason]}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </section>

            {/* Distribuição por motivo */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-4">
                <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-gray-700" />
                  Distribuição por motivo
                </h2>
                {Object.keys(data.statistics.byReason).length === 0 ? (
                  <p className="text-sm text-gray-500">
                    Ainda não há registros suficientes para exibir a
                    distribuição.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {(
                      Object.entries(
                        data.statistics.byReason,
                      ) as [RejectionReason, number][]
                    )
                      .sort((a, b) => b[1] - a[1])
                      .map(([reason, count]) => {
                        const percent =
                          data.statistics.total > 0
                            ? Math.round(
                                (count / data.statistics.total) * 100,
                              )
                            : 0;
                        return (
                          <li
                            key={reason}
                            className="flex items-center justify-between gap-3"
                          >
                            <div className="flex-1">
                              <p className="text-xs font-medium text-gray-800">
                                {REASON_LABELS[reason]}
                              </p>
                              <div className="mt-1 h-1.5 w-full rounded-full bg-gray-100">
                                <div
                                  className="h-1.5 rounded-full bg-gray-900"
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-semibold text-gray-900">
                                {count}
                              </p>
                              <p className="text-[11px] text-gray-500">
                                {percent}%
                              </p>
                            </div>
                          </li>
                        );
                      })}
                  </ul>
                )}
              </div>

              {/* Distribuição por nível de atividade e tipo de dia */}
              <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-4 space-y-4">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900 mb-2">
                    Por nível de atividade
                  </h2>
                  {Object.keys(data.statistics.byActivityLevel).length === 0 ? (
                    <p className="text-sm text-gray-500">
                      Sem dados de nível de atividade registrados.
                    </p>
                  ) : (
                    <ul className="space-y-1">
                      {Object.entries(data.statistics.byActivityLevel)
                        .sort((a, b) => b[1] - a[1])
                        .map(([levelKey, count]) => (
                          <li
                            key={levelKey}
                            className="flex items-center justify-between text-xs text-gray-800"
                          >
                            <span>{levelKey}</span>
                            <span className="font-semibold">{count}</span>
                          </li>
                        ))}
                    </ul>
                  )}
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-gray-900 mb-2">
                    Por tipo de dia (divisão)
                  </h2>
                  {Object.keys(data.statistics.byDayType).length === 0 ? (
                    <p className="text-sm text-gray-500">
                      Sem dados de tipo de dia registrados.
                    </p>
                  ) : (
                    <ul className="space-y-1">
                      {Object.entries(data.statistics.byDayType)
                        .sort((a, b) => b[1] - a[1])
                        .map(([dayTypeKey, count]) => (
                          <li
                            key={dayTypeKey}
                            className="flex items-center justify-between text-xs text-gray-800"
                          >
                            <span>{dayTypeKey || "Sem tipo"}</span>
                            <span className="font-semibold">{count}</span>
                          </li>
                        ))}
                    </ul>
                  )}
                </div>
              </div>
            </section>

            {/* Tabela de últimas rejeições */}
            <section className="rounded-xl bg-white border border-gray-200 shadow-sm p-4">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">
                Últimas rejeições
              </h2>
              {data.statistics.recent.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Nenhuma rejeição registrada até o momento.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-600">
                          Data / hora
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600">
                          Motivo
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600">
                          Nível
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600">
                          Divisão
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600">
                          Contexto
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {data.statistics.recent.slice(0, 50).map((metric) => (
                        <tr key={metric.timestamp + metric.reason}>
                          <td className="px-3 py-2 whitespace-nowrap text-gray-900">
                            {formatDateTime(metric.timestamp)}
                          </td>
                          <td className="px-3 py-2 text-gray-900 max-w-xs">
                            {REASON_LABELS[metric.reason]}
                          </td>
                          <td className="px-3 py-2 text-gray-700">
                            {metric.context.activityLevel || "—"}
                          </td>
                          <td className="px-3 py-2 text-gray-700">
                            {metric.context.dayType || "—"}
                          </td>
                          <td className="px-3 py-2 text-gray-500 max-w-md">
                            <div className="flex flex-wrap gap-1">
                              {metric.context.trainingDays && (
                                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-700">
                                  {metric.context.trainingDays}x/sem
                                </span>
                              )}
                              {metric.context.exerciseCount && (
                                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-700">
                                  {metric.context.exerciseCount} exercícios
                                </span>
                              )}
                              {metric.context.muscle && (
                                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-700">
                                  músculo: {metric.context.muscle}
                                </span>
                              )}
                              {metric.context.muscleCount && (
                                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-700">
                                  volume: {metric.context.muscleCount}
                                </span>
                              )}
                              {metric.context.maxAllowed && (
                                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-700">
                                  máx: {metric.context.maxAllowed}
                                </span>
                              )}
                              {!metric.context.trainingDays &&
                                !metric.context.exerciseCount &&
                                !metric.context.muscle &&
                                !metric.context.muscleCount &&
                                !metric.context.maxAllowed && (
                                  <span className="text-[11px] text-gray-400">
                                    Sem detalhes adicionais.
                                  </span>
                                )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}


