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

    // Ler body da requisição para determinar o tipo de compra
    const body = await request.json().catch(() => ({}));
    const purchaseType = body.type || "premium"; // 'prompt_single', 'prompt_triple', ou 'premium'

    // Buscar dados do usuário
    const { data: userProfile } = await supabase
      .from("user_profiles")
      .select("email, full_name")
      .eq("user_id", user.id)
      .maybeSingle();

    console.log("🔍 Tipo de compra:", purchaseType);

    // Configurar produtos baseado no tipo
    let lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    let mode: "payment" | "subscription" = "payment";
    const metadata: Record<string, string> = {
      user_id: user.id,
    };

    if (purchaseType === "prompt_single") {
      // Compra de 1 prompt - R$ 17,99
      lineItems = [
        {
          price_data: {
            currency: "brl",
            product_data: {
              name: "Mova+ - 1 Prompt",
              description: "1 prompt para gerar plano personalizado",
            },
            unit_amount: 1799, // R$ 17,99 em centavos
          },
          quantity: 1,
        },
      ];
      metadata.purchase_type = "prompt_single";
      metadata.prompts_amount = "1";
    } else if (purchaseType === "prompt_triple") {
      // Compra de 3 prompts - R$ 39,99
      lineItems = [
        {
          price_data: {
            currency: "brl",
            product_data: {
              name: "Mova+ - Pacote Premium (3 Prompts)",
              description: "3 prompts para gerar planos personalizados",
            },
            unit_amount: 3999, // R$ 39,99 em centavos
          },
          quantity: 1,
        },
      ];
      metadata.purchase_type = "prompt_triple";
      metadata.prompts_amount = "3";
    } else {
      // Premium mensal (comportamento original)
      lineItems = [
        {
          price_data: {
            currency: "brl",
            product_data: {
              name: "Mova+ Premium",
              description: "Plano premium com 2 planos personalizados por mês",
            },
            unit_amount: 2990, // R$ 29,90 em centavos
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ];
      mode = "subscription";
      metadata.subscription_type = "premium";
    }

    // Criar sessão de checkout
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ["card"],
      line_items: lineItems,
      mode,
      success_url: `${
        process.env.NODE_ENV === "production"
          ? "https://movamais.fit"
          : "http://localhost:3000"
      }/dashboard?purchase=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${
        process.env.NODE_ENV === "production"
          ? "https://movamais.fit"
          : "http://localhost:3000"
      }/dashboard?purchase=canceled`,
      customer_email: userProfile?.email || user.email,
      metadata,
    };

    // Adicionar subscription_data apenas para premium
    if (mode === "subscription") {
      const { data: trialData } = await supabase
        .from("user_trials")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      const isInTrial =
        trialData && trialData.is_active && !trialData.upgraded_to_premium;

      sessionParams.subscription_data = {
        metadata: {
          user_id: user.id,
        },
        trial_period_days: isInTrial ? 0 : 7,
      };
      sessionParams.custom_text = {
        submit: {
          message: isInTrial
            ? "Fazer upgrade para Premium"
            : "Começar meu teste gratuito de 7 dias",
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("❌ Erro ao criar sessão de checkout:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
