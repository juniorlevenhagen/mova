"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

const plan = {
  name: "Mova+ Complete",
  price: "R$ 29,90",
  period: "/mês",
  description: "Sua jornada fitness completa e personalizada",
  features: [
    "Treinos personalizados baseados no seu perfil",
    "Planos nutricionais adaptados às suas preferências",
    "Acompanhamento semanal do seu progresso",
    "Biblioteca completa de exercícios com vídeos",
    "Receitas deliciosas para cada objetivo",
    "Comunidade ativa para trocar experiências",
    "Acompanhamento visual do seu progresso",
    "Lembretes personalizados para manter a consistência",
    "Suporte para suas dúvidas mais comuns",
  ],
  buttonText: "Começar Minha Jornada",
  trialText: "7 dias grátis",
};

export function PricingSection() {
  const router = useRouter();
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleStartJourney = () => {
    router.push("/register/step0");
  };

  return (
    <div>
      {/* Título da seção - Fundo branco */}
      <section className="w-full bg-white py-16 md:py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div
            className={`text-center transition-all duration-1000 ease-out ${
              isVisible
                ? "opacity-100 transform translate-y-0"
                : "opacity-0 transform translate-y-10"
            }`}
          >
            <h2 className="text-2xl md:text-4xl font-bold text-gray-800 mb-4">
              Sua transformação começa aqui
            </h2>
            <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
              Tudo que você precisa para transformar seu corpo e sua vida, com
              uma experiência personalizada que se adapta ao seu ritmo.
            </p>
          </div>
        </div>
      </section>

      {/* Seção com imagem de fundo */}
      <section
        ref={sectionRef}
        className="relative w-full py-16 md:py-20 px-4 overflow-hidden"
      >
        {/* Imagem de fundo responsiva */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/feature-card-5.webp"
            alt="Background fitness"
            fill
            className="object-cover object-center"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
            priority
            quality={85}
          />
          {/* Overlay para melhorar legibilidade em mobile */}
          <div className="absolute inset-0 bg-black/20 md:bg-black/10"></div>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto">
          {/* Layout horizontal principal */}
          <div
            className={`bg-white/95 md:bg-white/90 backdrop-blur-sm rounded-2xl p-6 md:p-8 lg:p-12 shadow-xl border border-white/20 transition-all duration-1000 ease-out ${
              isVisible
                ? "opacity-100 transform translate-y-0 scale-100"
                : "opacity-0 transform translate-y-10 scale-95"
            }`}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 lg:gap-12 items-center">
              {/* Lado esquerdo - Informações do plano */}
              <div
                className={`transition-all duration-1000 ease-out delay-200 ${
                  isVisible
                    ? "opacity-100 transform translate-x-0"
                    : "opacity-0 transform -translate-x-10"
                }`}
              >
                <div className="mb-4 md:mb-6">
                  <span className="inline-block bg-gray-800 text-white px-3 md:px-4 py-1 rounded-full text-xs md:text-sm font-medium mb-3 md:mb-4 transition-colors duration-200">
                    Plano Completo
                  </span>
                  <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 mb-2 md:mb-3">
                    {plan.name}
                  </h3>
                  <p className="text-sm md:text-base text-gray-600 mb-3 md:mb-4">
                    {plan.description}
                  </p>
                </div>

                {/* Preço */}
                <div className="mb-4 md:mb-6">
                  <div className="flex items-baseline">
                    <span className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800">
                      {plan.price}
                    </span>
                    <span className="text-gray-600 ml-2 text-lg md:text-xl">
                      {plan.period}
                    </span>
                  </div>
                  <div className="text-gray-600 text-xs md:text-sm mt-2">
                    {plan.trialText}
                  </div>
                </div>

                {/* Botão CTA */}
                <button
                  onClick={handleStartJourney}
                  className="w-full md:w-auto bg-gradient-to-r from-blue-500 to-green-500 text-white py-3 px-6 md:px-8 rounded-lg font-medium hover:from-blue-600 hover:to-green-600 transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg hover:shadow-xl text-base md:text-lg"
                >
                  {plan.buttonText}
                </button>
                <p className="text-xs text-gray-500 mt-2 md:mt-3">
                  Cancele a qualquer momento. Sem taxas ocultas.
                </p>
              </div>

              {/* Lado direito - Lista de recursos */}
              <div
                className={`transition-all duration-1000 ease-out delay-400 ${
                  isVisible
                    ? "opacity-100 transform translate-x-0"
                    : "opacity-0 transform translate-x-10"
                }`}
              >
                <h4 className="text-base md:text-lg font-semibold text-gray-800 mb-3 md:mb-4">
                  O que está incluído:
                </h4>
                <div className="grid grid-cols-1 gap-2 md:gap-3">
                  {plan.features.map((feature, index) => (
                    <div
                      key={index}
                      className={`flex items-start transition-all duration-500 ease-out ${
                        isVisible
                          ? "opacity-100 transform translate-x-0"
                          : "opacity-0 transform translate-x-5"
                      }`}
                      style={{ transitionDelay: `${600 + index * 100}ms` }}
                    >
                      <svg
                        className="w-3 h-3 md:w-4 md:h-4 text-gray-800 mt-0.5 mr-2 md:mr-3 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-base md:text-lg text-gray-700">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Benefícios em linha horizontal */}
          <div
            className={`mt-8 md:mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 transition-all duration-1000 ease-out delay-600 ${
              isVisible
                ? "opacity-100 transform translate-y-0"
                : "opacity-0 transform translate-y-10"
            }`}
          >
            <div className="text-center group bg-white/80 backdrop-blur-sm rounded-xl p-4 md:p-6 shadow-lg border border-white/20">
              <h4 className="text-base md:text-lg font-semibold text-gray-800 mb-2 group-hover:text-gray-600 transition-colors duration-200">
                Personalizado
              </h4>
              <p className="text-xs md:text-sm text-gray-600 group-hover:text-gray-700 transition-colors duration-200">
                Cada treino e plano nutricional é criado pensando
                especificamente em você
              </p>
            </div>
            <div className="text-center group bg-white/80 backdrop-blur-sm rounded-xl p-4 md:p-6 shadow-lg border border-white/20">
              <h4 className="text-base md:text-lg font-semibold text-gray-800 mb-2 group-hover:text-gray-600 transition-colors duration-200">
                Acompanhamento
              </h4>
              <p className="text-xs md:text-sm text-gray-600 group-hover:text-gray-700 transition-colors duration-200">
                Seu progresso é monitorado e os planos são ajustados conforme
                sua evolução
              </p>
            </div>
            <div className="text-center group bg-white/80 backdrop-blur-sm rounded-xl p-4 md:p-6 shadow-lg border border-white/20">
              <h4 className="text-base md:text-lg font-semibold text-gray-800 mb-2 group-hover:text-gray-600 transition-colors duration-200">
                Comunidade
              </h4>
              <p className="text-xs md:text-sm text-gray-600 group-hover:text-gray-700 transition-colors duration-200">
                Conecte-se com pessoas que compartilham dos mesmos objetivos que
                você
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
