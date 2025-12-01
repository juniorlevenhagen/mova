"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShinyButton } from "@/components/ui/shiny-button";

export function PricingSection() {
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
    <div className="w-full py-8 md:py-16 px-4">
      <section className="relative w-full max-w-7xl mx-auto overflow-hidden rounded-3xl shadow-2xl">
        {/* Foto FIXA */}
        <div className="flex-shrink-0">
          <div className="relative w-full h-[400px] md:h-[500px] lg:h-[600px] flex-shrink-0">
            <Image
              src="/images/09.webp"
              alt="Mulher fazendo exercício"
              fill
              className="object-cover object-center"
              sizes="(max-width: 768px) 100vw, 1200px"
              priority
              quality={100}
            />
          </div>
        </div>

        {/* PARTE ROXA - Gradiente Animado */}
        <div
          ref={sectionRef}
          className="relative px-8 md:px-12 lg:px-16 py-12 md:py-16 lg:py-20 overflow-hidden"
          style={{
            background: `linear-gradient(${90 + scrollProgress * 180}deg, 
                         #6F74E8 ${scrollProgress * 30}%, 
                         rgb(210, 92, 246) ${100 - scrollProgress * 30}%)`,
            transition: "background 0.5s ease-out",
          }}
        >
          {/* WORKOUT - NÍTIDO sem blur */}
          <div
            className="absolute top-0 right-0 text-[8rem] md:text-[12rem] lg:text-[14rem] 
                       font-black select-none pointer-events-none leading-none"
            style={{
              // Apenas opacidade e escala (SEM textShadow que embacava)
              color: `rgba(147, 51, 234, ${0.15 + scrollProgress * 0.25})`, // 15% → 40% opacidade
              transform: `scale(${1 + scrollProgress * 0.1})`, // Cresce 10%
              transition: "all 0.3s ease-out",
            }}
          >
            WORK
            <br />
            OUT
          </div>

          {/* Conteúdo */}
          <div className="relative z-10 max-w-xs">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-black mb-4 md:mb-6 leading-tight">
              Fique saudável e mais forte
            </h2>
            <p className="text-lg md:text-xl lg:text-2xl text-black/90 font-medium leading-relaxed max-w-xs">
              O primeiro passo começa aqui, onde a força vence a dúvida, o
              hábito molda a mente e cada gota de suor te aproxima da tua melhor
              versão. Saiba seu peso ideal
            </p>

            <div className="mt-6 md:mt-8 flex justify-center md:justify-start">
              <Link href="/register/step0">
                <ShinyButton className="px-12 py-3 bg-black rounded-lg">
                  Calcule seu IMC
                </ShinyButton>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
