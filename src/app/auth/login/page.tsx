import { Suspense } from "react";
import Link from "next/link";
import LoginForm from "@/components/ui/LoginForm";

export default function LoginPage() {
  return (
    <div className="bg-gray-50 rounded-[22px] p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-zalando-medium text-black mb-2">
          Bem-vindo de volta
        </h1>
        <p className="text-gray-700">Continue sua jornada fitness no Mova+</p>
      </div>

      <Suspense
        fallback={<div className="text-center py-4">Carregando...</div>}
      >
        <LoginForm />
      </Suspense>

      <div className="text-center mt-6">
        <p className="text-gray-700">
          Não tem uma conta?{" "}
          <Link
            href="/register/step0"
            className="text-black font-bold hover:underline"
          >
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  );
}
