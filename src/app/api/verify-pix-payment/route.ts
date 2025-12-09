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
    if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: "Mercado Pago não configurado" },
        { status: 500 }
      );
    }

    // Verificar autenticação
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "Token de autorização não encontrado" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");

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

    const {
      data: { user },
      error: userError,
    } = await supabaseUser.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const paymentId = (body as { payment_id?: string }).payment_id;

    if (!paymentId) {
      return NextResponse.json(
        { error: "ID do pagamento não fornecido" },
        { status: 400 }
      );
    }

    // Buscar pagamento no banco de dados - usar supabaseUser
    const { data: pixPayment, error: dbError } = await supabaseUser
      .from("pix_payments")
      .select("*")
      .eq("id", paymentId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (dbError || !pixPayment) {
      return NextResponse.json(
        { error: "Pagamento não encontrado" },
        { status: 404 }
      );
    }

    // Criar cliente do Mercado Pago
    const client = getClient();
    const payment = new Payment(client);

    // Verificar status no Mercado Pago
    const mercadoPagoPayment = await payment.get({
      id: parseInt(pixPayment.mercado_pago_payment_id),
    });

    const newStatus =
      mercadoPagoPayment.status === "approved"
        ? "approved"
        : mercadoPagoPayment.status === "rejected"
          ? "rejected"
          : mercadoPagoPayment.status === "cancelled"
            ? "cancelled"
            : "pending";

    // Atualizar status no banco se mudou
    if (newStatus !== pixPayment.status) {
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

      if (newStatus === "approved") {
        updateData.paid_at = new Date().toISOString();
      }

      await supabaseUser
        .from("pix_payments")
        .update(updateData)
        .eq("id", paymentId);

      // Se foi aprovado, adicionar prompts ao usuário
      if (newStatus === "approved" && pixPayment.status !== "approved") {
        await addPromptsToUser(
          user.id,
          pixPayment.prompts_amount,
          pixPayment.purchase_type
        );
      }
    }

    // Verificar se expirou
    const now = new Date();
    const expiresAt = new Date(pixPayment.expires_at);
    if (now > expiresAt && newStatus === "pending") {
      await supabaseUser
        .from("pix_payments")
        .update({ status: "expired", updated_at: new Date().toISOString() })
        .eq("id", paymentId);
    }

    return NextResponse.json({
      payment_id: pixPayment.id,
      status:
        newStatus === "pending" && now > expiresAt ? "expired" : newStatus,
      mercado_pago_status: mercadoPagoPayment.status,
      paid_at: pixPayment.paid_at,
      expires_at: pixPayment.expires_at,
    });
  } catch (error) {
    console.error("❌ Erro ao verificar pagamento PIX:", error);
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
        const newPackagePrompts = currentPackagePrompts + promptsAmount;
        updateData.package_prompts = newPackagePrompts;
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
