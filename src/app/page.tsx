import Carousel from "@/components/ui/Carousel";
import { FeaturesSection } from "@/components/ui/FeaturesSection";
import { HowItWorksSection } from "@/components/ui/HowItWorksSection";
import { PricingSection } from "@/components/ui/PricingSection";
import { AboutSection } from "@/components/ui/AboutSection";
import { Footer } from "@/components/ui/Footer";

export default function Home() {
  return (
    <div>
      <Carousel />

      {/* Seção de texto abaixo do carrossel */}
      <section className="w-full bg-[#f5f1e8] py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-5xl font-bold text-gray-800 mb-6">
            Tudo que você precisa para desenvolver seu físico e melhorar sua
            saúde.
          </h2>
          <p className="text-base md:text-xl text-gray-600 leading-relaxed">
            Descubra como o Mova+ pode acelerar sua jornada fitness com
            ferramentas inteligentes e conteúdo de qualidade.
          </p>
        </div>
      </section>

      {/* Adicionando espaçamento antes da FeaturesSection */}
      <div className="py-8 bg-white"></div>

      <FeaturesSection />

      <HowItWorksSection />

      {/* Seção de planos */}
      <PricingSection />

      <AboutSection />

      {/* Footer */}
      <Footer />
    </div>
  );
}
