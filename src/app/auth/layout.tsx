import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Autenticação - Mova+",
  description: "Faça login ou cadastre-se no Mova+",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
