// Teste simples de conexão com Supabase
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("Supabase URL:", supabaseUrl);
console.log("Supabase Key:", supabaseAnonKey ? "Present" : "Missing");

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Variáveis de ambiente do Supabase não configuradas!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Teste 1: Verificar conectividade básica
async function testConnection() {
  try {
    console.log("\n🔍 Testando conectividade básica...");
    const { data, error } = await supabase.from("users").select("count");

    if (error) {
      console.log("❌ Erro ao conectar:", error.message);
      console.log("Detalhes:", error);
    } else {
      console.log("✅ Conexão básica funcionando");
    }
  } catch (err) {
    console.log("❌ Erro na conexão:", err.message);
  }
}

// Teste 2: Tentar signup simples
async function testSignup() {
  try {
    console.log("\n🔍 Testando signup...");
    const { data, error } = await supabase.auth.signUp({
      email: "test@example.com",
      password: "testpassword123",
    });

    if (error) {
      console.log("❌ Erro no signup:", error.message);
      console.log("Detalhes:", error);
    } else {
      console.log("✅ Signup funcionando (usuário pode já existir)");
    }
  } catch (err) {
    console.log("❌ Erro no signup:", err.message);
  }
}

// Executar testes
testConnection();
testSignup();
