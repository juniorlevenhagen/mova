"use client";

import Image from "next/image";
import { useState } from "react";

interface BlogImageProps {
  src: string;
  alt: string;
}

/**
 * Componente de imagem otimizada para o blog
 * Redimensiona automaticamente e carrega de forma eficiente
 */
export function BlogImage({ src, alt }: BlogImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className="my-8 flex justify-center items-center h-48 bg-gray-100 rounded-lg">
        <p className="text-gray-400 text-sm">Imagem não disponível</p>
      </div>
    );
  }

  return (
    <div className="my-8 flex justify-center">
      <div className="relative w-full max-w-4xl">
        {isLoading && (
          <div className="absolute inset-0 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center z-10">
            <div className="text-gray-400 text-sm">Carregando imagem...</div>
          </div>
        )}
        <Image
          src={src}
          alt={alt}
          width={1200}
          height={800}
          className={`max-w-full h-auto rounded-lg shadow-lg transition-opacity duration-300 ${
            isLoading ? "opacity-0" : "opacity-100"
          }`}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
          style={{
            width: "100%",
            height: "auto",
          }}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
          priority={false}
        />
      </div>
    </div>
  );
}
