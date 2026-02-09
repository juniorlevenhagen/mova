import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

function getStripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY não configurada");
  }

  return new Stripe(key, {
    apiVersion: "2025-08-27.basil",
  });
}

function getSupabaseClient(token?: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Supabase URL ou ANON KEY não configuradas");
  }

  return createClient(
    url,
    anonKey,
    token
      ? {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        }
      : undefined
  );
}

export async function POST(request: NextRequest) {
  try {
    // 🔐 Auth
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "Token de autorização não encontrado" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseUser = getSupabaseClient(token);

    const {
      data: { user },
      error: userError,
    } = await supabaseUser.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const stripe = getStripeClient();

    const body = await request.json().catch(() => ({}));
    const sessionId = body.sessionId as string | undefined;

    // 🔍 Verificação de pagamento
    if (sessionId) {
      console.log(`🔍 Verificando sessão do Stripe: ${sessionId}`);

      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (
        session.payment_status === "paid" &&
        session.metadata?.user_id === user.id
      ) {
        const promptsPurchased = session.metadata?.prompts_amount
          ? parseInt(session.metadata.prompts_amount, 10)
          : 1;

        // Buscar trial atual
        const { data: trialData } = await supabaseUser
          .from("user_trials")
          .select("available_prompts, plans_generated, max_plans_allowed")
          .eq("user_id", user.id)
          .maybeSingle();

        const currentPrompts = trialData?.available_prompts ?? 0;
        const newPrompts = currentPrompts + promptsPurchased;

        const { data: updatedTrial } = await supabaseUser
          .from("user_trials")
          .upsert(
            {
              user_id: user.id,
              available_prompts: newPrompts,
              is_active: true,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          )
          .select("available_prompts, plans_generated, max_plans_allowed")
          .maybeSingle();

        return NextResponse.json({
          success: true,
          promptsPurchased,
          availablePrompts: updatedTrial?.available_prompts ?? newPrompts,
          plansGenerated: updatedTrial?.plans_generated ?? 0,
          maxPlansAllowed: updatedTrial?.max_plans_allowed ?? 1,
          message: "Pagamento confirmado e prompts liberados.",
        });
      }

      return NextResponse.json({
        success: false,
        message: "Pagamento não confirmado",
      });
    }

    // 🔎 Apenas status
    const { data: trialData } = await supabaseUser
      .from("user_trials")
      .select("available_prompts, plans_generated, max_plans_allowed")
      .eq("user_id", user.id)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      availablePrompts: trialData?.available_prompts ?? 0,
      plansGenerated: trialData?.plans_generated ?? 0,
      maxPlansAllowed: trialData?.max_plans_allowed ?? 1,
    });
  } catch (error) {
    console.error("❌ Erro ao verificar pagamento:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
