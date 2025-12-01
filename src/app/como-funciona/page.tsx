"use client";

import { useState, useEffect, useRef } from "react";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { ShinyButton } from "@/components/ui/shiny-button";
import Link from "next/link";
import {
  UserPlus,
  Settings,
  FileText,
  TrendingUp,
  Bot,
  Target,
  BarChart3,
  Users,
} from "lucide-react";

const detailedSteps = [
  {
    number: "01",
    title: "Cadastre-se",
    description: "Crie sua conta em segundos e comece sua jornada fitness.",
    details: [
      "Preencha seus dados básicos",
      "Confirme seu email",
      "Escolha sua senha segura",
      "Aceite os termos de uso",
    ],
    icon: UserPlus,
  },
  {
    number: "02",
    title: "Configure seu Perfil",
    description: "Defina seus objetivos e configure seu perfil personalizado.",
    details: [
      "Informe seus dados físicos",
      "Defina seus objetivos fitness",
      "Mencione limitações ou lesões",
      "Escolha seu nível de experiência",
    ],
    icon: Settings,
  },
  {
    number: "03",
    title: "Receba seu Plano",
    description: "Nossa IA cria um plano personalizado baseado no seu perfil.",
    details: [
      "Treinos adaptados ao seu nível",
      "Plano nutricional personalizado",
      "Cronograma de evolução",
      "Metas realistas e alcançáveis",
    ],
    icon: FileText,
  },
  {
    number: "04",
    title: "Execute e Evolua",
    description: "Acompanhe seu progresso e veja seus resultados.",
    details: [
      "Siga seu plano diário",
      "Registre suas evoluções",
      "Ajustes automáticos do plano",
      "Celebre suas conquistas",
    ],
    icon: TrendingUp,
  },
];

const features = [
  {
    title: "Inteligência Artificial",
    description: "Nossa IA analisa seus dados e cria planos únicos para você",
    icon: Bot,
  },
  {
    title: "Personalização Total",
    description: "Cada treino e refeição é pensado especificamente para você",
    icon: Target,
  },
  {
    title: "Acompanhamento Contínuo",
    description:
      "Seu progresso é monitorado e os planos são ajustados automaticamente",
    icon: BarChart3,
  },
  {
    title: "Comunidade Apoiadora",
    description: "Conecte-se com pessoas que compartilham seus objetivos",
    icon: Users,
  },
];

