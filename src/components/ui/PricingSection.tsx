"use client";

const plans = [
  {
    name: "Básico",
    price: "R$ 29,90",
    period: "/mês",
    description: "Perfeito para quem está começando sua jornada fitness",
    features: [
      "Treinos personalizados básicos",
      "Acesso à biblioteca de exercícios",
      "Acompanhamento de progresso",
      "Suporte por email",
    ],
    popular: false,
    buttonText: "Começar Agora",
    buttonVariant: "outline",
  },
  {
    name: "Premium",
    price: "R$ 49,90",
    period: "/mês",
    description: "Para quem quer resultados mais rápidos e completos",
    features: [
      "Tudo do plano Básico",
      "Planos de nutrição personalizados",
      "Acesso à comunidade exclusiva",
      "Consultoria com especialistas",
      "Análises avançadas de progresso",
      "Suporte prioritário",
    ],
    popular: true,
    buttonText: "Escolher Premium",
    buttonVariant: "primary",
  },
  {
    name: "Pro",
    price: "R$ 79,90",
    period: "/mês",
    description: "Para atletas e profissionais que buscam excelência",
    features: [
      "Tudo do plano Premium",
      "Treinos específicos por modalidade",
      "Acompanhamento 1:1 com coach",
      "Planos de recuperação",
      "Acesso antecipado a novos recursos",
      "Suporte 24/7",
    ],
    popular: false,
    buttonText: "Escolher Pro",
    buttonVariant: "outline",
  },
];

export function PricingSection() {
  return (
    <section className="w-full bg-[#f5f1e8] py-16 md:py-24 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Título da seção */}
        <div className="text-center mb-16">
          <h2 className="text-2xl md:text-4xl font-bold text-gray-800 mb-4">
            Escolha seu plano
          </h2>
          <p className="text-base md:text-xl text-gray-600 max-w-3xl mx-auto">
            Planos flexíveis que se adaptam ao seu ritmo e objetivos.
          </p>
        </div>

        {/* Grid dos planos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative bg-white rounded-2xl p-8 md:p-10 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col ${
                plan.popular
                  ? "ring-2 ring-gray-800 scale-105"
                  : "hover:scale-105"
              }`}
            >
              {/* Badge Popular */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gray-800 text-white px-4 py-2 rounded-full text-sm font-medium">
                    Mais Popular
                  </span>
                </div>
              )}

              {/* Cabeçalho do plano */}
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  {plan.name}
                </h3>
                <p className="text-gray-600 mb-6">{plan.description}</p>

                {/* Preço */}
                <div className="mb-6">
                  <span className="text-4xl md:text-5xl font-bold text-gray-800">
                    {plan.price}
                  </span>
                  <span className="text-gray-600 ml-1">{plan.period}</span>
                </div>
              </div>

              {/* Lista de recursos */}
              <ul className="space-y-4 mb-8 flex-grow">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start">
                    <svg
                      className="w-5 h-5 text-gray-800 mt-0.5 mr-3 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Botão */}
              <button
                className={`w-full py-3 px-6 rounded-lg font-medium transition-colors duration-200 mt-auto ${
                  plan.buttonVariant === "primary"
                    ? "bg-gray-800 text-white hover:bg-gray-900"
                    : "bg-white text-gray-800 border-2 border-gray-800 hover:bg-gray-800 hover:text-white"
                }`}
              >
                {plan.buttonText}
              </button>
            </div>
          ))}
        </div>

        {/* Nota adicional */}
        <div className="text-center mt-12">
          <p className="text-sm text-gray-500">
            Todos os planos incluem 7 dias de teste grátis. Cancele a qualquer
            momento.
          </p>
        </div>
      </div>
    </section>
  );
}
