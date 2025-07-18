"use client";
// src/components/ui/FAQSection.tsx
import { useState } from "react";

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

  return (
    <section className="max-w-2xl mx-auto py-16 px-4">
      <h2 className="text-3xl font-bold text-center mb-2 text-gray-800">
        Perguntas frequentes
      </h2>
      <p className="text-gray-600 text-center mb-8">
        Tudo que você precisa saber sobre o Mova+
      </p>
      <div className="divide-y divide-gray-200">
        {faqs.map((faq, idx) => (
          <div key={idx}>
            <button
              className="w-full flex justify-between items-center py-5 text-left focus:outline-none"
              onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
            >
              <span className="font-medium text-gray-900">{faq.question}</span>
              <span className="text-2xl text-gray-400">
                {openIndex === idx ? "−" : "+"}
              </span>
            </button>
            {openIndex === idx && (
              <div className="pb-5 text-gray-600">{faq.answer}</div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
