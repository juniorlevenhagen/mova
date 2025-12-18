import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET() {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: "Configuração do Supabase ausente" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar as últimas 100 correções
    const { data: corrections, error } = await supabase
      .from("plan_correction_metrics")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;

    // Agrupar estatísticas básicas
    const stats = {
      total: corrections.length,
      byReason: corrections.reduce((acc: Record<string, number>, curr) => {
        acc[curr.reason] = (acc[curr.reason] || 0) + 1;
        return acc;
      }, {}),
      recent: corrections.slice(0, 10),
    };

    return NextResponse.json({ success: true, stats, corrections });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
