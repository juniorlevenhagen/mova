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

    // sessionId é opcional; se ausente, retornamos apenas o estado atual do usuário
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
      console.log(`🔍 Verificando sessão do Stripe: ${sessionId}`);
      // Verificar sessão no Stripe
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      console.log(`📋 Status do pagamento: ${session.payment_status}`);
      console.log(`📋 Metadata da sessão:`, JSON.stringify(session.metadata, null, 2));

      if (
        session.payment_status === "paid" &&
        session.metadata?.user_id === user.id
      ) {
        const purchaseType = session.metadata?.purchase_type || null;
        const promptsAmount = session.metadata?.prompts_amount
          ? parseInt(session.metadata.prompts_amount, 10)
          : 0;
        const promptsPurchased = promptsAmount > 0 ? promptsAmount : 1;

        console.log(
          `✅ Pagamento confirmado: ${promptsPurchased} prompt(s) comprado(s) para usuário ${user.id}`
        );

        let { data: trialData, error: trialError } = await supabaseUser
          .from("user_trials")
          .select("available_prompts, plans_generated, max_plans_allowed")
          .eq("user_id", user.id)
          .maybeSingle();

        if (trialError) {
          console.error("❌ Erro ao buscar trial:", trialError);
        } else {
          console.log(
            `📊 Trial encontrado: available_prompts=${trialData?.available_prompts ?? 0}, plans_generated=${trialData?.plans_generated ?? 0}`
          );
        }

        // ✅ FALLBACK: Verificar se o webhook processou. Se não, adicionar prompts diretamente.
        // Estratégia: Aguardar um pouco e verificar se os prompts aumentaram. Se não aumentaram, usar fallback.
        const currentPrompts = trialData?.available_prompts ?? 0;
        const promptsBeforeCheck = currentPrompts;
        
        // Aguardar um pouco para dar tempo ao webhook processar
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Verificar novamente após aguardar
        const { data: trialDataAfterWait } = await supabaseUser
          .from("user_trials")
          .select("available_prompts, updated_at")
          .eq("user_id", user.id)
          .maybeSingle();
        
        const promptsAfterWait = trialDataAfterWait?.available_prompts ?? 0;
        const wasUpdated = promptsAfterWait > promptsBeforeCheck;
        
        // Se os prompts não aumentaram, adicionar via fallback
        if (!wasUpdated) {
          console.log(`⚠️ Webhook pode não ter processado ainda (prompts: ${promptsBeforeCheck} → ${promptsAfterWait}). Adicionando prompts diretamente como fallback...`);
          
          const now = new Date().toISOString();
          
          if (trialDataAfterWait || trialData) {
            // Atualizar trial existente - adicionar prompts comprados
            const promptsToAdd = promptsAfterWait > 0 ? promptsAfterWait : promptsBeforeCheck;
            const newPrompts = promptsToAdd + promptsPurchased;
            
            const { data: updatedTrial, error: updateError } = await supabaseUser
              .from("user_trials")
              .update({
                available_prompts: newPrompts,
                updated_at: now,
              })
              .eq("user_id", user.id)
              .select("available_prompts, plans_generated, max_plans_allowed")
              .maybeSingle();
            
            if (updateError) {
              console.error("❌ Erro ao adicionar prompts (fallback):", updateError);
              // Se erro for de coluna não existente, informar
              if (updateError.message?.includes("column") || updateError.message?.includes("does not exist")) {
                console.error("⚠️ ATENÇÃO: A coluna 'available_prompts' pode não existir na tabela 'user_trials'.");
              }
            } else {
              console.log(`✅ ${promptsPurchased} prompt(s) adicionado(s) diretamente (fallback). Total: ${newPrompts}`);
              trialData = updatedTrial;
            }
          } else {
            // Criar novo trial se não existir
            const { data: newTrial, error: insertError } = await supabaseUser
              .from("user_trials")
              .insert({
                user_id: user.id,
                trial_start_date: now,
                trial_end_date: new Date(
                  Date.now() + 365 * 24 * 60 * 60 * 1000
                ).toISOString(),
                plans_generated: 0,
                max_plans_allowed: 1,
                is_active: true,
                upgraded_to_premium: false,
                available_prompts: promptsPurchased,
              })
              .select("available_prompts, plans_generated, max_plans_allowed")
              .maybeSingle();
            
            if (insertError) {
              console.error("❌ Erro ao criar trial com prompts (fallback):", insertError);
            } else {
              console.log(`✅ Trial criado com ${promptsPurchased} prompt(s) (fallback)`);
              trialData = newTrial;
            }
          }
        } else {
          console.log(`✅ Webhook processou com sucesso. Prompts aumentaram: ${promptsBeforeCheck} → ${promptsAfterWait}. Total disponível: ${promptsAfterWait}`);
          trialData = trialDataAfterWait ? {
            ...trialDataAfterWait,
            plans_generated: trialData?.plans_generated ?? 0,
            max_plans_allowed: trialData?.max_plans_allowed ?? 1,
          } : trialData;
        }

        return NextResponse.json({
          success: true,
          purchaseType,
          promptsPurchased,
          availablePrompts: trialData?.available_prompts ?? 0,
          plansGenerated: trialData?.plans_generated ?? 0,
          maxPlansAllowed: trialData?.max_plans_allowed ?? 1,
          message:
            promptsPurchased > 1
              ? `Pagamento confirmado: ${promptsPurchased} prompts liberados.`
              : "Pagamento confirmado: 1 prompt liberado.",
        });
      } else {
        console.log(
          `⚠️ Pagamento não confirmado ou user_id não corresponde: payment_status=${session.payment_status}, user_id=${session.metadata?.user_id}, expected=${user.id}`
        );
      }

      return NextResponse.json({
        success: false,
        message: "Pagamento não confirmado",
      });
    }

    // Sem sessionId: apenas retornar estado atual de prompts
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
      message: "Status de prompts recuperado com sucesso.",
    });
  } catch (error) {
    console.error("❌ Erro ao verificar pagamento:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
