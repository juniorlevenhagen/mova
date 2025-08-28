"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

export default function Step3Page() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    cardNumber: "",
    cardName: "",
    expiryDate: "",
    cvv: "",
    acceptTerms: false,
  });

  const [canRender, setCanRender] = useState(false);

  // Proteção da rota
  useEffect(() => {
    const step2Data = localStorage.getItem("registerStep2");
    const step1Data = localStorage.getItem("registerStep1");
    if (!step2Data || !step1Data) {
      router.replace("/register/step0");
    } else {
      setCanRender(true);
    }
  }, [router]);

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

      // 3. Criar assinatura com período de teste
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 7); // 7 dias de teste

      const subscriptionData = {
        user_id: userData.id,
        status: "trial",
        trial_ends_at: trialEndsAt.toISOString(),
      };

      const { error: subscriptionError } = await supabase
        .from("subscriptions")
        .insert(subscriptionData);

      if (subscriptionError) throw subscriptionError;

      // 4. Limpar dados temporários
      localStorage.removeItem("registerStep1");
      localStorage.removeItem("registerStep2");
      localStorage.removeItem("registerStep3");

      // 5. Redirecionar para página de sucesso
      router.push("/register/success");
    } catch (error) {
      console.error("Erro detalhado:", error);
      alert("Erro ao criar assinatura. Tente novamente.");
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
  };

  if (!canRender) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f1e8]">
        <span className="text-gray-600">Carregando...</span>
      </div>
    );
  }

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

      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl p-4 md:p-6 lg:p-8 mt-16 md:mt-0">
        {/* Indicador de progresso */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Mova+ Complete</h2>
          </div>
          <div className="flex items-center space-x-2">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step <= 3
                      ? "bg-gray-800 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {step}
                </div>
                {step < 3 && (
                  <div
                    className={`w-12 h-1 mx-2 ${
                      step <= 3 ? "bg-gray-800" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Resumo do plano */}
          <div className="space-y-4">
            <div className="text-center lg:text-left">
              <h3 className="text-2xl font-bold text-gray-800 mb-3">
                Mova+ Complete
              </h3>
              <p className="text-lg text-gray-600 mb-4">
                Seu plano personalizado está pronto!
              </p>
            </div>

            {/* Banner de teste gratuito */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-base font-semibold text-green-800">
                    7 dias de teste GRATUITO
                  </p>
                  <p className="text-xs text-green-700">
                    Comece hoje e cancele a qualquer momento
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-base font-semibold text-gray-800">
                O que você receberá:
              </h4>

              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-700">
                    Plano de treino personalizado
                  </span>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-700">
                    Plano alimentar completo
                  </span>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-700">
                    Acompanhamento com IA
                  </span>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-700">Suporte 24/7</span>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-700">
                    Acesso ilimitado
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-center">
                  <p className="text-xs text-gray-600">
                    Após 7 dias de teste gratuito
                  </p>
                  <p className="text-2xl font-bold text-gray-800">R$ 29,90</p>
                  <p className="text-xs text-gray-600">por mês</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Cancele a qualquer momento
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Formulário de pagamento */}
          <div className="space-y-4">
            <h4 className="text-base font-semibold text-gray-800">
              Informações de pagamento
            </h4>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
              <p className="text-xs text-blue-800">
                <strong>Importante:</strong> Seu cartão não será cobrado durante
                os 7 dias de teste. Após esse período, será cobrado R$ 29,90
                mensais. Você pode cancelar a qualquer momento.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label
                  htmlFor="cardNumber"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Número do cartão
                </label>
                <input
                  type="text"
                  id="cardNumber"
                  name="cardNumber"
                  value={formData.cardNumber}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-colors"
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                />
              </div>

              <div>
                <label
                  htmlFor="cardName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Nome no cartão
                </label>
                <input
                  type="text"
                  id="cardName"
                  name="cardName"
                  value={formData.cardName}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-colors"
                  placeholder="Nome como está no cartão"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="expiryDate"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Validade
                  </label>
                  <input
                    type="text"
                    id="expiryDate"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-colors"
                    placeholder="MM/AA"
                    maxLength={5}
                  />
                </div>
                <div>
                  <label
                    htmlFor="cvv"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    CVV
                  </label>
                  <input
                    type="text"
                    id="cvv"
                    name="cvv"
                    value={formData.cvv}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-colors"
                    placeholder="123"
                    maxLength={4}
                  />
                </div>
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
                <label
                  htmlFor="acceptTerms"
                  className="ml-2 text-xs text-gray-600"
                >
                  Aceito os{" "}
                  <a href="#" className="text-gray-800 hover:underline">
                    termos de uso
                  </a>{" "}
                  e{" "}
                  <a href="#" className="text-gray-800 hover:underline">
                    política de privacidade
                  </a>
                  . Entendo que terei 7 dias de teste gratuito e após esse
                  período será cobrado R$ 29,90 mensais.
                </label>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => router.push("/register/step2")}
                  className="flex-1 bg-transparent text-gray-600 py-2.5 px-4 rounded-lg font-medium hover:text-gray-800 hover:bg-gray-100 transition-colors border border-gray-300 text-sm md:text-base"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gray-800 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-gray-900 transition-colors text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Criando assinatura..." : "Começar Teste Grátis"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
