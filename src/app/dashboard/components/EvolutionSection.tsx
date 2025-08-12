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

interface UserEvolution {
  id: string;
  user_id: string;
  date: string;
  peso: number;
  percentual_gordura?: number;
  massa_magra?: number;
  cintura?: number;
  quadril?: number;
  braco?: number;
  objetivo?: string;
  nivel_atividade?: string;
  bem_estar: number;
  observacoes: string;
  created_at: string;
  updated_at: string;
}

interface EvolutionSectionProps {
  evolutions: UserEvolution[];
  onAddEvolution: () => void;
  isAddingEvolution: boolean;
  userProfile?: {
    altura: number;
    peso: number; // Peso atual
    pesoInicial: number; // Peso inicial
    sexo: string;
    frequenciaTreinos: string;
    objetivo: string;
    idade?: number;
    nivelAtividade: string;
  };
}

export function EvolutionSection({
  evolutions,
  onAddEvolution,
  isAddingEvolution,
  userProfile,
}: EvolutionSectionProps) {
  // Função para calcular massa magra estimada usando fórmula de Boer
  const calcularMassaMagraEstimada = (
    peso: number,
    altura: number,
    sexo: string
  ) => {
    if (peso <= 0 || altura <= 0) return null;

    // Fórmula de Boer
    if (sexo.toLowerCase() === "masculino" || sexo.toLowerCase() === "m") {
      return Number((0.407 * peso + 0.267 * altura - 19.2).toFixed(1));
    } else {
      return Number((0.252 * peso + 0.473 * altura - 48.3).toFixed(1));
    }
  };

  // Dados do cadastro inicial (usando dados reais do perfil)
  const initialData = {
    date: "15/01/2024",
    peso: userProfile?.pesoInicial || 0,
    percentualGordura: null, // Não temos dados reais de % gordura no cadastro
    massaMagra:
      userProfile?.pesoInicial && userProfile?.altura && userProfile?.sexo
        ? calcularMassaMagraEstimada(
            userProfile.pesoInicial,
            userProfile.altura,
            userProfile.sexo
          )
        : null, // Estimativa usando fórmula de Boer
    cintura: null, // Não temos dados reais de cintura no cadastro
    quadril: null, // Não temos dados reais de quadril no cadastro
    braco: null, // Não temos dados reais de braço no cadastro
    objetivo: userProfile?.objetivo || null,
    nivelAtividade: userProfile?.nivelAtividade || null,
    bemEstar: null, // Não temos dados reais de bem-estar no cadastro
    observacoes: "Dados do cadastro inicial",
  };

  // Dados atuais (última evolução ou dados iniciais)
  const currentData =
    evolutions.length > 0
      ? {
          peso: evolutions[evolutions.length - 1].peso, // Última evolução (mais recente)
          percentualGordura:
            evolutions[evolutions.length - 1].percentual_gordura || 20,
          massaMagra: evolutions[evolutions.length - 1].massa_magra || 60,
          treinosConcluidos: evolutions.length * 4, // Simulação baseada no número de evoluções
          caloriasQueimadas: evolutions.length * 500, // Simulação
          sequencia: evolutions.length,
        }
      : {
          peso: initialData.peso,
          percentualGordura: initialData.percentualGordura,
          massaMagra: initialData.massaMagra,
          treinosConcluidos: 0,
          caloriasQueimadas: 0,
          sequencia: 0,
        };

  // Função para formatar valores ou mostrar "-"
  const formatValue = (value: number | string | null, unit: string = "") => {
    if (value === null || value === undefined || value === 0) {
      return "-";
    }
    return `${value}${unit}`;
  };

  // Função para calcular último % gordura e diferença
  const getUltimoPercentualGordura = () => {
    // Filtrar evoluções que têm percentual_gordura
    const evolucoesComGordura = evolutions.filter(
      (evo) => evo.percentual_gordura && evo.percentual_gordura > 0
    );

    if (evolucoesComGordura.length === 0) {
      return { valor: null, diferenca: null, texto: "-", cor: "text-gray-600" };
    }

    const ultimoValor =
      evolucoesComGordura[evolucoesComGordura.length - 1]?.percentual_gordura;

    if (!ultimoValor) {
      return { valor: null, diferenca: null, texto: "-", cor: "text-gray-600" };
    }

    if (evolucoesComGordura.length === 1) {
      // Primeira medição de gordura
      return {
        valor: ultimoValor,
        diferenca: null,
        texto: `${ultimoValor}%`,
        cor: "text-green-600",
      };
    }

    // Calcular diferença em relação à medição anterior
    const valorAnterior =
      evolucoesComGordura[evolucoesComGordura.length - 2]?.percentual_gordura;

    if (!valorAnterior) {
      return {
        valor: ultimoValor,
        diferenca: null,
        texto: `${ultimoValor}%`,
        cor: "text-green-600",
      };
    }

    const diferenca = ultimoValor - valorAnterior;

    const sign = diferenca > 0 ? "+" : "-";
    const diferencaAbsoluta = Math.abs(diferenca);
    const cor =
      diferenca < 0
        ? "text-green-600"
        : diferenca > 0
        ? "text-red-600"
        : "text-gray-600";

    return {
      valor: ultimoValor,
      diferenca: diferenca,
      texto: `${ultimoValor}% (${sign}${diferencaAbsoluta}%)`,
      cor: cor,
    };
  };

  // Calcular dados de gordura uma única vez para evitar recálculos
  const gorduraData = getUltimoPercentualGordura();

  // Calcular variações (apenas se temos dados reais)
  const pesoVariacao =
    initialData.peso > 0 ? initialData.peso - currentData.peso : 0;
  const gorduraVariacao =
    initialData.percentualGordura && currentData.percentualGordura
      ? initialData.percentualGordura - currentData.percentualGordura
      : 0;
  const massaVariacao =
    initialData.massaMagra && currentData.massaMagra
      ? currentData.massaMagra - initialData.massaMagra
      : 0;

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

  // Função para calcular diferença e formatar
  const calculateDifference = (
    initial: number,
    current: number,
    unit: string
  ) => {
    const diff = current - initial;
    if (diff === 0) return `${current}${unit}`;

    const sign = diff > 0 ? "+" : "-";
    const formattedDiff = Math.abs(diff);

    return `${current}${unit} (${sign}${formattedDiff}${unit})`;
  };

  // Função para calcular diferença percentual com cores para gordura
  const calculatePercentageDifference = (
    initial: number,
    current: number,
    isFat: boolean = false
  ) => {
    const diff = current - initial;
    if (diff === 0) return `${current}%`;

    const sign = diff > 0 ? "+" : "-"; // Corrigir: sempre mostrar o sinal
    const formattedDiff = Math.abs(diff);

    if (isFat) {
      // Para gordura: verde quando diminui (negativo), vermelho quando aumenta (positivo)
      const colorClass = diff < 0 ? "text-green-600" : "text-red-600";
      return (
        <span>
          {current}%{" "}
          <span className={colorClass}>
            ({sign}
            {formattedDiff}%)
          </span>
        </span>
      );
    }

    return `${current}% (${sign}${formattedDiff}%)`;
  };

  // Função para normalizar dados de referência
  const normalizeReferenceData = (
    referenceData: UserEvolution | typeof initialData
  ) => {
    if ("percentual_gordura" in referenceData) {
      // É um UserEvolution
      return {
        peso: referenceData.peso,
        percentualGordura: referenceData.percentual_gordura,
        massaMagra: referenceData.massa_magra,
        cintura: referenceData.cintura,
      };
    } else {
      // É initialData
      const initialDataRef = referenceData as typeof initialData;
      return {
        peso: initialDataRef.peso,
        percentualGordura: initialDataRef.percentualGordura,
        massaMagra: initialDataRef.massaMagra,
        cintura: initialDataRef.cintura,
      };
    }
  };

  // Função para calcular IMC
  const calculateIMC = (peso: number, altura: number) => {
    if (peso <= 0 || altura <= 0) return null;
    const alturaEmMetros = altura / 100; // Converter cm para metros
    return Number((peso / (alturaEmMetros * alturaEmMetros)).toFixed(1));
  };

  // Função para obter classificação do IMC
  const getIMCClassification = (imc: number) => {
    if (imc < 18.5) return "Abaixo do peso";
    if (imc < 25) return "Peso normal";
    if (imc < 30) return "Sobrepeso";
    if (imc < 35) return "Obesidade grau I";
    if (imc < 40) return "Obesidade grau II";
    return "Obesidade grau III";
  };

  // Calcular IMC atual
  const imcAtual = calculateIMC(currentData.peso, userProfile?.altura || 0);

  // Função para preparar dados do gráfico com dados reais
  const prepareChartData = () => {
    const chartData = [];

    // Adicionar dados do cadastro inicial se existir
    if (userProfile?.pesoInicial && userProfile.pesoInicial > 0) {
      chartData.push({
        data: "Início",
        peso: userProfile.pesoInicial,
        cintura: null, // Não temos cintura inicial
        date: "Início",
      });
    }

    // Adicionar dados das evoluções
    evolutions.forEach((evolution, index) => {
      const date = new Date(evolution.date);
      const formattedDate = date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      });

      chartData.push({
        data: formattedDate,
        peso: evolution.peso,
        cintura: evolution.cintura || null,
        date: evolution.date,
        evolutionIndex: index + 1,
      });
    });

    return chartData;
  };

  // Obter dados do gráfico
  const chartData = prepareChartData();

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
              {gorduraData.texto}
            </p>
            <p className={`text-xs ${gorduraData.cor}`}>
              {gorduraData.valor
                ? gorduraData.diferenca === null
                  ? "Primeira medição"
                  : gorduraData.diferenca < 0
                  ? "Redução na gordura"
                  : gorduraData.diferenca > 0
                  ? "Aumento na gordura"
                  : "Sem mudança"
                : "Não medido ainda"}
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg text-center border border-purple-200">
            <h4 className="text-sm text-gray-600 mb-1">Massa Magra</h4>
            <p className="text-2xl font-bold text-purple-800">
              {currentData.massaMagra}kg
            </p>
            <p className="text-xs text-purple-600">
              +{massaVariacao.toFixed(2)}kg desde o início
            </p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg text-center border border-orange-200">
            <h4 className="text-sm text-gray-600 mb-1">IMC</h4>
            <p className="text-2xl font-bold text-orange-800">
              {imcAtual ? imcAtual.toFixed(2) : "-"}
            </p>
            <p className="text-xs text-green-600">
              {imcAtual
                ? getIMCClassification(imcAtual)
                : "Altura não informada"}
            </p>
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
        <div className="grid grid-cols-1 gap-6">
          {/* Gráfico de Linha: Evolução do Peso e Cintura */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <h4 className="text-sm font-medium text-gray-800 mb-3 flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              Evolução do Peso e Cintura
            </h4>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="data"
                  stroke="#6b7280"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                  formatter={(value, name) => {
                    if (name === "peso") return [`${value} kg`, "Peso"];
                    if (name === "cintura") return [`${value} cm`, "Cintura"];
                    return [value, name];
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
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="cintura"
                  stroke="#10B981"
                  strokeWidth={3}
                  name="Cintura (cm)"
                  dot={{ fill: "#10B981", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: "#10B981", strokeWidth: 2 }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>

            {/* Mensagem quando não há dados */}
            {chartData.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>Nenhum dado de evolução disponível.</p>
                <p className="text-sm">
                  Adicione sua primeira evolução para ver o gráfico!
                </p>
              </div>
            )}
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
                      value: currentData.massaMagra || 0,
                      color: "#3B82F6",
                    },
                    {
                      name: "Gordura",
                      value: currentData.percentualGordura
                        ? (currentData.peso * currentData.percentualGordura) /
                          100
                        : 0,
                      color: "#EF4444",
                    },
                  ]}
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  innerRadius={30}
                  dataKey="value"
                  label={({ name }) => {
                    if (name === "Gordura" && currentData.percentualGordura) {
                      return `${name} ${currentData.percentualGordura}%`;
                    }
                    if (name === "Massa Magra" && currentData.massaMagra) {
                      const percentualMassaMagra = (
                        (currentData.massaMagra / currentData.peso) *
                        100
                      ).toFixed(0);
                      return `${name} ${percentualMassaMagra}%`;
                    }
                    return `${name} 0%`;
                  }}
                  labelLine={false}
                >
                  {[
                    {
                      name: "Massa Magra",
                      value: currentData.massaMagra || 0,
                      color: "#3B82F6",
                    },
                    {
                      name: "Gordura",
                      value: currentData.percentualGordura
                        ? (currentData.peso * currentData.percentualGordura) /
                          100
                        : 0,
                      color: "#EF4444",
                    },
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white border border-gray-200 rounded-lg p-2 shadow-lg">
                          {payload.map((entry, index) => (
                            <p
                              key={index}
                              className="text-sm"
                              style={{ color: entry.color }}
                            >
                              {entry.name}: {entry.value?.toFixed(1)}kg
                            </p>
                          ))}
                        </div>
                      );
                    }
                    return null;
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
                <span className="font-medium ml-1">
                  {formatValue(initialData.peso, "kg")}
                </span>
              </div>
              <div>
                <span className="text-gray-600">% Gordura:</span>
                <span className="font-medium ml-1">
                  {formatValue(initialData.percentualGordura, "%")}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Massa Magra:</span>
                <span className="font-medium ml-1">
                  {formatValue(initialData.massaMagra, "kg")}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Cintura:</span>
                <span className="font-medium ml-1">
                  {formatValue(initialData.cintura, "cm")}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Objetivo:</span>
                <span className="font-medium ml-1">
                  {initialData.objetivo || "-"}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Nível:</span>
                <span className="font-medium ml-1">
                  {initialData.nivelAtividade || "-"}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Bem-estar:</span>
                <span className="font-medium ml-1">
                  {initialData.bemEstar ? `${initialData.bemEstar}/5` : "-"}
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
          {evolutions.length > 0 ? (
            evolutions.map((evolution, index) => {
              const referenceData =
                index === 0
                  ? initialData // Evolução #1 compara com Cadastro Inicial
                  : evolutions[index - 1]; // Outras evoluções comparam com a anterior

              const normalizedRef = normalizeReferenceData(referenceData);

              return (
                <div
                  key={evolution.id}
                  className="border-l-4 border-green-500 bg-green-50 p-4 rounded-r-lg mb-4"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-800">
                        Evolução #{index + 1}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {new Date(evolution.date).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      {index === 0
                        ? calculateDifference(
                            normalizedRef.peso,
                            evolution.peso,
                            "kg"
                          )
                        : calculateDifference(
                            normalizedRef.peso,
                            evolution.peso,
                            "kg"
                          )}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Peso:</span>
                      <span className="font-medium ml-1">
                        {calculateDifference(
                          normalizedRef.peso,
                          evolution.peso,
                          "kg"
                        )}
                      </span>
                    </div>
                    {evolution.percentual_gordura && (
                      <div>
                        <span className="text-gray-600">% Gordura:</span>
                        <span className="font-medium ml-1">
                          {index === 0
                            ? calculatePercentageDifference(
                                normalizedRef.percentualGordura || 25,
                                evolution.percentual_gordura,
                                true // isFat = true para aplicar cores
                              )
                            : calculatePercentageDifference(
                                normalizedRef.percentualGordura || 25,
                                evolution.percentual_gordura,
                                true // isFat = true para aplicar cores
                              )}
                        </span>
                      </div>
                    )}
                    {evolution.massa_magra && (
                      <div>
                        <span className="text-gray-600">Massa Magra:</span>
                        <span className="font-medium ml-1">
                          {calculateDifference(
                            normalizedRef.massaMagra || 60,
                            evolution.massa_magra,
                            "kg"
                          )}
                        </span>
                      </div>
                    )}
                    {evolution.cintura && (
                      <div>
                        <span className="text-gray-600">Cintura:</span>
                        <span className="font-medium ml-1">
                          {calculateDifference(
                            normalizedRef.cintura || 85,
                            evolution.cintura,
                            "cm"
                          )}
                        </span>
                      </div>
                    )}
                    {evolution.objetivo && (
                      <div>
                        <span className="text-gray-600">Objetivo:</span>
                        <span className="font-medium ml-1">
                          {evolution.objetivo}
                        </span>
                      </div>
                    )}
                    {evolution.nivel_atividade && (
                      <div>
                        <span className="text-gray-600">Nível:</span>
                        <span className="font-medium ml-1">
                          {evolution.nivel_atividade}
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-600">Bem-estar:</span>
                      <span className="font-medium ml-1">
                        {evolution.bem_estar}/5
                      </span>
                    </div>
                  </div>

                  {evolution.observacoes && (
                    <div className="mt-3 p-3 bg-white rounded-lg">
                      <p className="text-sm text-gray-700">
                        {evolution.observacoes}
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Nenhuma evolução registrada ainda.</p>
              <p className="text-sm">
                Adicione sua primeira evolução para começar a acompanhar seu
                progresso!
              </p>
            </div>
          )}
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
