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
    nivelAtividade: "", // Novo campo para nível de atividade
    hasPain: "",
    dietaryRestrictions: "",
    foodBudget: "", // Novo campo para orçamento alimentar
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white via-white to-gray-100">
        <span className="text-black/80 font-zalando">Carregando...</span>
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
        .maybeSingle();

      if (userError) throw userError;

      // Adicionar verificação de null
      if (!userData) {
        throw new Error("Usuário não encontrado");
      }

      // 3. Salvar perfil do usuário
      // Converte dd/mm/aaaa para aaaa-mm-dd (formato ISO)
      const isoDate = convertToISO(formData.birthDate);
      if (!isoDate) {
        throw new Error("Data de nascimento inválida");
      }

      const birthDate = new Date(isoDate);
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
          birth_date: isoDate, // Salva no formato ISO (aaaa-mm-dd)
          age: calculatedAge,
          height: parseFloat(formData.height), // Altura com uma casa decimal
          weight: parseFloat(formData.weight), // Peso atual com decimais
          initial_weight: parseFloat(formData.weight), // Peso inicial (mesmo valor)
          gender: formData.gender,
          objective: formData.objective,
          training_frequency: formData.trainingFrequency,
          training_location: formData.trainingLocation,
          nivel_atividade: formData.nivelAtividade || "Moderado", // Salvar nível de atividade
          has_pain: formData.hasPain,
          dietary_restrictions: formData.dietaryRestrictions,
          food_budget: formData.foodBudget,
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

  // Função para formatar data no formato dd/mm/aaaa
  const formatDateInput = (value: string): string => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, "");

    // Aplica a máscara dd/mm/aaaa
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 4) {
      return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
    } else {
      return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
    }
  };

  // Função para converter dd/mm/aaaa para aaaa-mm-dd (formato ISO para o banco)
  const convertToISO = (dateStr: string): string => {
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      const [day, month, year] = parts;
      if (
        day &&
        month &&
        year &&
        day.length === 2 &&
        month.length === 2 &&
        year.length === 4
      ) {
        const dayNum = parseInt(day, 10);
        const monthNum = parseInt(month, 10);
        const yearNum = parseInt(year, 10);

        // Valida se a data é válida
        const date = new Date(yearNum, monthNum - 1, dayNum);
        if (
          date.getDate() === dayNum &&
          date.getMonth() === monthNum - 1 &&
          date.getFullYear() === yearNum
        ) {
          // Verifica se não é uma data futura
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (date <= today) {
            return `${year}-${month}-${day}`;
          }
        }
      }
    }
    return "";
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const formatted = formatDateInput(value);

    // Atualiza o estado com o valor formatado (dd/mm/aaaa)
    setFormData({
      ...formData,
      birthDate: formatted,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-white to-gray-100 flex items-center justify-center p-4 md:p-6 lg:p-8 relative">
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

      <div className="w-full max-w-2xl bg-white rounded-[22px] border-2 border-black shadow-xl p-4 md:p-6 lg:p-8 mt-16 md:mt-0">
        {/* Indicador de progresso */}
        <div className="mb-4 md:mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl md:text-2xl font-zalando-medium text-black">
              Personalização do perfil
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm font-zalando-medium ${
                    step <= 2
                      ? "bg-black text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {step}
                </div>
                {step < 3 && (
                  <div
                    className={`w-6 md:w-12 h-1 mx-2 ${
                      step <= 2 ? "bg-black" : "bg-gray-200"
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
              className="block text-sm font-zalando-medium text-black mb-2"
            >
              Qual é o seu objetivo principal?
            </label>
            <select
              id="objective"
              name="objective"
              value={formData.objective}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none focus:border-black transition-colors text-sm md:text-base font-zalando"
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
                className="block text-sm font-zalando-medium text-black mb-1"
              >
                Data de Nascimento
              </label>
              <input
                type="text"
                id="birthDate"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleDateChange}
                required
                className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none focus:border-black transition-colors text-sm md:text-base font-zalando"
                placeholder="dd/mm/aaaa"
                maxLength={10}
                pattern="\d{2}/\d{2}/\d{4}"
              />
            </div>
            <div>
              <label
                htmlFor="height"
                className="block text-sm font-zalando-medium text-black mb-1"
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
                className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none focus:border-black transition-colors text-sm md:text-base font-zalando"
                placeholder="170"
              />
            </div>
            <div>
              <label
                htmlFor="weight"
                className="block text-sm font-zalando-medium text-black mb-1"
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
                className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none focus:border-black transition-colors text-sm md:text-base font-zalando"
                placeholder="70"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="gender"
              className="block text-sm font-zalando-medium text-black mb-2"
            >
              Gênero
            </label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none focus:border-black transition-colors text-sm md:text-base font-zalando"
            >
              <option value="">Selecione o gênero</option>
              <option value="masculino">Masculino</option>
              <option value="feminino">Feminino</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="nivelAtividade"
              className="block text-sm font-zalando-medium text-black mb-2"
            >
              Nível de Atividade
            </label>
            <select
              id="nivelAtividade"
              name="nivelAtividade"
              value={formData.nivelAtividade}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none focus:border-black transition-colors text-sm md:text-base font-zalando"
            >
              <option value="">Selecione seu nível de atividade</option>
              <option value="Sedentário">Sedentário</option>
              <option value="Moderado">Moderado</option>
              <option value="Atleta">Atleta</option>
              <option value="Atleta Alto Rendimento">Atleta Alto Rendimento</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="trainingFrequency"
                className="block text-sm font-zalando-medium text-black mb-2"
              >
                Frequência de treino
              </label>
              <select
                id="trainingFrequency"
                name="trainingFrequency"
                value={formData.trainingFrequency}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none focus:border-black transition-colors text-sm md:text-base font-zalando"
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
                className="block text-sm font-zalando-medium text-black mb-2"
              >
                Local de treino
              </label>
              <select
                id="trainingLocation"
                name="trainingLocation"
                value={formData.trainingLocation}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none focus:border-black transition-colors text-sm md:text-base font-zalando"
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
                className="block text-sm font-zalando-medium text-black mb-2"
              >
                Limitações físicas (opcional)
              </label>
              <textarea
                id="hasPain"
                name="hasPain"
                value={formData.hasPain}
                onChange={handleChange}
                rows={2}
                className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none focus:border-black transition-colors resize-none text-sm md:text-base font-zalando"
                placeholder="Descreva suas limitações ou dores"
              />
            </div>
            <div>
              <label
                htmlFor="dietaryRestrictions"
                className="block text-sm font-zalando-medium text-black mb-2"
              >
                Restrições alimentares (opcional)
              </label>
              <textarea
                id="dietaryRestrictions"
                name="dietaryRestrictions"
                value={formData.dietaryRestrictions}
                onChange={handleChange}
                rows={2}
                className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none focus:border-black transition-colors resize-none text-sm md:text-base font-zalando"
                placeholder="Descreva suas restrições alimentares"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="foodBudget"
              className="block text-sm font-zalando-medium text-black mb-2"
            >
              Orçamento para alimentação *
            </label>
            <select
              id="foodBudget"
              name="foodBudget"
              value={formData.foodBudget}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none focus:border-black transition-colors text-sm md:text-base font-zalando"
            >
              <option value="">Selecione seu orçamento</option>
              <option value="economico">
                Econômico - Frango, ovos, iogurte comum
              </option>
              <option value="moderado">
                Moderado - Frango, peixe mais barato, iogurte grego
                ocasionalmente
              </option>
              <option value="premium">
                Premium - Salmão, iogurte grego, alimentos mais caros
              </option>
            </select>
            <p className="text-xs text-gray-600 mt-1 font-zalando">
              Isso ajuda a sugerir alimentos adequados ao seu orçamento
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-3">
            <button
              type="button"
              onClick={() => router.push("/register/step1")}
              className="flex-1 bg-white text-black py-2 px-3 rounded-lg font-zalando-medium hover:bg-gray-50 transition-colors border-2 border-black text-sm md:text-base"
            >
              Voltar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-black text-white py-2.5 px-4 rounded-lg font-zalando-medium hover:bg-black/90 transition-colors text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed border-2 border-black"
            >
              {loading ? "Salvando..." : "Continuar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
