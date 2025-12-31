import type { Metadata } from "next";

import "./globals.css";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";

export const metadata: Metadata = {
  title: "Mova+",
  description: "Sua transformação fitness completa e personalizada",
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
