import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Como Funciona",
  description:
    "Cadastre-se, configure seu perfil, receba planos de treino e nutrição personalizados por IA e acompanhe sua evolução. Método estruturado e personalizado.",
  openGraph: {
    title: "Como Funciona | Mova+",
    description:
      "Cadastre-se, configure seu perfil, receba planos personalizados e evolua. Veja o passo a passo do Mova+.",
    url: "/como-funciona",
  },
};

export default function ComoFuncionaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
