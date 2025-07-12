"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";

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

  return (
    <div className="min-h-screen bg-[#f5f1e8] flex flex-col lg:flex-row">
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
            <h1 className="text-2xl md:text-3xl font-bold mb-2">{title}</h1>
            <p className="text-lg opacity-90">{subtitle}</p>
          </div>
        </div>
      </div>

      {/* Imagem Desktop - Lado esquerdo */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <Image
          src="/images/jakub-klucky-O3UrNIU1FVQ-unsplash.webp"
          alt="Fitness motivation - Mova+"
          fill
          className="object-cover object-center"
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
        />
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white px-8">
            <h1 className="text-4xl font-bold mb-4">{title}</h1>
            <p className="text-xl opacity-90">{subtitle}</p>
          </div>
        </div>
      </div>

      {/* Formulário - Abaixo da imagem no mobile, lado direito no desktop */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
