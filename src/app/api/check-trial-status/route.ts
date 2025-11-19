import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
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

    // Verificar status do trial
    const { data: trialData, error: trialError } = await supabase
      .from("user_trials")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (trialError) {
      console.error("❌ Erro ao verificar trial:", trialError);
      return NextResponse.json(
        { error: "Erro ao verificar status do trial" },
        { status: 500 }
      );
    }

    // Determinar status do trial
    let hasActiveTrial = false;
    let hasUsedTrial = false;

    if (trialData) {
      // Verificar se tem trial ativo
      if (trialData.is_active && !trialData.upgraded_to_premium) {
        const trialEndDate = new Date(trialData.trial_end_date);
        const currentDate = new Date();

        hasActiveTrial = trialEndDate > currentDate;
      }

      // Verificar se já usou trial (mesmo que expirado)
      hasUsedTrial = trialData.plans_generated > 0;
    }

    return NextResponse.json({
      hasActiveTrial,
      hasUsedTrial,
      trialData: trialData
        ? {
            isActive: trialData.is_active,
            upgradedToPremium: trialData.upgraded_to_premium,
            plansGenerated: trialData.plans_generated,
            trialEndDate: trialData.trial_end_date,
          }
        : null,
    });
  } catch (error) {
    console.error("❌ Erro ao verificar status do trial:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
