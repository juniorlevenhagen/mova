"use client";

import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";

export default function TermosDeUsoPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="w-full py-16 md:py-24 px-4 bg-gradient-to-b from-white via-white to-gray-100">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-medium text-gray-600 mb-8 tracking-wide uppercase bg-gradient-to-r from-black to-gray-800 text-white py-2 rounded-full w-48 mx-auto font-zalando relative overflow-hidden group shadow-lg">
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
            <span className="relative z-10">Termos de Uso</span>
          </p>
          <h1 className="text-3xl md:text-6xl font-zalando-medium text-black mb-6 leading-tight">
            Termos de Uso
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
                1. Aceitação dos Termos
              </h2>
              <p className="text-black/80 leading-relaxed font-zalando mb-4">
                Ao acessar e utilizar a plataforma Mova+, você concorda em
                cumprir e estar vinculado a estes Termos de Uso. Se você não
                concorda com qualquer parte destes termos, não deve utilizar
                nossos serviços.
              </p>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-zalando-medium text-black mb-4">
                2. Descrição do Serviço
              </h2>
              <p className="text-black/80 leading-relaxed font-zalando mb-4">
                O Mova+ é uma plataforma digital que oferece planos de treino e
                orientação alimentar adaptada através de sistema automatizado.
                Nossos serviços incluem:
              </p>
              <ul className="list-disc list-inside space-y-2 text-black/80 font-zalando ml-4">
                <li>Geração de planos de treino personalizados</li>
                <li>Orientações nutricionais adaptadas</li>
                <li>Acompanhamento de progresso</li>
                <li>Acesso a conteúdo educacional sobre fitness e saúde</li>
                <li>Comunidade de usuários para suporte e motivação</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-zalando-medium text-black mb-4">
                3. Cadastro e Conta de Usuário
              </h2>
              <p className="text-black/80 leading-relaxed font-zalando mb-4">
                Para utilizar nossos serviços, você precisa criar uma conta
                fornecendo informações precisas e atualizadas. Você é
                responsável por:
              </p>
              <ul className="list-disc list-inside space-y-2 text-black/80 font-zalando ml-4">
                <li>Manter a confidencialidade de sua senha</li>
                <li>
                  Notificar-nos imediatamente sobre qualquer uso não autorizado
                  de sua conta
                </li>
                <li>
                  Ser responsável por todas as atividades que ocorram em sua
                  conta
                </li>
                <li>Fornecer informações verdadeiras e precisas</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-zalando-medium text-black mb-4">
                4. Uso Aceitável
              </h2>
              <p className="text-black/80 leading-relaxed font-zalando mb-4">
                Você concorda em não utilizar a plataforma para:
              </p>
              <ul className="list-disc list-inside space-y-2 text-black/80 font-zalando ml-4">
                <li>Qualquer propósito ilegal ou não autorizado</li>
                <li>Violar qualquer lei ou regulamento aplicável</li>
                <li>Infringir direitos de propriedade intelectual</li>
                <li>Transmitir vírus ou código malicioso</li>
                <li>Interferir ou interromper o funcionamento da plataforma</li>
                <li>Tentar acessar áreas restritas da plataforma</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-zalando-medium text-black mb-4">
                5. Planos e Pagamentos
              </h2>
              <p className="text-black/80 leading-relaxed font-zalando mb-4">
                Nossos serviços são oferecidos mediante assinatura. Ao assinar
                um plano:
              </p>
              <ul className="list-disc list-inside space-y-2 text-black/80 font-zalando ml-4">
                <li>
                  Você concorda em pagar as taxas aplicáveis conforme o plano
                  escolhido
                </li>
                <li>
                  As assinaturas são renovadas automaticamente, a menos que
                  canceladas
                </li>
                <li>Você pode cancelar sua assinatura a qualquer momento</li>
                <li>
                  Reembolsos são tratados conforme nossa política de reembolso
                </li>
                <li>
                  Reservamo-nos o direito de alterar preços com aviso prévio
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-zalando-medium text-black mb-4">
                6. Propriedade Intelectual
              </h2>
              <p className="text-black/80 leading-relaxed font-zalando mb-4">
                Todo o conteúdo da plataforma, incluindo textos, gráficos,
                logos, ícones, imagens e software, é propriedade do Mova+ ou de
                seus licenciadores e está protegido por leis de direitos
                autorais e outras leis de propriedade intelectual.
              </p>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-zalando-medium text-black mb-4">
                7. Limitação de Responsabilidade
              </h2>
              <p className="text-black/80 leading-relaxed font-zalando mb-4">
                O Mova+ fornece informações e orientações sobre fitness e
                nutrição, mas não substitui o aconselhamento médico
                profissional. Você reconhece que:
              </p>
              <ul className="list-disc list-inside space-y-2 text-black/80 font-zalando ml-4">
                <li>
                  Deve consultar um médico antes de iniciar qualquer programa de
                  exercícios
                </li>
                <li>É responsável por sua própria saúde e bem-estar</li>
                <li>
                  O Mova+ não se responsabiliza por lesões ou problemas de saúde
                  decorrentes do uso dos planos
                </li>
                <li>Os resultados podem variar de pessoa para pessoa</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-zalando-medium text-black mb-4">
                8. Modificações dos Termos
              </h2>
              <p className="text-black/80 leading-relaxed font-zalando mb-4">
                Reservamo-nos o direito de modificar estes Termos de Uso a
                qualquer momento. Alterações significativas serão comunicadas
                através da plataforma ou por e-mail. O uso continuado dos
                serviços após as modificações constitui aceitação dos novos
                termos.
              </p>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-zalando-medium text-black mb-4">
                9. Cancelamento e Encerramento
              </h2>
              <p className="text-black/80 leading-relaxed font-zalando mb-4">
                Você pode cancelar sua conta a qualquer momento através das
                configurações da plataforma. Reservamo-nos o direito de
                suspender ou encerrar sua conta em caso de violação destes
                termos.
              </p>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-zalando-medium text-black mb-4">
                10. Lei Aplicável
              </h2>
              <p className="text-black/80 leading-relaxed font-zalando mb-4">
                Estes Termos de Uso são regidos pelas leis brasileiras. Qualquer
                disputa será resolvida nos tribunais competentes do Brasil.
              </p>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-zalando-medium text-black mb-4">
                11. Contato
              </h2>
              <p className="text-black/80 leading-relaxed font-zalando mb-4">
                Para questões sobre estes Termos de Uso, entre em contato
                conosco através da nossa Central de Ajuda ou pelo e-mail de
                suporte disponível na plataforma.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
