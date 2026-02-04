import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Comunidade",
  description:
    "Faça parte da comunidade Mova+: redes sociais, conteúdo e conexão com quem também busca evolução fitness.",
  openGraph: {
    title: "Comunidade | Mova+",
    description:
      "Comunidade Mova+: redes sociais e conteúdo para sua evolução.",
    url: "/comunidade",
  },
};

export default function ComunidadeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
