import { createClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Verificar se estamos no servidor
const isServer = typeof window === "undefined";

if (isServer && (!supabaseUrl || !supabaseAnonKey)) {
  console.warn(
    "Supabase environment variables not found during server-side rendering"
  );
}

// Criar cliente Supabase
// No navegador: usar createBrowserClient para gerenciar cookies corretamente
// No servidor: usar createClient padrão para compatibilidade com APIs
export const supabase = isServer
  ? createClient(
      supabaseUrl || "https://placeholder.supabase.co",
      supabaseAnonKey || "placeholder-key"
    )
  : createBrowserClient(
      supabaseUrl || "https://placeholder.supabase.co",
      supabaseAnonKey || "placeholder-key"
    );
