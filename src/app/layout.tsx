import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mova+",
  description: "Corpo forte, mente leve",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-[#f5f1e8] font-sans">{children}</body>
    </html>
  );
}
