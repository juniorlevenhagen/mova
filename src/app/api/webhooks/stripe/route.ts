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
    // Atualizar trial para premium
    const { error } = await supabase
      .from("user_trials")
      .update({
        upgraded_to_premium: true,
        upgraded_at: new Date().toISOString(),
        is_active: false,
      })
      .eq("user_id", userId);

    if (error) {
      console.error("❌ Erro ao atualizar trial:", error);
    } else {
      console.log("✅ Trial atualizado para premium para usuário:", userId);
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
