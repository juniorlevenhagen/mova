"use client";
// src/components/ui/FAQSection.tsx
import { useState, useEffect, useRef } from "react";

const faqs = [
  {
    question: "O que está incluído no Mova+ Complete?",
    answer:
      "Você recebe uma experiência completa de cuidado com o corpo: treinos personalizados de acordo com seu objetivo, nível e local (casa ou academia), orientação alimentar ajustada às suas necessidades, preferências e restrições, além de acesso à plataforma com atualizações, conteúdos e benefícios exclusivos.",
  },
  {
    question: "A orientação alimentar é feita por nutricionista?",
    answer:
      "Não. O Mova+ oferece orientações alimentares personalizadas com base em dados informados por você e referências nutricionais amplamente utilizadas. Não se trata de prescrição médica ou nutricional.",
  },
  {
    question: "Os treinos consideram dores ou limitações físicas?",
    answer:
      "Sim. Ao iniciar, você responde um questionário que nos ajuda a adaptar os treinos à sua realidade, respeitando possíveis dores, desconfortos ou limitações, sempre priorizando segurança e progressão gradual.",
  },
  {
    question: "Preciso de equipamentos para treinar?",
    answer:
      "Não obrigatoriamente. Se você treina em casa, os treinos são adaptados para usar o peso do próprio corpo ou objetos simples. Caso tenha acesso à academia, o plano também se ajusta aos aparelhos disponíveis.",
  },
  {
    question: "Existe acompanhamento individual com profissionais?",
    answer:
      "Todo o acompanhamento acontece pela plataforma digital. As orientações são personalizadas a partir das informações que você fornece, sem atendimento individual ou acompanhamento presencial.",
  },
  {
    question: "Preciso ter experiência com exercícios físicos?",
    answer:
      "Não é necessário ter experiência prévia. O Mova+ foi desenvolvido para acompanhar pessoas em todos os níveis, desde quem está começando até quem já treina há algum tempo. Os treinos são criados respeitando seu nível atual e evoluem de forma gradual conforme você progride, sempre priorizando segurança e adaptação ao seu ritmo. Em caso de dúvidas ou condições específicas, consulte sempre um profissional de educação física.",
  },
  {
    question: "Como recebo meus treinos e orientações alimentares?",
    answer:
      "Após o cadastro, você acessa sua área exclusiva, onde seu plano é liberado e atualizado conforme sua evolução e ajustes no seu perfil.",
  },
  {
    question: "Existem outros planos além do Mova+ Complete?",
    answer:
      "No momento, oferecemos uma única experiência completa, pensada para simplificar sua jornada e entregar resultados de forma clara, prática e acessível.",
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
    <section ref={sectionRef} className="max-w-2xl mx-auto py-8 md:py-16 px-4">
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
                  : "opacity-0 -translate-y-8"
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
                <span
                  className={`text-2xl text-gray-400 transition-transform duration-300 ease-in-out ${
                    openIndex === idx ? "rotate-180" : "rotate-0"
                  }`}
                >
                  +
                </span>
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  openIndex === idx
                    ? "max-h-96 opacity-100"
                    : "max-h-0 opacity-0"
                }`}
              >
                <div className="pb-5 text-base md:text-lg text-black/90 leading-relaxed">
                  {faq.answer}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
