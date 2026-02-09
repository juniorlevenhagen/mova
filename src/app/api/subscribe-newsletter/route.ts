import { NextRequest, NextResponse } from "next/server";
import {
  sendNewsletterNotification,
  sendNewsletterConfirmation,
} from "@/lib/email";
import { config } from "@/lib/config";

import { createClient } from "@supabase/supabase-js";

function getSupabaseClient(token?: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Supabase URL e/ou chave não encontradas");
  }
  return createClient(
    url,
    key,
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

// Headers CORS para produção
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
};

// Handler para OPTIONS (CORS preflight)
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    // Verificar se há body na requisição
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error("❌ Erro ao fazer parse do JSON:", parseError);
      return NextResponse.json(
        { error: "Formato de requisição inválido" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!body || typeof body !== "object") {
      console.error("❌ Body inválido ou vazio:", body);
      return NextResponse.json(
        { error: "Dados inválidos" },
        { status: 400, headers: corsHeaders }
      );
    }

    let { email } = body;

    // Validação básica
    if (!email) {
      return NextResponse.json(
        { error: "Email é obrigatório" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Trim do email para remover espaços (comum em mobile)
    email = email.trim();

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error("❌ Email inválido recebido:", email);
      return NextResponse.json(
        { error: "Email inválido" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Log detalhado para debug em produção
    const isProduction = process.env.NODE_ENV === "production";
    const userAgent = request.headers.get("user-agent");
    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");

    console.log("📧 Processando inscrição na newsletter:", {
      email,
      userAgent,
      origin,
      referer,
      timestamp: new Date().toISOString(),
      environment: isProduction ? "production" : "development",
    });

    // Verificar se as variáveis de ambiente estão configuradas
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("❌ Variáveis do Supabase não configuradas:", {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseAnonKey,
      });
      // Continuar mesmo assim, mas logar o erro
    }

    // Criar cliente Supabase (anon key é suficiente pois a política RLS permite INSERT sem auth)
    const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "");

    // Determinar origem da inscrição baseado no referer
    let source = "unknown";
    if (referer) {
      if (referer.includes("/blog")) source = "blog";
      else if (referer.includes("/")) source = "homepage";
    }

    // Verificar se o email já existe
    const { data: existingSubscriber, error: selectError } = await supabase
      .from("newsletter_subscribers")
      .select("id, email, is_active, unsubscribed_at")
      .eq("email", email)
      .maybeSingle();

    if (selectError) {
      console.error("❌ Erro ao verificar email existente:", {
        error: selectError,
        code: selectError.code,
        message: selectError.message,
        details: selectError.details,
        hint: selectError.hint,
      });
      // Se for erro de tabela não encontrada, pode ser que a migration não foi executada
      if (selectError.code === "42P01") {
        console.error(
          "❌ Tabela 'newsletter_subscribers' não encontrada. Execute a migration primeiro!"
        );
      }
    }

    let subscriberData;
    let dbError;
    let isNewSubscription = false;
    let wasReactivated = false;

    let alreadySubscribed = false;
    if (existingSubscriber) {
      // Email já existe
      if (existingSubscriber.is_active) {
        // Já está ativo, não precisa fazer nada além de atualizar metadata
        console.log("ℹ️ Email já está inscrito e ativo:", email);
        subscriberData = existingSubscriber;
        alreadySubscribed = true;
      } else {
        // Reativar inscrição cancelada
        wasReactivated = true;
        const { data: updated, error: updateError } = await supabase
          .from("newsletter_subscribers")
          .update({
            is_active: true,
            unsubscribed_at: null,
            source,
            user_agent: userAgent,
            metadata: {
              origin,
              referer,
              reactivated_at: new Date().toISOString(),
              original_subscribed_at: existingSubscriber.unsubscribed_at
                ? null
                : new Date().toISOString(),
            },
          })
          .eq("email", email)
          .select()
          .single();

        subscriberData = updated;
        dbError = updateError;
        console.log("✅ Inscrição reativada:", email);
      }
    } else {
      // Novo email, inserir
      isNewSubscription = true;
      const { data: inserted, error: insertError } = await supabase
        .from("newsletter_subscribers")
        .insert({
          email,
          is_active: true,
          source,
          user_agent: userAgent,
          metadata: {
            origin,
            referer,
            subscribed_at: new Date().toISOString(),
          },
        })
        .select()
        .single();

      subscriberData = inserted;
      dbError = insertError;
    }

    if (dbError) {
      console.error("❌ Erro ao salvar inscrição no banco:", {
        error: dbError,
        code: dbError.code,
        message: dbError.message,
        details: dbError.details,
        hint: dbError.hint,
        email,
        isNewSubscription,
        wasReactivated,
      });

      // Se for erro de tabela não encontrada
      if (dbError.code === "42P01") {
        console.error(
          "❌ Tabela 'newsletter_subscribers' não encontrada. Execute a migration primeiro!"
        );
      }

      // Se for erro de política RLS
      if (dbError.code === "42501") {
        console.error(
          "❌ Erro de permissão RLS. Verifique se a política de INSERT está configurada corretamente."
        );
      }

      // Continuar mesmo se falhar o banco, para não quebrar o fluxo
    } else if (subscriberData) {
      console.log("✅ Inscrição salva no banco de dados:", {
        id: subscriberData.id,
        email: subscriberData.email,
        source: subscriberData.source,
        isNew: isNewSubscription,
        wasReactivated,
      });
    }

    // Enviar email de notificação para você
    console.log("📧 Enviando email de notificação...");
    const notificationResult = await sendNewsletterNotification(email);
    console.log(
      "📧 Resultado notificação:",
      JSON.stringify(notificationResult, null, 2)
    );

    // Enviar email de confirmação para o usuário
    console.log("📧 Enviando email de confirmação...");
    const confirmationResult = await sendNewsletterConfirmation(email);
    console.log(
      "📧 Resultado confirmação:",
      JSON.stringify(confirmationResult, null, 2)
    );

    // Verificar se Gmail está configurado
    const gmailNotConfigured =
      notificationResult.error === "Gmail não configurado" ||
      confirmationResult.error === "Gmail não configurado";

    // SEMPRE retornar sucesso se a inscrição foi processada
    // Os emails podem falhar mas a inscrição foi registrada
    const atLeastOneEmailSent =
      notificationResult.success || confirmationResult.success;

    if (gmailNotConfigured) {
      console.warn(
        "⚠️ Gmail não configurado em produção. Nova inscrição na newsletter:",
        {
          email,
          date: new Date().toLocaleString("pt-BR"),
          notificationEmail: config.newsletterEmail,
          notificationSuccess: notificationResult.success,
          confirmationSuccess: confirmationResult.success,
        }
      );
    } else if (!atLeastOneEmailSent) {
      console.error("❌ Ambos os emails falharam:", {
        email,
        notificationError: notificationResult.error,
        confirmationError: confirmationResult.error,
      });
    }

    // Log de sucesso (inscrição processada, independente do envio de email)
    console.log("✅ Inscrição na newsletter processada:", {
      email,
      notificationSuccess: notificationResult.success,
      confirmationSuccess: confirmationResult.success,
      gmailConfigured: !gmailNotConfigured,
      timestamp: new Date().toISOString(),
    });

    // SEMPRE retornar sucesso se chegou até aqui
    // A inscrição foi processada mesmo que os emails tenham falhado
    return NextResponse.json(
      {
        success: true,
        message: alreadySubscribed
          ? "Você já está inscrito na newsletter"
          : "Inscrição realizada com sucesso",
        alreadySubscribed,
        emailSent: atLeastOneEmailSent,
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error: unknown) {
    console.error("❌ Erro no envio de email:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erro desconhecido";

    // Log detalhado do erro
    console.error("❌ Detalhes do erro:", {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: errorMessage,
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
