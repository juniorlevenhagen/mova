"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";

export function Navbar() {
  const router = useRouter();

  const handleEnter = () => {
    router.push("/auth/login");
  };

  const handleStartNow = () => {
    router.push("/register/step0");
  };

  return (
    <nav className="w-full bg-white px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
      {/* Logo à esquerda */}
      <div className="flex items-center">
        <button onClick={() => router.push("/")} className="focus:outline-none">
          <Image
            src="/images/logo_black.webp"
            alt="Mova+ Logo"
            width={120}
            height={40}
            className="h-4 sm:h-6 w-auto"
          />
        </button>
      </div>

      {/* Botões à direita */}
      <div className="flex items-center gap-2">
        <button
          className="text-sm px-3 sm:text-base text-black font-zalando hover:text-gray-700 transition-colors duration-200"
          onClick={() => router.push("/planos-precos")}
        >
          Preços
        </button>
        <button
          className="text-sm px-3 sm:text-base text-black font-zalando font-medium hover:text-gray-700 transition-colors duration-200"
          onClick={() => router.push("/sobre-nos")}
        >
          Sobre
        </button>

        <button
          className="text-sm px-3 mr-3 sm:text-base text-black font-zalando font-medium hover:text-gray-700 transition-colors duration-200"
          onClick={() => router.push("/blog")}
        >
          Blog
        </button>

        {/* Botão "Entrar" - Minimalista ghost button */}
        <button
          onClick={handleEnter}
          className="text-xs sm:text-sm px-4 py-2 text-black font-zalando font-medium border border-gray-300 hover:border-black hover:bg-black hover:text-white rounded-lg transition-all duration-200"
        >
          Entrar
        </button>

        {/* Botão "Comece agora" - CTA moderno com gradient sutil */}
        <button
          onClick={handleStartNow}
          className="text-xs sm:text-sm px-5 sm:px-7 py-2 sm:py-2.5 text-white font-zalando font-semibold bg-black hover:bg-gray-900 rounded-lg shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
        >
          Comece agora
        </button>
      </div>
    </nav>
  );
}
