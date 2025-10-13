"use client";

import { useEffect, useRef, useState } from "react";

const steps = [
  {
    number: "01",
    title: "Cadastre-se",
    description: "Crie sua conta em segundos e comece sua jornada fitness.",
    instruction:
      "Preencha seus dados básicos para começarmos a te conhecer melhor. É rápido e seguro!",
    image: "/images/03.jpg",
  },
  {
    number: "02",
    title: "Configure",

    description: "Defina seus objetivos e configure seu perfil.",
    instruction:
      "Responda algumas perguntas sobre seus objetivos, características físicas e nível de condicionamento. Essa parte é muito importante para conseguirmos criar um plano específico para você.",
    image: "/images/02.jpg",
  },
  {
    number: "03",
    title: "Treine",

    description:
      "Acesse treinos personalizados e dieta adaptados ao seu nível.",
    instruction:
      "Nossa IA criará um plano de treino e uma dieta exclusiva para você. Aqui contamos com todo o seu empenho e dedicação para juntos alcançarmos seus objetivos.",
    image: "/images/07.jpg",
  },
  {
    number: "04",
    title: "Evolua",

    description: "Acompanhe seu progresso e veja seus resultados.",
    instruction:
      "Registre seus treinos, tire fotos do progresso e celebre cada conquista alcançada! Estaremos aqui para te apoiar e torcendo por você!",
    image: "/images/01.jpg",
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
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="w-full bg-white py-20 md:py-32">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Lado esquerdo - Texto motivador */}
          <div
            className={`space-y-8 transition-all duration-1000 ease-out ${
              isVisible
                ? "opacity-100 translate-x-0"
                : "opacity-0 -translate-x-20"
            }`}
          >
            <div className="relative min-h-[380px]">
              {/* Texto padrão */}
              <div
                className={`absolute inset-0 transition-opacity duration-500 ${
                  hoveredCard === null ? "opacity-100" : "opacity-0"
                }`}
              >
                <h2 className="text-4xl md:text-7xl font-zalando-black text-black mb-8">
                  Transforme sua vida em 4 passos simples!
                </h2>

                <p className="text-2xl roboto-regular text-gray-600 leading-relaxed">
                  A jornada para um corpo saudável e uma vida com mais qualidade
                  começa aqui. Com o Mova+, cada passo é uma conquista, cada
                  treino é uma evolução.
                </p>
              </div>

              {/* Texto de instrução no hover */}
              {steps.map((step, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-opacity duration-500 ${
                    hoveredCard === index ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <h2 className="text-4xl md:text-7xl font-zalando-black text-black mb-8">
                    {step.title}
                  </h2>

                  <p className="text-2xl roboto-regular text-gray-600 leading-relaxed">
                    {step.instruction}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Lado direito - Cards */}
          <div
            className={`transition-all duration-1000 ease-out ${
              isVisible
                ? "opacity-100 translate-x-0"
                : "opacity-0 translate-x-20"
            }`}
          >
            {/* Versão Desktop - Cards lado a lado */}
            <div className="hidden lg:block">
              <div className="flex flex-row justify-center items-center gap-4">
                {steps.map((step, index) => (
                  <div
                    key={index}
                    className={`group relative flex-shrink-0 w-[150px] h-[600px] rounded-2xl 
                               shadow-lg cursor-pointer overflow-hidden
                               transition-all duration-300 ease-out
                               ${
                                 isVisible
                                   ? "opacity-100 scale-100 translate-y-0"
                                   : "opacity-0 scale-95 translate-y-12"
                               }
                               ${
                                 hoveredCard === index
                                   ? "scale-105 shadow-2xl z-10"
                                   : "scale-100"
                               }`}
                    style={{
                      backgroundImage: `url(${step.image})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      transitionDelay:
                        isVisible && hoveredCard === null
                          ? `${index * 0.15}s`
                          : "0s",
                    }}
                    onMouseEnter={() => setHoveredCard(index)}
                    onMouseLeave={() => setHoveredCard(null)}
                  >
                    {/* Overlay escuro no hover */}
                    <div
                      className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent 
                                    opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    />

                    {/* Conteúdo no hover com slide up */}
                    <div
                      className="absolute bottom-8 left-8 right-8 opacity-0 group-hover:opacity-100 
                                    transition-all duration-300 transform translate-y-4 group-hover:translate-y-0"
                    >
                      <div className="text-5xl font-zalando-black text-white mb-2">
                        {step.number}
                      </div>
                      <div className="text-lg font-zalando-bold text-white leading-tight">
                        {step.titleCard}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Versão Mobile - Cards empilhados */}
            <div className="lg:hidden space-y-6">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className={`bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 
                             shadow-md transition-all duration-500 hover:scale-105 hover:shadow-xl
                             ${
                               isVisible
                                 ? "opacity-100 translate-y-0"
                                 : "opacity-0 translate-y-10"
                             }`}
                  style={{ transitionDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-start space-x-4">
                    <div className="text-4xl font-zalando-black text-purple-600 flex-shrink-0">
                      {step.number}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-zalando-bold text-gray-800 mb-2">
                        {step.title}
                      </h3>
                      <p className="text-lg roboto-regular text-gray-600 leading-relaxed">
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
