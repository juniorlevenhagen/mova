"use client";

import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { Check } from "lucide-react";
import { BackgroundGradient } from "@/components/ui/shadcn-io/background-gradient";

export default function PlanosPrecosPage() {
  const plans = [
    {
      name: "Plano Básico",
      price: "14,99",
      yearlyPrice: "179,88",
      plansIncluded: 1,
      features: [
        "1 plano personalizado gerado",
        "Acesso ao dashboard completo",
        "Acompanhamento de evolução",
        "Registro de atividades diárias",
        "Suporte por e-mail",
      ],
      popular: false,
    },
    {
      name: "Plano Premium",
      price: "39,99",
      yearlyPrice: "479,88",
      plansIncluded: 3,
      features: [
        "3 planos personalizados gerados",
        "Acesso ao dashboard completo",
        "Acompanhamento de evolução",
        "Registro de atividades diárias",
        "Suporte prioritário",
        "Atualizações ilimitadas de planos",
      ],
      popular: true,
    },
  ];

  return (
    <div>
      <Navbar />

      {/* Hero Section - Seguindo padrão da página principal */}
      <section className="w-full py-20 md:py-32 px-4">
        <div className="mx-auto text-center">
          <p className="text-sm font-medium text-gray-600 mb-8 tracking-wide uppercase bg-gradient-to-r from-black to-gray-800 text-white py-2 rounded-full w-60 mx-auto font-zalando relative overflow-hidden group shadow-lg">
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
            <span className="relative z-10">Planos e Preços</span>
          </p>
          <h1 className="max-w-7xl mx-auto text-3xl md:text-6xl font-zalando-medium text-black leading-tight my-12">
            Quanto vale para você transformar seu corpo e sua saúde?
          </h1>

          <section
            className="relative w-9/12 mx-auto overflow-hidden rounded-3xl shadow-2xl"
            style={{
              background:
                "linear-gradient(to right, #f0f0f0, #ffffff, #f0f0f0)",
            }}
          >
            {/* EVOLUTION centralizado verticalmente */}
            <div
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[8rem] md:text-[12rem] lg:text-[14rem] 
                 font-black select-none pointer-events-none leading-none z-0 text-gray-300/30"
            >
              EVOL
              <br />
              UTION
            </div>

            {/* Layout em grid - Texto e Vídeo lado a lado */}
            <div className="grid md:grid-cols-2 gap-8 p-8 relative z-10">
              {/* Lado esquerdo - Texto */}
              <div className="text-left flex flex-col justify-center">
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-black mb-6 md:mb-8 leading-tight text-left">
                  Você no controle da sua evolução
                </h2>

                <p className="text-lg md:text-xl lg:text-2xl text-black/90 font-medium leading-relaxed text-left max-w-xl">
                  O método Mova+ é a revolução que o seu corpo e a sua saúde
                  esperavam. Não importa o seu nível, rotina ou objetivo — nossa
                  IA personalizada cria o caminho certo para você conquistar
                  resultados reais, com segurança e eficiência. Transforme seu
                  corpo em menos tempo, sem dietas malucas nem treinos
                  intermináveis. O que antes parecia impossível, agora é questão
                  de método.
                </p>
              </div>

              {/* Lado direito - Vídeo */}
              <div className="flex items-center justify-end">
                <video
                  className="w-full max-w-md h-auto object-cover rounded-2xl shadow-lg"
                  src="/images/antesedepois.mp4"
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              </div>
            </div>
          </section>
        </div>
      </section>

      {/* Pricing Cards - Com background alternado */}
      <section className="w-full">
        <p className="text-2xl md:text-2xl text-gray-800 font-zalando max-w-3xl mx-auto mb-12 leading-relaxed mt-12">
          Escolha o plano ideal para sua jornada de transformação fitness. Todos
          os planos incluem acesso completo ao dashboard e ferramentas
          personalizadas.
        </p>
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <BackgroundGradient
                key={index}
                className="bg-white rounded-[22px] p-8 h-full flex flex-col"
                containerClassName="transition-all duration-300 hover:scale-[1.02] transform-gpu will-change-transform antialiased"
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                    <span className="bg-black hover:bg-gray-700 text-white px-6 py-1 rounded-full text-sm font-medium shadow-lg transition-colors duration-200">
                      Mais Popular
                    </span>
                  </div>
                )}

                {/* Icon */}
                <div className="flex justify-end mb-4">
                  <div
                    className={`w-12 h-12 ${
                      plan.popular ? "bg-blue-600" : "bg-black"
                    } rounded-lg flex items-center justify-center transition-colors duration-200`}
                  >
                    <svg
                      className="w-7 h-7 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
                    </svg>
                  </div>
                </div>

                {/* Plan Name */}
                <h3 className="text-2xl font-bold text-black mb-4">
                  {plan.name}
                </h3>

                {/* Price */}
                <div className="mb-2">
                  <span className="text-5xl font-bold text-black">
                    R${plan.price}
                  </span>
                  <span className="text-xl text-gray-600">/mês</span>
                </div>
                <p className="text-sm text-gray-500 mb-6">
                  ou R${plan.yearlyPrice} anualmente
                </p>

                {/* Divider */}
                <div className="border-t border-gray-200 my-6"></div>

                {/* Features */}
                <div className="mb-8 flex-grow">
                  <p className="text-sm font-medium text-gray-700 mb-4">
                    Inclui:
                  </p>
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <Check
                          className={`w-5 h-5 ${
                            plan.popular ? "text-blue-600" : "text-black"
                          } flex-shrink-0 mt-0.5`}
                        />
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Button */}
                <button
                  className={`w-full py-4 px-6 rounded-lg font-medium text-base transition-all duration-200 mt-auto ${
                    plan.popular
                      ? "bg-black text-white hover:bg-blue-700 shadow-lg hover:shadow-xl"
                      : "bg-white text-black border-2 border-black hover:bg-black hover:text-white"
                  }`}
                >
                  Começar agora
                </button>
              </BackgroundGradient>
            ))}
          </div>

          {/* Additional Info */}
          <div className="mt-12 text-center">
            <p className="text-gray-600 text-sm">
              Todos os planos incluem 7 dias de teste grátis. Cancele a qualquer
              momento.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
