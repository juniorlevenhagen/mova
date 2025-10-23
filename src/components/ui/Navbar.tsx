"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";

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
        <button className="text-sm px-3 sm:text-base text-black font-zalando hover:text-gray-700 transition-colors duration-200" onClick={() => router.push("/planos-precos")}>
          Preços
        </button>
        <button className="text-sm px-3 sm:text-base text-black font-zalando font-medium hover:text-gray-700 transition-colors duration-200">
          Sobre
        </button>

        <button className="text-sm px-3 mr-3 sm:text-base text-black font-zalando font-medium hover:text-gray-700 transition-colors duration-200">
          Blog
        </button>

        {/* Botão "Entrar" - Roxo vibrante */}
        <InteractiveHoverButton
          onClick={handleEnter}
          className="text-xs sm:text-base text-white font-zalando font-semibold bg-[black] border-[#7333EF] hover:bg-[black] hover:border-[#5F2AD1] shadow-lg hover:shadow-xl hover:shadow-purple-500/50 transition-all"
        >
          Entrar
        </InteractiveHoverButton>

        {/* Botão "Comece agora" - Verde neon */}
        <InteractiveHoverButton
          onClick={handleStartNow}
          className="text-xs sm:text-base text-white font-zalando font-semibold bg-gray-600 hover:bg-[#63D934] hover:border-[#63D934] shadow-lg hover:shadow-xl hover:shadow-green-400/50 hover:text-black transition-all"
        >
          Comece agora!
        </InteractiveHoverButton>
      </div>
    </nav>
  );
}
