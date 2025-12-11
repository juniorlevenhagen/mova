"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

import { cn } from "@/lib/utils";

type Grid = {
  rows: number;
  cols: number;
};

const DEFAULT_GRIDS: Record<string, Grid> = {
  "6x4": { rows: 4, cols: 6 },
  "8x8": { rows: 8, cols: 8 },
  "8x3": { rows: 3, cols: 8 },
  "4x6": { rows: 6, cols: 4 },
  "3x8": { rows: 8, cols: 3 },
};

type PredefinedGridKey = keyof typeof DEFAULT_GRIDS;

interface PixelImageProps {
  src: string;
  grid?: PredefinedGridKey;
  customGrid?: Grid;
  grayscaleAnimation?: boolean;
  pixelFadeInDuration?: number; // in ms
  maxAnimationDelay?: number; // in ms
  colorRevealDelay?: number; // in ms
  className?: string;
}

export const PixelImage = ({
  src,
  grid = "6x4",
  grayscaleAnimation = false,
  pixelFadeInDuration = 1000,
  maxAnimationDelay = 1200,
  colorRevealDelay = 1300,
  customGrid,
  className,
}: PixelImageProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showColor, setShowColor] = useState(!grayscaleAnimation);

  const MIN_GRID = 1;
  const MAX_GRID = 16;

  const { rows, cols } = useMemo(() => {
    const isValidGrid = (grid?: Grid) => {
      if (!grid) return false;
      const { rows, cols } = grid;
      return (
        Number.isInteger(rows) &&
        Number.isInteger(cols) &&
        rows >= MIN_GRID &&
        cols >= MIN_GRID &&
        rows <= MAX_GRID &&
        cols <= MAX_GRID
      );
    };

    return isValidGrid(customGrid) ? customGrid! : DEFAULT_GRIDS[grid];
  }, [customGrid, grid]);

  useEffect(() => {
    // Disparar animação após o componente montar usando requestAnimationFrame
    // para garantir que o DOM esteja pronto e permitir a transição
    const frame = requestAnimationFrame(() => {
      setIsVisible(true);
    });
    
    if (grayscaleAnimation) {
      const colorTimeout = setTimeout(() => {
        setShowColor(true);
      }, colorRevealDelay);
      return () => {
        cancelAnimationFrame(frame);
        clearTimeout(colorTimeout);
      };
    }
    
    return () => cancelAnimationFrame(frame);
  }, [colorRevealDelay, grayscaleAnimation]);

  // Função determinística para gerar valores pseudo-aleatórios consistentes entre servidor e cliente
  const seededRandom = (seed: number, max: number) => {
    const x = Math.sin(seed) * 10000;
    return Math.round((x - Math.floor(x)) * max * 100) / 100;
  };

  const pieces = useMemo(() => {
    const total = rows * cols;
    return Array.from({ length: total }, (_, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;

      // Arredonda valores para evitar diferenças de precisão entre servidor e cliente
      const x1 = Math.round(col * (100 / cols) * 100) / 100;
      const y1 = Math.round(row * (100 / rows) * 100) / 100;
      const x2 = Math.round((col + 1) * (100 / cols) * 100) / 100;
      const y2 = Math.round((row + 1) * (100 / rows) * 100) / 100;

      const clipPath = `polygon(${x1}% ${y1}%, ${x2}% ${y1}%, ${x2}% ${y2}%, ${x1}% ${y2}%)`;

      // Usa o índice como seed para gerar valores determinísticos
      const delay = seededRandom(index, maxAnimationDelay);
      return {
        clipPath,
        delay,
      };
    });
  }, [rows, cols, maxAnimationDelay]);

  return (
    <div
      className={cn(
        "relative select-none bg-white",
        className || "h-72 w-72 md:h-96 md:w-96"
      )}
      style={{ backgroundColor: "white" }}
    >
      {/* Fundo branco explícito que fica sempre visível */}
      <div className="absolute inset-0 bg-white z-0" />
      {pieces.map((piece, index) => (
        <div
          key={index}
          className={cn(
            "absolute inset-0 transition-all ease-out z-10 border-8 border-white",
            isVisible ? "opacity-100" : "opacity-0"
          )}
          style={{
            clipPath: piece.clipPath,
            transitionDelay: `${piece.delay}ms`,
            transitionDuration: `${pixelFadeInDuration}ms`,
          }}
        >
          <Image
            src={src}
            alt={`Pixel image piece ${index + 1}`}
            fill
            sizes="100vw"
            className={cn(
              "rounded-[2.5rem] object-cover",
              !grayscaleAnimation && "grayscale-0",
              grayscaleAnimation && !showColor && "grayscale",
              grayscaleAnimation && showColor && "grayscale-0"
            )}
            style={{
              filter:
                grayscaleAnimation && !showColor ? "grayscale(100%)" : "none",
              transition: grayscaleAnimation
                ? `filter ${pixelFadeInDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`
                : "none",
            }}
            draggable={false}
          />
        </div>
      ))}
    </div>
  );
};