export default function ComoFuncionaPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const heroReveal = useScrollReveal({ threshold: 0.1 });
  const videoReveal = useScrollReveal({ threshold: 0.1 });
  const featuresReveal = useScrollReveal({ threshold: 0.1 });

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleVideoHover = () => {
    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  const handleVideoEnded = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-white to-gray-100">
      <Navbar />

      {/* Hero Section */}
      <section
        ref={heroReveal.ref}
        className={`w-full py-16 md:py-24 px-4 bg-gradient-to-b from-white via-white to-gray-100 transition-all duration-1000 ease-out ${
          heroReveal.isVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-8"
        }`}
      >
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-sm font-medium text-gray-600 mb-8 tracking-wide uppercase bg-gradient-to-r from-black to-gray-800 text-white py-2 rounded-full w-64 mx-auto font-zalando relative overflow-hidden group shadow-lg">
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
            <span className="relative z-10">Como Funciona</span>
          </p>
          <h1 className="text-3xl md:text-6xl font-zalando-medium text-black mb-6 leading-tight">
            Como Funciona o <span className="text-black">Mova+</span>
          </h1>
          <p className="text-lg md:text-xl text-black/90 max-w-3xl mx-auto leading-relaxed font-zalando">
            Descubra como nossa plataforma transforma sua jornada fitness com
            tecnologia inteligente e personalização completa.
          </p>
        </div>
      </section>

      {/* Vídeo Passo a Passo */}
      <section
        ref={videoReveal.ref}
        className={`w-full py-16 md:py-24 px-4 bg-white transition-all duration-1000 ease-out ${
          videoReveal.isVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-8"
        }`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-zalando-medium text-black mb-4">
              Veja como funciona na prática
            </h2>
            <p className="text-lg text-black/80 max-w-2xl mx-auto font-zalando">
              Assista ao nosso vídeo passo a passo e descubra como é fácil
              começar sua transformação
            </p>
          </div>

          <div className="flex justify-center">
            <div
              className="relative w-full max-w-4xl"
              onMouseEnter={handleVideoHover}
            >
              <video
                ref={videoRef}
                src="/videos/como-funciona.mp4"
                muted
                className="w-full h-auto rounded-[22px] border-2 border-black shadow-2xl shadow-black/20 object-cover"
                onEnded={handleVideoEnded}
                playsInline
                preload="metadata"
                controls
              ></video>
            </div>
          </div>
        </div>
      </section>

      {/* Processo Detalhado */}
      <section ref={sectionRef} className="w-full bg-gray-50 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-zalando-medium text-black mb-4">
              Seu caminho para a transformação
            </h2>
            <p className="text-lg text-black/80 max-w-2xl mx-auto font-zalando">
              Um processo simples e eficaz, desenvolvido para garantir seus
              resultados
            </p>
          </div>

          {/* Steps Navigation - Melhorar responsividade */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-8 sm:mb-12">
            {detailedSteps.map((step, index) => (
              <button
                key={index}
                onClick={() => setActiveStep(index)}
                className={`px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-zalando-medium transition-all duration-300 text-sm sm:text-base border-2 ${
                  activeStep === index
                    ? "bg-black text-white border-black shadow-lg"
                    : "bg-white text-black border-black hover:bg-gray-50"
                }`}
              >
                {step.title}
              </button>
            ))}
          </div>

          {/* Active Step Content - Melhorar layout mobile */}
          <div className="max-w-4xl mx-auto">
            <div className="space-y-6 sm:space-y-8">
              <div className="flex items-center space-x-4 sm:space-x-6">
                <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-black items-center justify-center text-white text-xl sm:text-2xl font-zalando-medium flex">
                  {detailedSteps[activeStep].number}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl sm:text-3xl md:text-4xl font-zalando-medium text-black mb-2">
                    {detailedSteps[activeStep].title}
                  </h3>
                  <p className="text-base sm:text-lg text-black/80 font-zalando">
                    {detailedSteps[activeStep].description}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-[22px] border-2 border-black p-6 sm:p-8">
                <ul className="space-y-3 sm:space-y-4">
                  {detailedSteps[activeStep].details.map((detail, index) => (
                    <li
                      key={index}
                      className="flex items-start space-x-3 sm:space-x-4"
                    >
                      <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-black flex items-center justify-center mt-0.5">
                        <svg
                          className="w-3 h-3 sm:w-4 sm:h-4 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <span className="text-base sm:text-lg text-black/80 font-zalando leading-relaxed">
                        {detail}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        ref={featuresReveal.ref}
        className={`w-full bg-white py-20 px-4 transition-all duration-1000 ease-out ${
          featuresReveal.isVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-8"
        }`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-zalando-medium text-black mb-4">
              O que nos torna únicos
            </h2>
            <p className="text-lg text-black/80 max-w-2xl mx-auto font-zalando">
              Tecnologia avançada e personalização completa para seus melhores
              resultados
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`bg-white rounded-[22px] p-8 border-2 border-black hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 ${
                  isVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-10"
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-zalando-medium text-black mb-3">
                  {feature.title}
                </h3>
                <p className="text-black/80 leading-relaxed font-zalando">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-16 md:py-24 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-zalando-medium text-black mb-6">
            Pronto para começar sua transformação?
          </h2>
          <p className="text-lg text-black/80 mb-8 max-w-2xl mx-auto font-zalando">
            Junte-se a milhares de pessoas que já transformaram suas vidas com o
            Mova+
          </p>
          <div className="mt-6">
            <Link href="/register/step0">
              <ShinyButton className="px-12 py-3 bg-black rounded-lg">
                Começar Minha Jornada
              </ShinyButton>
            </Link>
          </div>
          <p className="text-black/60 text-sm mt-4 font-zalando">
            7 dias grátis • Cancele a qualquer momento
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
