"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export function Footer() {
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevenir event bubbling no iPhone

    // Trim do email para remover espaços (comum no mobile)
    const trimmedEmail = newsletterEmail.trim();

    if (!trimmedEmail || newsletterStatus === "loading") return;

    setNewsletterStatus("loading");
    setErrorMessage(""); // Limpar erro anterior

    // Log para debug no iPhone (Chrome ou Safari)
    if (typeof window !== "undefined") {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isChromeIOS = /CriOS/.test(navigator.userAgent);
      if (isIOS) {
        console.log(`📱 [iOS ${isChromeIOS ? "Chrome" : "Safari"}] Tentando inscrever na newsletter:`, {
          email: trimmedEmail,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        });
      }
    }

    try {
      // Timeout reduzido para 20 segundos (Chrome no iOS pode ter problemas com timeouts longos)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      // Fetch com configurações otimizadas para Chrome no iOS
      const response = await fetch("/api/subscribe-newsletter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({ email: trimmedEmail }),
        signal: controller.signal,
        cache: "no-store", // Evitar cache no Chrome iOS
        credentials: "same-origin",
      });

      clearTimeout(timeoutId);

      // Verificar se a resposta é válida antes de fazer parse
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Resposta inválida do servidor");
      }

      let data;
      try {
        const text = await response.text();
        data = text ? JSON.parse(text) : {};
      } catch (parseError) {
        console.error("Erro ao fazer parse da resposta:", parseError);
        throw new Error("Erro ao processar resposta do servidor");
      }

      if (!response.ok) {
        throw new Error(data.error || data.details || "Erro ao inscrever-se");
      }

      setNewsletterStatus("success");
      setNewsletterEmail("");
      setTimeout(() => setNewsletterStatus("idle"), 3000);
    } catch (error) {
      console.error("Erro ao inscrever-se:", error);

      // Tratamento específico para diferentes tipos de erro
      let errorMessage = "Erro ao inscrever-se. Tente novamente.";
      
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          errorMessage = "Tempo de espera esgotado. Verifique sua conexão e tente novamente.";
          console.error("Timeout ao inscrever-se na newsletter");
        } else if (
          error.message.includes("Failed to fetch") || 
          error.message.includes("NetworkError") ||
          error.message.includes("Network request failed") ||
          error.message.includes("fetch")
        ) {
          errorMessage = "Erro de conexão. Verifique sua internet e tente novamente.";
        } else if (error.message.includes("Resposta inválida")) {
          errorMessage = "Erro ao processar resposta. Tente novamente em alguns instantes.";
        } else {
          errorMessage = error.message || errorMessage;
        }
      }

      // Log específico para Chrome no iOS
      if (typeof window !== "undefined") {
        const isChromeIOS = /CriOS/.test(navigator.userAgent);
        if (isChromeIOS) {
          console.error("❌ [Chrome iOS] Erro na newsletter:", {
            error: error instanceof Error ? error.message : String(error),
            errorName: error instanceof Error ? error.name : "Unknown",
            timestamp: new Date().toISOString(),
          });
        }
      }

      setErrorMessage(errorMessage);
      setNewsletterStatus("error");
      
      // Mostrar mensagem de erro no console para debug (iPhone)
      if (typeof window !== "undefined") {
        console.error("❌ [Newsletter Error]:", {
          error: error instanceof Error ? error.message : String(error),
          errorMessage,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        });
      }
      
      setTimeout(() => {
        setNewsletterStatus("idle");
        setErrorMessage("");
      }, 5000);
    }
  };

  return (
    <footer className="w-full bg-black text-white">
      {/* Seção principal do footer */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Logo e descrição */}
          <div className="lg:col-span-1">
            <div className="mb-6">
              <Image
                src="/images/logo_white.webp"
                alt="Mova+ Logo"
                width={120}
                height={40}
                className="h-8 w-auto"
              />
            </div>
            <p className="text-gray-300 mb-6 leading-relaxed">
              Transforme sua vida através do movimento. O Mova+ é sua parceira
              na jornada para um corpo forte e mente leve.
            </p>

            {/* Redes sociais */}
            <div className="flex space-x-4">
              <a
                href="#"
                className="text-gray-300 hover:text-white transition-colors duration-200"
                aria-label="Instagram"
              >
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
              <a
                href="#"
                className="text-gray-300 hover:text-white transition-colors duration-200"
                aria-label="Facebook"
              >
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a
                href="#"
                className="text-gray-300 hover:text-white transition-colors duration-200"
                aria-label="YouTube"
              >
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Links rápidos */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Links Rápidos</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/como-funciona"
                  className="text-gray-300 hover:text-white transition-colors duration-200"
                >
                  Como Funciona
                </Link>
              </li>
              <li>
                <Link
                  href="/planos-precos"
                  className="text-gray-300 hover:text-white transition-colors duration-200"
                >
                  Planos e Preços
                </Link>
              </li>
              <li>
                <Link
                  href="/sobre-nos"
                  className="text-gray-300 hover:text-white transition-colors duration-200"
                >
                  Sobre Nós
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="text-gray-300 hover:text-white transition-colors duration-200"
                >
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Suporte */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Suporte</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/central-ajuda"
                  className="text-gray-300 hover:text-white transition-colors duration-200"
                >
                  Central de Ajuda
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Fique por dentro</h3>
            <p className="text-gray-300 mb-4">
              Receba dicas exclusivas de fitness e novidades do Mova+
            </p>
            <form className="space-y-3" onSubmit={handleNewsletterSubmit}>
              <input
                type="email"
                name="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                onBlur={(e) => setNewsletterEmail(e.target.value.trim())}
                placeholder="Seu melhor email"
                className="w-full px-4 py-3 bg-gray-800 rounded-lg text-white placeholder-white/70 focus:outline-none focus:border-white transition-colors duration-200 text-center disabled:opacity-50"
                autoComplete="email"
                inputMode="email"
                required
                disabled={newsletterStatus === "loading"}
              />
              <button
                type="submit"
                disabled={
                  newsletterStatus === "loading" ||
                  newsletterStatus === "success"
                }
                className="w-full bg-white text-gray-800 px-4 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {newsletterStatus === "loading"
                  ? "Enviando..."
                  : newsletterStatus === "success"
                    ? "Inscrito!"
                    : "Inscrever-se"}
              </button>
              {newsletterStatus === "error" && (
                <p className="text-sm text-red-400 text-center">
                  {errorMessage || "Erro ao inscrever-se. Tente novamente."}
                </p>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Linha divisória */}
      <div className="border-t border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Copyright */}
            <div className="text-white text-sm text-center md:text-left">
              © 2024 Mova+. Todos os direitos reservados.
            </div>

            {/* Desenvolvido por ELEVEN - Centralizado */}
            <div className="text-white text-sm text-center">
              Desenvolvido por ELEVEN
            </div>

            {/* Links legais */}
            <div className="flex flex-wrap justify-center md:justify-end space-x-6 text-sm">
              <Link
                href="/termos-de-uso"
                className="text-white hover:text-white transition-colors duration-200"
              >
                Termos de Uso
              </Link>
              <Link
                href="/politica-de-privacidade"
                className="text-white hover:text-white transition-colors duration-200"
              >
                Política de Privacidade
              </Link>
              <Link
                href="/cookies"
                className="text-white hover:text-white transition-colors duration-200"
              >
                Cookies
              </Link>
              <Link
                href="/lgpd"
                className="text-white hover:text-white transition-colors duration-200"
              >
                LGPD
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
