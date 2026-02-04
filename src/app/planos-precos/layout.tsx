import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Planos e Preços",
  description:
    "Conheça os planos Mova+: treino e nutrição personalizados por IA. Preços acessíveis e opções de créditos para gerar seu plano fitness.",
  openGraph: {
    title: "Planos e Preços | Mova+",
    description:
      "Planos de treino e nutrição personalizados por IA. Preços e opções de créditos.",
    url: "/planos-precos",
  },
};

export default function PlanosPrecosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
