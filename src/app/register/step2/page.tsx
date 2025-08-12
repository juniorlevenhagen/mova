"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

export default function Step2Page() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    objective: "",
    trainingFrequency: "",
    trainingLocation: "",
    birthDate: "", // Mudou de age para birthDate
    height: "",
    weight: "",
    gender: "",
    hasPain: "",
    dietaryRestrictions: "",
  });
  const [canRender, setCanRender] = useState(false);

  // Proteção da rota
  useEffect(() => {
    const step1Data = localStorage.getItem("registerStep1");
    if (!step1Data) {
      router.replace("/register/step1");
    } else {
      setCanRender(true);
    }
  }, [router]);

  if (!canRender) {
    // Mostra apenas um loading ou nada enquanto verifica
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f1e8]">
        <span className="text-gray-600">Carregando...</span>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Pegar dados do step1 do localStorage
      const step1Data = JSON.parse(
        localStorage.getItem("registerStep1") || "{}"
      );

      // 2. Buscar o usuário pelo email
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("email", step1Data.email)
        .single();

      if (userError) throw userError;

      // 3. Salvar perfil do usuário
      const birthDate = new Date(formData.birthDate);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      const calculatedAge =
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
          ? age - 1
          : age;

      const { error: profileError } = await supabase
        .from("user_profiles")
        .insert({
          user_id: userData.id,
          birth_date: formData.birthDate,
          age: calculatedAge,
          height: parseInt(formData.height),
          weight: parseInt(formData.weight), // Peso atual
          initial_weight: parseInt(formData.weight), // Peso inicial (mesmo valor)
          gender: formData.gender,
          objective: formData.objective,
          training_frequency: formData.trainingFrequency,
          training_location: formData.trainingLocation,
          has_pain: formData.hasPain,
          dietary_restrictions: formData.dietaryRestrictions,
        });

      if (profileError) throw profileError;

      // 4. Salvar dados temporários para o step3
      localStorage.setItem("registerStep2", JSON.stringify(formData));

      router.push("/register/step3");
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
      alert("Erro ao salvar perfil. Tente novamente.");
    } finally {
      setLoading(false);
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
    <div className="min-h-screen bg-[#f5f1e8] flex items-center justify-center p-4 md:p-6 lg:p-8 relative">
      {/* Logo no canto superior esquerdo */}
      <div className="absolute top-4 left-4 md:top-6 md:left-6 z-20">
        <Image
          src="/images/logo_blue.webp"
          alt="Mova+ Logo"
          width={120}
          height={40}
          className="h-5 md:h-6 w-auto drop-shadow-lg"
        />
      </div>

      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-4 md:p-6 lg:p-8 mt-16 md:mt-0">
        {/* Indicador de progresso */}
        <div className="mb-4 md:mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800">
              Personalização do perfil
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm font-medium ${
                    step <= 2
                      ? "bg-gray-800 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {step}
                </div>
                {step < 3 && (
                  <div
                    className={`w-6 md:w-12 h-1 mx-2 ${
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-colors text-sm md:text-base"
            >
              <option value="">Selecione seu objetivo</option>
              <option value="Ganho de Massa">Ganho de Massa</option>
              <option value="Emagrecimento">Emagrecimento</option>
              <option value="Força">Força</option>
              <option value="Resistência">Resistência</option>
              <option value="Definição">Definição</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label
                htmlFor="birthDate"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Data de Nascimento
              </label>
              <input
                type="date"
                id="birthDate"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-colors text-sm md:text-base"
                max={new Date().toISOString().split("T")[0]} // Não permite datas futuras
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-colors text-sm md:text-base"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-colors text-sm md:text-base"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-colors text-sm md:text-base"
            >
              <option value="">Selecione o gênero</option>
              <option value="masculino">Masculino</option>
              <option value="feminino">Feminino</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-colors text-sm md:text-base"
              >
                <option value="">Selecione a frequência</option>
                <option value="2x por semana">2x por semana</option>
                <option value="3x por semana">3x por semana</option>
                <option value="4x por semana">4x por semana</option>
                <option value="5x por semana">5x por semana</option>
                <option value="6x por semana">6x por semana</option>
                <option value="Todos os dias">Todos os dias</option>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-colors text-sm md:text-base"
              >
                <option value="">Selecione o local</option>
                <option value="casa">Em casa</option>
                <option value="academia">Na academia</option>
                <option value="ambos">Casa e academia</option>
                <option value="ar_livre">Ar livre</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-colors resize-none text-sm md:text-base"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-colors resize-none text-sm md:text-base"
                placeholder="Descreva suas restrições alimentares"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-3">
            <button
              type="button"
              onClick={() => router.push("/register/step1")}
              className="flex-1 bg-transparent text-gray-600 py-2 px-3 rounded-lg font-medium hover:text-gray-800 hover:bg-gray-100 transition-colors border border-gray-300 text-sm md:text-base"
            >
              Voltar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gray-800 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-gray-900 transition-colors text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Salvando..." : "Continuar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
