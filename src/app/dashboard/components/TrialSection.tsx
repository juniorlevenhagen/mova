import { useState, useEffect } from "react";
import { TrialStatus } from "@/hooks/useTrial";

interface TrialSectionProps {
  status: TrialStatus;
  onBuyPrompts?: () => void;
}

export function TrialSection({ status, onBuyPrompts }: TrialSectionProps) {
  // ✅ Botão sempre visível após usar plano grátis (independente de ter prompts disponíveis)
  const showBuyButton = status.hasUsedFreePlan;
  
  // ✅ Atualizar tempo de cooldown em tempo real
  const [timeRemaining, setTimeRemaining] = useState<{
    hours: number;
    minutes: number;
  } | null>(null);
  
  useEffect(() => {
    if (status.isInCooldown && status.hoursUntilNextPlan !== undefined && status.nextPlanAvailable) {
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
  }, [status.isInCooldown, status.hoursUntilNextPlan, status.nextPlanAvailable]);

  return (
    <div className="bg-gray-50 rounded-2xl shadow-lg border border-gray-200 p-6 mb-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        Planos Personalizados
      </h2>

      <div className="space-y-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-gray-800">{status.message}</p>
          <div className="mt-3 space-y-2">
            <p className="text-sm text-gray-500">
              Planos disponíveis agora:{" "}
              <span className="font-semibold text-gray-900">
                {status.plansRemaining}
              </span>
            </p>
            {status.availablePrompts > 0 && (
              <p className="text-sm text-gray-500">
                Prompts comprados:{" "}
                <span className="font-semibold text-gray-900">
                  {status.availablePrompts}
                </span>
              </p>
            )}
            
            {/* ✅ Informação de cooldown - mostrar quando há cooldown ativo */}
            {status.isInCooldown === true && status.hoursUntilNextPlan !== undefined && status.hoursUntilNextPlan > 0 && status.nextPlanAvailable && (
              <div className="mt-3 pt-3 border-t border-gray-200 bg-amber-50 rounded-lg p-3">
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
                            const hours = Math.floor(status.hoursUntilNextPlan);
                            const minutes = Math.floor((status.hoursUntilNextPlan - hours) * 60);
                            return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
                          })()
                        : "Calculando..."}
                    </p>
                    {status.nextPlanAvailable && (
                      <p className="text-xs text-amber-600">
                        Disponível em:{" "}
                        {new Date(status.nextPlanAvailable).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* ✅ Feedback informativo quando tem prompts mas sem cooldown */}
            {status.availablePrompts > 0 && status.isInCooldown !== true && (
              <div className="mt-3 pt-3 border-t border-gray-200 bg-green-50 rounded-lg p-3">
                <div className="flex items-start gap-2">
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
                  <div className="flex-1">
                    <p className="text-sm text-green-800 font-semibold">
                      ✅ Você pode gerar um novo plano agora!
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      Seus prompts estão disponíveis sem cooldown.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* ✅ Feedback quando não há prompts mas pode comprar */}
            {!status.availablePrompts && status.hasUsedFreePlan && !status.isInCooldown && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Você pode comprar prompts adicionais para gerar novos planos a qualquer momento.
                </p>
              </div>
            )}
          </div>
        </div>

        {showBuyButton && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
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
                Compre prompts adicionais para liberar novas gerações a qualquer momento.
              </p>
              <button
                onClick={onBuyPrompts}
                className="bg-black hover:bg-gray-900 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl whitespace-nowrap"
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

