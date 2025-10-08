"use client";

import { useEffect, useRef, useState } from "react";

const steps = [
  {
    number: "01",
    title: "01. Cadastre-se",
    description: "Crie sua conta em segundos e comece sua jornada fitness.",
    instruction:
      "Clique no botão 'Começar agora' e preencha seus dados básicos. É rápido e seguro!",
  },
  {
    number: "02",
    title: "02. Configure",
    description: "Defina seus objetivos e configure seu perfil.",
    instruction:
      "Responda algumas perguntas sobre seus objetivos, peso atual e nível de condicionamento físico.",
  },
  {
    number: "03",
    title: "03. Treine",
    description: "Acesse treinos personalizados adaptados ao seu nível.",
    instruction:
      "Nossa IA criará um plano de treino exclusivo para você. Siga as instruções e veja os resultados!",
  },
  {
    number: "04",
    title: "04. Evolua",
    description: "Acompanhe seu progresso e veja seus resultados.",
    instruction:
      "Registre seus treinos, tire fotos do progresso e celebre cada conquista alcançada!",
  },
];

export function HowItWorksSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

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

  return (
    <section ref={sectionRef} className="w-full bg-white py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Lado esquerdo - Texto motivador que muda no hover */}
          <div
            className={`space-y-8 transition-all duration-1000 ease-out ${
              isVisible
                ? "opacity-100 transform translate-x-0"
                : "opacity-0 transform translate-x-[-100px]"
            }`}
          >
            {/* Texto padrão ou instrução no hover */}
            <div className="relative min-h-[315px]">
              {/* Texto padrão */}
              <div
                className={`transition-opacity duration-700 ease-in-out ${
                  hoveredCard === null
                    ? "opacity-100 relative"
                    : "opacity-0 absolute inset-0 pointer-events-none"
                }`}
              >
                <h2 className="text-4xl md:text-7xl text-black mb-8">
                  Transforme sua vida em 4 passos simples
                </h2>

                <p className="text-xl text-gray-600 leading-relaxed">
                  A jornada para o seu melhor eu começa aqui. Com o Mova+, cada
                  passo é uma conquista, cada treino é uma evolução.
                </p>
              </div>

              {/* Texto de instrução no hover */}
              <div
                className={`transition-opacity duration-700 ease-in-out ${
                  hoveredCard !== null
                    ? "opacity-100 relative"
                    : "opacity-0 absolute inset-0 pointer-events-none"
                }`}
              >
                <h2 className="text-4xl md:text-7xl text-black mb-8">
                  {hoveredCard !== null && steps[hoveredCard].title}
                </h2>

                <p className="text-xl text-gray-600 leading-relaxed">
                  {hoveredCard !== null && steps[hoveredCard].instruction}
                </p>
              </div>
            </div>
          </div>

          {/* Lado direito - Cards responsivos */}
          <div
            className={`transition-all duration-1000 ease-out ${
              isVisible
                ? "opacity-100 transform translate-x-0"
                : "opacity-0 transform translate-x-[100px]"
            }`}
          >
            {/* Versão Desktop - Cards lado a lado */}
            <div className="hidden lg:block">
              <div className="flex flex-row justify-center items-center gap-4 max-w-8xl mx-auto px-4">
                {/* Card 1 */}
                <div
                  className={`flex-shrink-0 w-[150px] h-[600px] rounded-2xl p-8 hover:border-gray-400 transition-all duration-500 transform hover:scale-105 hover:rotate-2 shadow-md cursor-pointer ${
                    isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
                  }`}
                  style={{
                    animationDelay: "200ms",
                    backgroundImage: "url(/images/03.jpg)",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                  onMouseEnter={() => setHoveredCard(0)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  {/* Card vazio - apenas imagem de fundo */}
                </div>

                {/* Card 2 */}
                <div
                  className={`flex-shrink-0 w-[150px] h-[600px] rounded-3xl p-8 hover:border-gray-400 transition-all duration-500 transform hover:scale-105 hover:-rotate-2 shadow-md cursor-pointer ${
                    isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
                  }`}
                  style={{
                    animationDelay: "400ms",
                    backgroundImage: "url(/images/02.jpg)",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                  onMouseEnter={() => setHoveredCard(1)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  {/* Card vazio - apenas imagem de fundo */}
                </div>

                {/* Card 3 */}
                <div
                  className={`flex-shrink-0 w-[150px] h-[600px] rounded-xl p-8 hover:border-gray-400 transition-all duration-500 transform hover:scale-105 hover:rotate-1 shadow-md cursor-pointer ${
                    isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
                  }`}
                  style={{
                    animationDelay: "600ms",
                    backgroundImage: "url(/images/07.jpg)",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                  onMouseEnter={() => setHoveredCard(2)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  {/* Card vazio - apenas imagem de fundo */}
                </div>

                {/* Card 4 */}
                <div
                  className={`flex-shrink-0 w-[150px] h-[600px] rounded-2xl p-8 hover:border-gray-400 transition-all duration-500 transform hover:scale-105 hover:-rotate-1 shadow-md cursor-pointer ${
                    isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
                  }`}
                  style={{
                    animationDelay: "800ms",
                    backgroundImage: "url(/images/01.jpg)",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                  onMouseEnter={() => setHoveredCard(3)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  {/* Card vazio - apenas imagem de fundo */}
                </div>
              </div>
            </div>

            {/* Versão Mobile - Cards empilhados */}
            <div className="lg:hidden space-y-6">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className={`bg-[#f5f1e8] rounded-2xl p-6 shadow-md transition-all duration-500 transform hover:scale-105 ${
                    isVisible
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-10"
                  }`}
                  style={{ animationDelay: `${(index + 1) * 200}ms` }}
                >
                  <div className="flex items-start space-x-4">
                    <div className="text-4xl font-bold text-gray-800 font-poppins tracking-tight flex-shrink-0">
                      {index + 1}.
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-800 mb-2 font-poppins">
                        {step.title}
                      </h3>
                      <p className="text-lg text-gray-600 font-inter leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
