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
import { config } from "@/lib/config";

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

  // Função para normalizar texto para busca (remove acentos e converte para minúsculas)
  const normalizeText = (text: string) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };

  // Filtrar artigos baseado no termo de busca
  const filteredArticles = helpCategories.flatMap((category) =>
    category.articles
      .filter(
        (article) =>
          normalizeText(article.title).includes(normalizeText(searchTerm)) ||
          normalizeText(article.content).includes(normalizeText(searchTerm))
      )
      .map((article, index) => ({
        ...article,
        categoryId: category.id,
        categoryTitle: category.title,
        categoryIcon: category.icon,
        articleIndex: index,
      }))
  );

  // Filtrar FAQs baseado no termo de busca
  const filteredFaqs = faqs.filter(
    (faq) =>
      normalizeText(faq.question).includes(normalizeText(searchTerm)) ||
      normalizeText(faq.answer).includes(normalizeText(searchTerm))
  );

  const hasSearchResults = searchTerm.trim().length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-white to-gray-100">
      <Navbar />

      {/* Hero Section */}
      <section className="w-full py-16 md:py-24 px-4 bg-gradient-to-b from-white via-white to-gray-100">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-medium text-gray-600 mb-8 tracking-wide uppercase bg-gradient-to-r from-black to-gray-800 text-white py-2 rounded-full w-56 mx-auto font-zalando relative overflow-hidden group shadow-lg">
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
            <span className="relative z-10">Central de Ajuda</span>
          </p>
          <h1 className="text-3xl md:text-6xl font-zalando-medium text-black mb-6 leading-tight">
            Central de Ajuda
          </h1>
          <p className="text-lg md:text-xl text-black/90 mb-8 font-zalando">
            Encontre respostas para suas dúvidas e aprenda a usar o Mova+
          </p>

          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-black/60 w-5 h-5" />
            <input
              type="text"
              placeholder="Digite sua dúvida aqui..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent font-zalando"
            />
          </div>
        </div>
      </section>

      {/* Search Results or Categories Section */}
      <section className="w-full bg-white py-20 px-4">
        <div className="max-w-6xl mx-auto">
          {hasSearchResults ? (
            <>
              <h2 className="text-3xl md:text-5xl font-zalando-medium text-black mb-4 text-center">
                Resultados da Busca
              </h2>
              <p className="text-lg text-black/80 mb-12 text-center font-zalando">
                {filteredArticles.length + filteredFaqs.length} resultado(s)
                encontrado(s) para &quot;{searchTerm}&quot;
              </p>

              {/* Artigos encontrados */}
              {filteredArticles.length > 0 && (
                <div className="mb-12">
                  <h3 className="text-2xl font-zalando-medium text-black mb-6">
                    Artigos ({filteredArticles.length})
                  </h3>
                  <div className="space-y-4">
                    {filteredArticles.map((article, index) => {
                      const articleKey = `${article.categoryId}-${article.articleIndex}`;
                      const IconComponent = article.categoryIcon;
                      return (
                        <div
                          key={index}
                          className="bg-white rounded-[22px] border-2 border-black p-6"
                        >
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                              <IconComponent className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-sm text-black/60 font-zalando">
                              {article.categoryTitle}
                            </span>
                          </div>
                          <button
                            onClick={() =>
                              setExpandedArticle(
                                expandedArticle === articleKey
                                  ? null
                                  : articleKey
                              )
                            }
                            className="text-left w-full"
                          >
                            <h4 className="font-zalando-medium text-black hover:text-black/80 transition-colors text-lg mb-2">
                              {article.title}
                            </h4>
                          </button>
                          {expandedArticle === articleKey && (
                            <p className="text-black/80 mt-2 leading-relaxed font-zalando">
                              {article.content}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* FAQs encontrados */}
              {filteredFaqs.length > 0 && (
                <div>
                  <h3 className="text-2xl font-zalando-medium text-black mb-6">
                    Perguntas Frequentes ({filteredFaqs.length})
                  </h3>
                  <div className="space-y-4">
                    {filteredFaqs.map((faq, index) => {
                      const originalIndex = faqs.findIndex(
                        (f) => f.question === faq.question
                      );
                      return (
                        <div
                          key={index}
                          className="bg-white rounded-[22px] border-2 border-black"
                        >
                          <button
                            onClick={() =>
                              setExpandedFaq(
                                expandedFaq === originalIndex
                                  ? null
                                  : originalIndex
                              )
                            }
                            className="w-full flex justify-between items-center p-6 text-left hover:bg-gray-50 transition-colors rounded-[22px]"
                          >
                            <span className="font-zalando-medium text-black text-left">
                              {faq.question}
                            </span>
                            {expandedFaq === originalIndex ? (
                              <ChevronDown className="w-5 h-5 text-black flex-shrink-0" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-black flex-shrink-0" />
                            )}
                          </button>
                          {expandedFaq === originalIndex && (
                            <div className="px-6 pb-6 text-black/80 leading-relaxed font-zalando">
                              {faq.answer}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Nenhum resultado */}
              {filteredArticles.length === 0 && filteredFaqs.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-lg text-black/80 font-zalando mb-4">
                    Nenhum resultado encontrado para &quot;{searchTerm}&quot;
                  </p>
                  <p className="text-base text-black/60 font-zalando">
                    Tente usar palavras-chave diferentes ou verifique a
                    ortografia
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              <h2 className="text-3xl md:text-5xl font-zalando-medium text-black mb-12 text-center">
                Categorias de Ajuda
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {helpCategories.map((category) => (
                  <div
                    key={category.id}
                    className="bg-white rounded-[22px] border-2 border-black p-8 hover:shadow-xl transition-all duration-300 cursor-pointer"
                    onClick={() =>
                      setSelectedCategory(
                        selectedCategory === category.id ? null : category.id
                      )
                    }
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                          <category.icon className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-xl font-zalando-medium text-black">
                          {category.title}
                        </h3>
                      </div>
                      {selectedCategory === category.id ? (
                        <ChevronDown className="w-5 h-5 text-black" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-black" />
                      )}
                    </div>

                    {selectedCategory === category.id && (
                      <div className="space-y-4 mt-6">
                        {category.articles.map((article, index) => (
                          <div
                            key={index}
                            className="border-l-4 border-black pl-4"
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
                              <h4 className="font-zalando-medium text-black hover:text-black/80 transition-colors">
                                {article.title}
                              </h4>
                            </button>
                            {expandedArticle === `${category.id}-${index}` && (
                              <p className="text-black/80 mt-2 leading-relaxed font-zalando">
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
            </>
          )}
        </div>
      </section>

      {/* FAQ Section - Mostrar apenas se não houver busca ativa */}
      {!hasSearchResults && (
        <section className="w-full bg-gray-50 py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-zalando-medium text-black mb-12 text-center">
              Perguntas Frequentes
            </h2>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="bg-white rounded-[22px] border-2 border-black"
                >
                  <button
                    onClick={() =>
                      setExpandedFaq(expandedFaq === index ? null : index)
                    }
                    className="w-full flex justify-between items-center p-6 text-left hover:bg-gray-50 transition-colors rounded-[22px]"
                  >
                    <span className="font-zalando-medium text-black text-left">
                      {faq.question}
                    </span>
                    {expandedFaq === index ? (
                      <ChevronDown className="w-5 h-5 text-black flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-black flex-shrink-0" />
                    )}
                  </button>
                  {expandedFaq === index && (
                    <div className="px-6 pb-6 text-black/80 leading-relaxed font-zalando">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact Section */}
      <section className="w-full bg-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-zalando-medium text-black mb-8">
            Ainda precisa de ajuda?
          </h2>
          <p className="text-lg text-black/80 mb-12 font-zalando">
            Nossa equipe está aqui para ajudar você
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-[22px] border-2 border-black p-8">
              <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-zalando-medium text-black mb-4">
                Envie um Email
              </h3>
              <p className="text-black/80 mb-6 font-zalando">
                Envie sua dúvida por email e receba uma resposta em até 24 horas
              </p>
              <a
                href={`mailto:${config.supportEmail}`}
                className="inline-block bg-black text-white px-6 py-3 rounded-lg hover:bg-black/90 transition-colors font-zalando-medium border-2 border-black"
              >
                Enviar Email
              </a>
            </div>

            <div className="bg-white rounded-[22px] border-2 border-black p-8">
              <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-zalando-medium text-black mb-4">
                Chat ao Vivo
              </h3>
              <p className="text-black/80 mb-6 font-zalando">
                Converse com nossa equipe em tempo real
              </p>
              <button className="inline-block bg-black text-white px-6 py-3 rounded-lg hover:bg-black/90 transition-colors font-zalando-medium border-2 border-black">
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
