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
      <div className="flex items-center">
        <button className="text-sm px-3 sm:text-base text-black font-zalando hover:text-gray-700 transition-colors duration-200">
          Preços
        </button>
        <button className="text-sm px-3 sm:text-base text-black font-zalando font-medium hover:text-gray-700 transition-colors duration-200">
          Sobre
        </button>

        <button className="text-sm px-3 mr-3 sm:text-base text-black font-zalando font-medium hover:text-gray-700 transition-colors duration-200">
          Blog
        </button>

        {/* Botão "Entrar" */}
        <button
          onClick={handleEnter}
          className="sm:px-6 py-2 text-xs sm:text-base text-white font-zalando font-medium bg-[#4AA4F7] hover:bg-[#F59C46] transition-all duration-200 rounded-lg mr-2"
        >
          Entrar
        </button>

        {/* Botão "Comece agora" */}
        <button
          onClick={handleStartNow}
          className="sm:px-6 py-2 text-xs sm:text-base text-white font-zalando font-medium bg-black hover:bg-gray-600 transition-all duration-200 rounded-lg"
        >
          Comece agora
        </button>
      </div>
    </nav>
  );
}
