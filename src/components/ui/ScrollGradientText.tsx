"use client";

import { useEffect, useState, useRef } from "react";

interface ScrollGradientTextProps {
  text: string;
  className?: string;
}

export function ScrollGradientText({
  text,
  className = "",
}: ScrollGradientTextProps) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const textRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!textRef.current) return;

      const element = textRef.current;
      const rect = element.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Calcula o progresso baseado na posição do elemento
      // Quando o elemento está no centro da tela, progress = 1
      const elementCenter = rect.top + rect.height / 1;
      const viewportCenter = windowHeight / 2;

      // progress = 0 quando está no topo, 1 quando está no centro
      const progress = Math.max(
        0,
        Math.min(2, 1 - (elementCenter - viewportCenter) / (windowHeight / 2))
      );

      setScrollProgress(progress);
    };

    handleScroll(); // Chama uma vez no início
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Função para calcular cores baseadas na posição da letra e scroll
  const calculateColor = (index: number, total: number) => {
    const letterPosition = index / total; // 0 a 1
    const threshold = scrollProgress; // Progresso do scroll

    // A letra muda de cor quando o scroll passa por ela
    if (letterPosition < threshold - 0.2) {
      // Letras que já passaram: cinza claro
      return "rgb(44, 44, 44)";
    } else if (
      letterPosition >= threshold - 0.2 &&
      letterPosition <= threshold + 0.1
    ) {
      // Letras na zona de transição: verde-amarelo gradiente
      const transitionProgress = (letterPosition - (threshold - 0.2)) / 0.3;
      const r = Math.floor(30 + transitionProgress * (199 - 30));
      const g = Math.floor(30 + transitionProgress * (248 - 30));
      const b = Math.floor(30 + transitionProgress * (65 - 30));
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      // Letras que ainda não foram alcançadas: preto
      return "rgb(218, 218, 218)";
    }
  };

  const words = text.split(" ");
  const totalLetters = text.replace(/\s/g, "").length;

  return (
    <div
      className={`w-full px-4 flex flex-col items-center gap-2 py-4 md:py-8 ${className}`}
    >
      {/* Título com efeito gradiente */}
      <h2
        ref={textRef}
        className="md:text-[72px]/[1.1] text-[22px]/[1.1] tracking-tight bbh-sans-hegarty-regular w-full text-center mb-8 break-words overflow-hidden"
        aria-label={text}
      >
        {words.map((word, wordIndex) => {
          // Calcula o índice global das letras
          let startIndex = 0;
          for (let i = 0; i < wordIndex; i++) {
            startIndex += words[i].length;
          }

          return (
            <span key={wordIndex} style={{ whiteSpace: "pre" }}>
              <span
                aria-hidden="true"
                style={{ position: "relative", display: "inline-block" }}
              >
                {word.split("").map((letter, letterIndex) => {
                  const globalIndex = startIndex + letterIndex;

                  return (
                    <span
                      key={letterIndex}
                      aria-hidden="true"
                      style={{
                        position: "relative",
                        display: "inline-block",
                        color: calculateColor(globalIndex, totalLetters),
                        transition: "color 0.3s ease-out",
                      }}
                    >
                      {letter}
                    </span>
                  );
                })}
              </span>
              {/* Adiciona quebra de linha após cada frase que termina com ponto */}
              {word.endsWith(".") && <br />}
              {wordIndex < words.length - 1 && !word.endsWith(".") && " "}
            </span>
          );
        })}
      </h2>
    </div>
  );
}
