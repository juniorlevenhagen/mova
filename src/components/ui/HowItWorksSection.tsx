"use client";

import { useEffect, useRef, useState } from "react";

const steps = [
  {
    number: "01",
    title: "Cadastre-se",
    description: "Crie sua conta em segundos e comece sua jornada fitness.",
  },
  {
    number: "02",
    title: "Configure",
    description: "Defina seus objetivos e configure seu perfil.",
  },
  {
    number: "03",
    title: "Treine",
    description: "Acesse treinos personalizados adaptados ao seu nível.",
  },
  {
    number: "04",
    title: "Evolua",
    description: "Acompanhe seu progresso e veja seus resultados.",
  },
];

export function HowItWorksSection() {
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

  return (
    <section ref={sectionRef} className="w-full bg-white py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Lado esquerdo - Texto motivador */}
          <div
            className={`space-y-8 transition-all duration-1000 ease-out ${
              isVisible
                ? "opacity-100 transform translate-x-0"
                : "opacity-0 transform translate-x-[-100px]"
            }`}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 leading-tight">
              Transforme sua vida em
              <span className="block text-gray-600 font-light">
                4 passos simples
              </span>
            </h2>

            <p className="text-xl text-gray-600 leading-relaxed">
              A jornada para o seu melhor eu começa aqui. Com o Mova+, cada
              passo é uma conquista, cada treino é uma evolução.
            </p>

            <p className="text-lg text-gray-500">
              Descubra como é fácil começar e como é gratificante ver seus
              resultados aparecerem.
            </p>
          </div>

          {/* Lado direito - Cards responsivos */}
          <div
            className={`transition-all duration-1000 ease-out ${
              isVisible
                ? "opacity-100 transform translate-x-0"
                : "opacity-0 transform translate-x-[100px]"
            }`}
          >
            {/* Versão Desktop - Cards sobrepostos */}
            <div className="hidden lg:block relative h-[600px]">
              {/* Card 1 - Topo esquerdo */}
              <div
                className={`absolute top-0 left-0 w-72 h-72 bg-[#f5f1e8] rounded-2xl p-8 hover:border-gray-400 transition-all duration-500 transform hover:scale-105 hover:rotate-2 shadow-md ${
                  isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
                }`}
                style={{ zIndex: 4, animationDelay: "200ms" }}
              >
                <div className="h-full flex flex-col">
                  <div className="text-5xl font-bold text-gray-800 mb-4 font-poppins tracking-tight">
                    1.
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-3 font-poppins">
                    Cadastre-se
                  </h3>
                  <p className="text-lg text-gray-600 font-inter leading-relaxed">
                    {steps[0].description}
                  </p>
                </div>
              </div>

              {/* Card 2 - Topo direito */}
              <div
                className={`absolute top-0 right-0 w-72 h-72 bg-[#f5f1e8] rounded-3xl p-8 hover:border-gray-400 transition-all duration-500 transform hover:scale-105 hover:-rotate-2 shadow-md ${
                  isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
                }`}
                style={{ zIndex: 3, animationDelay: "400ms" }}
              >
                <div className="h-full flex flex-col">
                  <div className="text-5xl font-bold text-gray-800 mb-4 font-poppins tracking-tight">
                    2.
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-3 font-poppins">
                    Configure
                  </h3>
                  <p className="text-lg text-gray-600 font-inter leading-relaxed">
                    {steps[1].description}
                  </p>
                </div>
              </div>

              {/* Card 3 - Baixo esquerdo */}
              <div
                className={`absolute bottom-0 left-0 w-72 h-72 bg-[#f5f1e8] rounded-xl p-8 hover:border-gray-400 transition-all duration-500 transform hover:scale-105 hover:rotate-1 shadow-md ${
                  isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
                }`}
                style={{ zIndex: 2, animationDelay: "600ms" }}
              >
                <div className="h-full flex flex-col">
                  <div className="text-5xl font-bold text-gray-800 mb-4 font-poppins tracking-tight">
                    3.
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-3 font-poppins">
                    Treine
                  </h3>
                  <p className="text-lg text-gray-600 font-inter leading-relaxed">
                    {steps[2].description}
                  </p>
                </div>
              </div>

              {/* Card 4 - Baixo direito */}
              <div
                className={`absolute bottom-0 right-0 w-72 h-72 bg-[#f5f1e8] rounded-2xl p-8 hover:border-gray-400 transition-all duration-500 transform hover:scale-105 hover:-rotate-1 shadow-md ${
                  isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
                }`}
                style={{ zIndex: 1, animationDelay: "800ms" }}
              >
                <div className="h-full flex flex-col">
                  <div className="text-5xl font-bold text-gray-800 mb-4 font-poppins tracking-tight">
                    4.
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-3 font-poppins">
                    Evolua
                  </h3>
                  <p className="text-lg text-gray-600 font-inter leading-relaxed">
                    {steps[3].description}
                  </p>
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
