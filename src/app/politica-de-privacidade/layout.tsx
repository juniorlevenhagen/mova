import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description:
    "Política de privacidade do Mova+: como coletamos, usamos e protegemos seus dados pessoais.",
  openGraph: {
    title: "Política de Privacidade | Mova+",
    description: "Como o Mova+ coleta, usa e protege seus dados pessoais.",
    url: "/politica-de-privacidade",
  },
  robots: { index: true, follow: true },
};

export default function PoliticaDePrivacidadeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
