"use client";

import { useRef, useEffect, useState } from "react";

import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { Heart, Target, Users, Zap } from "lucide-react";
import { ShinyButton } from "@/components/ui/shiny-button";
import Link from "next/link";
import { useScrollReveal } from "@/hooks/useScrollReveal";
const values = [
  {
    icon: Heart,
    title: "Paixão pelo Movimento",
    description:
      "Acreditamos que o movimento é a chave para uma vida mais saudável e feliz.",
  },
  {
    icon: Target,
    title: "Personalização Total",
    description:
      "Cada pessoa é única, por isso criamos planos específicos para cada indivíduo.",
  },
  {
    icon: Users,
    title: "Comunidade Forte",
    description:
      "Conectamos pessoas com objetivos similares para se apoiarem mutuamente.",
  },
  {
    icon: Zap,
    title: "Tecnologia Inteligente",
    description:
      "Usamos IA para criar planos que se adaptam ao seu progresso em tempo real.",
  },
];

const stats = [
  { number: 10000, suffix: "+", label: "Usuários Ativos" },
  { number: 95, suffix: "%", label: "Taxa de Satisfação" },
  { number: 50, suffix: "+", label: "Especialistas" },
  { number: "24/7", label: "Suporte Disponível", isText: true },
];

// Componente para animar números
function AnimatedNumber({
  value,
  suffix = "",
  isText = false,
}: {
  value: number | string;
  suffix?: string;
  isText?: boolean;
}) {
  const [displayValue, setDisplayValue] = useState<number | string>(0);

  useEffect(() => {
    if (isText || typeof value === "string") {
      setDisplayValue(value);
      return;
    }

    const duration = 2000; // 2 segundos
    const steps = 60;
    const increment = (value as number) / steps;
    const stepDuration = duration / steps;

    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= (value as number)) {
        setDisplayValue(value as number);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [value, isText]);

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return num.toLocaleString("pt-BR");
    }
    return num.toString();
  };

  if (isText || typeof value === "string") {
    return <span>{value}</span>;
  }

  return (
    <span>
      {formatNumber(displayValue as number)}
      {suffix}
    </span>
  );
}

