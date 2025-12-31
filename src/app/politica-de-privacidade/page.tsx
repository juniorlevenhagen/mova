"use client";

import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";

export default function PoliticaDePrivacidadePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="w-full py-16 md:py-24 px-4 bg-gradient-to-b from-white via-white to-gray-100">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-medium text-gray-600 mb-8 tracking-wide uppercase bg-gradient-to-r from-black to-gray-800 text-white py-2 rounded-full w-64 mx-auto font-zalando relative overflow-hidden group shadow-lg">
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
            <span className="relative z-10">Política de Privacidade</span>
          </p>
          <h1 className="text-3xl md:text-6xl font-zalando-medium text-black mb-6 leading-tight">
            Política de Privacidade
          </h1>
          <p className="text-lg md:text-xl text-black/90 max-w-3xl mx-auto leading-relaxed font-zalando">
            Última atualização:{" "}
            {new Date().toLocaleDateString("pt-BR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </section>

      {/* Conteúdo */}
      <section className="w-full py-12 md:py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-[22px] border-2 border-black p-8 md:p-12 space-y-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-zalando-medium text-black mb-4">
                1. Introdução
              </h2>
              <p className="text-black/80 leading-relaxed font-zalando mb-4">
                O Mova+ está comprometido em proteger sua privacidade. Esta
                Política de Privacidade explica como coletamos, usamos,
                armazenamos e protegemos suas informações pessoais quando você
                utiliza nossa plataforma.
              </p>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-zalando-medium text-black mb-4">
                2. Informações que Coletamos
              </h2>
              <p className="text-black/80 leading-relaxed font-zalando mb-4">
                Coletamos as seguintes categorias de informações:
              </p>

              <h3 className="text-xl font-zalando-medium text-black mb-3 mt-6">
                2.1. Informações Fornecidas por Você
              </h3>
              <ul className="list-disc list-inside space-y-2 text-black/80 font-zalando ml-4">
                <li>Dados de cadastro (nome, e-mail, senha)</li>
                <li>
                  Informações do perfil (idade, peso, altura, objetivos fitness)
                </li>
                <li>Dados de saúde e limitações físicas</li>
                <li>Informações de pagamento (processadas de forma segura)</li>
                <li>Comunicações com nosso suporte</li>
              </ul>

              <h3 className="text-xl font-zalando-medium text-black mb-3 mt-6">
                2.2. Informações Coletadas Automaticamente
              </h3>
              <ul className="list-disc list-inside space-y-2 text-black/80 font-zalando ml-4">
                <li>
                  Dados de uso da plataforma (páginas visitadas, tempo de uso)
                </li>
                <li>
                  Informações do dispositivo (tipo, sistema operacional,
                  navegador)
                </li>
                <li>Endereço IP e localização aproximada</li>
                <li>Cookies e tecnologias similares</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-zalando-medium text-black mb-4">
                3. Como Usamos suas Informações
              </h2>
              <p className="text-black/80 leading-relaxed font-zalando mb-4">
                Utilizamos suas informações para:
              </p>
              <ul className="list-disc list-inside space-y-2 text-black/80 font-zalando ml-4">
                <li>Fornecer e melhorar nossos serviços</li>
                <li>Criar planos de treino e orientação alimentar adaptados</li>
                <li>Processar pagamentos e gerenciar assinaturas</li>
                <li>Comunicar-nos com você sobre o serviço</li>
                <li>
                  Enviar atualizações, newsletters e conteúdo relevante (com seu
                  consentimento)
                </li>
                <li>Analisar e melhorar a experiência do usuário</li>
                <li>Detectar e prevenir fraudes ou atividades suspeitas</li>
                <li>Cumprir obrigações legais</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-zalando-medium text-black mb-4">
                4. Compartilhamento de Informações
              </h2>
              <p className="text-black/80 leading-relaxed font-zalando mb-4">
                Não vendemos suas informações pessoais. Podemos compartilhar
                suas informações apenas nas seguintes situações:
              </p>
              <ul className="list-disc list-inside space-y-2 text-black/80 font-zalando ml-4">
                <li>
                  Com prestadores de serviços que nos ajudam a operar a
                  plataforma (processamento de pagamentos, hospedagem, análise
                  de dados)
                </li>
                <li>Quando exigido por lei ou processo legal</li>
                <li>Para proteger nossos direitos, propriedade ou segurança</li>
                <li>Com seu consentimento explícito</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-zalando-medium text-black mb-4">
                5. Segurança dos Dados
              </h2>
              <p className="text-black/80 leading-relaxed font-zalando mb-4">
                Implementamos medidas de segurança técnicas e organizacionais
                para proteger suas informações pessoais contra acesso não
                autorizado, alteração, divulgação ou destruição. Isso inclui:
              </p>
              <ul className="list-disc list-inside space-y-2 text-black/80 font-zalando ml-4">
                <li>Criptografia de dados sensíveis</li>
                <li>Autenticação segura</li>
                <li>Monitoramento regular de segurança</li>
                <li>Acesso restrito a informações pessoais</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-zalando-medium text-black mb-4">
                6. Retenção de Dados
              </h2>
              <p className="text-black/80 leading-relaxed font-zalando mb-4">
                Mantemos suas informações pessoais apenas pelo tempo necessário
                para cumprir os propósitos descritos nesta política, a menos que
                um período de retenção mais longo seja exigido ou permitido por
                lei.
              </p>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-zalando-medium text-black mb-4">
                7. Seus Direitos (LGPD)
              </h2>
              <p className="text-black/80 leading-relaxed font-zalando mb-4">
                De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem
                os seguintes direitos:
              </p>
              <ul className="list-disc list-inside space-y-2 text-black/80 font-zalando ml-4">
                <li>Confirmar a existência de tratamento de dados</li>
                <li>Acessar seus dados pessoais</li>
                <li>Corrigir dados incompletos, inexatos ou desatualizados</li>
                <li>
                  Solicitar anonimização, bloqueio ou eliminação de dados
                  desnecessários
                </li>
                <li>Solicitar portabilidade dos dados</li>
                <li>Revogar seu consentimento</li>
                <li>Ser informado sobre compartilhamento de dados</li>
              </ul>
              <p className="text-black/80 leading-relaxed font-zalando mt-4">
                Para exercer esses direitos, entre em contato conosco através da
                nossa Central de Ajuda.
              </p>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-zalando-medium text-black mb-4">
                8. Cookies e Tecnologias Similares
              </h2>
              <p className="text-black/80 leading-relaxed font-zalando mb-4">
                Utilizamos cookies e tecnologias similares para melhorar sua
                experiência. Para mais informações, consulte nossa Política de
                Cookies.
              </p>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-zalando-medium text-black mb-4">
                9. Alterações nesta Política
              </h2>
              <p className="text-black/80 leading-relaxed font-zalando mb-4">
                Podemos atualizar esta Política de Privacidade periodicamente.
                Notificaremos você sobre mudanças significativas através da
                plataforma ou por e-mail. A data da última atualização está
                indicada no topo desta página.
              </p>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-zalando-medium text-black mb-4">
                10. Contato
              </h2>
              <p className="text-black/80 leading-relaxed font-zalando mb-4">
                Para questões sobre esta Política de Privacidade ou para exercer
                seus direitos, entre em contato conosco através da nossa Central
                de Ajuda ou pelo e-mail de suporte disponível na plataforma.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
