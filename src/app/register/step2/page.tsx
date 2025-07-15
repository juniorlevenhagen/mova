"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Step2Page() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    objective: "",
    trainingFrequency: "",
    trainingLocation: "",
    age: "",
    height: "",
    weight: "",
    gender: "",
    hasPain: "",
    dietaryRestrictions: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      formData.objective &&
      formData.trainingFrequency &&
      formData.trainingLocation &&
      formData.age &&
      formData.height &&
      formData.weight &&
      formData.gender
    ) {
      // Salvar dados no localStorage
      localStorage.setItem("registerStep2", JSON.stringify(formData));
      router.push("/register/step3");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  return (
    <div className="min-h-screen bg-[#f5f1e8] flex items-center justify-center p-4 relative">
      {/* Logo no canto superior esquerdo */}
      <div className="absolute top-6 left-6 z-20">
        <Image
          src="/images/logo_blue.svg"
          alt="Mova+ Logo"
          width={120}
          height={40}
          className="h-6 w-auto drop-shadow-lg"
        />
      </div>

      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8">
        {/* Indicador de progresso */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800">
              Personalização do perfil
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step <= 2
                      ? "bg-gray-800 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {step}
                </div>
                {step < 3 && (
                  <div
                    className={`w-12 h-1 mx-2 ${
                      step <= 2 ? "bg-gray-800" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="objective"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Qual é o seu objetivo principal?
            </label>
            <select
              id="objective"
              name="objective"
              value={formData.objective}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-colors"
            >
              <option value="">Selecione seu objetivo</option>
              <option value="emagrecer">Emagrecer</option>
              <option value="ganhar_massa">Ganhar massa muscular</option>
              <option value="definicao">Definição muscular</option>
              <option value="saude">Melhorar a saúde</option>
              <option value="resistencia">Aumentar resistência</option>
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label
                htmlFor="age"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Idade
              </label>
              <input
                type="number"
                id="age"
                name="age"
                value={formData.age}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-colors"
                placeholder="25"
              />
            </div>
            <div>
              <label
                htmlFor="height"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Altura (cm)
              </label>
              <input
                type="number"
                id="height"
                name="height"
                value={formData.height}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-colors"
                placeholder="170"
              />
            </div>
            <div>
              <label
                htmlFor="weight"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Peso (kg)
              </label>
              <input
                type="number"
                id="weight"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-colors"
                placeholder="70"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="gender"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Gênero
            </label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-colors"
            >
              <option value="">Selecione o gênero</option>
              <option value="masculino">Masculino</option>
              <option value="feminino">Feminino</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="trainingFrequency"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Frequência de treino
              </label>
              <select
                id="trainingFrequency"
                name="trainingFrequency"
                value={formData.trainingFrequency}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-colors"
              >
                <option value="">Selecione a frequência</option>
                <option value="2x_semana">2x por semana</option>
                <option value="3x_semana">3x por semana</option>
                <option value="4x_semana">4x por semana</option>
                <option value="5x_semana">5x por semana</option>
                <option value="6x_semana">6x por semana</option>
                <option value="diario">Todos os dias</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="trainingLocation"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Local de treino
              </label>
              <select
                id="trainingLocation"
                name="trainingLocation"
                value={formData.trainingLocation}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-colors"
              >
                <option value="">Selecione o local</option>
                <option value="casa">Em casa</option>
                <option value="academia">Na academia</option>
                <option value="ambos">Casa e academia</option>
                <option value="ar_livre">Ar livre</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="hasPain"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Limitações físicas (opcional)
              </label>
              <textarea
                id="hasPain"
                name="hasPain"
                value={formData.hasPain}
                onChange={handleChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-colors resize-none"
                placeholder="Descreva suas limitações ou dores"
              />
            </div>
            <div>
              <label
                htmlFor="dietaryRestrictions"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Restrições alimentares (opcional)
              </label>
              <textarea
                id="dietaryRestrictions"
                name="dietaryRestrictions"
                value={formData.dietaryRestrictions}
                onChange={handleChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-colors resize-none"
                placeholder="Descreva suas restrições alimentares"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={() => router.push("/register/step1")}
              className="flex-1 bg-transparent text-gray-600 py-2 px-3 rounded-lg font-medium hover:text-gray-800 hover:bg-gray-100 transition-colors border border-gray-300"
            >
              Voltar
            </button>
            <button
              type="submit"
              className="flex-1 bg-gray-800 text-white py-2 px-3 rounded-lg font-medium hover:bg-gray-900 transition-colors"
            >
              Continuar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
