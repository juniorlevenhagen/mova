"use client";

import { useRouter } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { motion } from "framer-motion";
import Image from "next/image";

import { ShinyButton } from "@/components/ui/shiny-button";
import { PixelImage } from "@/components/ui/pixel-image";

export default function WelcomePage() {
  const router = useRouter();

  const handleStartJourney = () => {
    router.push("/register/step1");
  };

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row relative">
      {/* Logo - Mobile e Desktop */}
      <Logo />

      {/* Imagem de fundo - Mobile usa Image normal, Desktop usa PixelImage */}
      <div className="w-full lg:w-2/5 h-[50vh] md:h-[55vh] lg:h-screen relative bg-white contrast-100 overflow-hidden">
        {/* Mobile: Image simples para melhor performance */}
        <div className="lg:hidden absolute inset-0">
          <Image
            src="/images/logan-weaver-lgnwvr-u76Gd0hP5w4-unsplash.webp"
            alt="Fitness motivation"
            fill
            className="object-cover"
            priority
          />
        </div>
        {/* Desktop: PixelImage com efeito */}
        <div className="hidden lg:block absolute inset-0">
          <PixelImage
            src="/images/logan-weaver-lgnwvr-u76Gd0hP5w4-unsplash.webp"
            className="absolute inset-0 w-full h-full object-cover"
            grayscaleAnimation={false}
          />
        </div>
      </div>

      {/* Conteúdo - Mobile e Desktop */}
      <div className="flex-1 flex items-center justify-center lg:absolute lg:w-3/5 lg:h-full lg:right-0 lg:pr-8 py-12 lg:py-0">
        <div className="w-full max-w-lg px-4 lg:px-0">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="bg-white/95 border-2 border-black rounded-[24px] shadow-[0_25px_80px_-30px_rgba(0,0,0,0.45)] p-8 md:p-12 text-center space-y-8"
          >
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="inline-flex items-center gap-2 bg-black text-white text-xs md:text-sm font-semibold tracking-[0.28em] uppercase px-6 py-2 rounded-full"
            >
              Bem-vindo ao Mova+
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: -18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-4xl md:text-5xl font-bold text-black leading-tight font-[Bebas Neue]"
            >
              Planos feitos especialmente para você
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="text-base md:text-lg text-black/80 leading-relaxed"
            >
              Descubra o seu plano fitness ideal com tecnologia e acompanhamento
              inteligente. Tudo pensado para a rotina real e resultados
              duradouros.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, ease: "easeInOut", delay: 0.45 }}
            >
              <ShinyButton
                onClick={handleStartJourney}
                className="w-full py-4 px-6 bg-black rounded-lg flex items-center justify-center gap-3 whitespace-nowrap text-sm md:text-base"
              >
                Vamos lá!
              </ShinyButton>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
