"use client";

import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="w-full py-16 md:py-24 px-4 bg-gradient-to-b from-white via-white to-gray-100">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-medium text-gray-600 mb-8 tracking-wide uppercase bg-gradient-to-r from-black to-gray-800 text-white py-2 rounded-full w-40 mx-auto font-zalando relative overflow-hidden group shadow-lg">
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
            <span className="relative z-10">Cookies</span>
          </p>
          <h1 className="text-3xl md:text-6xl font-zalando-medium text-black mb-6 leading-tight">
            Política de Cookies
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
                1. O que são Cookies?
              </h2>
              <p className="text-black/80 leading-relaxed font-zalando mb-4">
                Cookies são pequenos arquivos de texto armazenados em seu
                dispositivo quando você visita um site. Eles permitem que o site
                reconheça seu dispositivo e armazene algumas informações sobre
                suas preferências ou ações passadas.
              </p>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-zalando-medium text-black mb-4">
                2. Como Usamos Cookies
              </h2>
              <p className="text-black/80 leading-relaxed font-zalando mb-4">
                O Mova+ utiliza cookies para:
              </p>
              <ul className="list-disc list-inside space-y-2 text-black/80 font-zalando ml-4">
                <li>Manter você conectado à sua conta</li>
                <li>Lembrar suas preferências e configurações</li>
                <li>Melhorar a segurança da plataforma</li>
                <li>
                  Analisar como você utiliza nosso site para melhorar a
                  experiência
                </li>
                <li>
                  Personalizar conteúdo e anúncios (com seu consentimento)
                </li>
                <li>Medir a eficácia de nossas campanhas</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-zalando-medium text-black mb-4">
                3. Tipos de Cookies que Utilizamos
              </h2>

              <h3 className="text-xl font-zalando-medium text-black mb-3 mt-6">
                3.1. Cookies Essenciais
              </h3>
              <p className="text-black/80 leading-relaxed font-zalando mb-4">
                Esses cookies são necessários para o funcionamento básico da
                plataforma. Eles permitem que você navegue pelo site e use
                recursos essenciais, como acessar áreas seguras e manter sua
                sessão ativa.
              </p>

              <h3 className="text-xl font-zalando-medium text-black mb-3 mt-6">
                3.2. Cookies de Funcionalidade
              </h3>
              <p className="text-black/80 leading-relaxed font-zalando mb-4">
                Estes cookies permitem que o site forneça funcionalidades e
                personalização aprimoradas. Eles podem ser definidos por nós ou
                por provedores terceirizados cujos serviços adicionamos às
                nossas páginas.
              </p>

              <h3 className="text-xl font-zalando-medium text-black mb-3 mt-6">
                3.3. Cookies de Análise
              </h3>
              <p className="text-black/80 leading-relaxed font-zalando mb-4">
                Utilizamos cookies de análise para entender como os visitantes
                interagem com nosso site. Isso nos ajuda a melhorar a
                funcionalidade e a experiência do usuário.
              </p>

              <h3 className="text-xl font-zalando-medium text-black mb-3 mt-6">
                3.4. Cookies de Marketing
              </h3>
              <p className="text-black/80 leading-relaxed font-zalando mb-4">
                Estes cookies são usados para rastrear visitantes em diferentes
                sites. A intenção é exibir anúncios relevantes e envolventes
                para cada usuário individual. Esses cookies requerem seu
                consentimento explícito.
              </p>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-zalando-medium text-black mb-4">
                4. Cookies de Terceiros
              </h2>
              <p className="text-black/80 leading-relaxed font-zalando mb-4">
                Alguns cookies são colocados por serviços de terceiros que
                aparecem em nossas páginas. Esses incluem:
              </p>
              <ul className="list-disc list-inside space-y-2 text-black/80 font-zalando ml-4">
                <li>Serviços de análise (Google Analytics, etc.)</li>
                <li>Plataformas de pagamento (Stripe)</li>
                <li>Serviços de autenticação (Supabase)</li>
                <li>Ferramentas de marketing e publicidade</li>
              </ul>
              <p className="text-black/80 leading-relaxed font-zalando mt-4">
                Esses terceiros podem usar cookies para coletar informações
                sobre suas atividades online em diferentes sites.
              </p>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-zalando-medium text-black mb-4">
                5. Gerenciamento de Cookies
              </h2>
              <p className="text-black/80 leading-relaxed font-zalando mb-4">
                Você tem controle sobre os cookies. A maioria dos navegadores
                permite que você:
              </p>
              <ul className="list-disc list-inside space-y-2 text-black/80 font-zalando ml-4">
                <li>Veja quais cookies você tem e delete-os individualmente</li>
                <li>Bloqueie cookies de terceiros</li>
                <li>Bloqueie todos os cookies de sites específicos</li>
                <li>Bloqueie todos os cookies</li>
                <li>Delete todos os cookies quando fechar o navegador</li>
              </ul>
              <p className="text-black/80 leading-relaxed font-zalando mt-4">
                <strong>Importante:</strong> Se você bloquear ou deletar
                cookies, algumas funcionalidades do site podem não funcionar
                corretamente. Cookies essenciais são necessários para o
                funcionamento básico da plataforma.
              </p>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-zalando-medium text-black mb-4">
                6. Como Gerenciar Cookies no Seu Navegador
              </h2>
              <p className="text-black/80 leading-relaxed font-zalando mb-4">
                Você pode gerenciar cookies através das configurações do seu
                navegador. Aqui estão links para instruções dos navegadores mais
                populares:
              </p>
              <ul className="list-disc list-inside space-y-2 text-black/80 font-zalando ml-4">
                <li>Google Chrome</li>
                <li>Mozilla Firefox</li>
                <li>Safari</li>
                <li>Microsoft Edge</li>
                <li>Opera</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-zalando-medium text-black mb-4">
                7. Consentimento
              </h2>
              <p className="text-black/80 leading-relaxed font-zalando mb-4">
                Ao continuar usando nosso site após ver o aviso de cookies, você
                concorda com o uso de cookies conforme descrito nesta política.
                Você pode retirar seu consentimento a qualquer momento alterando
                as configurações do seu navegador ou entrando em contato
                conosco.
              </p>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-zalando-medium text-black mb-4">
                8. Alterações nesta Política
              </h2>
              <p className="text-black/80 leading-relaxed font-zalando mb-4">
                Podemos atualizar esta Política de Cookies periodicamente para
                refletir mudanças em nossas práticas ou por outros motivos
                operacionais, legais ou regulamentares. Recomendamos que você
                revise esta página regularmente.
              </p>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-zalando-medium text-black mb-4">
                9. Contato
              </h2>
              <p className="text-black/80 leading-relaxed font-zalando mb-4">
                Se você tiver dúvidas sobre nossa Política de Cookies, entre em
                contato conosco através da nossa Central de Ajuda ou pelo e-mail
                de suporte disponível na plataforma.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
