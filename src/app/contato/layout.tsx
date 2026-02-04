import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contato",
  description:
    "Entre em contato com a equipe Mova+. Dúvidas, sugestões ou parcerias — estamos à disposição.",
  openGraph: {
    title: "Contato | Mova+",
    description: "Entre em contato com a equipe Mova+. Estamos à disposição.",
    url: "/contato",
  },
};

export default function ContatoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
