import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Cookies",
  description:
    "Política de cookies do Mova+: como usamos cookies e tecnologias similares no site.",
  openGraph: {
    title: "Política de Cookies | Mova+",
    description: "Como o Mova+ utiliza cookies no site.",
    url: "/cookies",
  },
  robots: { index: true, follow: true },
};

export default function CookiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
