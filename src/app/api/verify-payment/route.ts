import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabase } from "@/lib/supabase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "Token de autorização não encontrado" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID é obrigatório" },
        { status: 400 }
      );
    }

    // ✅ Criar cliente Supabase autenticado com token do usuário
    const { createClient } = await import("@supabase/supabase-js");
    const supabaseUser = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    // Verificar sessão no Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (
      session.payment_status === "paid" &&
      session.metadata?.user_id === user.id
    ) {
      // ✅ Pagamento confirmado - forçar atualização premium
      const now = new Date().toISOString();

      // Buscar trial existente
      const { data: existingTrial } = await supabaseUser
        .from("user_trials")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      let updateError = null;

      if (existingTrial) {
        // Atualizar trial existente para premium
        const { error } = await supabaseUser
          .from("user_trials")
          .update({
            upgraded_to_premium: true,
            upgraded_at: now,
            is_active: false,
            premium_plan_count: 0,
            premium_plan_cycle_start: now,
            premium_max_plans_per_cycle: 2,
            premium_cycle_days: 30,
          })
          .eq("user_id", user.id);

        updateError = error;
      } else {
        // Criar novo trial premium
        const { error } = await supabaseUser.from("user_trials").insert({
          user_id: user.id,
          trial_start_date: now,
          trial_end_date: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ).toISOString(),
          plans_generated: 0,
          max_plans_allowed: 2,
          is_active: false,
          upgraded_to_premium: true,
          upgraded_at: now,
          premium_plan_count: 0,
          premium_plan_cycle_start: now,
          premium_max_plans_per_cycle: 2,
          premium_cycle_days: 30,
        });

        updateError = error;
      }

      if (updateError) {
        console.error("❌ Erro ao atualizar status premium:", updateError);
        return NextResponse.json(
          { error: "Erro ao atualizar status premium" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        isPremium: true,
        message: "Pagamento confirmado e status premium ativado!",
      });
    }

    return NextResponse.json({
      success: false,
      isPremium: false,
      message: "Pagamento não confirmado",
      paymentStatus: session.payment_status,
    });
  } catch (error) {
    console.error("❌ Erro ao verificar pagamento:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
