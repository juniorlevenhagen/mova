import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sobre Nós",
  description:
    "Conheça a Mova+: paixão pelo movimento, personalização total, comunidade forte e acompanhamento dinâmico para sua transformação fitness.",
  openGraph: {
    title: "Sobre Nós | Mova+",
    description:
      "Conheça a Mova+: paixão pelo movimento, personalização total e comunidade forte para sua transformação fitness.",
    url: "/sobre-nos",
  },
};

export default function SobreNosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
