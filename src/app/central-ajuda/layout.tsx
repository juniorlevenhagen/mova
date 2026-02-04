import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Central de Ajuda",
  description:
    "Tire dúvidas sobre conta, planos, assinatura, pagamentos e suporte técnico. FAQ e guias do Mova+.",
  openGraph: {
    title: "Central de Ajuda | Mova+",
    description: "FAQ e guias: conta, planos, pagamentos e suporte técnico.",
    url: "/central-ajuda",
  },
};

export default function CentralAjudaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
