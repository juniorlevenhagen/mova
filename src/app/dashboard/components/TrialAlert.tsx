"use client";

import { TrialStatus } from "@/hooks/useTrial";

interface TrialAlertProps {
  trialStatus: TrialStatus;
  onUpgrade?: () => void;
}

export function TrialAlert({ trialStatus, onUpgrade }: TrialAlertProps) {
  const shouldShowAlert =
    trialStatus.hasUsedFreePlan && trialStatus.availablePrompts === 0;

  if (!shouldShowAlert) {
    return null;
  }

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      console.log("Comprar prompts clicked");
    }
  };

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <svg
            className="w-6 h-6 text-orange-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-orange-800 font-medium mb-1">
            Plano Grátis Utilizado
          </h3>
          <p className="text-orange-700 text-sm mb-3">
            Você já utilizou seu plano personalizado gratuito. Compre prompts
            para gerar novos planos quando quiser.
          </p>
          <button
            onClick={handleUpgrade}
            className="bg-black hover:bg-gray-900 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
          >
            Comprar Prompts
          </button>
        </div>
      </div>
    </div>
  );
}
