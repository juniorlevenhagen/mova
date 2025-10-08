import { FeaturesSection } from "@/components/ui/FeaturesSection";
import { HowItWorksSection } from "@/components/ui/HowItWorksSection";
import { PricingSection } from "@/components/ui/PricingSection";
import { AboutSection } from "@/components/ui/AboutSection";
import { Footer } from "@/components/ui/Footer";
import { MotivationalSection } from "@/components/ui/MotivationalSection";
import { FAQSection } from "@/components/ui/FAQSection";
import { Navbar } from "@/components/ui/Navbar";

export default function Home() {
  return (
    <div>
      <Navbar />

      {/* Seção Hero com melhor espaçamento */}
      <section className="w-full bg-white py-12 md:py-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl md:text-6xl font-zalando-medium text-black mb-8 leading-tight">
            Tudo que você precisa para desenvolver seu físico e melhorar sua
            saúde utilizando Inteligência Artificial.
          </h2>
          <p className="text-2xl md:text-2xl text-gray-800 font-zalando max-w-3xl mx-auto mb-12 leading-relaxed">
            Descubra como o Mova+ pode acelerar sua jornada fitness com o poder
            de ferramentas inteligentes e conteúdo de alta qualidade.
          </p>
        </div>
      </section>

      {/* Seção da imagem com espaçamento otimizado */}
      <section className="w-full bg-white pb-16 px-4">
        <FeaturesSection />
      </section>

      <HowItWorksSection />
      <PricingSection />
      <MotivationalSection />
      <AboutSection />
      <FAQSection />
      <Footer />
    </div>
  );
}
