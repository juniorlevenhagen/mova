import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import React from "react";
import { BlogImage } from "@/components/ui/BlogImage";

/**
 * Detecta se o texto deve ser tratado como bloco
 * (ex: botão ou imagem ocupando linha inteira)
 */
export function isMarkdownBlock(text: string) {
  if (!text) return false;

  return /^\s*::button\[/.test(text) || /^\s*!\[.*?\]\(.*?\)/.test(text);
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converte texto com Markdown básico para elementos React
 * Suporta:
 *  - **negrito**
 *  - *itálico*
 *  - ![imagem](url)
 *  - ::button[Texto](url)
 */
export function parseMarkdown(text: string): React.ReactNode[] {
  if (!text) return [];

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;

  const markdownRegex =
    /(::button\[([^\]]+)\]\(([^)]+)\)|!\[([^\]]*)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*)/g;

  let match: RegExpExecArray | null;

  while ((match = markdownRegex.exec(text)) !== null) {
    // Texto antes do match
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const fullMatch = match[0];

    // BOTÃO
    if (fullMatch.startsWith("::button")) {
      const label = match[2];
      const url = match[3];

      parts.push(
        <div key={key++} className="my-8 flex justify-center">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-8 py-4 bg-black text-white rounded-full 
                       text-sm font-semibold uppercase tracking-[0.3em]
                       transition hover:bg-gray-800"
          >
            {label}
          </a>
        </div>
      );
    }

    // IMAGEM
    else if (fullMatch.startsWith("![")) {
      const altText = match[4] || "";
      const imageUrl = match[5] || "";

      if (imageUrl) {
        parts.push(<BlogImage key={key++} src={imageUrl} alt={altText} />);
      }
    }

    // NEGRITO
    else if (fullMatch.startsWith("**")) {
      parts.push(
        <strong key={key++} className="font-semibold">
          {match[6]}
        </strong>
      );
    }

    // ITÁLICO
    else if (fullMatch.startsWith("*")) {
      parts.push(
        <em key={key++} className="italic">
          {match[7]}
        </em>
      );
    }

    lastIndex = match.index + fullMatch.length;
  }

  // Texto restante
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length ? parts : [text];
}
