"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { Logo } from "@/components/ui/Logo";
import { motion } from "framer-motion";
import { MoveRight } from "lucide-react";

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
      </div>

      {/* Conteúdo - Mobile e Desktop */}
      <div className="flex-1 flex items-center justify-center lg:absolute lg:w-1/2 lg:h-full lg:right-0 lg:pr-8">
        <div className="w-full max-w-md text-center px-4 lg:px-0">
          <motion.div
            className="space-y-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-4xl md:text-5xl font-bold text-gray-800 lg:text-gray-800 lg:drop-shadow-lg font-[Bebas Neue]"
            >
              Sua jornada começa aqui
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-lg md:text-xl text-gray-600 lg:text-gray-600 lg:drop-shadow-md"
            >
              Personalização total, resultados reais. Vamos montar seu plano
              agora.
            </motion.p>

            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              whileHover={{
                scale: 1.02,
                boxShadow: "0 10px 25px rgba(203, 182, 139, 0.3)",
              }}
              whileTap={{ scale: 0.98 }}
              onClick={handleStartJourney}
              className="w-full bg-[#cbb68b] text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-[#b8a57a] transition-all duration-300 shadow-lg flex items-center justify-center gap-3"
            >
              Vamos lá! <MoveRight size={20} />
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
