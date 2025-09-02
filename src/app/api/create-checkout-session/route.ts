import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabase } from "@/lib/supabase";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-08-27.basil",
    })
  : null;

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe não configurado" },
        { status: 500 }
      );
    }

    console.log("🔍 Iniciando criação de sessão de checkout...");

    // Verificar autenticação
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      console.log("❌ Token de autorização não encontrado");
      return NextResponse.json(
        { error: "Token de autorização não encontrado" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    console.log("🔍 Verificando token...");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.log("❌ Token inválido:", userError);
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    console.log("✅ Usuário autenticado:", user.id);

    // Buscar dados do usuário (pode não existir ainda no cadastro)
    const { data: userProfile } = await supabase
      .from("user_profiles")
      .select("email, full_name")
      .eq("user_id", user.id)
      .maybeSingle();

    console.log("🔍 Criando sessão de checkout para usuário:", user.id);
    console.log("🔍 Email do usuário:", userProfile?.email || user.email);

    // Verificar se usuário já está em trial
    const { data: trialData } = await supabase
      .from("user_trials")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    const isInTrial =
      trialData && trialData.is_active && !trialData.upgraded_to_premium;
    console.log("🔍 Usuário em trial:", isInTrial);

    // Criar sessão de checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: {
              name: "Mova+ Premium",
              description: "Plano premium com 2 planos personalizados por mês",
              // images: ["https://movamais.fit/images/logo_blue.webp"], // Logo do seu domínio
            },
            unit_amount: 2990, // R$ 29,90 em centavos
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${
        process.env.NODE_ENV === "production"
          ? "https://movamais.fit"
          : "http://localhost:3000"
      }/register/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${
        process.env.NODE_ENV === "production"
          ? "https://movamais.fit"
          : "http://localhost:3000"
      }/register/step3?canceled=true`,
      customer_email: userProfile?.email || user.email,
      metadata: {
        user_id: user.id,
        subscription_type: "premium",
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
        },
        trial_period_days: isInTrial ? 0 : 7, // 0 dias se já está em trial, 7 dias se é novo
      },
      custom_text: {
        submit: {
          message: isInTrial
            ? "Fazer upgrade para Premium"
            : "Começar meu teste gratuito de 7 dias",
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("❌ Erro ao criar sessão de checkout:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
