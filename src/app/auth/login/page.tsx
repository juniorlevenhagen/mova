import Link from "next/link";
import LoginForm from "@/components/ui/LoginForm";

export default function LoginPage() {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Bem-vindo de volta
        </h1>
        <p className="text-gray-600">Continue sua jornada fitness no Mova+</p>
      </div>

      <LoginForm />

      <div className="text-center mt-6">
        <p className="text-gray-600">
          Não tem uma conta?{" "}
          <Link
            href="/auth/cadastro"
            className="text-gray-800 font-semibold hover:underline"
          >
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  );
}