export default function SobreNosPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const statsSectionRef = useRef<HTMLDivElement>(null);
  const [isStatsVisible, setIsStatsVisible] = useState(false);
  const heroReveal = useScrollReveal({ threshold: 0.1 });
  const historiaReveal = useScrollReveal({ threshold: 0.1 });
  const valoresReveal = useScrollReveal({ threshold: 0.1 });
  const ctaReveal = useScrollReveal({ threshold: 0.1 });

  useEffect(() => {
    const currentSection = statsSectionRef.current;

    if (!currentSection) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsStatsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(currentSection);

    return () => {
      observer.unobserve(currentSection);
    };
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

      {/* Hero Section - Padronizado */}
      <section
        ref={heroReveal.ref}
        className={`w-full py-16 md:py-24 px-4 bg-gradient-to-b from-white via-white to-gray-100 transition-all duration-1000 ease-out ${
          heroReveal.isVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-8"
        }`}
      >
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm font-medium text-gray-600 mb-8 tracking-wide uppercase bg-gradient-to-r from-black to-gray-800 text-white py-2 rounded-full w-52 mx-auto font-zalando relative overflow-hidden group shadow-lg">
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
            <span className="relative z-10">Sobre o Mova+</span>
          </p>
          <h1 className="text-3xl md:text-6xl font-zalando-medium text-black leading-tight mb-6">
            Conheça a história por trás do Mova+
          </h1>
          <p className="text-lg md:text-xl text-black/90 leading-relaxed max-w-3xl mx-auto">
            Nossa missão é democratizar o acesso a planos fitness
            personalizados, usando tecnologia de ponta para transformar vidas de
            forma sustentável.
          </p>
        </div>
      </section>

      {/* Nossa História - Padronizado */}
      <section
        ref={historiaReveal.ref}
        className={`w-full py-16 md:py-24 px-4 transition-all duration-1000 ease-out ${
          historiaReveal.isVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-8"
        }`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Texto */}
            <div>
              <h2 className="text-3xl md:text-5xl font-zalando-medium text-black mb-6 leading-tight">
                Nossa História
              </h2>
              <div className="space-y-4 text-black/80 leading-relaxed text-lg">
                <p>
                  O Mova+ nasceu da paixão por democratizar o acesso a planos
                  fitness personalizados. Nossa equipe de especialistas em
                  medicina esportiva, nutrição e tecnologia se uniu para criar
                  uma plataforma que combina o melhor da ciência do exercício
                  com inteligência artificial.
                </p>
                <p>
                  Começamos com uma simples pergunta: “Por que planos
                  personalizados devem ser privilégio de poucos?” Hoje, ajudamos
                  milhares de pessoas a alcançarem seus objetivos de forma
                  segura e eficaz.
                </p>
                <p>
                  Nossa tecnologia analisa seu perfil, objetivos e progresso
                  para criar planos únicos que se adaptam automaticamente,
                  garantindo resultados duradouros e sustentáveis.
                </p>
              </div>
            </div>
            {/* Visual */}
            <div
              className="flex justify-center"
              onMouseEnter={handleVideoHover}
            >
              <video
                ref={videoRef}
                src="/images/jump5.mp4"
                muted
                className="w-2/3 h-auto object-cover shadow-2xl shadow-black/100"
                style={{ maxWidth: "calc(66.66667% - 2px)" }}
                onEnded={handleVideoEnded}
                playsInline
                preload="metadata"
              ></video>
            </div>
          </div>
        </div>
      </section>

      {/* Nossos Valores - Padronizado */}
      <section
        ref={valoresReveal.ref}
        className={`w-full py-16 md:py-24 px-4 transition-all duration-1000 ease-out ${
          valoresReveal.isVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-8"
        }`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-zalando-medium text-black mb-4">
              Nossos Valores
            </h2>
            <p className="text-lg text-black/70 max-w-2xl mx-auto">
              Os princípios que guiam cada decisão e cada linha de código
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div
                key={index}
                className="rounded-[22px] p-8 border-2 border-black transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white"
              >
                <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center mb-4">
                  <value.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-black mb-3">
                  {value.title}
                </h3>
                <p className="text-black/70 leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Estatísticas - Harmonizado preto/cinza */}
      <section
        ref={statsSectionRef}
        className="w-full py-16 md:py-24 px-4 relative"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url('/images/sven-mieke-Lx_G.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-zalando-medium text-white mb-4">
              Números que Falam
            </h2>
            <p className="text-lg text-white/70">
              Resultados reais de uma comunidade em crescimento
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="text-center transition-all duration-500"
                style={{
                  opacity: isStatsVisible ? 1 : 0,
                  transform: isStatsVisible
                    ? "translateY(0)"
                    : "translateY(20px)",
                  transitionDelay: `${index * 100}ms`,
                }}
              >
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                  {isStatsVisible ? (
                    <AnimatedNumber
                      value={stat.number}
                      suffix={stat.suffix}
                      isText={stat.isText}
                    />
                  ) : stat.isText ? (
                    stat.number
                  ) : (
                    "0"
                  )}
                </div>
                <div className="text-white/70 text-lg">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Padronizado */}
      <section
        ref={ctaReveal.ref}
        className={`w-full py-16 md:py-24 px-4 transition-all duration-1000 ease-out ${
          ctaReveal.isVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-8"
        }`}
      >
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-zalando-medium text-black mb-6">
            Pronto para fazer parte da nossa história?
          </h2>
          <p className="text-lg text-black/80 mb-8 max-w-2xl mx-auto">
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
        </div>
      </section>

      <Footer />
    </div>
  );
}
