// Teste direto do signup do Supabase Auth
// Execute com: node test_auth_signup.js

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Carregar variáveis de ambiente
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("🔍 Configurações:");
console.log("URL:", supabaseUrl);
console.log("Key:", supabaseAnonKey ? "✅ Presente" : "❌ Ausente");

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Variáveis de ambiente não configuradas!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSignup() {
  try {
    console.log("\n🚀 Testando signup...");

    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = "password123";

    console.log("📧 Email de teste:", testEmail);
    console.log("🔑 Password:", testPassword);

    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: "Test User",
        },
      },
    });

    console.log("\n📊 Resultado:");
    console.log("Data:", JSON.stringify(data, null, 2));

    if (error) {
      console.log("❌ Erro:", JSON.stringify(error, null, 2));
    } else {
      console.log("✅ Signup funcionou!");
    }
  } catch (err) {
    console.error("❌ Erro capturado:", err);
  }
}

// Testar configurações do Auth
async function testAuthConfig() {
  try {
    console.log("\n🔍 Testando configurações de Auth...");

    // Tentar fazer uma operação simples de auth
    const { data: session } = await supabase.auth.getSession();
    console.log("✅ Conexão com Auth OK");
  } catch (err) {
    console.error("❌ Problema na conexão com Auth:", err);
  }
}

// Executar testes
async function runTests() {
  await testAuthConfig();
  await testSignup();
}

runTests();
