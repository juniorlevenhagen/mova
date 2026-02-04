import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Artigos sobre treino, nutrição, motivação, recuperação e mindset. Conteúdo do time Mova+ para sua evolução fitness.",
  openGraph: {
    title: "Blog | Mova+",
    description:
      "Artigos sobre treino, nutrição, motivação e mindset para sua evolução.",
    url: "/blog",
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
