import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { supabase } from "@/lib/supabase";

// Helper para criar cliente do Mercado Pago
const getClient = () => {
  if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
    throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado");
  }
  return new MercadoPagoConfig({
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
    options: {
      timeout: 5000,
    },
  });
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Verificar tipo de notificação
    const type = body.type;
    const data = body.data;

    console.log("🔔 Webhook Mercado Pago recebido:", type);

    if (type === "payment") {
      const paymentId = data.id;
      if (!paymentId) {
        return NextResponse.json(
          { error: "Payment ID não encontrado" },
          { status: 400 }
        );
      }

      // Criar cliente do Mercado Pago
      const client = getClient();
      const payment = new Payment(client);

      // Buscar pagamento no Mercado Pago
      const mercadoPagoPayment = await payment.get({ id: parseInt(paymentId) });

      // Buscar pagamento no banco de dados
      const { data: pixPayment, error: dbError } = await supabase
        .from("pix_payments")
        .select("*")
        .eq("mercado_pago_payment_id", paymentId)
        .maybeSingle();

      if (dbError || !pixPayment) {
        console.log("⚠️ Pagamento não encontrado no banco:", paymentId);
        return NextResponse.json({ received: true });
      }

      // Determinar novo status
      const newStatus =
        mercadoPagoPayment.status === "approved"
          ? "approved"
          : mercadoPagoPayment.status === "rejected"
            ? "rejected"
            : mercadoPagoPayment.status === "cancelled"
              ? "cancelled"
              : "pending";

      // Atualizar status no banco
      const updateData: {
        status: string;
        mercado_pago_status: string;
        paid_at?: string;
        updated_at: string;
      } = {
        status: newStatus,
        mercado_pago_status: mercadoPagoPayment.status || "",
        updated_at: new Date().toISOString(),
      };

      if (newStatus === "approved" && pixPayment.status !== "approved") {
        updateData.paid_at = new Date().toISOString();

        // Adicionar prompts ao usuário
        await addPromptsToUser(
          pixPayment.user_id,
          pixPayment.prompts_amount,
          pixPayment.purchase_type
        );

        console.log(
          `✅ Pagamento PIX aprovado: ${paymentId}. ${pixPayment.prompts_amount} prompt(s) adicionado(s) ao usuário ${pixPayment.user_id}`
        );
      }

      await supabase
        .from("pix_payments")
        .update(updateData)
        .eq("id", pixPayment.id);

      console.log(
        `✅ Status do pagamento ${paymentId} atualizado para: ${newStatus}`
      );
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("❌ Erro ao processar webhook Mercado Pago:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

async function addPromptsToUser(
  userId: string,
  promptsAmount: number,
  purchaseType: string
) {
  try {
    const now = new Date().toISOString();

    // Buscar trial existente
    const { data: existingTrial } = await supabase
      .from("user_trials")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (existingTrial) {
      const currentPrompts = existingTrial.available_prompts || 0;
      const currentPackagePrompts = existingTrial.package_prompts || 0;
      const newPrompts = currentPrompts + promptsAmount;

      const updateData: Record<string, number | string> = {
        available_prompts: newPrompts,
        updated_at: now,
      };

      if (purchaseType === "prompt_triple") {
        // Apenas pacote de 3 tem cooldown
        const newPackagePrompts = currentPackagePrompts + promptsAmount;
        updateData.package_prompts = newPackagePrompts;
        console.log(
          `📦 Adicionando ${promptsAmount} prompt(s) do pacote (com cooldown). Total do pacote: ${newPackagePrompts}`
        );
      } else if (purchaseType === "prompt_pro_5") {
        // Pacote Pro = sem cooldown (não adicionar package_prompts)
        console.log(
          `✅ Adicionando ${promptsAmount} prompt(s) do Pacote Pro (sem cooldown). Total disponível: ${newPrompts}`
        );
      }

      await supabase
        .from("user_trials")
        .update(updateData)
        .eq("user_id", userId);

      console.log(
        `✅ ${promptsAmount} prompt(s) adicionado(s) via PIX. Total disponível: ${newPrompts}`
      );
    } else {
      // Criar novo trial
      const insertData: Record<string, number | string | boolean> = {
        user_id: userId,
        trial_start_date: now,
        trial_end_date: new Date(
          Date.now() + 365 * 24 * 60 * 60 * 1000
        ).toISOString(),
        plans_generated: 0,
        max_plans_allowed: 1,
        is_active: true,
        upgraded_to_premium: false,
        available_prompts: promptsAmount,
      };

      if (purchaseType === "prompt_triple") {
        insertData.package_prompts = promptsAmount;
      }

      await supabase.from("user_trials").insert(insertData);

      console.log(
        `✅ Trial criado com ${promptsAmount} prompt(s) via PIX para usuário:`,
        userId
      );
    }
  } catch (error) {
    console.error("❌ Erro ao adicionar prompts ao usuário:", error);
    throw error;
  }
}
