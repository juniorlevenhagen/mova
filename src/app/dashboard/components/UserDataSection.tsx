interface UserDataSectionProps {
  profile: {
    altura: number;
    peso: number;
    sexo: string;
    frequenciaTreinos: string;
    objetivo: string;
  };
  onGeneratePlan: () => void;
  isGeneratingPlan: boolean;
}

export function UserDataSection({
  profile,
  onGeneratePlan,
  isGeneratingPlan,
}: UserDataSectionProps) {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Seus Dados</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <span className="block text-gray-500 text-sm">Altura</span>
          <span className="block text-gray-800 font-bold">
            {profile.altura} cm
          </span>
        </div>
        <div>
          <span className="block text-gray-500 text-sm">Peso</span>
          <span className="block text-gray-800 font-bold">
            {profile.peso} kg
          </span>
        </div>
        <div>
          <span className="block text-gray-500 text-sm">IMC</span>
          <span className="block text-gray-800 font-bold">23.7</span>
          <span className="block text-xs text-green-600">Peso normal</span>
        </div>
        <div>
          <span className="block text-gray-500 text-sm">Sexo</span>
          <span className="block text-gray-800 font-bold">{profile.sexo}</span>
        </div>
        <div>
          <span className="block text-gray-500 text-sm">
            Frequência de Treinos
          </span>
          <span className="block text-gray-800 font-bold">
            {profile.frequenciaTreinos}
          </span>
        </div>
        <div>
          <span className="block text-gray-500 text-sm">Objetivo</span>
          <span className="block text-gray-800 font-bold">
            {profile.objetivo}
          </span>
        </div>
        <div>
          <span className="block text-gray-500 text-sm">
            Caloria Basal Estimada
          </span>
          <span className="block text-gray-800 font-bold">1.850 kcal</span>
        </div>
        <div>
          <span className="block text-gray-500 text-sm">Idade</span>
          <span className="block text-gray-800 font-bold">28 anos</span>
        </div>
        <div>
          <span className="block text-gray-500 text-sm">
            Nível de Atividade
          </span>
          <span className="block text-gray-800 font-bold">Moderado</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mt-8">
        <button
          onClick={onGeneratePlan}
          disabled={isGeneratingPlan}
          className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isGeneratingPlan ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Gerando Plano...
            </>
          ) : (
            "Gerar Plano Personalizado (Treino + Dieta)"
          )}
        </button>
      </div>
    </div>
  );
}
