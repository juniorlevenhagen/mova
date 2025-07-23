import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Verificar se estamos no servidor e se as variáveis estão definidas
const isServer = typeof window === "undefined";

if (isServer && (!supabaseUrl || !supabaseAnonKey)) {
  console.warn(
    "Supabase environment variables not found during server-side rendering"
  );
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-key"
);
