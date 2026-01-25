"use client";

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

  // Verificar se é imagem local (começa com /) ou externa
  const isLocal = src.startsWith("/");

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
          <div className="absolute inset-0 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
            <div className="text-gray-400 text-sm">Carregando imagem...</div>
          </div>
        )}
        <img
          src={src}
          alt={alt}
          className={`max-w-full h-auto rounded-lg shadow-lg transition-opacity duration-300 ${
            isLoading ? "opacity-0" : "opacity-100"
          }`}
          loading="lazy"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
          style={{
            maxWidth: "100%",
            height: "auto",
            width: "auto",
          }}
          // Atributos para otimização
          decoding="async"
          fetchPriority="high"
        />
      </div>
    </div>
  );
}

