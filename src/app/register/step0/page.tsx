"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { Logo } from "@/components/ui/Logo";

export default function WelcomePage() {
  const router = useRouter();

  const handleStartJourney = () => {
    router.push("/register/step1");
  };

  return (
    <div className="min-h-screen bg-[#f5f1e8] flex flex-col lg:flex-row">
      {/* Imagem Mobile - Acima do conteúdo */}
      <div className="lg:hidden w-full h-64 md:h-80 relative">
        <Image
          src="/images/jakub-klucky-O3UrNIU1FVQ-unsplash.webp"
          alt="Fitness motivation - Mova+"
          fill
          className="object-cover object-center"
          priority
        />
      </div>

      {/* Imagem Desktop - Lado esquerdo */}
      <div>
        <Logo />
      </div>

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
      </div>

      {/* Conteúdo - Mobile e Desktop */}
      <div className="flex-1 flex items-center justify-center lg:absolute lg:w-1/2 lg:h-full lg:right-0 lg:pr-8">
        <div className="w-full max-w-md text-center px-4 lg:px-0">
          <div className="space-y-6">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 lg:text-gray-800 lg:drop-shadow-lg">
              Sua jornada começa aqui
            </h1>
            <p className="text-lg md:text-xl text-gray-600 lg:text-gray-600 lg:drop-shadow-md">
              Vamos descobrir qual é o seu objetivo!
            </p>

            <button
              onClick={handleStartJourney}
              className="w-full bg-gray-800 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-gray-900 transition-colors shadow-lg"
            >
              Vamos lá!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
