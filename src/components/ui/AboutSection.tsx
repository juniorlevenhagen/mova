"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";

export function AboutSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new window.IntersectionObserver(
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
    <section ref={sectionRef} className="w-full bg-white py-16 md:py-24 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Lado esquerdo - Conteúdo */}
          <div className="space-y-8">
            <div
              className={`transition-all duration-1000 ease-out ${
                isVisible
                  ? "opacity-100 transform translate-x-0"
                  : "opacity-0 transform translate-x-[-100px]"
              }`}
            >
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-6 leading-tight">
                Sobre o <span className="text-gray-600">Mova+</span>
              </h2>

              <p className="text-lg md:text-xl text-gray-600 leading-relaxed mb-6">
                Somos uma plataforma fitness inovadora que acredita que a
                transformação física vai muito além dos exercícios. Nossa missão
                é criar uma experiência completa que transforme não apenas seu
                corpo, mas sua vida.
              </p>

              <p className="text-base md:text-lg text-gray-600 leading-relaxed mb-8">
                Combinando tecnologia de ponta com conhecimento especializado,
                oferecemos treinos personalizados, planos nutricionais
                inteligentes e uma comunidade que te motiva a alcançar seus
                objetivos.
              </p>

              {/* Botão */}
              <button className="bg-gray-800 text-white px-8 py-4 rounded-lg font-medium hover:bg-gray-900 transition-colors duration-200 text-lg shadow-lg hover:shadow-xl">
                Participar do Clube
              </button>
            </div>
          </div>

          {/* Lado direito - Imagem */}
          <div
            className={`relative transition-all duration-1000 ease-out delay-300 ${
              isVisible
                ? "opacity-100 transform translate-x-0"
                : "opacity-0 transform translate-x-[100px]"
            }`}
          >
            <Image
              src="/images/about-woman-exercising.webp"
              alt="Mulher praticando exercícios"
              width={400}
              height={500}
              className="w-full h-auto object-cover rounded-3xl shadow-lg"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
