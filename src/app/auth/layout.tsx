"use client";

import { usePathname } from "next/navigation";
import Image from "next/image";
import { Logo } from "@/components/ui/Logo";
import { PixelImage } from "@/components/ui/pixel-image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isLogin = pathname === "/auth/login";

  // Para login, forgot-password e reset-password, sempre mostrar layout dividido
  if (
    isLogin ||
    pathname === "/auth/forgot-password" ||
    pathname === "/auth/reset-password"
  ) {
    return (
      <div className="min-h-screen bg-white flex flex-col lg:flex-row relative">
        {/* Logo - Mobile e Desktop */}
        <Logo />

        {/* Imagem de fundo - Mobile usa Image normal, Desktop usa PixelImage */}
        <div className="w-full lg:w-2/5 h-[50vh] md:h-[55vh] lg:h-screen relative bg-white contrast-100 overflow-hidden">
          {/* Mobile: Image simples para melhor performance */}
          <div className="lg:hidden absolute inset-0">
            <Image
              src="/images/about-woman-exercising.jpg"
              alt="Fitness motivation"
              fill
              className="object-cover"
              priority
            />
          </div>
          {/* Desktop: PixelImage com efeito */}
          <div className="hidden lg:block absolute inset-0">
            <PixelImage
              src="/images/about-woman-exercising.jpg"
              className="absolute inset-0 w-full h-full"
              grayscaleAnimation={false}
            />
          </div>
        </div>

        {/* Formulário - Lado direito */}
        <div className="w-full lg:w-3/5 flex items-center justify-center p-4 py-12 lg:py-4">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </div>
    );
  }

  // Para cadastro, layout centralizado sem imagem
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">{children}</div>
    </div>
  );
}
