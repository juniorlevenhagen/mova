import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");

  // Se houver erro, redirecionar para login com mensagem de erro
  if (error) {
    console.error("Erro no OAuth:", error);
    return NextResponse.redirect(
      new URL("/auth/login?error=oauth_error", request.url)
    );
  }

  // Se não houver código, redirecionar para login
  if (!code) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  try {
    const supabase = await createClient();
    const { error: exchangeError, data: sessionData } =
      await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error("Erro ao trocar código por sessão:", exchangeError);
      return NextResponse.redirect(
        new URL("/auth/login?error=exchange_error", request.url)
      );
    }

    // Verificar se o usuário tem perfil completo
    const user = sessionData?.user;
    if (user) {
      // Verificar se existe perfil do usuário
      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      // Se não houver perfil ou houver erro (exceto "não encontrado"), redirecionar para completar cadastro
      if (!profile || (profileError && profileError.code !== "PGRST116")) {
        console.log("Usuário sem perfil completo, redirecionando para registro");
        return NextResponse.redirect(new URL("/register/step2", request.url));
      }
    }

    // Redirecionar para dashboard após login bem-sucedido
    return NextResponse.redirect(new URL("/dashboard", request.url));
  } catch (error) {
    console.error("Erro inesperado no callback:", error);
    return NextResponse.redirect(
      new URL("/auth/login?error=unexpected_error", request.url)
    );
  }
}
