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
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white px-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              Sua jornada começa aqui
            </h1>
            <p className="text-lg opacity-90">
              Vamos descobrir qual é o seu objetivo!
            </p>
          </div>
        </div>
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

      {/* Conteúdo - Lado direito */}
      <div className="absolute w-full h-full flex items-center justify-center">
        <div className="w-full max-w-md text-center">
          <div className="space-y-6">
            <h1 className="text-4xl font-bold text-white drop-shadow-lg">
              Sua jornada <span className="text-gray-800">começa aqui</span>
            </h1>
            <p className="text-xl text-white/90 drop-shadow-md">
              Vamos descobrir qu<span className="text-gray-800">al é o seu objetivo!</span>
            </p>

            <button
              onClick={handleStartJourney}
              className="w-full bg-white text-gray-800 py-4 px-6 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors shadow-lg"
            >
              Vamos lá!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
