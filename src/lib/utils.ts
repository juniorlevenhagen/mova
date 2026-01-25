import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import React from "react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converte texto com Markdown básico para elementos React
 * Suporta: **negrito**, *itálico*, ![imagem](url)
 */
export function parseMarkdown(text: string): React.ReactNode[] {
  if (!text) return [];

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;

  // Regex combinado: imagens primeiro (mais específico), depois negrito e itálico
  // Formato imagem: ![alt text](url)
  const markdownRegex = /(!\[([^\]]*)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*)/g;
  let match;

  while ((match = markdownRegex.exec(text)) !== null) {
    // Adicionar texto antes do match
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    // Processar o match
    if (match[0].startsWith("![")) {
      // Imagem: ![alt](url)
      const altText = match[2] || "";
      const imageUrl = match[3] || "";
      
      if (imageUrl) {
        // Criar um wrapper div para a imagem com otimizações
        parts.push(
          React.createElement(
            "div",
            {
              key: key++,
              className: "my-8 flex justify-center",
            },
            React.createElement(
              "div",
              {
                className: "relative w-full max-w-4xl",
              },
              React.createElement("img", {
                src: imageUrl,
                alt: altText,
                className: "max-w-full h-auto rounded-lg shadow-lg",
                loading: "lazy",
                decoding: "async",
                style: {
                  maxWidth: "100%",
                  height: "auto",
                  width: "auto",
                },
              })
            )
          )
        );
      }
    } else if (match[0].startsWith("**")) {
      // Negrito: **texto**
      parts.push(
        React.createElement(
          "strong",
          { key: key++, className: "font-semibold" },
          match[4]
        )
      );
    } else if (match[0].startsWith("*")) {
      // Itálico: *texto*
      parts.push(
        React.createElement("em", { key: key++, className: "italic" }, match[5])
      );
    }

    lastIndex = match.index + match[0].length;
  }

  // Adicionar texto restante
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  // Se não houve matches, retornar o texto original
  if (parts.length === 0) {
    return [text];
  }

  return parts;
}
