interface TrialSectionProps {
  trial: {
    diasRestantes: number;
    totalDias: number;
    requisicoesRestantes: number;
    totalRequisicoes: number;
  };
  trialPercent: number;
}

export function TrialSection({ trial, trialPercent }: TrialSectionProps) {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 mb-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-2">
        Seu Período de Teste
      </h2>
      <div className="flex flex-col md:flex-row md:items-center md:gap-8 gap-2 mb-2">
        <span className="text-gray-700 text-base">
          ⏱ Faltam <span className="font-bold">{trial.diasRestantes}</span> dias
          do seu teste gratuito.
        </span>
        <span className="text-gray-700 text-base">
          🧠 Você pode gerar mais{" "}
          <span className="font-bold">{trial.requisicoesRestantes}</span> planos
          personalizados.
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
        <div
          className="bg-green-500 h-3 rounded-full transition-all"
          style={{ width: `${trialPercent}%` }}
        />
      </div>
      <p className="text-sm text-gray-600 mt-2">
        Aproveite o máximo durante esse período!
      </p>
    </div>
  );
}
