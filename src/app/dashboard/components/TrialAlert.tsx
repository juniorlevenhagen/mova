"use client";

interface TrialStatus {
  isNewUser?: boolean;
  canGenerate: boolean;
  plansRemaining: number;
  isPremium: boolean;
  hasUsedFreePlan?: boolean;
  message: string;
  daysUntilNextCycle?: number;
  cycleDays?: number;
}

interface TrialAlertProps {
  trialStatus: TrialStatus;
  onUpgrade?: () => void;
}

export function TrialAlert({ trialStatus, onUpgrade }: TrialAlertProps) {
  // Não mostrar nada se for premium
  if (trialStatus.isPremium) {
    return null;
  }

  // Definir quando mostrar alertas - novo sistema
  const shouldShowAlert =
    (!trialStatus.isPremium &&
      trialStatus.hasUsedFreePlan &&
      !trialStatus.canGenerate) || // Usuário que já usou plano grátis
    (trialStatus.isPremium && trialStatus.plansRemaining === 0); // Premium sem planos restantes

  if (!shouldShowAlert) {
    return null;
  }

  // Determinar tipo e cor do alerta - novo sistema
  const getAlertType = () => {
    if (!trialStatus.isPremium && trialStatus.hasUsedFreePlan) {
      return {
        type: "warning",
        bgColor: "bg-orange-50",
        borderColor: "border-orange-200",
        textColor: "text-orange-800",
        iconColor: "text-orange-600",
        title: "Plano Gratuito Usado",
        message:
          "Você já usou seu plano gratuito. Compre prompts para gerar mais planos personalizados quando precisar!",
        actionText: "Comprar Prompts",
      };
    } else if (trialStatus.isPremium && trialStatus.plansRemaining === 0) {
      const daysUntilNext = trialStatus.daysUntilNextCycle || 0;
      return {
        type: "info",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
        textColor: "text-blue-800",
        iconColor: "text-blue-600",
        title: "Planos do Ciclo Esgotados",
        message: `Você usou os 2 planos deste ciclo. ${
          daysUntilNext > 0
            ? `Próximo ciclo em ${daysUntilNext} dias.`
            : "Novo ciclo disponível em breve!"
        }`,
        actionText: "Ver Planos",
      };
    } else {
      return {
        type: "info",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
        textColor: "text-blue-800",
        iconColor: "text-blue-600",
        title: "Informação",
        message: "Aproveite ao máximo seu plano atual!",
        actionText: "OK",
      };
    }
  };

  const alertConfig = getAlertType();

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      console.log("Comprar prompts clicked");
    }
  };

  return (
    <div
      className={`${alertConfig.bgColor} ${alertConfig.borderColor} border rounded-lg p-4 mb-6`}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {alertConfig.type === "error" || alertConfig.type === "urgent" ? (
            <svg
              className={`h-5 w-5 ${alertConfig.iconColor}`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg
              className={`h-5 w-5 ${alertConfig.iconColor}`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${alertConfig.textColor}`}>
            {alertConfig.title}
          </h3>
          <div className={`mt-1 text-sm ${alertConfig.textColor}`}>
            <p>{alertConfig.message}</p>
          </div>
          <div className="mt-3">
            <button
              onClick={handleUpgrade}
              className={`text-sm font-medium ${alertConfig.textColor} hover:underline focus:outline-none focus:underline`}
            >
              {alertConfig.actionText} →
            </button>
          </div>
        </div>
        <div className="ml-4 flex-shrink-0">
          <button
            className={`inline-flex ${alertConfig.textColor} hover:bg-${alertConfig.type}-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${alertConfig.type}-500 rounded-md p-1.5`}
            onClick={() => {
              // TODO: Implementar dismiss temporário
              console.log("Alert dismissed");
            }}
          >
            <span className="sr-only">Dismiss</span>
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
