"use client";

import { SignupData } from "../SignupForm";

interface Step1Props {
  data: SignupData;
  updateData: (data: Partial<SignupData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function Step1BasicData({
  data,
  updateData,
  onNext,
  onBack,
}: Step1Props) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      data.firstName &&
      data.lastName &&
      data.email &&
      data.password &&
      data.agreeToTerms
    ) {
      onNext();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Dados básicos</h2>
        <p className="text-gray-600">
          Vamos começar com suas informações pessoais
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="firstName"
            className="block text-sm font-medium text-gray-800 mb-2"
          >
            Nome
          </label>
          <input
            type="text"
            id="firstName"
            value={data.firstName}
            onChange={(e) => updateData({ firstName: e.target.value })}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-colors bg-white"
            placeholder="Seu nome"
          />
        </div>

        <div>
          <label
            htmlFor="lastName"
            className="block text-sm font-medium text-gray-800 mb-2"
          >
            Sobrenome
          </label>
          <input
            type="text"
            id="lastName"
            value={data.lastName}
            onChange={(e) => updateData({ lastName: e.target.value })}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-colors bg-white"
            placeholder="Seu sobrenome"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-800 mb-2"
        >
          Email
        </label>
        <input
          type="email"
          id="email"
          value={data.email}
          onChange={(e) => updateData({ email: e.target.value })}
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-colors bg-white"
          placeholder="seu@email.com"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-800 mb-2"
        >
          Senha
        </label>
        <input
          type="password"
          id="password"
          value={data.password}
          onChange={(e) => updateData({ password: e.target.value })}
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-colors bg-white"
          placeholder="Mínimo 6 caracteres"
        />
      </div>

      <div className="flex items-start">
        <input
          type="checkbox"
          id="agreeToTerms"
          checked={data.agreeToTerms}
          onChange={(e) => updateData({ agreeToTerms: e.target.checked })}
          required
          className="mt-1 rounded border-gray-300 text-gray-800 focus:ring-gray-800"
        />
        <label htmlFor="agreeToTerms" className="ml-2 text-sm text-gray-600">
          Concordo com os{" "}
          <a href="#" className="text-gray-800 hover:underline">
            termos de uso
          </a>{" "}
          e{" "}
          <a href="#" className="text-gray-800 hover:underline">
            política de privacidade
          </a>
        </label>
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
