"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogoBlue } from "@/components/ui/LogoBlue";
import { supabase } from "@/lib/supabase";

export default function Step1Page() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    acceptTerms: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(""); // Limpar erros anteriores

    try {
      // 1. Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
          },
        },
      });

      if (authError) {
        // Tratar erros específicos do Supabase
        if (authError.message.includes("User already registered")) {
          setError(
            "Este email já está cadastrado. Tente fazer login ou use outro email."
          );
        } else if (authError.message.includes("Password should be at least")) {
          setError("A senha deve ter pelo menos 6 caracteres.");
        } else if (authError.message.includes("Invalid email")) {
          setError("Por favor, insira um email válido.");
        } else if (authError.message.includes("Email rate limit exceeded")) {
          setError("Muitas tentativas. Aguarde um momento e tente novamente.");
        } else {
          setError("Erro ao criar conta. Tente novamente.");
        }
        return;
      }

      // 2. Salvar dados adicionais na tabela users
      const { error: userError } = await supabase.from("users").insert({
        id: authData.user?.id,
        email: formData.email,
        full_name: formData.fullName,
      });

      if (userError) {
        console.error("Erro ao salvar dados do usuário:", userError);
        setError(
          "Conta criada, mas houve um problema ao salvar seus dados. Tente fazer login."
        );
        return;
      }

      // 3. Salvar dados temporários no localStorage para os próximos steps
      localStorage.setItem("registerStep1", JSON.stringify(formData));

      router.push("/register/step2");
    } catch (error) {
      console.error("Erro no cadastro:", error);
      setError("Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
    // Limpar erro quando o usuário começa a digitar
    if (error) setError("");
  };

  return (
    <div className="min-h-screen bg-[#f5f1e8] flex items-center justify-center p-4 relative">
      <LogoBlue />

      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        {/* Indicador de progresso */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800">
              Cadastro simples
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step === 1
                      ? "bg-gray-800 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {step}
                </div>
                {step < 3 && (
                  <div
                    className={`w-12 h-1 mx-2 ${
                      step === 1 ? "bg-gray-800" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Mensagem de erro */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="fullName"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Nome completo
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-colors ${
                error ? "border-red-300" : "border-gray-300"
              }`}
              placeholder="Digite seu nome completo"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              E-mail
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-colors ${
                error ? "border-red-300" : "border-gray-300"
              }`}
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Senha
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-colors ${
                error ? "border-red-300" : "border-gray-300"
              }`}
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <div className="flex items-start">
            <input
              type="checkbox"
              id="acceptTerms"
              name="acceptTerms"
              checked={formData.acceptTerms}
              onChange={handleChange}
              required
              className="mt-1 rounded border-gray-300 text-gray-800 focus:ring-gray-800"
            />
            <label htmlFor="acceptTerms" className="ml-2 text-sm text-gray-600">
              Aceito os{" "}
              <a href="#" className="text-gray-800 hover:underline">
                termos de uso
              </a>{" "}
              e{" "}
              <a href="#" className="text-gray-800 hover:underline">
                política de privacidade
              </a>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-800 text-white py-2.5 px-6 rounded-lg font-semibold text-base md:text-lg hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Criando conta..." : "Continuar Personalização"}
          </button>
        </form>
      </div>
    </div>
  );
}
