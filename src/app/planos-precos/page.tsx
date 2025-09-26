"use client";

import { useRouter } from "next/navigation";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { Check, Star, Shield, Users, TrendingUp, Clock } from "lucide-react";

const plan = {
  name: "Mova+ Premium",
  price: "R$ 29,90",
  period: "/mês",
  description: "Sua transformação fitness completa e personalizada",
  features: [
    "Planos ilimitados personalizados",
    "Treinos adaptados à sua evolução",
    "Planos nutricionais detalhados",
    "Acompanhamento semanal de progresso",
    "IA que ajusta seus planos automaticamente",
    "Receitas personalizadas para seus objetivos",
    "Lembretes inteligentes",
    "Suporte prioritário",
    "Acesso à comunidade premium",
    "Relatórios detalhados de evolução",
    "Acompanhamento visual do progresso",
    "Metas realistas e alcançáveis",
  ],
  buttonText: "Começar Teste Grátis",
  trialText: "7 dias grátis",
  originalPrice: "R$ 49,90",
  discount: "40% OFF",
};

const benefits = [
  {
    icon: Shield,
    title: "Planos sempre atualizados",
    description:
      "Seus treinos são ajustados automaticamente conforme sua evolução",
  },
  {
    icon: Users,
    title: "Comunidade ativa",
    description: "Mais de 10.000 pessoas já transformaram suas vidas",
  },
  {
    icon: TrendingUp,
    title: "Resultados comprovados",
    description: "95% dos usuários veem resultados em 30 dias",
  },
  {
    icon: Clock,
    title: "Suporte 24/7",
    description: "Nossa equipe está sempre disponível para ajudar",
  },
];

const testimonials = [
  {
    name: "Maria Silva",
    result: "Perdeu 15kg em 3 meses",
    text: "O Mova+ mudou completamente minha vida. Os planos são perfeitos para mim!",
  },
  {
    name: "João Santos",
    result: "Ganhou 8kg de massa muscular",
    text: "Nunca pensei que conseguiria resultados tão bons em casa.",
  },
  {
    name: "Ana Costa",
    result: "Melhorou sua resistência",
    text: "A personalização é incrível. Cada treino é pensado para mim.",
  },
];

export default function PlanosPrecosPage() {
  const router = useRouter();

  const handleStartJourney = () => {
    router.push("/register/step0");
  };

  return (
    <div className="min-h-screen bg-[#f5f1e8]">
      <Navbar />

      {/* Hero Section */}
      <section className="w-full bg-gradient-to-br from-[#f5f1e8] to-white py-16 md:py-24 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-gray-800 mb-6 leading-tight">
            Transforme sua vida com o{" "}
            <span className="text-gray-600">Mova+</span>
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">
            O único plano que você precisa para alcançar seus objetivos fitness.
            Personalizado, inteligente e eficaz.
          </p>

          {/* Special Offer Badge */}
        </div>
      </section>

      {/* Main Pricing Card */}
      <section className="w-full bg-white py-16 sm:py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-green-500 p-6 sm:p-8 text-center text-white">
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
                <Star className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                {plan.name}
              </h2>
              <p className="text-lg sm:text-xl opacity-90">
                {plan.description}
              </p>
            </div>

            {/* Pricing */}
            <div className="p-6 sm:p-8 text-center">
              <div className="mb-6">
                <div className="flex items-center justify-center space-x-2 sm:space-x-4 mb-4">
                  <span className="text-lg sm:text-2xl text-gray-500 line-through">
                    {plan.originalPrice}
                  </span>
                  <span className="bg-red-100 text-red-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                    {plan.discount}
                  </span>
                </div>
                <div className="flex items-baseline justify-center">
                  <span className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800">
                    {plan.price}
                  </span>
                  <span className="text-gray-600 ml-2 text-base sm:text-xl">
                    {plan.period}
                  </span>
                </div>
                <div className="text-green-600 text-base sm:text-lg font-medium mt-2">
                  {plan.trialText}
                </div>
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
                {plan.features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-2 sm:space-x-3 text-left"
                  >
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mt-1 flex-shrink-0" />
                    <span className="text-sm sm:text-base text-gray-700">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <button
                onClick={handleStartJourney}
                className="w-full bg-gradient-to-r from-blue-500 to-green-500 text-white py-3 sm:py-4 px-6 sm:px-8 rounded-lg font-medium hover:from-blue-600 hover:to-green-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-lg sm:text-xl mb-4"
              >
                {plan.buttonText}
              </button>
              <p className="text-gray-500 text-xs sm:text-sm">
                Cancele a qualquer momento • Sem taxas ocultas
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="w-full bg-[#f5f1e8] py-16 sm:py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Por que escolher o Mova+?
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
              Mais de 10.000 pessoas já transformaram suas vidas conosco
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-800 rounded-lg flex items-center justify-center mb-4">
                  <benefit.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3">
                  {benefit.title}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="w-full bg-white py-16 sm:py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              O que nossos usuários dizem
            </h2>
            <p className="text-base sm:text-lg text-gray-600">
              Histórias reais de transformação
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-2xl p-6 sm:p-8 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div className="ml-3 sm:ml-4">
                    <h4 className="font-bold text-gray-800 text-sm sm:text-base">
                      {testimonial.name}
                    </h4>
                    <p className="text-green-600 font-medium text-xs sm:text-sm">
                      {testimonial.result}
                    </p>
                  </div>
                </div>
                <p className="text-gray-600 italic text-sm sm:text-base">
                  &ldquo;{testimonial.text}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="w-full bg-[#f5f1e8] py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Perguntas Frequentes
            </h2>
            <p className="text-lg text-gray-600">
              Tire suas dúvidas sobre o Mova+
            </p>
          </div>

          <div className="space-y-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Posso cancelar a qualquer momento?
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Sim! Você pode cancelar sua assinatura a qualquer momento, sem
                taxas ou multas. Seu acesso continuará até o final do período
                pago.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Como funciona o período de teste?
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Oferecemos 7 dias grátis para você experimentar todos os
                recursos do Mova+. Não é necessário cartão de crédito para
                começar.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Os planos são realmente personalizados?
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Absolutamente! Nossa IA analisa seu perfil, objetivos e
                progresso para criar planos únicos e adaptados especificamente
                para você.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="w-full bg-gray-800 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Pronto para transformar sua vida?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Junte-se a milhares de pessoas que já alcançaram seus objetivos com
            o Mova+
          </p>
          <button
            onClick={handleStartJourney}
            className="bg-gradient-to-r from-blue-500 to-green-500 text-white py-4 px-8 rounded-lg font-medium hover:from-blue-600 hover:to-green-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-lg"
          >
            Começar Minha Jornada
          </button>
          <p className="text-gray-400 text-sm mt-4">
            7 dias grátis • Cancele a qualquer momento
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
