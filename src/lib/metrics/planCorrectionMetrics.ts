/**
 * Sistema de Registro de Correções Aplicadas (Assíncrono)
 *
 * "LLM cria, código governa, métricas informam."
 */

import { createClient } from "@supabase/supabase-js";
import { CorrectionPayload, CorrectionContext } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getSupabaseClient() {
  if (!supabaseUrl || !supabaseServiceKey) return null;
  return createClient(supabaseUrl, supabaseServiceKey);
}

const supabase = getSupabaseClient();

/**
 * Registra uma correção aplicada de forma assíncrona.
 * NUNCA use await nesta função dentro do fluxo principal para não travar a IA.
 */
export async function recordPlanCorrection(
  payload: CorrectionPayload,
  context: CorrectionContext
): Promise<void> {
  // 1. Log imediato no console (para debug em dev)
  console.log(`📈 [Métrica de Correção] ${payload.reason}`, {
    data: payload.data,
    context,
  });

  if (!supabase) return;

  // 2. Persistência em background
  const persist = async () => {
    try {
      const { error } = await supabase.from("plan_correction_metrics").insert({
        reason: payload.reason,
        payload: payload.data,
        context: context,
        created_at: new Date().toISOString(),
      });

      if (error) {
        console.warn("[Metrics] Erro ao persistir correção:", error.message);
      }
    } catch (err) {
      console.warn("[Metrics] Falha crítica ao registrar correção:", err);
    }
  };

  persist();
}
