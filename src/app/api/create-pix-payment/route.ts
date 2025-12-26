import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { supabase } from "@/lib/supabase";

// Inicializar cliente do Mercado Pago
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

// Valores dos produtos (em reais)
const PRODUCT_PRICES = {
  prompt_single: 49.9,
  prompt_triple: 119.9,
  prompt_pro_5: 179.9,
};

export async function POST(request: NextRequest) {
  try {
    if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: "Mercado Pago não configurado" },
        { status: 500 }
      );
    }

    console.log("🔍 Iniciando criação de pagamento PIX...");

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

    // ✅ Criar cliente Supabase autenticado com token do usuário para RLS
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

    // Ler body da requisição
    const body = await request.json().catch(() => ({}));
    const purchaseType = body.type || "prompt_single"; // 'prompt_single', 'prompt_triple' ou 'prompt_pro_5'

    // Buscar dados do usuário usando cliente autenticado
    const { data: userProfile } = await supabaseUser
      .from("user_profiles")
      .select("email, full_name")
      .eq("user_id", user.id)
      .maybeSingle();

    console.log("🔍 Tipo de compra:", purchaseType);

    // Determinar valor e quantidade
    const amount = PRODUCT_PRICES[purchaseType as keyof typeof PRODUCT_PRICES];
    const promptsAmount =
      purchaseType === "prompt_triple"
        ? 3
        : purchaseType === "prompt_pro_5"
          ? 5
          : 1;

    if (!amount) {
      return NextResponse.json(
        { error: "Tipo de compra inválido" },
        { status: 400 }
      );
    }

    // Criar cliente do Mercado Pago
    const client = getClient();
    const payment = new Payment(client);

    // Criar pagamento no Mercado Pago
    const paymentData = {
      transaction_amount: amount,
      description: `Mova+ - ${promptsAmount} Prompt${promptsAmount > 1 ? "s" : ""}`,
      payment_method_id: "pix",
      payer: {
        email: userProfile?.email || user.email || "",
        first_name: userProfile?.full_name?.split(" ")[0] || "Usuário",
      },
      metadata: {
        user_id: user.id,
        purchase_type: purchaseType,
        prompts_amount: promptsAmount.toString(),
      },
    };

    console.log("💳 Criando pagamento no Mercado Pago...");
    const paymentResponse = await payment.create({ body: paymentData });

    if (!paymentResponse || !paymentResponse.id) {
      console.error("❌ Erro ao criar pagamento no Mercado Pago");
      return NextResponse.json(
        { error: "Erro ao criar pagamento" },
        { status: 500 }
      );
    }

    console.log("✅ Pagamento criado:", paymentResponse.id);

    // Extrair dados do QR Code PIX
    const pointOfInteraction = paymentResponse.point_of_interaction;
    const transactionData = pointOfInteraction?.transaction_data;
    const qrCode = transactionData?.qr_code || "";
    const qrCodeBase64 = transactionData?.qr_code_base64 || "";
    const pixCode = qrCode || transactionData?.qr_code_base64 || ""; // Fallback

    // Log para debug
    console.log("📋 Dados do pagamento:", {
      paymentId: paymentResponse.id,
      hasPointOfInteraction: !!pointOfInteraction,
      hasTransactionData: !!transactionData,
      qrCodeLength: qrCode.length,
      qrCodeBase64Length: qrCodeBase64.length,
    });

    // Calcular data de expiração (30 minutos)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30);

    // Salvar pagamento no banco de dados usando cliente autenticado
    const { data: pixPayment, error: dbError } = await supabaseUser
      .from("pix_payments")
      .insert({
        user_id: user.id,
        mercado_pago_payment_id: paymentResponse.id.toString(),
        purchase_type: purchaseType,
        prompts_amount: promptsAmount,
        amount: amount,
        currency: "BRL",
        qr_code: qrCode || pixCode || "",
        qr_code_base64: qrCodeBase64 || null,
        pix_code: pixCode || null,
        status: "pending",
        mercado_pago_status: paymentResponse.status || "pending",
        payment_method_id: paymentResponse.payment_method_id || "pix",
        point_of_interaction: pointOfInteraction as unknown as Record<
          string,
          unknown
        >,
        metadata: paymentResponse.metadata as unknown as Record<
          string,
          unknown
        >,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (dbError) {
      console.error("❌ Erro ao salvar pagamento no banco:", dbError);
      console.error("❌ Detalhes do erro:", JSON.stringify(dbError, null, 2));
      console.error("❌ Código do erro:", dbError.code);
      console.error("❌ Mensagem:", dbError.message);

      // Verificar se é erro de tabela não existe
      if (
        dbError.code === "42P01" ||
        dbError.message?.includes("does not exist")
      ) {
        return NextResponse.json(
          {
            error:
              "Tabela pix_payments não encontrada. Execute a migration SQL primeiro.",
            details: dbError.message,
          },
          { status: 500 }
        );
      }

      // Verificar se é erro de RLS
      if (
        dbError.code === "42501" ||
        dbError.message?.includes("permission denied")
      ) {
        return NextResponse.json(
          {
            error:
              "Erro de permissão. Verifique as políticas RLS da tabela pix_payments.",
            details: dbError.message,
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          error: "Erro ao salvar pagamento",
          details:
            process.env.NODE_ENV === "development"
              ? dbError.message
              : undefined,
        },
        { status: 500 }
      );
    }

    console.log("✅ Pagamento salvo no banco:", pixPayment.id);

    // Retornar dados do pagamento
    return NextResponse.json({
      payment_id: pixPayment.id,
      mercado_pago_payment_id: paymentResponse.id,
      qr_code: qrCode,
      qr_code_base64: qrCodeBase64,
      pix_code: pixCode,
      amount,
      expires_at: expiresAt.toISOString(),
      status: "pending",
    });
  } catch (error) {
    console.error("❌ Erro ao criar pagamento PIX:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
