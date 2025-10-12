"use client";

import { useEffect, useRef, useState } from "react";

const steps = [
  {
    number: "01",
    title: "01. Cadastre-se",
    description: "Crie sua conta em segundos e comece sua jornada fitness.",
    instruction:
      "Preencha seus dados básicos para começarmos a te conhecer melhor. É rápido e seguro!",
  },
  {
    number: "02",
    title: "02. Configure",
    description: "Defina seus objetivos e configure seu perfil.",
    instruction:
      "Responda algumas perguntas sobre seus objetivos, características físicas e nível de condicionamento. Essa parte é muito importante para conseguirmos criar um plano específico para você.",
  },
  {
    number: "03",
    title: "03. Treine",
    description:
      "Acesse treinos personalizados e dieta adaptados ao seu nível.",
    instruction:
      "Nossa IA criará um plano de treino e uma dieta exclusiva para você. Aqui contamos com todo o seu empenho e dedicação para juntos alcançarmos seus objetivos.",
  },
  {
    number: "04",
    title: "04. Evolua",
    description: "Acompanhe seu progresso e veja seus resultados.",
    instruction:
      "Registre seus treinos, tire fotos do progresso e celebre cada conquista alcançada! Estaremos aqui para te apoiar e torcendo por você!",
  },
];

export function HowItWorksSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [hasAnimated, setHasAnimated] = useState(false); // NOVO

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            // Marcar como animado após o último card terminar (800ms delay + 700ms animação)
            setTimeout(() => setHasAnimated(true), 1500);
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
    <section ref={sectionRef} className="w-full bg-white py-20 md:py-32">
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
            <div className="relative min-h-[380px]">
              {/* Texto padrão */}
              <div
                className={`transition-opacity duration-700 ease-in-out ${
                  hoveredCard === null
                    ? "opacity-100 relative"
                    : "opacity-0 absolute inset-0 pointer-events-none"
                }`}
              >
                <h2 className="text-4xl md:text-7xl text-black mb-8">
                  Transforme sua vida em 4 passos simples!
                </h2>

                <p className="text-2xl text-gray-600 leading-relaxed">
                  A jornada para um corpo saudável e uma vida com mais qualidade
                  começa aqui. Com o Mova+, cada passo é uma conquista, cada
                  treino é uma evolução.
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

                <p className="text-2xl text-gray-600 leading-relaxed">
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
                  className={`flex-shrink-0 w-[150px] h-[600px] rounded-2xl p-8 shadow-md cursor-pointer ${
                    isVisible
                      ? "opacity-100 scale-100 translate-y-0"
                      : "opacity-0 scale-90 translate-y-12"
                  }`}
                  style={{
                    backgroundImage: "url(/images/03.jpg)",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    transition: hasAnimated
                      ? "all 0.3s ease-out" // Depois de animar, hover rápido
                      : "opacity 0.7s ease-out 0.2s, transform 0.7s ease-out 0.2s", // Primeira vez, entrada lenta
                  }}
                  onMouseEnter={() => setHoveredCard(0)}
                  onMouseLeave={() => setHoveredCard(null)}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform =
                      "scale(1.05) rotate(2deg)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = "scale(1) rotate(0deg)";
                  }}
                >
                  {/* Card vazio - apenas imagem de fundo */}
                </div>

                {/* Card 2 */}
                <div
                  className={`flex-shrink-0 w-[150px] h-[600px] rounded-3xl p-8 shadow-md cursor-pointer ${
                    isVisible
                      ? "opacity-100 scale-100 translate-y-0"
                      : "opacity-0 scale-90 translate-y-12"
                  }`}
                  style={{
                    backgroundImage: "url(/images/02.jpg)",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    transition: hasAnimated
                      ? "all 0.3s ease-out"
                      : "opacity 0.7s ease-out 0.4s, transform 0.7s ease-out 0.4s",
                  }}
                  onMouseEnter={() => setHoveredCard(1)}
                  onMouseLeave={() => setHoveredCard(null)}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform =
                      "scale(1.05) rotate(-2deg)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = "scale(1) rotate(0deg)";
                  }}
                >
                 
                </div>

                {/* Card 3 */}
                <div
                  className={`flex-shrink-0 w-[150px] h-[600px] rounded-xl p-8 shadow-md cursor-pointer ${
                    isVisible
                      ? "opacity-100 scale-100 translate-y-0"
                      : "opacity-0 scale-90 translate-y-12"
                  }`}
                  style={{
                    backgroundImage: "url(/images/07.jpg)",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    transition: hasAnimated
                      ? "all 0.3s ease-out"
                      : "opacity 0.7s ease-out 0.6s, transform 0.7s ease-out 0.6s",
                  }}
                  onMouseEnter={() => setHoveredCard(2)}
                  onMouseLeave={() => setHoveredCard(null)}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform =
                      "scale(1.05) rotate(2deg)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = "scale(1) rotate(0deg)";
                  }}
                >
              
                </div>

                {/* Card 4 */}
                <div
                  className={`flex-shrink-0 w-[150px] h-[600px] rounded-2xl p-8 shadow-md cursor-pointer ${
                    isVisible
                      ? "opacity-100 scale-100 translate-y-0"
                      : "opacity-0 scale-90 translate-y-12"
                  }`}
                  style={{
                    backgroundImage: "url(/images/01.jpg)",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    transition: hasAnimated
                      ? "all 0.3s ease-out"
                      : "opacity 0.7s ease-out 0.8s, transform 0.7s ease-out 0.8s",
                  }}
                  onMouseEnter={() => setHoveredCard(3)}
                  onMouseLeave={() => setHoveredCard(null)}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform =
                      "scale(1.05) rotate(-2deg)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = "scale(1) rotate(0deg)";
                  }}
                >
                 
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
