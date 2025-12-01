import { FeaturesSection } from "@/components/ui/FeaturesSection";
import { HowItWorksSection } from "@/components/ui/HowItWorksSection";
import { PricingSection } from "@/components/ui/PricingSection";
import { AboutSection } from "@/components/ui/AboutSection";
import { Footer } from "@/components/ui/Footer";
import { FAQSection } from "@/components/ui/FAQSection";
import { Navbar } from "@/components/ui/Navbar";
import { ScrollGradientText } from "@/components/ui/ScrollGradientText";

export default function Home() {
  return (
    <div>
      <Navbar />

      {/* Seção Hero com melhor espaçamento */}
      <section className="w-full bg-white py-8 md:py-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl md:text-5xl lg:text-6xl font-zalando-medium text-black mb-4 md:mb-6 leading-[1.1] md:leading-tight">
            Tudo que você precisa para desenvolver seu físico e melhorar sua
            saúde utilizando Inteligência Artificial
          </h2>
          <p className="text-lg md:text-xl lg:text-2xl text-black/90 font-zalando max-w-3xl mx-auto mb-12 leading-relaxed font-medium">
            Descubra como o Mova+ pode acelerar sua jornada fitness com o poder
            de ferramentas inteligentes e conteúdo de alta qualidade
          </p>
        </div>
      </section>

      {/* Seção da imagem com espaçamento otimizado */}
      <section className="w-full bg-white pt-4 pb-8 md:py-16 px-4">
        <FeaturesSection />
      </section>

      <HowItWorksSection />
      <PricingSection />

      {/* Seção com efeito gradiente entre PricingSection e AboutSection */}
      <section className="w-full lg:bg-gray-50 bg-gray-500 py-8 md:py-16 px-4 font-bbh-sans-hegarty-regular">
        <ScrollGradientText
          text="TRANSFORME SEU CORPO. SUPERE SEUS LIMITES. ALCANCE SEUS OBJETIVOS."
          textMobile="TRANSFORME. SEU CORPO. SUPERE SEUS. LIMITES. ALCANCE. SEUS. OBJETIVOS"
        />
      </section>

      <AboutSection />
      <FAQSection />
      <Footer />
    </div>
  );
}
