import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabase } from "@/lib/supabase";

// Interface para acessar propriedades do subscription
interface StripeSubscription extends Stripe.Subscription {
  current_period_start: number;
  current_period_end: number;
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig!, endpointSecret);
  } catch (err) {
    console.error("❌ Erro ao verificar webhook:", err);
    return NextResponse.json({ error: "Webhook error" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;

      case "customer.subscription.created":
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCreated(subscription);
        break;

      case "customer.subscription.updated":
        const updatedSubscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(updatedSubscription);
        break;

      case "customer.subscription.deleted":
        const deletedSubscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(deletedSubscription);
        break;

      default:
        console.log(`Evento não tratado: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("❌ Erro ao processar webhook:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id;
  if (!userId) {
    console.log("❌ User ID não encontrado no metadata da sessão");
    return;
  }

  try {
    const now = new Date().toISOString();
    const purchaseType = session.metadata?.purchase_type;
    const promptsAmount = session.metadata?.prompts_amount
      ? parseInt(session.metadata.prompts_amount)
      : 0;

    // Se for compra de prompts (não premium)
    if (purchaseType === "prompt_single" || purchaseType === "prompt_triple") {
      console.log(
        `✅ Processando compra de ${promptsAmount} prompt(s) para usuário:`,
        userId
      );

      // Buscar trial existente
      const { data: existingTrial } = await supabase
        .from("user_trials")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (existingTrial) {
        // Atualizar trial adicionando prompts disponíveis
        const currentPrompts =
          existingTrial.available_prompts || 0;
        const newPrompts = currentPrompts + promptsAmount;

        const { error } = await supabase
          .from("user_trials")
          .update({
            available_prompts: newPrompts,
            updated_at: now,
          })
          .eq("user_id", userId);

        if (error) {
          console.error("❌ Erro ao atualizar prompts:", error);
        } else {
          console.log(
            `✅ ${promptsAmount} prompt(s) adicionado(s). Total disponível: ${newPrompts}`
          );
        }
      } else {
        // Criar novo trial com prompts
        const { error } = await supabase.from("user_trials").insert({
          user_id: userId,
          trial_start_date: now,
          trial_end_date: new Date(
            Date.now() + 365 * 24 * 60 * 60 * 1000
          ).toISOString(), // 1 ano de validade
          plans_generated: 0,
          max_plans_allowed: 1,
          is_active: true,
          upgraded_to_premium: false,
          available_prompts: promptsAmount,
        });

        if (error) {
          console.error("❌ Erro ao criar trial com prompts:", error);
        } else {
          console.log(
            `✅ Trial criado com ${promptsAmount} prompt(s) para usuário:`,
            userId
          );
        }
      }
      return; // Não processar como premium
    }

    // Processamento para premium (comportamento original)
    const { data: existingTrial } = await supabase
      .from("user_trials")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (existingTrial) {
      // Atualizar trial existente para premium
      const { error } = await supabase
        .from("user_trials")
        .update({
          upgraded_to_premium: true,
          upgraded_at: now,
          is_active: false,
          // ✅ Iniciar contador premium zerado (usuário poderá gerar 2 planos)
          premium_plan_count: 0,
          premium_plan_cycle_start: now,
          premium_max_plans_per_cycle: 2,
          premium_cycle_days: 30,
        })
        .eq("user_id", userId);

      if (error) {
        console.error("❌ Erro ao atualizar trial:", error);
      } else {
        console.log("✅ Trial atualizado para premium para usuário:", userId);
      }
    } else {
      // Criar novo trial premium
      const { error } = await supabase.from("user_trials").insert({
        user_id: userId,
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

      if (error) {
        console.error("❌ Erro ao criar trial premium:", error);
      } else {
        console.log("✅ Trial premium criado para usuário:", userId);
      }
    }
  } catch (error) {
    console.error("❌ Erro ao processar checkout completed:", error);
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.user_id;
  if (!userId) return;

  // Registrar assinatura no Supabase
  const subscriptionData: {
    user_id: string;
    stripe_subscription_id: string;
    status: string;
    current_period_start?: string;
    current_period_end?: string;
  } = {
    user_id: userId,
    stripe_subscription_id: subscription.id,
    status: subscription.status,
  };

  // Adicionar datas apenas se existirem e forem válidas
  const currentPeriodStart = (subscription as StripeSubscription)
    .current_period_start;
  const currentPeriodEnd = (subscription as StripeSubscription)
    .current_period_end;

  if (
    currentPeriodStart &&
    typeof currentPeriodStart === "number" &&
    currentPeriodStart > 0
  ) {
    subscriptionData.current_period_start = new Date(
      currentPeriodStart * 1000
    ).toISOString();
  }

  if (
    currentPeriodEnd &&
    typeof currentPeriodEnd === "number" &&
    currentPeriodEnd > 0
  ) {
    subscriptionData.current_period_end = new Date(
      currentPeriodEnd * 1000
    ).toISOString();
  }

  await supabase.from("subscriptions").insert(subscriptionData);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.user_id;
  if (!userId) return;

  // Atualizar status da assinatura
  const updateData: {
    status: string;
    current_period_start?: string;
    current_period_end?: string;
  } = {
    status: subscription.status,
  };

  // Adicionar datas apenas se existirem
  if ((subscription as StripeSubscription).current_period_start) {
    updateData.current_period_start = new Date(
      (subscription as StripeSubscription).current_period_start * 1000
    ).toISOString();
  }

  if ((subscription as StripeSubscription).current_period_end) {
    updateData.current_period_end = new Date(
      (subscription as StripeSubscription).current_period_end * 1000
    ).toISOString();
  }

  await supabase
    .from("subscriptions")
    .update(updateData)
    .eq("stripe_subscription_id", subscription.id);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.user_id;
  if (!userId) return;

  // Marcar assinatura como cancelada
  await supabase
    .from("subscriptions")
    .update({
      status: "canceled",
      canceled_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);

  // Reverter trial para grátis
  await supabase
    .from("user_trials")
    .update({
      upgraded_to_premium: false,
      upgraded_at: null,
      is_active: true,
    })
    .eq("user_id", userId);
}
