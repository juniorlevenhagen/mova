// Componente temporário para debug do trial status
// REMOVER APÓS RESOLVER O PROBLEMA

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
          <strong>isPremium:</strong>{" "}
          {trialStatus.isPremium ? "✅ true" : "❌ false"}
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
          <strong>plansRemaining:</strong> {trialStatus.plansRemaining}
        </div>
        <div>
          <strong>message:</strong> "{trialStatus.message}"
        </div>
        {trialStatus.daysUntilNextCycle && (
          <div>
            <strong>daysUntilNextCycle:</strong>{" "}
            {trialStatus.daysUntilNextCycle}
          </div>
        )}
        {trialStatus.cycleDays && (
          <div>
            <strong>cycleDays:</strong> {trialStatus.cycleDays}
          </div>
        )}
      </div>
      <div className="mt-2 text-xs text-yellow-600">
        Este componente é temporário para debug. Remover após resolver o
        problema.
      </div>
    </div>
  );
}
