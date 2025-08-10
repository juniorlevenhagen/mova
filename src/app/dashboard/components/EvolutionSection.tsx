import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

interface EvolutionSectionProps {
  onAddEvolution: () => void;
  isAddingEvolution: boolean;
}

export function EvolutionSection({
  onAddEvolution,
  isAddingEvolution,
}: EvolutionSectionProps) {
  // Dados do cadastro inicial (mockados por enquanto)
  const initialData = {
    date: "15/01/2024",
    peso: 80,
    percentualGordura: 25,
    massaMagra: 60,
    cintura: 85,
    quadril: 95,
    braco: 32,
    objetivo: "Emagrecimento",
    nivelAtividade: "Sedentário",
    bemEstar: 3,
    observacoes: "Iniciando treinos",
  };

  // Dados de evolução (mockados por enquanto)
  const evolutionData = [
    {
      date: "10/06/2024",
      peso: 75,
      percentualGordura: 20,
      massaMagra: 60,
      cintura: 80,
      quadril: 92,
      braco: 33,
      treinos: "4x por semana",
      objetivo: "Hipertrofia",
      nivelAtividade: "Moderado",
      bemEstar: 4,
      caloriasQueimadas: 2500,
      treinosConcluidos: 45,
      observacoes:
        "Treinos muito bons esta semana, sentindo mais força nos exercícios. Consegui aumentar a carga em alguns exercícios.",
    },
  ];

  // Dados atuais para os cards de resumo
  const currentData = {
    peso: 75,
    percentualGordura: 20,
    massaMagra: 60,
    treinosConcluidos: 45,
    caloriasQueimadas: 2500,
    sequencia: 12,
  };

  // Calcular variações
  const pesoVariacao = initialData.peso - currentData.peso;
  const gorduraVariacao =
    initialData.percentualGordura - currentData.percentualGordura;
  const massaVariacao = currentData.massaMagra - initialData.massaMagra;

  // Feedback motivacional baseado nos dados
  const getMotivationalMessage = () => {
    if (pesoVariacao > 0) {
      return "Parabéns! Você perdeu peso de forma consistente!";
    } else if (gorduraVariacao > 0) {
      return "Excelente! Redução significativa no percentual de gordura!";
    } else if (currentData.treinosConcluidos >= 40) {
      return "Incrível! Você já completou mais de 40 treinos!";
    } else {
      return "Continue assim! Seu progresso está sendo consistente!";
    }
  };

  // Badges para marcos
  const getBadges = () => {
    const badges = [];
    if (currentData.treinosConcluidos >= 50) {
      badges.push({
        text: "50+ Treinos",
        color: "bg-purple-100 text-purple-800",
      });
    }
    if (pesoVariacao >= 5) {
      badges.push({
        text: "5kg Perdidos",
        color: "bg-green-100 text-green-800",
      });
    }
    if (currentData.sequencia >= 10) {
      badges.push({
        text: "10+ Dias Seguidos",
        color: "bg-blue-100 text-blue-800",
      });
    }
    return badges;
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 mt-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-800">Sua Evolução</h2>

        {/* Filtros de período */}
        <div className="flex gap-2">
          <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg">
            Semanal
          </button>
          <button className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
            Mensal
          </button>
        </div>
      </div>

      {/* Feedback Motivacional */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-medium text-green-800">
              {getMotivationalMessage()}
            </p>
            <div className="flex gap-2 mt-2">
              {getBadges().map((badge, index) => (
                <span
                  key={index}
                  className={`text-xs px-2 py-1 rounded-full ${badge.color}`}
                >
                  {badge.text}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Seção: Peso e Composição Corporal */}
      <div className="mb-6">
        <h3 className="text-md font-semibold text-gray-800 mb-3">
          Peso e Composição Corporal
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg text-center border border-blue-200">
            <h4 className="text-sm text-gray-600 mb-1">Peso Atual</h4>
            <p className="text-2xl font-bold text-blue-800">
              {currentData.peso}kg
            </p>
            <p
              className={`text-xs ${
                pesoVariacao > 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {pesoVariacao > 0
                ? `-${pesoVariacao}kg`
                : `+${Math.abs(pesoVariacao)}kg`}{" "}
              desde o início
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg text-center border border-green-200">
            <h4 className="text-sm text-gray-600 mb-1">% Gordura</h4>
            <p className="text-2xl font-bold text-green-800">
              {currentData.percentualGordura}%
            </p>
            <p className="text-xs text-green-600">
              -{gorduraVariacao}% desde o início
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg text-center border border-purple-200">
            <h4 className="text-sm text-gray-600 mb-1">Massa Magra</h4>
            <p className="text-2xl font-bold text-purple-800">
              {currentData.massaMagra}kg
            </p>
            <p className="text-xs text-purple-600">
              +{massaVariacao}kg desde o início
            </p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg text-center border border-orange-200">
            <h4 className="text-sm text-gray-600 mb-1">IMC</h4>
            <p className="text-2xl font-bold text-orange-800">
              {((currentData.peso / Math.pow(1.78, 2)) * 100).toFixed(1)}
            </p>
            <p className="text-xs text-green-600">Peso normal</p>
          </div>
        </div>
      </div>

      {/* Seção: Atividade */}
      <div className="mb-6">
        <h3 className="text-md font-semibold text-gray-800 mb-3">Atividade</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-lg text-center border border-indigo-200">
            <h4 className="text-sm text-gray-600 mb-1">Treinos Concluídos</h4>
            <p className="text-2xl font-bold text-indigo-800">
              {currentData.treinosConcluidos}
            </p>
            <p className="text-xs text-indigo-600">Total acumulado</p>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg text-center border border-red-200">
            <h4 className="text-sm text-gray-600 mb-1">Calorias Queimadas</h4>
            <p className="text-2xl font-bold text-red-800">
              {currentData.caloriasQueimadas} kcal
            </p>
            <p className="text-xs text-red-600">Esta semana</p>
          </div>

          <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-4 rounded-lg text-center border border-teal-200">
            <h4 className="text-sm text-gray-600 mb-1">Sequência Atual</h4>
            <p className="text-2xl font-bold text-teal-800">
              {currentData.sequencia} dias
            </p>
            <p className="text-xs text-teal-600">Treinos consecutivos</p>
          </div>
        </div>
      </div>

      {/* Gráficos Interativos */}
      <div className="mb-6">
        <h3 className="text-md font-semibold text-gray-800 mb-3">
          Gráficos de Evolução
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Gráfico de Linha: Evolução do Peso e Cintura */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <h4 className="text-sm font-medium text-gray-800 mb-3 flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              Evolução do Peso e Cintura
            </h4>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart
                data={[
                  { data: "15/01", peso: 80, cintura: 85 },
                  { data: "01/02", peso: 79, cintura: 84 },
                  { data: "15/02", peso: 78, cintura: 83 },
                  { data: "01/03", peso: 77, cintura: 82 },
                  { data: "15/03", peso: 76, cintura: 81 },
                  { data: "01/04", peso: 75, cintura: 80 },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="data" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="peso"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  name="Peso (kg)"
                  dot={{ fill: "#3B82F6", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: "#3B82F6", strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="cintura"
                  stroke="#10B981"
                  strokeWidth={3}
                  name="Cintura (cm)"
                  dot={{ fill: "#10B981", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: "#10B981", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfico de Pizza: Composição Corporal */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <h4 className="text-sm font-medium text-gray-800 mb-3 flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              Composição Corporal Atual
            </h4>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={[
                    {
                      name: "Massa Magra",
                      value: currentData.massaMagra,
                      color: "#3B82F6",
                    },
                    {
                      name: "Gordura",
                      value: currentData.peso - currentData.massaMagra,
                      color: "#EF4444",
                    },
                  ]}
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  innerRadius={30}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`
                  }
                  labelLine={false}
                >
                  {[
                    {
                      name: "Massa Magra",
                      value: currentData.massaMagra,
                      color: "#3B82F6",
                    },
                    {
                      name: "Gordura",
                      value: currentData.peso - currentData.massaMagra,
                      color: "#EF4444",
                    },
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfico de Barras: Treinos Concluídos por Semana */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <h4 className="text-sm font-medium text-gray-800 mb-3 flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              Treinos Concluídos por Semana
            </h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={[
                  { semana: "Sem 1", treinos: 4, meta: 5 },
                  { semana: "Sem 2", treinos: 5, meta: 5 },
                  { semana: "Sem 3", treinos: 3, meta: 5 },
                  { semana: "Sem 4", treinos: 6, meta: 5 },
                  { semana: "Sem 5", treinos: 4, meta: 5 },
                  { semana: "Sem 6", treinos: 5, meta: 5 },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="semana" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Legend />
                <Bar
                  dataKey="treinos"
                  fill="#8B5CF6"
                  radius={[4, 4, 0, 0]}
                  name="Treinos Realizados"
                />
                <Bar
                  dataKey="meta"
                  fill="#E5E7EB"
                  radius={[4, 4, 0, 0]}
                  name="Meta Semanal"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfico de Área: Progresso em Relação à Meta */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <h4 className="text-sm font-medium text-gray-800 mb-3 flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              Progresso em Relação à Meta
            </h4>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart
                data={[
                  { mes: "Jan", atual: 80, meta: 75 },
                  { mes: "Fev", atual: 78, meta: 74 },
                  { mes: "Mar", atual: 76, meta: 73 },
                  { mes: "Abr", atual: 75, meta: 72 },
                  { mes: "Mai", atual: 74, meta: 71 },
                  { mes: "Jun", atual: 73, meta: 70 },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mes" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="atual"
                  stroke="#F59E0B"
                  fill="#FEF3C7"
                  strokeWidth={2}
                  name="Peso Atual"
                />
                <Area
                  type="monotone"
                  dataKey="meta"
                  stroke="#10B981"
                  fill="#D1FAE5"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Meta"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Histórico Detalhado */}
      <div className="mb-4">
        <h3 className="text-md font-semibold text-gray-800 mb-3">
          Histórico Detalhado
        </h3>
        <div className="space-y-4">
          {/* Dados do cadastro inicial */}
          <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-blue-800">
                {initialData.date} (Cadastro Inicial)
              </h4>
              <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                Início
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Peso:</span>
                <span className="font-medium ml-1">{initialData.peso}kg</span>
              </div>
              <div>
                <span className="text-gray-600">% Gordura:</span>
                <span className="font-medium ml-1">
                  {initialData.percentualGordura}%
                </span>
              </div>
              <div>
                <span className="text-gray-600">Massa Magra:</span>
                <span className="font-medium ml-1">
                  {initialData.massaMagra}kg
                </span>
              </div>
              <div>
                <span className="text-gray-600">Cintura:</span>
                <span className="font-medium ml-1">
                  {initialData.cintura}cm
                </span>
              </div>
              <div>
                <span className="text-gray-600">Objetivo:</span>
                <span className="font-medium ml-1">{initialData.objetivo}</span>
              </div>
              <div>
                <span className="text-gray-600">Nível:</span>
                <span className="font-medium ml-1">
                  {initialData.nivelAtividade}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Bem-estar:</span>
                <span className="font-medium ml-1">
                  {initialData.bemEstar}/5
                </span>
              </div>
            </div>
            {initialData.observacoes && (
              <p className="text-sm text-gray-700 mt-2 italic">
                &ldquo;{initialData.observacoes}&rdquo;
              </p>
            )}
          </div>

          {/* Evoluções adicionadas */}
          {evolutionData.map((evolution, index) => (
            <div
              key={index}
              className="border-l-4 border-green-500 bg-green-50 p-4 rounded-r-lg"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-green-800">{evolution.date}</h4>
                <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                  Evolução
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Peso:</span>
                  <span className="font-medium ml-1">{evolution.peso}kg</span>
                  <span className="text-xs text-green-600 ml-1">(-5kg)</span>
                </div>
                <div>
                  <span className="text-gray-600">% Gordura:</span>
                  <span className="font-medium ml-1">
                    {evolution.percentualGordura}%
                  </span>
                  <span className="text-xs text-green-600 ml-1">(-5%)</span>
                </div>
                <div>
                  <span className="text-gray-600">Massa Magra:</span>
                  <span className="font-medium ml-1">
                    {evolution.massaMagra}kg
                  </span>
                  <span className="text-xs text-green-600 ml-1">(+0kg)</span>
                </div>
                <div>
                  <span className="text-gray-600">Cintura:</span>
                  <span className="font-medium ml-1">
                    {evolution.cintura}cm
                  </span>
                  <span className="text-xs text-green-600 ml-1">(-5cm)</span>
                </div>
                <div>
                  <span className="text-gray-600">Treinos:</span>
                  <span className="font-medium ml-1">{evolution.treinos}</span>
                  <span className="text-xs text-green-600 ml-1">(+2x)</span>
                </div>
                <div>
                  <span className="text-gray-600">Objetivo:</span>
                  <span className="font-medium ml-1">{evolution.objetivo}</span>
                </div>
                <div>
                  <span className="text-gray-600">Nível:</span>
                  <span className="font-medium ml-1">
                    {evolution.nivelAtividade}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Bem-estar:</span>
                  <span className="font-medium ml-1">
                    {evolution.bemEstar}/5
                  </span>
                  <span className="text-xs text-green-600 ml-1">(+1)</span>
                </div>
              </div>
              {evolution.observacoes && (
                <p className="text-sm text-gray-700 mt-2 italic">
                  &ldquo;{evolution.observacoes}&rdquo;
                </p>
              )}
            </div>
          ))}
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
