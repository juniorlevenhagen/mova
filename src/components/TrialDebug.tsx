// Componente temporário para debug do trial status
// REMOVER APÓS RESOLVER O PROBLEMA

"use client";

import { TrialStatus } from "@/hooks/useTrial";

interface TrialDebugProps {
  trialStatus: TrialStatus;
}

export function TrialDebug({ trialStatus }: TrialDebugProps) {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
      <h3 className="text-lg font-semibold text-yellow-800 mb-2">
        🐛 DEBUG - Trial Status
      </h3>
      <div className="text-sm text-yellow-700 space-y-1">
        <div>
          <strong>canGenerate:</strong>{" "}
          {trialStatus.canGenerate ? "✅ true" : "❌ false"}
        </div>
        <div>
          <strong>isNewUser:</strong>{" "}
          {trialStatus.isNewUser ? "✅ true" : "❌ false"}
        </div>
        <div>
          <strong>hasUsedFreePlan:</strong>{" "}
          {trialStatus.hasUsedFreePlan ? "✅ true" : "❌ false"}
        </div>
        <div>
          <strong>availablePrompts:</strong> {trialStatus.availablePrompts}
        </div>
        <div>
          <strong>plansRemaining:</strong> {trialStatus.plansRemaining}
        </div>
        <div>
          <strong>message:</strong> &quot;{trialStatus.message}&quot;
        </div>
      </div>
      <div className="mt-2 text-xs text-yellow-600">
        Este componente é temporário para debug. Remover após resolver o
        problema.
      </div>
    </div>
  );
}
