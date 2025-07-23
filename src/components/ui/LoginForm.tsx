"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(""); // Limpar erros anteriores

    console.log("Tentando login com:", {
      email: formData.email,
      password: formData.password,
    });

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      console.log("Resultado do login:", { error });

      if (error) {
        // Tratar erros específicos do Supabase
        if (error.message.includes("Invalid login credentials")) {
          setError("Email ou senha incorretos. Verifique suas credenciais.");
        } else if (error.message.includes("Email not confirmed")) {
          setError("Por favor, confirme seu email antes de fazer login.");
        } else if (error.message.includes("Too many requests")) {
          setError("Muitas tentativas. Aguarde um momento e tente novamente.");
        } else {
          setError("Erro ao fazer login. Tente novamente.");
        }
        return;
      }

      // Redirecionar para dashboard após login bem-sucedido
      router.push("/dashboard");
    } catch (error) {
      console.error("Erro no login:", error);
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Mensagem de erro */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
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
          placeholder="Sua senha"
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="rememberMe"
            name="rememberMe"
            checked={formData.rememberMe}
            onChange={handleChange}
            className="rounded border-gray-300 text-gray-800 focus:ring-gray-800"
          />
          <span className="ml-2 text-sm text-gray-600">Lembrar de mim</span>
        </div>
        <a href="#" className="text-sm text-gray-800 hover:underline">
          Esqueceu a senha?
        </a>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gray-800 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
