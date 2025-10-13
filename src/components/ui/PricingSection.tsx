"use client";

import Image from "next/image";
import Link from "next/link";
import { ShinyButton } from "@/components/ui/shiny-button";

export function PricingSection() {
  return (
    <div className="w-full py-20 md:py-32 px-4">
      {/* Seção com design dividido - foto superior e texto inferior */}
      <section className="relative w-full max-w-7xl mx-auto overflow-hidden rounded-3xl shadow-2xl">
        {/* Seção superior - Foto da mulher se exercitando */}
        <div className="relative w-full h-[400px] md:h-[500px] lg:h-[600px]">
          <Image
            src="/images/09.webp"
            alt="Mulher fazendo exercício - fique saudável e mais forte"
            fill
            className="object-cover object-center"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
            priority
            quality={100}
          />
        </div>

        {/* Seção inferior - Fundo roxo com texto */}
        <div
          className="relative px-8 md:px-12 lg:px-16 py-12 md:py-16 lg:py-20"
          style={{
            background: "linear-gradient(to right, #6F74E8,rgb(210, 92, 246))",
          }}
        >
          {/* Texto de fundo "WORKOUT" */}
          <div className="absolute top-0 right-0 text-[8rem] md:text-[12rem] lg:text-[14rem] font-black text-purple-600/20 select-none pointer-events-none leading-none transparency">
            WORK
            <br />
            OUT
          </div>

          {/* Conteúdo principal */}
          <div className="relative z-10 max-w-xs">
            {/* Título principal */}
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-black mb-4 md:mb-6 leading-tight">
              Fique saudável e mais forte.
            </h2>

            {/* Texto descritivo */}
            <p className="text-base md:text-lg lg:text-xl text-black/90 font-medium leading-relaxed max-w-xs">
              O primeiro passo começa aqui, onde a força vence a dúvida, o
              hábito molda a mente e cada gota de suor te aproxima da tua melhor
              versão. Saiba seu peso ideal.
            </p>
          </div>
          <div className="mt-6">
            <Link href="/register/step0">
              <ShinyButton className="px-12 py-3 bg-black rounded-lg">
                Calcule seu IMC Gratuito
              </ShinyButton>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
