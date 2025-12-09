import { useState, useEffect } from "react";
import { TrialStatus } from "@/hooks/useTrial";

interface TrialSectionProps {
  status: TrialStatus;
  onBuyPrompts?: () => void;
}

export function TrialSection({ status, onBuyPrompts }: TrialSectionProps) {
  // ✅ Botão sempre visível quando não há prompts disponíveis
  const showBuyButton = status.availablePrompts === 0;

  // ✅ Atualizar tempo de cooldown em tempo real
  const [timeRemaining, setTimeRemaining] = useState<{
    hours: number;
    minutes: number;
  } | null>(null);

  useEffect(() => {
    if (
      status.isInCooldown &&
      status.hoursUntilNextPlan !== undefined &&
      status.nextPlanAvailable
    ) {
      const updateTimer = () => {
        const now = new Date();
        const nextDate = new Date(status.nextPlanAvailable!);
        const diffMs = nextDate.getTime() - now.getTime();

        if (diffMs <= 0) {
          setTimeRemaining(null);
          return;
        }

        const diffHours = diffMs / (1000 * 60 * 60);
        const hours = Math.floor(diffHours);
        const minutes = Math.floor((diffHours - hours) * 60);

        setTimeRemaining({ hours, minutes });
      };

      updateTimer();
      const interval = setInterval(updateTimer, 60000); // Atualizar a cada minuto

      return () => clearInterval(interval);
    } else {
      setTimeRemaining(null);
    }
  }, [
    status.isInCooldown,
    status.hoursUntilNextPlan,
    status.nextPlanAvailable,
  ]);

  return (
    <div className="bg-gray-50 rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6 mb-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        Planos Personalizados
      </h2>

      <div className="space-y-4">
        <div
          className={`border rounded-lg p-4 ${
            status.availablePrompts > 0
              ? "bg-green-50 border-green-200"
              : "bg-red-50 border-red-200"
          }`}
        >
          <div className="flex items-start gap-3">
            {status.availablePrompts > 0 ? (
              <svg
                className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            )}
            <div className="flex-1">
              <p
                className={`font-medium ${
                  status.availablePrompts > 0
                    ? "text-green-800"
                    : "text-red-800"
                }`}
              >
                {status.message}
              </p>
              {status.availablePrompts > 0 && (
                <div className="mt-3">
                  <p className="text-sm text-green-700">
                    Prompts disponíveis:{" "}
                    <span className="font-semibold">
                      {status.availablePrompts}
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ✅ Informação de cooldown - mostrar quando há cooldown ativo */}
          {status.isInCooldown === true &&
            status.hoursUntilNextPlan !== undefined &&
            status.hoursUntilNextPlan > 0 &&
            status.nextPlanAvailable && (
              <div className="mt-3 pt-3 border-t border-amber-200 bg-amber-50 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <svg
                    className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm text-amber-800 font-semibold mb-1">
                      Próximo plano disponível em:
                    </p>
                    <p className="text-lg font-bold text-amber-700 mb-1">
                      {timeRemaining
                        ? timeRemaining.hours > 0
                          ? `${timeRemaining.hours}h ${timeRemaining.minutes}m`
                          : `${timeRemaining.minutes}m`
                        : status.hoursUntilNextPlan !== undefined
                          ? (() => {
                              const hours = Math.floor(
                                status.hoursUntilNextPlan
                              );
                              const minutes = Math.floor(
                                (status.hoursUntilNextPlan - hours) * 60
                              );
                              return hours > 0
                                ? `${hours}h ${minutes}m`
                                : `${minutes}m`;
                            })()
                          : "Calculando..."}
                    </p>
                    {status.nextPlanAvailable && (
                      <p className="text-xs text-amber-600">
                        Disponível em:{" "}
                        {new Date(status.nextPlanAvailable).toLocaleString(
                          "pt-BR",
                          {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
        </div>

        {showBuyButton && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row items-start gap-3">
            <div className="flex-shrink-0">
              <svg
                className="w-6 h-6 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V5m0 11v3m9-9a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-blue-800 font-medium mb-1">
                Quer gerar novos planos?
              </h3>
              <p className="text-blue-700 text-sm mb-3">
                Adquira prompts para liberar novas gerações a qualquer momento.
              </p>
              <button
                onClick={onBuyPrompts}
                className="bg-black hover:bg-gray-900 text-white px-4 sm:px-6 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl whitespace-nowrap w-full sm:w-auto"
              >
                Comprar Prompts
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
