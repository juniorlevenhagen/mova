"use client";

import { useState } from "react";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import {
  Search,
  HelpCircle,
  Mail,
  MessageCircle,
  FileText,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

const helpCategories = [
  {
    id: "getting-started",
    title: "Primeiros Passos",
    icon: HelpCircle,
    articles: [
      {
        title: "Como criar minha conta?",
        content:
          "Para criar sua conta, clique em 'Cadastre-se' no canto superior direito e preencha os dados solicitados. Você receberá um email de confirmação para ativar sua conta.",
      },
      {
        title: "Como funciona o período de teste?",
        content:
          "Oferecemos 7 dias grátis para você experimentar todos os recursos do Mova+. Não é necessário cartão de crédito para começar. Após o período, você pode escolher um de nossos planos.",
      },
      {
        title: "Como configurar meu perfil?",
        content:
          "Após o cadastro, você será direcionado para configurar seu perfil. Informe seus dados físicos, objetivos fitness, limitações e nível de experiência para receber um plano personalizado.",
      },
    ],
  },
  {
    id: "plans",
    title: "Planos e Assinatura",
    icon: FileText,
    articles: [
      {
        title: "Quais são os planos disponíveis?",
        content:
          "Atualmente oferecemos o Mova+ Complete, que inclui treinos personalizados, plano nutricional gerado por IA, acompanhamento de progresso e acesso à comunidade.",
      },
      {
        title: "Posso cancelar a qualquer momento?",
        content:
          "Sim! Você pode cancelar sua assinatura a qualquer momento, sem taxas ou multas. Seu acesso continuará até o final do período pago.",
      },
      {
        title: "Como funciona a cobrança?",
        content:
          "A cobrança é mensal e automática. Você pode gerenciar sua assinatura e forma de pagamento a qualquer momento em sua conta.",
      },
    ],
  },
  {
    id: "technical",
    title: "Suporte Técnico",
    icon: MessageCircle,
    articles: [
      {
        title: "Estou com problemas para acessar minha conta",
        content:
          "Verifique se você está usando o email correto e tente redefinir sua senha. Se o problema persistir, entre em contato conosco através do formulário abaixo.",
      },
      {
        title: "Meu plano não está sendo gerado",
        content:
          "Certifique-se de que preencheu todas as informações do seu perfil. Se o problema persistir, verifique sua conexão com a internet e tente novamente.",
      },
      {
        title: "Como atualizar minhas informações?",
        content:
          "Acesse seu dashboard e clique em 'Configurações' para atualizar suas informações pessoais, objetivos ou limitações físicas.",
      },
    ],
  },
];

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
    question: "Preciso de equipamentos para treinar?",
    answer:
      "Não necessariamente. Se você treina em casa, sugerimos treinos que usam o peso do corpo ou objetos simples. Se tiver acesso a academia, também otimizamos seus treinos com os aparelhos disponíveis.",
  },
  {
    question: "Posso fazer contato direto com treinador ou nutricionista?",
    answer:
      "Atualmente, todo o suporte é feito através da plataforma digital, sem atendimento individualizado por profissionais humanos. As orientações são automáticas, baseadas em dados fornecidos por você.",
  },
];

export default function CentralAjudaPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#f5f1e8]">
      <Navbar />

      {/* Hero Section */}
      <section className="w-full bg-gradient-to-br from-[#f5f1e8] to-white py-16 md:py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
            Central de Ajuda
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Encontre respostas para suas dúvidas e aprenda a usar o Mova+
          </p>

          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Digite sua dúvida aqui..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent"
            />
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="w-full bg-white py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-800 mb-12 text-center">
            Categorias de Ajuda
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {helpCategories.map((category) => (
              <div
                key={category.id}
                className="bg-gray-50 rounded-2xl p-8 hover:shadow-lg transition-all duration-300 cursor-pointer"
                onClick={() =>
                  setSelectedCategory(
                    selectedCategory === category.id ? null : category.id
                  )
                }
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <category.icon className="w-8 h-8 text-gray-800" />
                    <h3 className="text-xl font-bold text-gray-800">
                      {category.title}
                    </h3>
                  </div>
                  {selectedCategory === category.id ? (
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  )}
                </div>

                {selectedCategory === category.id && (
                  <div className="space-y-4 mt-6">
                    {category.articles.map((article, index) => (
                      <div
                        key={index}
                        className="border-l-4 border-gray-800 pl-4"
                      >
                        <button
                          onClick={() =>
                            setExpandedArticle(
                              expandedArticle === `${category.id}-${index}`
                                ? null
                                : `${category.id}-${index}`
                            )
                          }
                          className="text-left w-full"
                        >
                          <h4 className="font-semibold text-gray-800 hover:text-gray-600 transition-colors">
                            {article.title}
                          </h4>
                        </button>
                        {expandedArticle === `${category.id}-${index}` && (
                          <p className="text-gray-600 mt-2 leading-relaxed">
                            {article.content}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="w-full bg-[#f5f1e8] py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-800 mb-12 text-center">
            Perguntas Frequentes
          </h2>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm">
                <button
                  onClick={() =>
                    setExpandedFaq(expandedFaq === index ? null : index)
                  }
                  className="w-full flex justify-between items-center p-6 text-left"
                >
                  <span className="font-semibold text-gray-800">
                    {faq.question}
                  </span>
                  {expandedFaq === index ? (
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  )}
                </button>
                {expandedFaq === index && (
                  <div className="px-6 pb-6 text-gray-600 leading-relaxed">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="w-full bg-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-8">
            Ainda precisa de ajuda?
          </h2>
          <p className="text-lg text-gray-600 mb-12">
            Nossa equipe está aqui para ajudar você
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-50 rounded-2xl p-8">
              <Mail className="w-12 h-12 text-gray-800 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Envie um Email
              </h3>
              <p className="text-gray-600 mb-6">
                Envie sua dúvida por email e receba uma resposta em até 24 horas
              </p>
              <a
                href="mailto:suporte@movaplus.com"
                className="inline-block bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-900 transition-colors"
              >
                Enviar Email
              </a>
            </div>

            <div className="bg-gray-50 rounded-2xl p-8">
              <MessageCircle className="w-12 h-12 text-gray-800 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Chat ao Vivo
              </h3>
              <p className="text-gray-600 mb-6">
                Converse com nossa equipe em tempo real
              </p>
              <button className="inline-block bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-900 transition-colors">
                Iniciar Chat
              </button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
