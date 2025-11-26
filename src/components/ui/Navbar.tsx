"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const navLinks = [
  { label: "Preços", href: "/planos-precos" },
  { label: "Sobre", href: "/sobre-nos" },
  { label: "Blog", href: "/blog" },
];

export function Navbar() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleEnter = () => {
    router.push("/auth/login");
    setMenuOpen(false);
  };

  const handleStartNow = () => {
    router.push("/register/step0");
    setMenuOpen(false);
  };

  const handleNavigate = (href: string) => {
    router.push(href);
    setMenuOpen(false);
  };

  return (
    <>
      <nav className="relative w-full bg-white px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
        {/* Logo à esquerda */}
        <div className="flex items-center">
          <button
            onClick={() => router.push("/")}
            className="focus:outline-none"
          >
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
        <div className="hidden items-center gap-2 lg:flex">
          {navLinks.map((link) => (
            <button
              key={link.href}
              className="text-sm px-3 sm:text-base text-black font-zalando font-medium hover:text-gray-700 transition-colors duration-200"
              onClick={() => handleNavigate(link.href)}
            >
              {link.label}
            </button>
          ))}

          <button
            type="button"
            className="lg:hidden text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Alternar menu"
          >
            <span className="sr-only">Abrir menu</span>
            <div className="space-y-1">
              <span
                className={`block h-0.5 w-6 bg-black transition-all duration-200 ${
                  menuOpen ? "translate-y-1.5 rotate-45" : ""
                }`}
              />
              <span
                className={`block h-0.5 w-6 bg-black transition-all duration-200 ${
                  menuOpen ? "opacity-0" : ""
                }`}
              />
              <span
                className={`block h-0.5 w-6 bg-black transition-all duration-200 ${
                  menuOpen ? "-translate-y-1.5 -rotate-45" : ""
                }`}
              />
            </div>
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
        <button
          type="button"
          className="lg:hidden text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Alternar menu"
        >
          <span className="sr-only">Abrir menu</span>
          <div className="space-y-1">
            <span
              className={`block h-0.5 w-6 bg-black transition-all duration-200 ${
                menuOpen ? "translate-y-1.5 rotate-45" : ""
              }`}
            />
            <span
              className={`block h-0.5 w-6 bg-black transition-all duration-200 ${
                menuOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`block h-0.5 w-6 bg-black transition-all duration-200 ${
                menuOpen ? "-translate-y-1.5 -rotate-45" : ""
              }`}
            />
          </div>
        </button>

        {/* Menu mobile */}
        <div
          className={`lg:hidden absolute left-0 right-0 top-full mt-2 overflow-hidden transition-[max-height] duration-300 ${
            menuOpen ? "max-h-72" : "max-h-0"
          }`}
        >
          <div className="bg-white border border-gray-200 flex flex-col gap-3 px-4 py-4">
            <div className="flex flex-wrap justify-between gap-2">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  className="flex-1 min-w-[100px] text-center text-sm text-black font-zalando font-medium hover:text-gray-700 transition-colors duration-200"
                  onClick={() => handleNavigate(link.href)}
                >
                  {link.label}
                </button>
              ))}
            </div>
            <button
              onClick={handleEnter}
              className="w-full text-sm text-black font-zalando font-medium border border-gray-300 rounded-lg px-3 py-2 transition-all duration-200 hover:border-black hover:bg-black hover:text-white"
            >
              Entrar
            </button>
            <button
              onClick={handleStartNow}
              className="w-full text-sm text-white font-zalando font-semibold bg-black rounded-lg px-3 py-2 transition-all duration-200 hover:bg-gray-900"
            >
              Comece agora
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}
