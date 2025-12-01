"use client";

import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import {
  Camera,
  MessageCircle,
  Facebook,
  Youtube,
  Users,
  Heart,
  Trophy,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const socialLinks = [
  {
    name: "Instagram",
    icon: Camera,
    url: "https://instagram.com/movaplus_oficial",
    description:
      "Siga nosso Instagram para dicas diárias, transformações e motivação",
    color: "from-pink-500 to-purple-600",
    followers: "15.2k",
  },
  {
    name: "WhatsApp",
    icon: MessageCircle,
    url: "https://wa.me/5511999999999",
    description:
      "Entre no nosso grupo do WhatsApp para suporte e motivação diária",
    color: "from-green-500 to-green-600",
    members: "2.1k",
  },
  {
    name: "Facebook",
    icon: Facebook,
    url: "https://facebook.com/movaplusbrasil",
    description: "Conecte-se com outros membros na nossa página do Facebook",
    color: "from-blue-500 to-blue-600",
    followers: "8.7k",
  },
  {
    name: "YouTube",
    icon: Youtube,
    url: "https://youtube.com/@movaplus",
    description: "Assista nossos treinos e dicas no YouTube",
    color: "from-red-500 to-red-600",
    subscribers: "5.3k",
  },
];

const testimonials = [
  {
    name: "Maria Silva",
    result: "-12kg em 3 meses",
    text: "A comunidade Mova+ me motivou todos os dias. Ver as transformações de outras pessoas me deu força para continuar!",
    image: "👩‍💼",
  },
  {
    name: "João Santos",
    result: "+8kg de massa muscular",
    text: "O grupo do WhatsApp é incrível! Todo mundo se ajuda e compartilha dicas valiosas.",
    image: "👨‍",
  },
  {
    name: "Ana Costa",
    result: "Meta alcançada!",
    text: "Encontrei minha tribo na Mova+. Pessoas que realmente entendem a jornada fitness.",
    image: "👩‍🎓",
  },
];

const benefits = [
  {
    icon: Users,
    title: "Suporte Diário",
    description: "Receba motivação e dicas todos os dias da nossa comunidade",
  },
  {
    icon: Heart,
    title: "Transformações Reais",
    description: "Veja histórias de sucesso e inspire-se com resultados reais",
  },
  {
    icon: Trophy,
    title: "Desafios em Grupo",
    description:
      "Participe de desafios e competições amigáveis com outros membros",
  },
];

export default function ComunidadePage() {
  const heroReveal = useScrollReveal<HTMLElement>({ threshold: 0.1 });
  const benefitsReveal = useScrollReveal<HTMLElement>({ threshold: 0.1 });
  const socialReveal = useScrollReveal<HTMLElement>({ threshold: 0.1 });
  const testimonialsReveal = useScrollReveal<HTMLElement>({ threshold: 0.1 });

  return (
    <div className="min-h-screen bg-[#f5f1e8]">
      <Navbar />

      {/* Hero Section */}
      <section
        ref={heroReveal.ref}
        className={`w-full bg-gradient-to-br from-[#f5f1e8] to-white py-16 md:py-24 px-4 transition-all duration-1000 ease-out ${
          heroReveal.isVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-8"
        }`}
      >
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-gray-800 mb-6">
            Junte-se à nossa <span className="text-gray-600">Comunidade</span>
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed">
            Conecte-se com milhares de pessoas que compartilham seus objetivos
            fitness
          </p>
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500">
            <span>🏆 15.000+ membros</span>
            <span>💪 Transformações reais</span>
            <span>🤝 Suporte diário</span>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section
        ref={benefitsReveal.ref}
        className={`w-full bg-white py-16 sm:py-20 px-4 transition-all duration-1000 ease-out ${
          benefitsReveal.isVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-8"
        }`}
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-10 sm:mb-12 text-center">
            Por que participar da nossa comunidade?
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center p-4 sm:p-6">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3">
                  {benefit.title}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Links Section */}
      <section
        ref={socialReveal.ref}
        className={`w-full bg-[#f5f1e8] py-16 sm:py-20 px-4 transition-all duration-1000 ease-out ${
          socialReveal.isVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-8"
        }`}
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-10 sm:mb-12 text-center">
            Conecte-se conosco
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {socialLinks.map((social, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
              >
                <div className="flex items-center justify-between mb-6">
                  <div
                    className={`w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r ${social.color} rounded-2xl flex items-center justify-center`}
                  >
                    <social.icon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-xl sm:text-2xl font-bold text-gray-800">
                      {social.followers || social.members || social.subscribers}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {social.followers
                        ? "seguidores"
                        : social.members
                          ? "membros"
                          : "inscritos"}
                    </p>
                  </div>
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3">
                  {social.name}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 mb-6 leading-relaxed">
                  {social.description}
                </p>

                <a
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center space-x-2 bg-gradient-to-r ${social.color} text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium hover:shadow-lg transition-all duration-300 transform hover:scale-105 text-sm sm:text-base`}
                >
                  <span>Participar</span>
                  <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section
        ref={testimonialsReveal.ref}
        className={`w-full bg-white py-16 sm:py-20 px-4 transition-all duration-1000 ease-out ${
          testimonialsReveal.isVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-8"
        }`}
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-10 sm:mb-12 text-center">
            O que nossos membros dizem
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-50 rounded-2xl p-6 sm:p-8">
                <div className="text-center mb-6">
                  <div className="text-3xl sm:text-4xl mb-4">
                    {testimonial.image}
                  </div>
                  <h4 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">
                    {testimonial.name}
                  </h4>
                  <p className="text-green-600 font-semibold text-sm sm:text-base">
                    {testimonial.result}
                  </p>
                </div>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed italic">
                  {testimonial.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full bg-gray-800 py-16 sm:py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-6">
            Pronto para se juntar à nossa comunidade?
          </h2>
          <p className="text-lg sm:text-xl text-gray-300 mb-8">
            Comece sua jornada hoje e transforme sua vida junto com milhares de
            pessoas
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
            <a
              href="https://instagram.com/movaplus_oficial"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-medium hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2 text-sm sm:text-base"
            >
              <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Seguir no Instagram</span>
              <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </a>
            <a
              href="https://wa.me/5511999999999"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-medium hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2 text-sm sm:text-base"
            >
              <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Entrar no WhatsApp</span>
              <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
