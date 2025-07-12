"use client";

import { SignupData } from "../SignupForm";

interface Step2Props {
  data: SignupData;
  updateData: (data: Partial<SignupData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const objectives = [
  { value: "emagrecer", label: "Emagrecer" },
  { value: "ganho_massa", label: "Ganho de massa" },
  { value: "definicao", label: "Definição" },
  { value: "saude_cardiovascular", label: "Melhor saúde cardiovascular" },
];

const activityLevels = [
  { value: "iniciante", label: "Iniciante" },
  { value: "intermediario", label: "Intermediário" },
  { value: "avancado", label: "Avançado" },
];

export function Step2ProfileCustomization({
  data,
  updateData,
  onNext,
  onBack,
}: Step2Props) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      data.objective &&
      data.trainingFrequency &&
      data.trainingLocation &&
      data.weight &&
      data.height &&
      data.age
    ) {
      onNext();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Personalização do perfil
        </h2>
        <p className="text-gray-600">Vamos personalizar seu plano de treino</p>
      </div>

      {/* Objetivo */}
      <div>
        <label className="block text-sm font-medium text-gray-800 mb-3">
          Qual é seu objetivo principal?
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {objectives.map((obj) => (
            <label
              key={obj.value}
              className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                data.objective === obj.value
                  ? "border-gray-800 bg-gray-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <input
                type="radio"
                name="objective"
                value={obj.value}
                checked={data.objective === obj.value}
                onChange={(e) =>
                  updateData({ objective: e.target.value as any })
                }
                className="mr-3"
              />
              {obj.label}
            </label>
          ))}
        </div>
      </div>

      {/* Frequência de treinos */}
      <div>
        <label className="block text-sm font-medium text-gray-800 mb-3">
          Quantos dias por semana você pode treinar?
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[3, 4, 5, 6].map((days) => (
            <label
              key={days}
              className={`flex items-center justify-center p-3 border rounded-lg cursor-pointer transition-colors ${
                data.trainingFrequency === days
                  ? "border-gray-800 bg-gray-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <input
                type="radio"
                name="trainingFrequency"
                value={days}
                checked={data.trainingFrequency === days}
                onChange={(e) =>
                  updateData({ trainingFrequency: parseInt(e.target.value) })
                }
                className="mr-2"
              />
              {days} dias
            </label>
          ))}
        </div>
      </div>

      {/* Local de treino */}
      <div>
        <label className="block text-sm font-medium text-gray-800 mb-3">
          Onde você pretende treinar?
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label
            className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
              data.trainingLocation === "casa"
                ? "border-gray-800 bg-gray-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
          >
            <input
              type="radio"
              name="trainingLocation"
              value="casa"
              checked={data.trainingLocation === "casa"}
              onChange={(e) =>
                updateData({ trainingLocation: e.target.value as any })
              }
              className="mr-3"
            />
            Casa
          </label>
          <label
            className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
              data.trainingLocation === "academia"
                ? "border-gray-800 bg-gray-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
          >
            <input
              type="radio"
              name="trainingLocation"
              value="academia"
              checked={data.trainingLocation === "academia"}
              onChange={(e) =>
                updateData({ trainingLocation: e.target.value as any })
              }
              className="mr-3"
            />
            Academia
          </label>
        </div>
      </div>

      {/* Dados físicos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label
            htmlFor="weight"
            className="block text-sm font-medium text-gray-800 mb-2"
          >
            Peso (kg)
          </label>
          <input
            type="number"
            id="weight"
            value={data.weight || ""}
            onChange={(e) =>
              updateData({ weight: parseFloat(e.target.value) || 0 })
            }
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-colors bg-white"
            placeholder="70"
          />
        </div>

        <div>
          <label
            htmlFor="height"
            className="block text-sm font-medium text-gray-800 mb-2"
          >
            Altura (cm)
          </label>
          <input
            type="number"
            id="height"
            value={data.height || ""}
            onChange={(e) =>
              updateData({ height: parseFloat(e.target.value) || 0 })
            }
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-colors bg-white"
            placeholder="170"
          />
        </div>

        <div>
          <label
            htmlFor="age"
            className="block text-sm font-medium text-gray-800 mb-2"
          >
            Idade
          </label>
          <input
            type="number"
            id="age"
            value={data.age || ""}
            onChange={(e) => updateData({ age: parseInt(e.target.value) || 0 })}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-colors bg-white"
            placeholder="25"
          />
        </div>
      </div>

      {/* Nível de atividade */}
      <div>
        <label className="block text-sm font-medium text-gray-800 mb-3">
          Você já pratica atividade física?
        </label>
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="radio"
              name="alreadyExercises"
              value="true"
              checked={data.alreadyExercises === true}
              onChange={(e) =>
                updateData({ alreadyExercises: e.target.value === "true" })
              }
              className="mr-3"
            />
            Sim, já pratico
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="alreadyExercises"
              value="false"
              checked={data.alreadyExercises === false}
              onChange={(e) =>
                updateData({ alreadyExercises: e.target.value === "true" })
              }
              className="mr-3"
            />
            Não, sou iniciante
          </label>
        </div>
      </div>

      {data.alreadyExercises && (
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-3">
            Qual seu nível atual?
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {activityLevels.map((level) => (
              <label
                key={level.value}
                className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                  data.currentActivityLevel === level.value
                    ? "border-gray-800 bg-gray-50"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <input
                  type="radio"
                  name="currentActivityLevel"
                  value={level.value}
                  checked={data.currentActivityLevel === level.value}
                  onChange={(e) =>
                    updateData({ currentActivityLevel: e.target.value as any })
                  }
                  className="mr-3"
                />
                {level.label}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Especificidades */}
      <div>
        <label
          htmlFor="specificities"
          className="block text-sm font-medium text-gray-800 mb-2"
        >
          Dores ou limitações físicas (opcional)
        </label>
        <textarea
          id="specificities"
          value={data.specificities}
          onChange={(e) => updateData({ specificities: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-colors bg-white"
          placeholder="Ex: Dor no joelho, lesão no ombro..."
          rows={3}
        />
      </div>

      {/* Restrições alimentares */}
      <div>
        <label
          htmlFor="dietaryRestrictions"
          className="block text-sm font-medium text-gray-800 mb-2"
        >
          Restrições alimentares (opcional)
        </label>
        <textarea
          id="dietaryRestrictions"
          value={data.dietaryRestrictions}
          onChange={(e) => updateData({ dietaryRestrictions: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-colors bg-white"
          placeholder="Ex: Vegetariano, intolerância à lactose..."
          rows={3}
        />
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 bg-transparent text-gray-600 py-3 px-4 rounded-lg font-medium hover:text-gray-800 hover:bg-gray-100 transition-colors border border-gray-300"
        >
          Voltar
        </button>
        <button
          type="submit"
          className="flex-1 bg-gray-800 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-900 transition-colors"
        >
          Continuar
        </button>
      </div>
    </form>
  );
}
