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
    description: "Defina seus objetivos e configure seu perfil personalizado.",
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
          } else {
            setIsVisible(false);
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

          {/* Lado direito - Cards maiores */}
          <div
            className={`relative h-[700px] transition-all duration-1000 ease-out ${
              isVisible
                ? "opacity-100 transform translate-x-0"
                : "opacity-0 transform translate-x-[100px]"
            }`}
          >
            {/* Card 1 */}
            <div
              className={`absolute top-0 left-10 w-80 h-80 bg-[#f5f1e8] rounded-2xl p-10 hover:border-gray-400 transition-all duration-500 transform hover:scale-105 hover:rotate-2 shadow-md ${
                isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
              }`}
              style={{ zIndex: 4, animationDelay: "200ms" }}
            >
              <div className="h-full flex flex-col">
                <div className="text-6xl font-bold text-gray-800 mb-6 font-poppins tracking-tight">
                  1.
                </div>
                <h3 className="text-3xl font-bold text-gray-800 mb-3 font-poppins">
                  Cadastre-se
                </h3>
                <p className="text-xl text-gray-600 font-inter leading-relaxed">
                  {steps[0].description}
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div
              className={`absolute top-0 -right-25 w-80 h-80 bg-[#f5f1e8]  rounded-3xl p-10 hover:border-gray-400 transition-all duration-500 transform hover:scale-105 hover:-rotate-2 shadow-md ${
                isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
              }`}
              style={{ zIndex: 3, animationDelay: "400ms" }}
            >
              <div className="h-full flex flex-col">
                <div className="text-6xl font-bold text-gray-800 mb-6 font-poppins tracking-tight">
                  2.
                </div>
                <h3 className="text-3xl font-bold text-gray-800 mb-3 font-poppins">
                  Configure
                </h3>
                <p className="text-xl text-gray-600 font-inter leading-relaxed">
                  {steps[1].description}
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div
              className={`absolute bottom-7 left-10 w-80 h-80 bg-[#f5f1e8]  rounded-xl p-10 hover:border-gray-400 transition-all duration-500 transform hover:scale-105 hover:rotate-1 shadow-md ${
                isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
              }`}
              style={{ zIndex: 2, animationDelay: "600ms" }}
            >
              <div className="h-full flex flex-col">
                <div className="text-6xl font-bold text-gray-800 mb-6 font-poppins tracking-tight">
                  3.
                </div>
                <h3 className="text-3xl font-bold text-gray-800 mb-3 font-poppins">
                  Treine
                </h3>
                <p className="text-xl text-gray-600 font-inter leading-relaxed">
                  {steps[2].description}
                </p>
              </div>
            </div>

            {/* Card 4 */}
            <div
              className={`absolute bottom-7 -right-25 w-80 h-80 bg-[#f5f1e8]  rounded-2xl p-10 hover:border-gray-400 transition-all duration-500 transform hover:scale-105 hover:-rotate-1 shadow-md ${
                isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
              }`}
              style={{ zIndex: 1, animationDelay: "800ms" }}
            >
              <div className="h-full flex flex-col">
                <div className="text-6xl font-bold text-gray-800 mb-6 font-poppins tracking-tight">
                  4.
                </div>
                <h3 className="text-3xl font-bold text-gray-800 mb-3 font-poppins">
                  Evolua
                </h3>
                <p className="text-xl text-gray-600 font-inter leading-relaxed">
                  {steps[3].description}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
