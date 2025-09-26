"use client";

import { useRouter } from "next/navigation";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { Heart, Target, Users, Zap } from "lucide-react";

const values = [
  {
    icon: Heart,
    title: "Paixão pelo Movimento",
    description:
      "Acreditamos que o movimento é a chave para uma vida mais saudável e feliz.",
  },
  {
    icon: Target,
    title: "Personalização Total",
    description:
      "Cada pessoa é única, por isso criamos planos específicos para cada indivíduo.",
  },
  {
    icon: Users,
    title: "Comunidade Forte",
    description:
      "Conectamos pessoas com objetivos similares para se apoiarem mutuamente.",
  },
  {
    icon: Zap,
    title: "Tecnologia Inteligente",
    description:
      "Usamos IA para criar planos que se adaptam ao seu progresso em tempo real.",
  },
];

const stats = [
  { number: "10.000+", label: "Usuários Ativos" },
  { number: "95%", label: "Taxa de Satisfação" },
  { number: "50+", label: "Especialistas" },
  { number: "24/7", label: "Suporte Disponível" },
];

export default function SobreNosPage() {
  const router = useRouter();

  const handleStartJourney = () => {
    router.push("/register/step0");
  };

  return (
    <div className="min-h-screen bg-[#f5f1e8]">
      <Navbar />

      {/* Hero Section */}
      <section className="w-full bg-gradient-to-br from-[#f5f1e8] to-white py-16 md:py-24 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-6 leading-tight">
            Conheça a <span className="text-gray-600">História do Mova+</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Nossa missão é democratizar o acesso a planos fitness
            personalizados, usando tecnologia de ponta para transformar vidas.
          </p>
        </div>
      </section>

      {/* Nossa História */}
      <section className="w-full bg-white py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
                Nossa História
              </h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  O Mova+ nasceu da paixão por democratizar o acesso a planos
                  fitness personalizados. Nossa equipe de especialistas em
                  medicina esportiva, nutrição e tecnologia se uniu para criar
                  uma plataforma que combina o melhor da ciência do exercício
                  com inteligência artificial.
                </p>
                <p>
                  Começamos com uma simples pergunta: &ldquo;Por que planos
                  personalizados devem ser privilégio de poucos?&rdquo; Hoje,
                  ajudamos milhares de pessoas a alcançarem seus objetivos de
                  forma segura e eficaz.
                </p>
                <p>
                  Nossa tecnologia analisa seu perfil, objetivos e progresso
                  para criar planos únicos que se adaptam automaticamente,
                  garantindo resultados duradouros e sustentáveis.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="w-full h-96 bg-gray-800 rounded-2xl flex items-center justify-center">
                <div className="text-center text-white">
                  <Users className="w-24 h-24 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold">
                    10.000+ Vidas Transformadas
                  </h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Nossos Valores */}
      <section className="w-full bg-[#f5f1e8] py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Nossos Valores
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Os princípios que guiam cada decisão e cada linha de código
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg flex items-center justify-center mb-4">
                  <value.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">
                  {value.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Estatísticas */}
      <section className="w-full bg-gray-800 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Números que Falam
            </h2>
            <p className="text-xl text-gray-300">
              Resultados reais de uma comunidade em crescimento
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-300 text-lg">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full bg-[#f5f1e8] py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
            Pronto para fazer parte da nossa história?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Junte-se a milhares de pessoas que já transformaram suas vidas com o
            Mova+
          </p>
          <button
            onClick={handleStartJourney}
            className="bg-gradient-to-r from-blue-500 to-green-500 text-white py-4 px-8 rounded-lg font-medium hover:from-blue-600 hover:to-green-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-lg"
          >
            Começar Minha Jornada
          </button>
          <p className="text-gray-500 text-sm mt-4">
            7 dias grátis • Cancele a qualquer momento
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
