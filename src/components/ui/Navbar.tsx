"use client";

import Image from "next/image";

interface NavbarProps {
  onStartNow?: () => void;
  onEnter?: () => void;
}

export function Navbar({ onStartNow, onEnter }: NavbarProps) {
  return (
    <nav className="w-full bg-[#f5f1e8] px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center shadow-sm">
      {/* Logo à esquerda */}
      <div className="flex items-center">
        <Image
          src="/images/logo_blue.svg"
          alt="Mova+ Logo"
          width={120}
          height={40}
          className="h-6 sm:h-8 w-auto"
        />
      </div>

      {/* Botões à direita */}
      <div className="flex items-center gap-2 sm:gap-4">
        <button
          onClick={onEnter}
          className="px-3 sm:px-6 py-2 text-sm sm:text-base text-gray-700 font-medium hover:text-gray-900 transition-colors duration-200"
        >
          Entrar
        </button>
        <button
          onClick={onStartNow}
          className="px-3 sm:px-6 py-2 text-sm sm:text-base bg-gray-800 text-white font-medium rounded-lg hover:bg-gray-900 transition-colors duration-200"
        >
          Cadastre-se
        </button>
      </div>
    </nav>
  );
}
