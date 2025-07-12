import Link from "next/link";
import { SignupForm } from "@/components/ui/SignupForm";

export default function SignupPage() {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Comece sua jornada
        </h1>
        <p className="text-gray-600">
          Crie sua conta e transforme sua vida com o Mova+
        </p>
      </div>

      <SignupForm />

      <div className="text-center mt-6">
        <p className="text-gray-600">
          Já tem uma conta?{" "}
          <Link
            href="/auth/login"
            className="text-gray-800 font-semibold hover:underline"
          >
            Faça login
          </Link>
        </p>
      </div>
    </div>
  );
}
