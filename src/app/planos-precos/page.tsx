"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { Check } from "lucide-react";
import { BackgroundGradient } from "@/components/ui/shadcn-io/background-gradient";
import { ShinyButton } from "@/components/ui/shiny-button";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export default function PlanosPrecosPage() {
  const router = useRouter();
  const heroReveal = useScrollReveal<HTMLElement>({ threshold: 0.1 });
  const socialReveal = useScrollReveal<HTMLDivElement>({ threshold: 0.1 });
  const pricingReveal = useScrollReveal<HTMLElement>({ threshold: 0.1 });
  const videoReveal = useScrollReveal<HTMLElement>({ threshold: 0.1 });
  const faqReveal = useScrollReveal<HTMLElement>({ threshold: 0.1 });

  const handleStartNow = () => {
    router.push("/register/step0");
  };

  const plans = [
    {
      name: "Plano Básico",
      price: "17,99",
      originalPrice: "35,90",
      discount: "50%",
      plansIncluded: 1,
      features: [
        "1 crédito para gerar plano personalizado",
        "Acesso ao dashboard completo",
        "Acompanhamento de evolução",
        "Registro de atividades diárias",
        "Suporte por e-mail",
      ],
      popular: false,
    },
    {
      name: "Pacote Premium",
      price: "39,99",
      originalPrice: "79,90",
      discount: "50%",
      plansIncluded: 3,
      features: [
        "3 créditos para gerar planos personalizados",
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
    <div className="min-h-screen bg-gradient-to-b from-white via-white to-gray-100">
      <Navbar />

      {/* Hero Section */}
      <section
        ref={heroReveal.ref}
        className={`w-full py-16 md:py-20 px-4 bg-gradient-to-b from-white via-white to-gray-100 transition-all duration-1000 ease-out ${
          heroReveal.isVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-8"
        }`}
      >
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm font-medium text-gray-600 mb-8 tracking-wide uppercase bg-gradient-to-r from-black to-gray-800 text-white py-2 rounded-full w-60 mx-auto font-zalando relative overflow-hidden group shadow-lg">
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
            <span className="relative z-10">Planos e Preços</span>
          </p>
          <h1 className="text-3xl md:text-6xl font-zalando-medium text-black leading-tight mb-6">
            Quanto vale para você transformar seu corpo e sua saúde?
          </h1>
        </div>
      </section>

      {/* Social Proof */}
      <div
        ref={socialReveal.ref}
        className={`text-center mb-12 max-w-4xl mx-auto px-4 transition-all duration-1000 ease-out ${
          socialReveal.isVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-8"
        }`}
      >
        <p className="text-lg text-gray-700 mb-3 mt-10">
          Junte-se a <span className="font-bold text-black">10.000+</span>{" "}
          pessoas que já transformaram suas vidas
        </p>
        <div className="flex items-center justify-center space-x-2">
          <span className="text-black">★★★★★</span>
          <span className="text-gray-600">4.9/5 • 2.847 avaliações</span>
        </div>
      </div>

      {/* Pricing Cards Section */}
      <section
        ref={pricingReveal.ref}
        className={`w-full py-12 md:py-4 md:mb-16 px-4 transition-all duration-1000 ease-out ${
          pricingReveal.isVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-8"
        }`}
      >
        <div className="max-w-7xl mx-auto">
          <p className="text-xl md:text-2xl text-gray-800 font-zalando max-w-3xl mx-auto mb-14 leading-relaxed text-center py-1 px-6">
            Escolha o plano ideal para sua jornada de transformação fitness
          </p>

          <div className="grid md:grid-cols-2 gap-12 md:gap-24 max-w-5xl mx-auto">
            {plans.map((plan, index) =>
              plan.popular ? (
                <BackgroundGradient
                  key={index}
                  className="bg-gray-100 rounded-[22px] p-8 h-full flex flex-col"
                  containerClassName="transition-all duration-150 hover:scale-[1.02]"
                >
                  {/* Popular Badge */}
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                    <span className="bg-black hover:bg-gray-700 text-white px-6 py-1 rounded-full text-sm font-medium shadow-lg transition-colors duration-200">
                      Mais Popular
                    </span>
                  </div>

                  {/* Icon */}
                  <div className="flex justify-end mb-4">
                    <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center transition-colors duration-200">
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
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-lg text-gray-400 line-through">
                        R$ {plan.originalPrice}
                      </span>
                      <span className="bg-black text-white px-2 py-1 rounded text-xs font-bold">
                        {plan.discount} OFF
                      </span>
                    </div>
                    <span className="text-5xl font-bold text-black">
                      R${plan.price}
                    </span>
                    <span className="text-gray-600 text-base ml-2">pacote</span>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-200 my-6"></div>

                  {/* Features */}
                  <div className="mb-8 flex-grow">
                    <p className="text-lg font-medium text-gray-700 mb-4">
                      Inclui:
                    </p>
                    <ul className="space-y-3">
                      {plan.features.map((feature, featureIndex) => (
                        <li
                          key={featureIndex}
                          className="flex items-start gap-3"
                        >
                          <Check className="w-5 h-5 text-black flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700 text-lg">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA Button */}
                  <ShinyButton
                    onClick={handleStartNow}
                    className="w-full py-4 px-6 bg-black rounded-lg mt-auto cursor-pointer"
                  >
                    Começar Agora →
                  </ShinyButton>
                </BackgroundGradient>
              ) : (
                <div
                  key={index}
                  className="rounded-[22px] p-8 h-full flex flex-col transition-all duration-300 border-2 border-black"
                >
                  {/* Icon */}
                  <div className="flex justify-end mb-4">
                    <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center transition-colors duration-200">
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
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-lg text-gray-400 line-through">
                        R$ {plan.originalPrice}
                      </span>
                      <span className="bg-black text-white px-2 py-1 rounded text-xs font-bold">
                        {plan.discount} OFF
                      </span>
                    </div>
                    <span className="text-5xl font-bold text-black">
                      R${plan.price}
                    </span>
                    <span className="text-gray-600 text-base ml-2">plano</span>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-200 my-6"></div>

                  {/* Features */}
                  <div className="mb-8 flex-grow">
                    <p className="text-lg font-medium text-gray-700 mb-4">
                      Inclui:
                    </p>
                    <ul className="space-y-3">
                      {plan.features.map((feature, featureIndex) => (
                        <li
                          key={featureIndex}
                          className="flex items-start gap-3"
                        >
                          <Check className="w-5 h-5 text-black flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700 text-lg">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA Button */}
                  <ShinyButton
                    onClick={handleStartNow}
                    className="w-full py-4 px-6 bg-black rounded-lg mt-auto cursor-pointer"
                  >
                    Começar Agora →
                  </ShinyButton>
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section
        ref={videoReveal.ref}
        className={`w-full bg-gray-100 py-16 md:py-24 px-4 transition-all duration-1000 ease-out ${
          videoReveal.isVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-8"
        }`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="relative w-11/12 mx-auto overflow-hidden shadow-2xl bg-gray-100">
            {/* Layout em grid - Texto e Vídeo lado a lado */}
            <div className="grid md:grid-cols-[2fr_3fr] gap-8 p-8 relative z-10">
              {/* Lado esquerdo - Texto */}
              <div className="text-left flex flex-col justify-center">
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-black mb-6 md:mb-8 leading-tight drop-shadow-lg">
                  Você no controle da sua evolução
                </h2>

                <p className="text-lg md:text-xl text-black/90 leading-relaxed max-w-lg drop-shadow-md">
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
                  className="w-full max-w-md h-auto object-cover rounded-2xl shadow-2xl shadow-black/50"
                  src="/images/antesedepois.mp4"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="auto"
                  aria-label="Vídeo demonstrativo dos resultados do método Mova+"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section
        ref={faqReveal.ref}
        className={`w-full py-16 md:py-24 px-4 transition-all duration-1000 ease-out ${
          faqReveal.isVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-8"
        }`}
      >
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-zalando-medium text-black mb-12 text-center">
            Perguntas Frequentes
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-[22px] p-6 border-2 border-black bg-white">
              <h3 className="font-bold text-lg text-black mb-3">
                Posso gerar planos quando quiser?
              </h3>
              <p className="text-gray-700">
                Sim! Você paga apenas quando gerar um plano. Não há compromisso
                mensal ou assinatura. Use quando precisar.
              </p>
            </div>

            <div className="rounded-[22px] p-6 border-2 border-black bg-white">
              <h3 className="font-bold text-lg text-black mb-3">
                Qual método de pagamento aceito?
              </h3>
              <p className="text-gray-700">
                Aceitamos cartões de crédito e débito e PIX. O pagamento é
                processado de forma segura e instantânea.
              </p>
            </div>

            <div className="rounded-[22px] p-6 border-2 border-black bg-white">
              <h3 className="font-bold text-lg text-black mb-3">
                Posso comprar mais créditos depois?
              </h3>
              <p className="text-gray-700">
                Sim! Você pode comprar créditos adicionais a qualquer momento
                pelo dashboard, conforme sua necessidade.
              </p>
            </div>

            <div className="rounded-[22px] p-6 border-2 border-black bg-white">
              <h3 className="font-bold text-lg text-black mb-3">
                Como funciona a cobrança?
              </h3>
              <p className="text-gray-700">
                Cobrança apenas quando você gerar um plano personalizado. Pague
                somente pelo que usar, sem compromisso mensal.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
