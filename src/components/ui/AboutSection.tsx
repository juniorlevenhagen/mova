"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShinyButton } from "@/components/ui/shiny-button";

export function AboutSection() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const progress = Math.max(
        0,
        Math.min(1, (window.innerHeight - rect.top) / window.innerHeight)
      );
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className="w-full bg-white py-20 md:py-32 px-4">
      <div className="w-full">
        {/* Seção com design dividido - foto superior e texto inferior */}
        <section className="relative w-full max-w-7xl mx-auto overflow-hidden rounded-3xl shadow-2xl">
          {/* Seção superior - Foto FIXA */}
          <div className="relative w-full h-[400px] md:h-[500px] lg:h-[600px]">
            <Image
              src="/images/10.webp"
              alt="Mulher fazendo exercício - fique saudável e mais forte"
              fill
              className="object-cover object-center"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
              priority
              quality={100}
            />
          </div>

          {/* Seção inferior - Gradiente Animado */}
          <div
            ref={sectionRef}
            className="relative px-8 md:px-12 lg:px-16 py-12 md:py-16 lg:py-20 overflow-hidden"
            style={{
              // Gradiente rotativo + posição das cores
              background: `linear-gradient(${90 + scrollProgress * 180}deg, 
                           rgb(111, 232, 222) ${scrollProgress * 30}%, 
                           rgb(199, 248, 65) ${100 - scrollProgress * 30}%)`,
              transition: "background 0.5s ease-out",
            }}
          >
            {/* HEALTH - Efeito nítido */}
            <div
              className="absolute top-0 right-0 text-[8rem] md:text-[12rem] lg:text-[14rem] 
                         font-black select-none pointer-events-none leading-none"
              style={{
                // Opacidade e escala (sem blur)
                color: `rgba(34, 197, 94, ${0.15 + scrollProgress * 0.25})`, // Verde com 15% → 40% opacidade
                transform: `scale(${1 + scrollProgress * 0.1})`, // Cresce 10%
                transition: "all 0.3s ease-out",
              }}
            >
              HEAL
              <br />
              TH
            </div>

            {/* Conteúdo principal */}
            <div className="relative z-10 max-w-xs">
              {/* Título principal */}
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-black mb-4 md:mb-6 leading-tight">
                Faça parte de quem escolheu evoluir.
              </h2>

              {/* Texto descritivo */}
              <p className="text-base md:text-lg lg:text-xl text-black/90 font-medium leading-relaxed max-w-xs">
                Entre para o grupo de pessoas que decidiram transformar hábitos
                diários, conquistando mais disposição, saúde e bem-estar.
              </p>
            </div>

            <div className="mt-6">
              <Link href="/register/step0">
                <ShinyButton className="px-12 py-3 lg:text-md bg-black rounded-lg">
                  Cadastre-se
                </ShinyButton>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}
