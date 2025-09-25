"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
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
    color: "from-blue-500 to-blue-600",
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
    color: "from-green-500 to-green-600",
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
    color: "from-purple-500 to-purple-600",
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
    color: "from-orange-500 to-orange-600",
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
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

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

  const handleStartJourney = () => {
    router.push("/register/step0");
  };

  return (
    <div className="min-h-screen bg-[#f5f1e8]">
      <Navbar />

      {/* Hero Section */}
      <section className="w-full bg-gradient-to-br from-[#f5f1e8] to-white py-16 md:py-24 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-6 leading-tight">
            Como Funciona o <span className="text-gray-600">Mova+</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Descubra como nossa plataforma transforma sua jornada fitness com
            tecnologia inteligente e personalização completa.
          </p>
        </div>
      </section>

      {/* Processo Detalhado */}
      <section ref={sectionRef} className="w-full bg-white py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Seu caminho para a transformação
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Um processo simples e eficaz, desenvolvido para garantir seus
              resultados
            </p>
          </div>

          {/* Steps Navigation */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {detailedSteps.map((step, index) => (
              <button
                key={index}
                onClick={() => setActiveStep(index)}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                  activeStep === index
                    ? "bg-gray-800 text-white shadow-lg"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {step.title}
              </button>
            ))}
          </div>

          {/* Active Step Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div
                  className={`w-16 h-16 rounded-full bg-gradient-to-r ${detailedSteps[activeStep].color} flex items-center justify-center text-white text-2xl font-bold`}
                >
                  {detailedSteps[activeStep].number}
                </div>
                <div>
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-800">
                    {detailedSteps[activeStep].title}
                  </h3>
                  <p className="text-lg text-gray-600">
                    {detailedSteps[activeStep].description}
                  </p>
                </div>
              </div>

              <ul className="space-y-3">
                {detailedSteps[activeStep].details.map((detail, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <svg
                      className="w-5 h-5 text-green-500 mt-1 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-gray-700">{detail}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative">
              <div
                className={`w-full h-96 bg-gradient-to-br ${detailedSteps[activeStep].color} rounded-2xl flex items-center justify-center text-white transition-all duration-500`}
              >
                {(() => {
                  const IconComponent = detailedSteps[activeStep].icon;
                  return <IconComponent className="w-32 h-32" />;
                })()}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full bg-[#f5f1e8] py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              O que nos torna únicos
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Tecnologia avançada e personalização completa para seus melhores
              resultados
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 ${
                  isVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-10"
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="text-4xl mb-4 text-gray-700">
                  <feature.icon className="w-12 h-12" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full bg-gray-800 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Pronto para começar sua transformação?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Junte-se a milhares de pessoas que já transformaram suas vidas com o
            Mova+
          </p>
          <button
            onClick={handleStartJourney}
            className="bg-gradient-to-r from-blue-500 to-green-500 text-white py-4 px-8 rounded-lg font-medium hover:from-blue-600 hover:to-green-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-lg"
          >
            Começar Minha Jornada
          </button>
          <p className="text-gray-400 text-sm mt-4">
            7 dias grátis • Cancele a qualquer momento
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
