"use client";

import { useEffect, useRef, useState } from "react";

const steps = [
  {
    number: "01",
    title: "Cadastre-se",
    description: "Crie sua conta em segundos e comece sua jornada fitness",
    instruction:
      "Preencha seus dados básicos para começarmos a montar sua experiência no Mova+. É rápido, simples e seguro!",
    image: "/images/03.jpg",
  },
  {
    number: "02",
    title: "Configure",
    description: "Defina seus objetivos e configure seu perfil.",
    instruction:
      "Responda algumas perguntas sobre seus objetivos, rotina, características físicas e nível de condicionamento. Essas informações são essenciais para criar um plano adequado para você.",
    image: "/images/02.jpg",
  },
  {
    number: "03",
    title: "Treine",
    description: "Receba treinos e planos alimentares ajustados ao seu nível.",
    instruction:
      "Com base nas suas informações, o Mova+ organiza um plano de treino e alimentação estruturado para o seu objetivo. Agora é sua vez: consistência e dedicação fazem toda a diferença.",
    image: "/images/07.jpg",
  },
  {
    number: "04",
    title: "Evolua",
    description: "Acompanhe seu progresso e visualize seus resultados.",
    instruction:
      "Monitore sua evolução ao longo do tempo, acompanhe mudanças no corpo e mantenha-se consistente a cada conquista. O progresso acontece passo a passo.",
    image: "/images/01.jpg",
  },
];

export function HowItWorksSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  // Estados para swipe no mobile
  const [currentStep, setCurrentStep] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Lógica de swipe
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    touchEndX.current = null;
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;

    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      setHoveredCard(currentStep + 1);
    }
    if (isRightSwipe && currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setHoveredCard(currentStep - 1);
    }
  };

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
    <section ref={sectionRef} className="w-full bg-white py-8 md:py-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center bg-gray-50 lg:bg-white rounded-2xl p-4">
          {/* Lado esquerdo - Texto motivador (apenas desktop) */}
          <div
            className={`hidden lg:block space-y-8 transition-all duration-1000 ease-out ${
              isVisible
                ? "opacity-100 translate-x-0"
                : "opacity-0 -translate-x-20"
            }`}
          >
            <div className="relative h-[500px]">
              {/* Texto padrão */}
              <div
                className={`absolute inset-0 transition-opacity duration-500 ${
                  hoveredCard === null ? "opacity-100" : "opacity-0"
                }`}
              >
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-zalando-black text-black lg:text-left lg:mb-8 mb-4 md:mb-6 leading-tight text-center">
                  Transforme sua vida em 4 passos simples!
                </h2>

                <p className="text-base md:text-lg lg:text-xl text-black/90 font-zalando max-w-3xl mx-auto mb-12 lg:leading-relaxed text-center lg:text-left leading-relaxed font-medium">
                  A jornada para um corpo saudável e uma vida com mais qualidade
                  começa aqui. Com o Mova+, cada passo é uma conquista, cada
                  treino é uma evolução
                </p>
              </div>

              {/* Texto de instrução no hover/tap */}
              {steps.map((step, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-opacity duration-500 ${
                    hoveredCard === index ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-zalando-black text-black mb-4 md:mb-6 text-center lg:text-left leading-tight">
                    {step.title}
                  </h2>

                  <p className="text-base md:text-lg lg:text-xl text-black/90 font-medium leading-relaxed text-center lg:text-left">
                    {step.instruction}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Texto padrão mobile - acima do carrossel */}
          <div className="lg:hidden text-center mt-6">
            <h2 className="text-3xl md:text-4xl font-zalando-black text-black mb-4 md:mb-6 leading-tight">
              Transforme sua vida em 4 passos simples!
            </h2>
            <p className="text-base md:text-lg text-black/90 font-zalando mb-0 leading-relaxed">
              A jornada para um corpo saudável e uma vida com mais qualidade
              começa aqui. Com o Mova+, cada passo é uma conquista, cada treino
              é uma evolução
            </p>
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
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Versão Mobile - Carrossel com Swipe */}
            <div className="lg:hidden -mt-2">
              <div
                ref={carouselRef}
                className="relative overflow-hidden rounded-2xl"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
              >
                <div
                  className="flex transition-transform duration-500 ease-out"
                  style={{
                    transform: `translateX(-${currentStep * 100}%)`,
                  }}
                >
                  {steps.map((step, index) => (
                    <div
                      key={index}
                      className="min-w-full relative h-[600px] rounded-2xl overflow-hidden shadow-lg"
                      style={{
                        backgroundImage: `url(${step.image})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    >
                      {/* Overlay escuro */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                      {/* Conteúdo do card com número, título e instrução */}
                      <div className="absolute bottom-16 left-0 right-0 p-6 text-white">
                        <div className="text-5xl font-zalando-black mb-2">
                          {step.number}
                        </div>
                        <h3 className="text-xl md:text-2xl font-zalando-bold mb-4 leading-tight">
                          {step.title}
                        </h3>
                        <p className="text-base md:text-lg font-zalando leading-relaxed opacity-90">
                          {step.instruction}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Indicadores de slide (dots) */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                  {steps.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setCurrentStep(index);
                        setHoveredCard(index);
                      }}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        currentStep === index ? "bg-white w-8" : "bg-white/50"
                      }`}
                      aria-label={`Ir para passo ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
