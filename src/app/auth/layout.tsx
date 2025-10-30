"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { PixelImage } from "@/components/ui/pixel-image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isLogin = pathname === "/auth/login";

  const title = isLogin ? "Bem-vindo de volta" : "Transforme sua vida";

  const subtitle = isLogin
    ? "Continue sua jornada fitness no Mova+"
    : "Comece sua jornada fitness hoje mesmo";

  // Para login, sempre mostrar layout dividido
  if (isLogin) {
    return (
      <div className="min-h-screen bg-white flex flex-col lg:flex-row">
        {/* Imagem Mobile - Acima do formulário */}
        <div className="lg:hidden w-full h-64 md:h-80 relative">
          <Image
            src="/images/jakub-klucky-O3UrNIU1FVQ-unsplash.webp"
            alt="Fitness motivation - Mova+"
            fill
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-black/30"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white px-8">
              <h1 className="hidden md:block text-3xl font-bold mb-2">
                {title}
              </h1>
              <p className="hidden md:block text-lg opacity-90">{subtitle}</p>
            </div>
          </div>
        </div>

        {/* Imagem Desktop - Lado esquerdo */}
        <div>
          <Logo />
        </div>
        <div className="hidden lg:block lg:w-1/2 relative bg-white contrast-100">
          <PixelImage
            src="/images/jakub-klucky-O3UrNIU1FVQ-unsplash.webp"
            className="absolute inset-0 w-full h-full"
            grayscaleAnimation={false}
          />
        </div>

        {/* Formulário - Lado direito */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-4">
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
