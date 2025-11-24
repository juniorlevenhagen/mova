"use client";

import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";

export default function LGPDPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="w-full py-16 md:py-24 px-4 bg-gradient-to-b from-white via-white to-gray-100">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-medium text-gray-600 mb-8 tracking-wide uppercase bg-gradient-to-r from-black to-gray-800 text-white py-2 rounded-full w-32 mx-auto font-zalando relative overflow-hidden group shadow-lg">
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
            <span className="relative z-10">LGPD</span>
          </p>
          <h1 className="text-3xl md:text-6xl font-zalando-medium text-black mb-6 leading-tight">
            Lei Geral de Proteção de Dados (LGPD)
          </h1>
          <p className="text-lg md:text-xl text-black/90 max-w-3xl mx-auto leading-relaxed font-zalando">
            Seus direitos e como o Mova+ protege seus dados pessoais
          </p>
        </div>
      </section>

      {/* Conteúdo */}
      <section className="w-full py-12 md:py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-[22px] border-2 border-black p-8 md:p-12 space-y-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-zalando-medium text-black mb-4">
                1. O que é a LGPD?
              </h2>
              <p className="text-black/80 leading-relaxed font-zalando mb-4">
                A Lei Geral de Proteção de Dados (Lei nº 13.709/2018) estabelece
                regras sobre coleta, armazenamento, tratamento e
                compartilhamento de dados pessoais no Brasil. O Mova+ está
                totalmente comprometido em cumprir todas as disposições da LGPD.
              </p>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-zalando-medium text-black mb-4">
                2. Seus Direitos sob a LGPD
              </h2>
              <p className="text-black/80 leading-relaxed font-zalando mb-4">
                Como titular de dados pessoais, você possui os seguintes
                direitos garantidos pela LGPD:
              </p>

              <h3 className="text-xl font-zalando-medium text-black mb-3 mt-6">
                2.1. Confirmação e Acesso
              </h3>
              <p className="text-black/80 leading-relaxed font-zalando mb-4">
                Você tem o direito de confirmar a existência de tratamento de
                seus dados pessoais e acessar esses dados, podendo solicitar uma
                cópia dos dados que mantemos sobre você.
              </p>

              <h3 className="text-xl font-zalando-medium text-black mb-3 mt-6">
                2.2. Correção
              </h3>
              <p className="text-black/80 leading-relaxed font-zalando mb-4">
                Você pode solicitar a correção de dados incompletos, inexatos ou
                desatualizados. Você pode atualizar muitas dessas informações
                diretamente na sua conta.
              </p>

              <h3 className="text-xl font-zalando-medium text-black mb-3 mt-6">
                2.3. Anonimização, Bloqueio ou Eliminação
              </h3>
              <p className="text-black/80 leading-relaxed font-zalando mb-4">
                Você pode solicitar a anonimização, bloqueio ou eliminação de
                dados desnecessários, excessivos ou tratados em desconformidade
                com a LGPD.
              </p>

              <h3 className="text-xl font-zalando-medium text-black mb-3 mt-6">
                2.4. Portabilidade
              </h3>
              <p className="text-black/80 leading-relaxed font-zalando mb-4">
                Você tem o direito de solicitar a portabilidade de seus dados
                para outro fornecedor de serviço, quando tecnicamente viável.
              </p>

              <h3 className="text-xl font-zalando-medium text-black mb-3 mt-6">
                2.5. Eliminação
              </h3>
              <p className="text-black/80 leading-relaxed font-zalando mb-4">
                Você pode solicitar a eliminação dos dados pessoais tratados com
                base no seu consentimento, exceto nas hipóteses previstas em
                lei.
              </p>

              <h3 className="text-xl font-zalando-medium text-black mb-3 mt-6">
                2.6. Informação sobre Compartilhamento
              </h3>
              <p className="text-black/80 leading-relaxed font-zalando mb-4">
                Você tem o direito de obter informações sobre entidades públicas
                e privadas com as quais compartilhamos seus dados.
              </p>

              <h3 className="text-xl font-zalando-medium text-black mb-3 mt-6">
                2.7. Revogação do Consentimento
              </h3>
              <p className="text-black/80 leading-relaxed font-zalando mb-4">
                Você pode revogar seu consentimento a qualquer momento, mediante
                manifestação expressa. A revogação não afeta a legalidade do
                tratamento realizado anteriormente.
              </p>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-zalando-medium text-black mb-4">
                3. Como Exercer Seus Direitos
              </h2>
              <p className="text-black/80 leading-relaxed font-zalando mb-4">
                Para exercer qualquer um dos direitos acima, você pode:
              </p>
              <ul className="list-disc list-inside space-y-2 text-black/80 font-zalando ml-4">
                <li>
                  Acessar sua conta e atualizar suas informações diretamente
                </li>
                <li>Entrar em contato através da nossa Central de Ajuda</li>
                <li>Enviar uma solicitação por e-mail para nosso suporte</li>
              </ul>
              <p className="text-black/80 leading-relaxed font-zalando mt-4">
                Responderemos à sua solicitação no prazo de até 15 (quinze)
                dias, conforme exigido pela LGPD.
              </p>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-zalando-medium text-black mb-4">
                4. Base Legal para Tratamento de Dados
              </h2>
              <p className="text-black/80 leading-relaxed font-zalando mb-4">
                O Mova+ trata seus dados pessoais com base nas seguintes bases
                legais previstas na LGPD:
              </p>
              <ul className="list-disc list-inside space-y-2 text-black/80 font-zalando ml-4">
                <li>
                  <strong>Consentimento:</strong> Quando você nos dá permissão
                  explícita para tratar seus dados
                </li>
                <li>
                  <strong>Execução de Contrato:</strong> Para cumprir obrigações
                  contratuais e fornecer nossos serviços
                </li>
                <li>
                  <strong>Legítimo Interesse:</strong> Para melhorar nossos
                  serviços, segurança e experiência do usuário
                </li>
                <li>
                  <strong>Obrigação Legal:</strong> Para cumprir obrigações
                  legais e regulatórias
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-zalando-medium text-black mb-4">
                5. Medidas de Segurança
              </h2>
              <p className="text-black/80 leading-relaxed font-zalando mb-4">
                Implementamos medidas técnicas e organizacionais adequadas para
                proteger seus dados pessoais contra:
              </p>
              <ul className="list-disc list-inside space-y-2 text-black/80 font-zalando ml-4">
                <li>Acesso não autorizado</li>
                <li>Alteração, destruição ou perda acidental</li>
                <li>Tratamento ilícito</li>
                <li>Qualquer forma de violação de dados</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-zalando-medium text-black mb-4">
                6. Compartilhamento de Dados
              </h2>
              <p className="text-black/80 leading-relaxed font-zalando mb-4">
                Compartilhamos dados pessoais apenas quando necessário e de
                forma segura, com:
              </p>
              <ul className="list-disc list-inside space-y-2 text-black/80 font-zalando ml-4">
                <li>
                  Prestadores de serviços que nos ajudam a operar a plataforma
                  (sob contratos que garantem proteção adequada)
                </li>
                <li>Autoridades competentes quando exigido por lei</li>
                <li>Com seu consentimento explícito</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-zalando-medium text-black mb-4">
                7. Encarregado de Proteção de Dados (DPO)
              </h2>
              <p className="text-black/80 leading-relaxed font-zalando mb-4">
                O Mova+ possui um Encarregado de Proteção de Dados (DPO)
                responsável por receber comunicações dos titulares de dados e da
                Autoridade Nacional de Proteção de Dados (ANPD). Para entrar em
                contato com nosso DPO, utilize os canais de suporte disponíveis
                na plataforma.
              </p>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-zalando-medium text-black mb-4">
                8. Retenção de Dados
              </h2>
              <p className="text-black/80 leading-relaxed font-zalando mb-4">
                Mantemos seus dados pessoais apenas pelo tempo necessário para
                cumprir os propósitos para os quais foram coletados, ou conforme
                exigido por lei. Quando seus dados não forem mais necessários,
                serão eliminados de forma segura.
              </p>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-zalando-medium text-black mb-4">
                9. Alterações nesta Política
              </h2>
              <p className="text-black/80 leading-relaxed font-zalando mb-4">
                Podemos atualizar esta política periodicamente para refletir
                mudanças em nossas práticas ou requisitos legais. Notificaremos
                você sobre mudanças significativas através da plataforma ou por
                e-mail.
              </p>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-zalando-medium text-black mb-4">
                10. Autoridade Nacional de Proteção de Dados (ANPD)
              </h2>
              <p className="text-black/80 leading-relaxed font-zalando mb-4">
                Se você acredita que seus direitos sob a LGPD foram violados,
                você pode apresentar uma reclamação à Autoridade Nacional de
                Proteção de Dados (ANPD). Para mais informações, visite:{" "}
                <a
                  href="https://www.gov.br/anpd"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-black underline hover:text-black/70"
                >
                  www.gov.br/anpd
                </a>
              </p>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-zalando-medium text-black mb-4">
                11. Contato
              </h2>
              <p className="text-black/80 leading-relaxed font-zalando mb-4">
                Para questões relacionadas à LGPD ou para exercer seus direitos,
                entre em contato conosco através da nossa Central de Ajuda ou
                pelo e-mail de suporte disponível na plataforma.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
