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

  // Estados para swipe no mobile
  const [currentStep, setCurrentStep] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState<number>(200);

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

  // Medir altura do texto do passo 2 (o mais longo) para fixar altura do container
  useEffect(() => {
    if (measureRef.current) {
      const height = measureRef.current.offsetHeight;
      // altura do texto + padding vertical (p-8 = 32px top + 32px bottom = 64px) + um pouco extra para segurança
      setContainerHeight(height + 80);
    }
  }, []);

  return (
    <section ref={sectionRef} className="w-full bg-white py-8 md:py-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
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
                <h2 className="text-4xl text-center md:text-7xl font-zalando-black text-black lg:text-left lg:mb-8 mb-8 -mt-6">
                  Transforme sua vida em 4 passos simples!
                </h2>

                <p className="text-xl md:text-2xl text-gray-600 font-zalando max-w-3xl mx-auto mb-12 lg:leading-relaxed text-center lg:text-left">
                  A jornada para um corpo saudável e uma vida com mais qualidade
                  começa aqui. Com o Mova+, cada passo é uma conquista, cada
                  treino é uma evolução.
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
                  <h2 className="text-4xl md:text-7xl font-zalando-black text-black mb-8 text-center lg:text-left">
                    {step.title}
                  </h2>

                  <p className="text-xl md:text-2xl roboto-regular text-gray-600 leading-relaxed text-center lg:text-left">
                    {step.instruction}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Texto padrão mobile - acima do carrossel */}
          <div className="lg:hidden text-center mb-8">
            <h2 className="text-4xl font-zalando-black text-black mb-4">
              Transforme sua vida em 4 passos simples!
            </h2>
            <p className="text-xl text-gray-600 font-zalando">
              A jornada para um corpo saudável e uma vida com mais qualidade
              começa aqui. Com o Mova+, cada passo é uma conquista, cada treino
              é uma evolução.
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
            <div className="lg:hidden">
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
                      className="min-w-full relative h-[400px] rounded-2xl overflow-hidden shadow-lg"
                      style={{
                        backgroundImage: `url(${step.image})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    >
                      {/* Overlay escuro */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

                      {/* Conteúdo do card com número e título */}
                      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                        <div className="text-5xl font-zalando-black mb-2">
                          {step.number}
                        </div>
                        <h3 className="text-2xl font-zalando-bold">
                          {step.title}
                        </h3>
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

              {/* Elemento invisível para medir altura do passo 2 (texto mais longo) */}
              <div className="absolute opacity-0 pointer-events-none -z-50 invisible">
                <div ref={measureRef} className="px-2">
                  <p className="text-xl md:text-2xl text-gray-800 font-zalando leading-tight text-center w-full">
                    {steps[1].instruction}
                  </p>
                </div>
              </div>

              {/* Texto instruction abaixo do carrossel no mobile */}
              <div className="mt-12 relative z-10">
                {/* Indicador do passo atual no topo - posicionado acima do card */}
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-20">
                  <div className="flex items-center gap-1 bg-white px-4 py-1.5 rounded-full shadow-lg border border-purple-200">
                    <span className="text-xs font-semibold text-gray-700">
                      Passo {currentStep + 1}
                    </span>
                  </div>
                </div>

                {/* Card principal com gradiente e efeitos - altura fixa baseada no passo 2 */}
                <div
                  className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 md:p-10 shadow-xl border border-purple-100/50 transition-all duration-500 flex items-center justify-center"
                  style={{ height: `${containerHeight}px` }}
                >
                  {/* Efeito de brilho animado no fundo */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer"></div>

                  {/* Elementos decorativos de fundo */}
                  <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-blue-400/20 to-cyan-400/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>

                  {/* Conteúdo do texto */}
                  <div className="relative z-10 px-2 py-4">
                    <p className="text-xl md:text-2xl text-gray-800 font-zalando leading-tight text-center">
                      {steps[currentStep].instruction}
                    </p>
                  </div>

                  {/* Borda decorativa inferior */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-purple-400 to-transparent opacity-50"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
