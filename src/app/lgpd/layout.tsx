import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "LGPD",
  description:
    "Informações sobre o tratamento de dados pessoais no Mova+ em conformidade com a Lei Geral de Proteção de Dados.",
  openGraph: {
    title: "LGPD | Mova+",
    description:
      "Tratamento de dados pessoais no Mova+ em conformidade com a LGPD.",
    url: "/lgpd",
  },
  robots: { index: true, follow: true },
};

export default function LGPDLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
