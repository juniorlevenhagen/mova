interface TrialSectionProps {
  trial: {
    diasRestantes: number;
    totalDias: number;
    requisicoesRestantes: number;
    totalRequisicoes: number;
  };
  trialPercent: number;
  onUpgrade?: () => void;
  isPremium?: boolean;
}

export function TrialSection({
  trial,
  trialPercent,
  onUpgrade,
  isPremium = false,
}: TrialSectionProps) {
  const hasUsedFreePlan = trial.requisicoesRestantes === 0;

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 mb-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        {isPremium ? "Seu Plano Premium" : "Seu Período de Teste"}
      </h2>

      {isPremium ? (
        // Usuário Premium
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-green-600">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-medium">Plano Premium Ativo</span>
          </div>
          <p className="text-gray-700">
            Você pode gerar até 2 planos personalizados por mês!
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-green-800 text-sm">
              <span className="font-medium">{trial.requisicoesRestantes}</span>{" "}
              de 2 planos disponíveis este mês
            </p>
          </div>
        </div>
      ) : (
        // Usuário em Trial
        <div className="space-y-4">
          {hasUsedFreePlan ? (
            // Usou o plano grátis
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
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
                    Você já utilizou seu plano personalizado gratuito. Faça
                    upgrade para gerar 2 planos por mês!
                  </p>
                  <button
                    onClick={onUpgrade}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    Upgrade para Premium - R$ 29,90/mês
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // Ainda tem plano grátis
            <div className="space-y-3">
              <div className="flex flex-col md:flex-row md:items-center md:gap-8 gap-2">
                <span className="text-gray-700 text-base">
                  Faltam{" "}
                  <span className="font-bold text-blue-600">
                    {trial.diasRestantes}
                  </span>{" "}
                  dias do seu teste gratuito.
                </span>
                <span className="text-gray-700 text-base">
                  Você pode gerar mais{" "}
                  <span className="font-bold text-green-600">
                    {trial.requisicoesRestantes}
                  </span>{" "}
                  plano
                  {trial.requisicoesRestantes !== 1 ? "s" : ""} personalizado
                  {trial.requisicoesRestantes !== 1 ? "s" : ""}.
                </span>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full transition-all"
                  style={{ width: `${trialPercent}%` }}
                />
              </div>

              <p className="text-sm text-gray-600">
                Aproveite o máximo durante esse período!
              </p>

              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-2">
                  Após usar seu plano grátis, faça upgrade para continuar:
                </p>
                <button
                  onClick={onUpgrade}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Ver Planos Premium
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
