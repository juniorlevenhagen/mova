interface EvolutionSectionProps {
  onAddEvolution: () => void;
  isAddingEvolution: boolean;
}

export function EvolutionSection({
  onAddEvolution,
  isAddingEvolution,
}: EvolutionSectionProps) {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 mt-8">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Sua Evolução</h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <h3 className="text-sm text-gray-600">Peso Atual</h3>
          <p className="text-2xl font-bold text-gray-800">75kg</p>
          <p className="text-xs text-green-600">-2kg este mês</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <h3 className="text-sm text-gray-600">Treinos/Semana</h3>
          <p className="text-2xl font-bold text-green-600">4</p>
          <p className="text-xs text-green-600">Meta atingida</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <h3 className="text-sm text-gray-600">Bem-estar</h3>
          <p className="text-2xl font-bold text-blue-600">4/5</p>
          <p className="text-xs text-blue-600">Muito bem</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <h3 className="text-sm text-gray-600">Sequência</h3>
          <p className="text-2xl font-bold text-gray-800">12 dias</p>
          <p className="text-xs text-gray-600">Última atualização</p>
        </div>
      </div>

      <div className="w-full h-40 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
        <span className="text-gray-400">[Gráfico de evolução aqui]</span>
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-5 gap-2 text-sm text-gray-700 items-center">
          <span>10/06/2024</span>
          <span>Peso: 75kg</span>
          <span>Treinos: 4</span>
          <span>Bem-estar: 4/5</span>
          <button className="text-blue-600 hover:text-blue-800 justify-self-end">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          </button>
        </div>
      </div>

      <button
        onClick={onAddEvolution}
        disabled={isAddingEvolution}
        className="mt-4 bg-green-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isAddingEvolution ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Salvando...
          </>
        ) : (
          "Adicionar Evolução"
        )}
      </button>
    </div>
  );
}
