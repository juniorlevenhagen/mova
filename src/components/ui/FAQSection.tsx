"use client";
// src/components/ui/FAQSection.tsx
import { useState, useEffect, useRef } from "react";

const faqs = [
  {
    question: "O que está incluído no Mova+ Complete?",
    answer:
      "Você recebe um plano completo com: Treinos personalizados conforme seu objetivo e nível (casa ou academia), Plano alimentar gerado por IA com base em suas necessidades, alergias e preferências, Acesso à plataforma com atualizações, conteúdos e benefícios parceiros.",
  },
  {
    question: "A dieta é feita por nutricionista?",
    answer:
      "Não. A dieta é gerada por um sistema de inteligência artificial treinado com base em recomendações nutricionais e adaptações conforme suas informações pessoais.",
  },
  {
    question: "Os treinos consideram dores ou limitações físicas?",
    answer:
      "Sim. No início, você preenche um questionário detalhado que nos ajuda a montar treinos adaptados à sua realidade, incluindo dores, lesões ou limitações.",
  },
  {
    question: "Preciso de equipamentos para treinar?",
    answer:
      "Não necessariamente. Se você treina em casa, sugerimos treinos que usam o peso do corpo ou objetos simples. Se tiver acesso a academia, também otimizamos seus treinos com os aparelhos disponíveis.",
  },
  {
    question: "Posso fazer contato direto com treinador ou nutricionista?",
    answer:
      "Atualmente, todo o suporte é feito através da plataforma digital, sem atendimento individualizado por profissionais humanos. As orientações são automáticas, baseadas em dados fornecidos por você.",
  },
  {
    question: "É necessário ter experiência com exercícios físicos?",
    answer:
      "Não. O Mova+ Complete é pensado para todos os níveis — do iniciante ao avançado. Os treinos são montados com base no seu perfil, objetivos e experiência.",
  },
  {
    question: "Como recebo meus treinos e dieta?",
    answer:
      "Após se cadastrar, você acessa sua área exclusiva onde seu plano completo é liberado, com atualizações periódicas baseadas no seu progresso.",
  },
  {
    question: "Existem outros planos além do Mova+ Complete?",
    answer:
      "Atualmente não. Trabalhamos com uma única experiência completa, para entregar o melhor de forma simples, acessível e objetiva.",
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target); // Stop observing once visible
          }
        });
      },
      {
        threshold: 0.3, // Trigger when 20% of the section is visible
        rootMargin: "0px 0px -50px 0px", // Start animation a bit before fully visible
      }
    );

    const currentSection = sectionRef.current;
    if (currentSection) {
      observer.observe(currentSection);
    }

    return () => {
      if (currentSection) {
        observer.unobserve(currentSection);
      }
    };
  }, []);

  return (
    <section ref={sectionRef} className="max-w-2xl mx-auto py-8 md:py-12 px-4">
      <div
        className={`transition-all duration-700 transform ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-center mb-4 md:mb-6 text-black leading-tight">
          Perguntas frequentes
        </h2>
        <p className="text-base md:text-lg lg:text-xl text-black/90 text-center mb-8 font-medium leading-relaxed">
          Tudo que você precisa saber sobre o Mova+
        </p>
      </div>
      <div className="divide-y divide-gray-200">
        {faqs.map((faq, idx) => {
          // Calculate delay for cascade effect (from top to bottom)
          const delay = idx * 100; // 100ms delay between each item

          return (
            <div
              key={idx}
              className={`transition-all duration-500 transform ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
              style={{
                transitionDelay: `${delay}ms`,
              }}
            >
              <button
                className="w-full flex justify-between items-center py-5 text-left focus:outline-none hover:bg-gray-50 transition-colors duration-200 rounded-lg px-2 -mx-2"
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
              >
                <span className="font-medium text-base md:text-lg text-black">
                  {faq.question}
                </span>
                <span className="text-2xl text-gray-400 transition-transform duration-200">
                  {openIndex === idx ? "−" : "+"}
                </span>
              </button>
              {openIndex === idx && (
                <div className="pb-5 text-base md:text-lg text-black/90 leading-relaxed animate-in slide-in-from-top-2 duration-300">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
