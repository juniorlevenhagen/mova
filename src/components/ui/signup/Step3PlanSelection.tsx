"use client";

import { SignupData } from "../SignupForm";

interface Step3Props {
  data: SignupData;
  updateData: (data: Partial<SignupData>) => void;
  onSubmit: () => void;
  onBack: () => void;
}

export function Step3PlanSelection({ data, updateData, onSubmit, onBack }: Step3Props) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (data.selectedPlan) {
      onSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Escolha seu plano
        </h2>
        <p className="text-gray-600">
          Selecione o plano que melhor se adapta às suas necessidades
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Plano Gratuito */}
        <div
          className={`border-2 rounded-xl p-6 cursor-pointer transition-all ${
            data.selectedPlan === "gratuito"
              ? "border-gray-800 bg-gray-50"
              : "border-gray-300 hover:border-gray-400"
          }`}
          onClick={() => updateData({ selectedPlan: "gratuito" })}
        >
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Plano Gratuito</h3>
            <p className="text-3xl font-bold text-gray-800 mb-4">R$ 0</p>
            <p className="text-gray-600 mb-4">Perfeito para começar</p>
          </div>
          
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              Treinos básicos personalizados
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              Dicas nutricionais gerais
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              Acesso à comunidade
            </li>
            <li className="flex items-center text-gray-400">
              <span className="mr-2">✗</span>
              Planos nutricionais completos
            </li>
            <li className="flex items-center text-gray-400">
              <span className="mr-2">✗</span>
              Acompanhamento personalizado
            </li>
          </ul>
        </div>

        {/* Plano Completo */}
        <div
          className={`border-2 rounded-xl p-6 cursor-pointer transition-all ${
            data.selectedPlan === "completo"
              ? "border-gray-800 bg-gray-50"
              : "border-gray-300 hover:border-gray-400"
          }`}
          onClick={() => updateData({ selectedPlan: "completo" })}
        >
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Plano Completo</h3>
            <p className="text-3xl font-bold text-gray-800 mb-4">R$ 29,90</p>
            <p className="text-gray-600 mb-4">Sua transformação completa</p>
          </div>
          
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              Treinos personalizados avançados
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              Planos nutricionais completos
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              Acompanhamento personalizado
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              Suporte prioritário
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              Todos os recursos disponíveis
            </li>
          </ul>
        </div>
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
          disabled={!data.selectedPlan}
          className="flex-1 bg-gray-800 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Finalizar cadastro
        </button>
      </div>
    </form>
  );
}
