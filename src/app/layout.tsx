import type { Metadata } from "next";

import "./globals.css";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://movamais.fit";
const defaultOgImage = `${siteUrl}/images/og-image.jpg`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Mova+ | Sua transformação fitness completa e personalizada",
    template: "%s | Mova+",
  },
  description:
    "Sua transformação fitness completa e personalizada. Planos de treino e nutrição gerados por IA, acompanhamento de evolução e comunidade.",
  keywords: [
    "fitness",
    "treino personalizado",
    "nutrição",
    "plano de treino",
    "emagrecimento",
    "ganho de massa",
    "Mova+",
  ],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: siteUrl,
    siteName: "Mova+",
    title: "Mova+ | Sua transformação fitness completa e personalizada",
    description:
      "Planos de treino e nutrição gerados por IA, acompanhamento de evolução e comunidade.",
    images: [
      {
        url: defaultOgImage,
        width: 1200,
        height: 630,
        alt: "Mova+ - Transformação fitness",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mova+ | Sua transformação fitness completa e personalizada",
    description:
      "Planos de treino e nutrição gerados por IA, acompanhamento de evolução e comunidade.",
    images: [
      {
        url: defaultOgImage,
        alt: "Mova+ - Transformação fitness",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="overflow-x-hidden">
      <body className="overflow-x-hidden">
        {children}
        <WhatsAppButton />
      </body>
    </html>
  );
}
