import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description:
    "Termos de uso do Mova+: condições gerais para utilização da plataforma e dos serviços de treino e nutrição.",
  openGraph: {
    title: "Termos de Uso | Mova+",
    description: "Condições gerais de uso da plataforma Mova+.",
    url: "/termos-de-uso",
  },
  robots: { index: true, follow: true },
};

export default function TermosDeUsoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
