import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function middleware(req: NextRequest) {
  console.log("Middleware executando para:", req.nextUrl.pathname);

  // Criar cliente Supabase para verificação
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Extrair token do cookie
  const authCookie = req.cookies.get("sb-access-token")?.value;
  console.log("Token encontrado:", authCookie ? "SIM" : "NÃO");

  let isAuthenticated = false;

  if (authCookie) {
    try {
      // Verificar se o token é válido
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(authCookie);
      isAuthenticated = !error && user !== null;
      console.log("Usuário autenticado:", isAuthenticated, user?.email);
    } catch (error) {
      console.error("Erro ao verificar autenticação:", error);
      isAuthenticated = false;
    }
  }

  console.log("Resultado final - Autenticado:", isAuthenticated);

  // Se não está autenticado e está tentando acessar rotas protegidas
  if (!isAuthenticated && req.nextUrl.pathname.startsWith("/dashboard")) {
    console.log("Redirecionando para login");
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/auth/login";
    return NextResponse.redirect(redirectUrl);
  }

  // Permitir acesso às páginas de registro mesmo para usuários autenticados
  if (req.nextUrl.pathname.startsWith("/register")) {
    console.log("Permitindo acesso às páginas de registro");
    return NextResponse.next();
  }

  // Se está autenticado e está tentando acessar páginas de auth (exceto registro)
  if (
    isAuthenticated &&
    (req.nextUrl.pathname.startsWith("/auth") || req.nextUrl.pathname === "/")
  ) {
    console.log("Redirecionando para dashboard");
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    return NextResponse.redirect(redirectUrl);
  }

  console.log("Continuando requisição");
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/auth/:path*", "/"],
};
