import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabase } from "@/lib/supabase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover" as unknown as "2025-08-27.basil",
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
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

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
  console.log("🔔 Webhook recebido - checkout.session.completed");
  console.log(
    "📋 Metadata da sessão:",
    JSON.stringify(session.metadata, null, 2)
  );
  console.log("📋 Mode da sessão:", session.mode);
  console.log("📋 Payment status:", session.payment_status);

  const userId = session.metadata?.user_id;
  if (!userId) {
    console.log("❌ User ID não encontrado no metadata da sessão");
    console.log("📋 Metadata disponível:", session.metadata);
    return;
  }

  try {
    const now = new Date().toISOString();
    const purchaseType = session.metadata?.purchase_type;
    const promptsAmount = session.metadata?.prompts_amount
      ? parseInt(session.metadata.prompts_amount, 10)
      : 0;

    console.log(
      `🔍 Processando compra: tipo=${purchaseType}, quantidade=${promptsAmount}, userId=${userId}`
    );

    const isPromptPurchase =
      purchaseType === "prompt_single" ||
      purchaseType === "prompt_triple" ||
      purchaseType === "prompt_pro_5" ||
      session.mode === "payment";

    if (!isPromptPurchase) {
      console.log(
        `⚠️ Sessão ${session.id} ignorada: tipo de compra não reconhecido (${purchaseType}).`
      );
      return;
    }

    const promptsToAdd = promptsAmount > 0 ? promptsAmount : 1;

    console.log(
      `✅ Processando compra de ${promptsToAdd} prompt(s) para usuário:`,
      userId
    );

    // Buscar trial existente
    const { data: existingTrial } = await supabase
      .from("user_trials")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (existingTrial) {
      const currentPrompts = existingTrial.available_prompts || 0;
      const currentPackagePrompts = existingTrial.package_prompts || 0;
      const newPrompts = currentPrompts + promptsToAdd;

      console.log(
        `🔄 Atualizando trial para usuário ${userId}: ${currentPrompts} + ${promptsToAdd} = ${newPrompts} prompts`
      );

      // ✅ Se for pacote de 3 prompts, também adicionar à coluna package_prompts
      // ✅ Pacote Pro (5) e Elite (10) são tratados como singlePrompts (sem cooldown)
      const updateData: Record<string, number | string> = {
        available_prompts: newPrompts,
        updated_at: now,
      };

      if (purchaseType === "prompt_triple") {
        // Apenas pacote de 3 tem cooldown
        const newPackagePrompts = currentPackagePrompts + promptsToAdd;
        updateData.package_prompts = newPackagePrompts;
        console.log(
          `📦 Adicionando ${promptsToAdd} prompt(s) do pacote (com cooldown). Total do pacote: ${newPackagePrompts}`
        );
      } else if (purchaseType === "prompt_pro_5") {
        // Pacote Pro = sem cooldown (não adicionar package_prompts)
        console.log(
          `✅ Adicionando ${promptsToAdd} prompt(s) do Pacote Pro (sem cooldown). Total disponível: ${newPrompts}`
        );
      }

      const { data, error } = await supabase
        .from("user_trials")
        .update(updateData)
        .eq("user_id", userId)
        .select();

      if (error) {
        console.error("❌ Erro ao atualizar prompts:", error);
        console.error("❌ Detalhes do erro:", JSON.stringify(error, null, 2));
        // Se erro for de coluna não existente, tentar criar
        if (
          error.message?.includes("column") ||
          error.message?.includes("does not exist")
        ) {
          console.error(
            "⚠️ ATENÇÃO: A coluna 'available_prompts' pode não existir na tabela 'user_trials'. Execute a migração SQL necessária."
          );
        }
      } else {
        console.log(
          `✅ ${promptsToAdd} prompt(s) adicionado(s). Total disponível: ${newPrompts}`
        );
        console.log("✅ Trial atualizado:", data);
      }
    } else {
      // ✅ Criar novo trial - se for pacote de 3, também definir package_prompts
      const insertData: Record<string, number | string | boolean> = {
        user_id: userId,
        trial_start_date: now,
        trial_end_date: new Date(
          Date.now() + 365 * 24 * 60 * 60 * 1000
        ).toISOString(), // 1 ano de validade para uso dos prompts
        plans_generated: 0,
        max_plans_allowed: 1,
        is_active: true,
        upgraded_to_premium: false,
        available_prompts: promptsToAdd,
      };

      if (purchaseType === "prompt_triple") {
        insertData.package_prompts = promptsToAdd;
        console.log(`📦 Criando trial com ${promptsToAdd} prompt(s) do pacote`);
      }

      const { error } = await supabase.from("user_trials").insert(insertData);

      if (error) {
        console.error("❌ Erro ao criar trial com prompts:", error);
      } else {
        console.log(
          `✅ Trial criado com ${promptsToAdd} prompt(s) para usuário:`,
          userId
        );
      }
    }
  } catch (error) {
    console.error("❌ Erro ao processar checkout completed:", error);
  }
}
