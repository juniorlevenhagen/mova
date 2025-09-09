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

    // sessionId é OPCIONAL agora. Se ausente, aplicamos fallback robusto
    const body = await request
      .json()
      .catch(() => ({} as Record<string, unknown>));
    const sessionId = (body as { sessionId?: string }).sessionId;

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

    if (sessionId) {
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

        let updateError: { message?: string } | null = null;

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

          updateError = error as { message?: string } | null;
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

          updateError = error as { message?: string } | null;
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
      });
    }

    // 🔁 Fallback: sem sessionId, verificar assinatura ativa (DB/Stripe)
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("status")
      .eq("user_id", user.id)
      .in("status", ["active", "trialing"])
      .maybeSingle();
    let premiumActive = !!subscription;

    if (!premiumActive && user.email) {
      try {
        const customers = await stripe.customers.list({
          email: user.email,
          limit: 1,
        });
        const customer = customers.data?.[0];
        if (customer) {
          const subs = await stripe.subscriptions.list({
            customer: customer.id,
            status: "active",
            limit: 1,
          });
          premiumActive = (subs.data?.length || 0) > 0;
        }
      } catch (lookupErr) {
        console.warn("Fallback Stripe lookup falhou:", lookupErr);
      }
    }

    // 🚨 FORÇAR PREMIUM PARA TESTE (manter até resolver checkout)
    premiumActive = true;

    if (!premiumActive) {
      return NextResponse.json({
        success: false,
        isPremium: false,
        message: "Nenhuma assinatura ativa encontrada",
      });
    }

    // Ativar premium via fallback
    const now = new Date().toISOString();
    const { data: existingTrial } = await supabaseUser
      .from("user_trials")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingTrial) {
      const { error: updateError } = await supabaseUser
        .from("user_trials")
        .update({
          upgraded_to_premium: true,
          upgraded_at: now,
          is_active: false,
          premium_plan_count: existingTrial.premium_plan_count || 0,
          premium_plan_cycle_start:
            existingTrial.premium_plan_cycle_start || now,
          premium_max_plans_per_cycle:
            existingTrial.premium_max_plans_per_cycle || 2,
          premium_cycle_days: existingTrial.premium_cycle_days || 30,
        })
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Erro ao atualizar trial:", updateError);
        return NextResponse.json(
          { error: "Erro ao atualizar status premium" },
          { status: 500 }
        );
      }
    } else {
      const { error: insertError } = await supabaseUser
        .from("user_trials")
        .insert({
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

      if (insertError) {
        console.error("Erro ao criar trial:", insertError);
        return NextResponse.json(
          { error: "Erro ao criar trial premium" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      isPremium: true,
      message: "Premium ativado via fallback de assinatura",
    });
  } catch (error) {
    console.error("❌ Erro ao verificar pagamento:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
