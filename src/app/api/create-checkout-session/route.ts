import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabase } from "@/lib/supabase";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-12-15.clover" as unknown as "2025-08-27.basil",
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
    const purchaseType = body.type || "prompt_single"; // 'prompt_single' ou 'prompt_triple'

    // Buscar dados do usuário
    const { data: userProfile } = await supabase
      .from("user_profiles")
      .select("email, full_name")
      .eq("user_id", user.id)
      .maybeSingle();

    console.log("🔍 Tipo de compra:", purchaseType);

    // Determinar a URL base de forma mais robusta usando a própria URL da requisição
    let origin = request.nextUrl.origin;

    // Fallback e correção para produção
    if (process.env.NODE_ENV === "production") {
      // Se já temos um origin válido com movamais.fit e HTTPS, mantemos para preservar subdomínios (ex: www)
      if (
        origin &&
        origin.includes("movamais.fit") &&
        origin.startsWith("https")
      ) {
        console.log("🔍 Origin de produção detectada e preservada:", origin);
      } else {
        origin = "https://movamais.fit";
        console.log(
          "⚠️ Origin de produção não detectada ou inválida, forçando padrão:",
          origin
        );
      }
    }

    console.log("🔍 Origin final para redirect:", origin);

    // Configurar produtos baseado no tipo
    let lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    const mode: "payment" | "subscription" = "payment";
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
              name: "Mova+ - Pacote com 3 Prompts",
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
      // Fallback para compra de 1 prompt caso o tipo seja desconhecido
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
    }

    // Criar sessão de checkout
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ["card"],
      line_items: lineItems,
      mode,
      success_url: `${origin}/dashboard?purchase=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard?purchase=canceled`,
      customer_email: userProfile?.email || user.email,
      metadata,
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const stripeError = error as { type?: string; message: string };
    console.error("❌ Erro ao criar sessão de checkout:", stripeError);

    // Log detalhado do erro do Stripe
    if (stripeError.type === "StripeInvalidRequestError") {
      console.error(
        "📋 Detalhes do erro Stripe (Invalid Request):",
        stripeError.message
      );
    }

    return NextResponse.json(
      {
        error: "Erro ao processar pagamento",
        details: stripeError.message,
        type: stripeError.type,
      },
      { status: 500 }
    );
  }
}
