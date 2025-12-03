"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ShinyButton } from "@/components/ui/shiny-button";
import { PasswordInput } from "@/components/ui/PasswordInput";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [validToken, setValidToken] = useState<boolean | null>(null);
  const [processingToken, setProcessingToken] = useState(true);

  useEffect(() => {
    const processToken = async () => {
      // Verificar se há um hash de token na URL (Supabase envia assim)
      const hash = window.location.hash;
      const code = searchParams.get("code");
      const errorParam = searchParams.get("error");

      // Se houver erro nos query params, tratar primeiro
      if (errorParam) {
        setValidToken(false);
        if (errorParam === "otp_expired" || errorParam === "access_denied") {
          setError("Este link expirou. Solicite um novo link de recuperação.");
        } else {
          setError("Link inválido ou expirado.");
        }
        setProcessingToken(false);
        return;
      }

      // Processar hash (formato mais comum do Supabase)
      if (hash) {
        // Extrair o access_token do hash
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");
        const type = params.get("type");

        if (accessToken && type === "recovery") {
          try {
            // Fazer exchange do token para uma sessão válida
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || "",
            });

            if (error) {
              console.error("Erro ao processar token do hash:", error);
              setValidToken(false);
              setError("Link expirado ou inválido. Solicite um novo link.");
            } else {
              setValidToken(true);
              // Limpar o hash da URL para não expor o token
              window.history.replaceState(null, "", window.location.pathname);
            }
          } catch (error) {
            console.error("Erro ao processar token do hash:", error);
            setValidToken(false);
            setError("Erro ao processar link. Tente novamente.");
          } finally {
            setProcessingToken(false);
          }
          return;
        }
      }

      // Processar code dos query params (formato alternativo)
      if (code) {
        try {
          // Quando o Supabase envia um code, ele precisa ser trocado por uma sessão
          // O Supabase pode processar automaticamente se a URL estiver configurada,
          // mas vamos verificar e fazer o exchange se necessário

          // Aguardar um pouco para o Supabase processar automaticamente (se configurado)
          await new Promise((resolve) => setTimeout(resolve, 500));

          // Verificar se já temos sessão (pode ter sido criada automaticamente)
          const { data: session, error: sessionError } =
            await supabase.auth.getSession();

          if (!session?.session || sessionError) {
            // Se não temos sessão, o Supabase não processou automaticamente
            // Isso geralmente significa que a URL não está configurada corretamente
            // ou o code precisa ser processado manualmente
            // Tentar fazer o exchange manualmente usando a API do Supabase
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            if (supabaseUrl) {
              try {
                // Fazer uma chamada direta à API do Supabase para trocar o code
                const exchangeUrl = `${supabaseUrl}/auth/v1/verify?token=${code}&type=recovery`;
                const response = await fetch(exchangeUrl, {
                  method: "GET",
                  headers: {
                    apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
                  },
                });

                if (response.ok) {
                  // Se o exchange funcionou, verificar sessão novamente
                  await new Promise((resolve) => setTimeout(resolve, 500));
                  const { data: newSession } = await supabase.auth.getSession();

                  if (newSession?.session) {
                    setValidToken(true);
                    const newUrl = window.location.pathname;
                    window.history.replaceState(null, "", newUrl);
                  } else {
                    setValidToken(false);
                    setError(
                      "Não foi possível processar o link. Verifique se a URL está configurada no Supabase."
                    );
                  }
                } else {
                  setValidToken(false);
                  setError(
                    "Link expirado ou inválido. Solicite um novo link de recuperação."
                  );
                }
              } catch (fetchError) {
                console.error("Erro ao fazer exchange do code:", fetchError);
                setValidToken(false);
                setError(
                  "Erro ao processar link. Verifique se a URL está configurada no Supabase Dashboard."
                );
              }
            } else {
              setValidToken(false);
              setError("Configuração do Supabase não encontrada.");
            }
          } else {
            // Temos sessão, tudo certo!
            setValidToken(true);
            // Limpar o code da URL
            const newUrl = window.location.pathname;
            window.history.replaceState(null, "", newUrl);
          }
        } catch (error) {
          console.error("Erro ao processar code:", error);
          setValidToken(false);
          setError("Erro ao processar link. Tente novamente.");
        } finally {
          setProcessingToken(false);
        }
        return;
      }

      // Se não encontrou nem hash nem code, verificar se já tem sessão válida
      const { data: session } = await supabase.auth.getSession();
      if (session?.session) {
        setValidToken(true);
      } else {
        setValidToken(false);
        setError(
          "Link inválido. Verifique se copiou o link completo do email."
        );
      }
      setProcessingToken(false);
    };

    processToken();
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validações
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    setLoading(true);

    try {
      // Atualizar senha usando Supabase
      // O Supabase persiste automaticamente a senha no banco de dados
      const { data, error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        console.error("Erro ao atualizar senha:", error);
        setError(error.message || "Erro ao redefinir senha. Tente novamente.");
        setLoading(false);
        return;
      }

      // Confirmar que a atualização foi bem-sucedida
      if (data?.user) {
        console.log("✅ Senha atualizada com sucesso no Supabase");
      }

      setSuccess(true);

      // Aguardar um pouco para garantir que a atualização foi processada
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Redirecionar para login após 2 segundos
      setTimeout(() => {
        router.push("/auth/login?passwordReset=success");
      }, 2000);
    } catch (error) {
      console.error("Erro inesperado:", error);
      setError("Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (processingToken || validToken === null) {
    return (
      <div className="bg-white rounded-[22px] border-2 border-black shadow-2xl p-8">
        <div className="text-center">
          <p className="text-gray-700">Verificando link...</p>
        </div>
      </div>
    );
  }

  if (validToken === false) {
    return (
      <div className="bg-white rounded-[22px] border-2 border-black shadow-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-zalando-medium text-black mb-2">
            Link Inválido
          </h1>
          <p className="text-gray-700 mb-6">
            Este link de recuperação de senha é inválido ou expirou.
          </p>
          <Link
            href="/auth/forgot-password"
            className="text-black font-bold hover:underline"
          >
            Solicitar novo link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[22px] border-2 border-black shadow-2xl p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-zalando-medium text-black mb-2">
          Redefinir Senha
        </h1>
        <p className="text-gray-700">Digite sua nova senha abaixo</p>
      </div>

      {success ? (
        <div className="space-y-6">
          <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-green-600"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-800 font-medium">
                  Senha redefinida com sucesso! Redirecionando para o login...
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-gray-100 border-2 border-black rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-black"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-black font-medium">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-bold text-black mb-2"
            >
              Nova Senha
            </label>
            <PasswordInput
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="border-gray-300"
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-bold text-black mb-2"
            >
              Confirmar Nova Senha
            </label>
            <PasswordInput
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="border-gray-300"
              placeholder="Digite a senha novamente"
            />
          </div>

          <ShinyButton
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 bg-black rounded-lg text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Redefinindo..." : "Redefinir Senha"}
          </ShinyButton>

          <div className="text-center">
            <Link
              href="/auth/login"
              className="text-sm text-black font-bold hover:underline"
            >
              Voltar para o login
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
