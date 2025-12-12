import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

/* --------------------------------------------------------
   Tipos locais
-------------------------------------------------------- */

type MuscleGroup = string;

interface Exercise {
  name: string;
  sets: string;
  reps: string;
  rest: string;
  notes: string;
  muscleGroups: MuscleGroup[];
}

interface TrainingDay {
  day: string;
  type?: string;
  exercises: Exercise[];
}

interface TrainingPlan {
  overview: string;
  weeklySchedule: TrainingDay[];
  progression: string;
}

interface TrainingResponseSchema {
  trainingPlan: TrainingPlan;
}

/* --------------------------------------------------------
   Cliente OpenAI
-------------------------------------------------------- */

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

/* --------------------------------------------------------
   SCHEMA CORRIGIDO – PERMITE LISTA DE EXERCÍCIOS COMPLETA
-------------------------------------------------------- */
const TRAINING_SCHEMA = {
  name: "training_plan",
  strict: false,
  schema: {
    type: "object",
    properties: {
      trainingPlan: {
        type: "object",
        properties: {
          overview: { type: "string" },
          weeklySchedule: {
            type: "array",
            items: {
              type: "object",
              properties: {
                day: { type: "string" },
                type: { type: "string" },
                exercises: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      sets: { type: "string" },
                      reps: { type: "string" },
                      rest: { type: "string" },
                      notes: { type: "string" },
                      muscleGroups: {
                        type: "array",
                        items: { type: "string" },
                        minItems: 1,
                        maxItems: 4,
                      },
                    },
                    required: [
                      "name",
                      "sets",
                      "reps",
                      "rest",
                      "notes",
                      "muscleGroups",
                    ],
                  },
                },
              },
              required: ["day", "exercises"],
            },
          },
          progression: { type: "string" },
        },
        required: ["overview", "weeklySchedule", "progression"],
      },
    },
    required: ["trainingPlan"],
  },
};

/* --------------------------------------------------------
   Funções auxiliares tipadas
-------------------------------------------------------- */

function safeParseJSON(
  raw: string | null | undefined
): TrainingResponseSchema | Record<string, unknown> {
  try {
    return raw ? (JSON.parse(raw) as TrainingResponseSchema) : {};
  } catch {
    return {};
  }
}

function parseTrainingDays(freq: string | null | undefined): number {
  if (!freq) return 3;
  const digits = String(freq).replace(/\D/g, "");
  const n = parseInt(digits, 10);
  if (!n || n < 1 || n > 7) return 3;
  return n;
}

function normalize(str: string): string {
  return String(str)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function primaryGroup(ex: Exercise | unknown): string {
  if (!ex || typeof ex !== "object") return "";
  const e = ex as Exercise;
  if (!Array.isArray(e.muscleGroups) || e.muscleGroups.length === 0) return "";
  return normalize(String(e.muscleGroups[0] || ""));
}

function isBig(group: string): boolean {
  const g = normalize(group);
  return (
    g === "peitoral" ||
    g === "costas" ||
    g === "quadriceps" ||
    g === "posterior de coxa" ||
    g === "gluteos" ||
    g === "ombros"
  );
}

function isSmall(group: string): boolean {
  const g = normalize(group);
  return (
    g === "biceps" || g === "triceps" || g === "panturrilhas" || g === "abdomen"
  );
}

/* --------------------------------------------------------
   VALIDAÇÃO FLEXÍVEL E TIPADA
-------------------------------------------------------- */
function isTrainingPlanUsable(
  plan: TrainingPlan | null,
  trainingDays: number
): boolean {
  if (!plan?.weeklySchedule || !Array.isArray(plan.weeklySchedule))
    return false;
  if (plan.weeklySchedule.length !== trainingDays) return false;

  for (const day of plan.weeklySchedule) {
    if (!day.exercises?.length) return false;

    const dayType = normalize(day.type || "");

    // MUSCLES ALLOWED BY DAY
    const allowed = {
      push: ["peitoral", "triceps", "ombros"],
      pull: ["costas", "biceps", "trapézio", "deltoide posterior", "ombros"],
      legs: ["quadriceps", "posterior de coxa", "gluteos", "panturrilhas"],
      upper: ["peitoral", "triceps", "ombros", "costas", "biceps"],
      shouldersarms: ["ombros", "biceps", "triceps"],
    };

    const allowedMuscles = allowed[dayType as keyof typeof allowed] || [];

    // Validate exercises
    for (const ex of day.exercises) {
      for (const mgRaw of ex.muscleGroups || []) {
        const mg = normalize(mgRaw);

        // Legs cannot have upper body
        if (dayType === "legs" && !allowedMuscles.includes(mg)) return false;

        // Push cannot have costas/biceps
        if (dayType === "push" && !allowedMuscles.includes(mg)) return false;

        // Pull cannot have peito/triceps
        if (dayType === "pull" && !allowedMuscles.includes(mg)) return false;

        // Shoulders & Arms cannot have costas
        if (dayType === "shouldersarms" && mg === "costas") return false;
      }
    }

    // Volume checks
    const counts = new Map<string, number>();
    for (const ex of day.exercises) {
      for (const mg of ex.muscleGroups) {
        const key = normalize(mg);
        counts.set(key, (counts.get(key) || 0) + 1);
      }
    }

    const main = primaryGroup(day.exercises[0]);
    const mainCount = counts.get(main) || 0;

    if (isBig(main) && (mainCount < 3 || mainCount > 6)) return false;

    for (const [g, n] of counts) {
      if (isSmall(g) && (n < 1 || n > 4)) return false;
    }
  }

  return true;
}

/* --------------------------------------------------------
   ROTA PRINCIPAL
-------------------------------------------------------- */

export async function POST(request: NextRequest) {
  try {
    // 1) Autenticação
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "Token não encontrado" },
        { status: 401 }
      );
    }
    const token = authHeader.replace("Bearer ", "");

    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: userRes } = await supabaseAuth.auth.getUser(token);
    const user = userRes?.user ?? null;
    if (!user) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    // 2) Buscar profile e plano ativo
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    const { data: activePlan } = await supabase
      .from("user_plans")
      .select("id, plan_data, generated_at")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!activePlan) {
      return NextResponse.json(
        { error: "Nenhum plano ativo" },
        { status: 404 }
      );
    }

    // 3) Preparar dados
    const trainingDays = parseTrainingDays(profile?.training_frequency);

    const existing =
      (activePlan.plan_data?.trainingPlan as TrainingPlan | undefined) ?? null;

    if (isTrainingPlanUsable(existing, trainingDays)) {
      return NextResponse.json({
        success: true,
        trainingPlan: existing,
        alreadyExists: true,
        planId: activePlan.id,
      });
    }

    const age = typeof profile?.age === "number" ? profile.age : null;

    const userData = {
      name: profile?.full_name || "Usuário",
      age,
      gender: profile?.gender || "Sem informação",
      height: profile?.height || 0,
      weight: profile?.weight || 0,
      objective: profile?.objective || "Não informado",
      trainingFrequency: profile?.training_frequency || "3x por semana",
      trainingLocation: profile?.training_location || "academia",
      limitations: profile?.limitations || "Nenhuma",
    };

    // 4) Prompts
    const systemPrompt = `
Você é um treinador de alta performance especializado em montar treinos completos, extensos e detalhados, sempre seguindo as regras abaixo e respeitando o JSON Schema enviado pelo sistema (campo trainingPlan).

📌 OBJETIVO PRINCIPAL

Gerar treinos longos, com múltiplos exercícios por grupo muscular, sempre respeitando:

O número de dias de treino solicitado (${trainingDays} dias).

Volume coerente para o objetivo (hipertrofia, emagrecimento, força, etc.).

Divisão muscular ideais para ${trainingDays} treinos/semana.

As regras de volume e de distribuição abaixo.

🧩 REGRAS GERAIS (OBRIGATÓRIAS)

Nunca gerar treinos curtos.
Cada dia deve ter no mínimo 6 exercícios, preferencialmente 8–12 exercícios, dependendo da divisão.

Nunca colocar apenas 1 exercício por grupo muscular.
Sempre gere 2–6 exercícios por músculo, conforme as regras abaixo.

O treino deve ser equilibrado, técnico, detalhado, e conter notes úteis.

Cada exercício deve ter:

name

sets

reps

rest

notes

muscleGroups (array com 1–4 músculos)

Ordem dos exercícios sempre lógica, por exemplo:

Multiarticulares → isoladores

Grandes grupos → pequenos grupos

Se o usuário treina 5x, preferir:

PPL + Upper + Lower
ou

Push + Pull + Legs + Upper + Lower

NUNCA misturar Peito + Ombro no mesmo dia, EXCETO em divisões Push.

NUNCA colocar Ombro no dia seguinte ao Peito.

Progressão do treino deve ser detalhada ao final.

🏋️ REGRAS DE VOLUME (OBRIGATÓRIO)
🔵 Grupos Musculares Grandes

(PEITO, COSTAS, OMBROS, QUADRÍCEPS, POSTERIOR, GLÚTEO)

3 a 8 exercícios por sessão

Prefira alta variedade e ângulos diferentes

🟡 Grupos Musculares Pequenos

(TRÍCEPS, BÍCEPS, ABDÔMEN, PANTURRILHA)

2 a 4 exercícios

Nunca colocar apenas 1 exercício

🧩 REGRAS POR DIVISÃO
🔥 PUSH (Peito / Ombro / Tríceps)

Peito: 2–4 exercícios

Ombros: 2–3 exercícios

Tríceps: 2–3 exercícios

Total do dia: 7–12 exercícios

🔵 PULL (Costas / Bíceps)

Costas: 3–5 exercícios

Bíceps: 2–3 exercícios

Total: 6–10 exercícios

🟢 LEGS (Quadríceps / Posterior / Glúteo / Panturrilha)

Quadríceps: 2–4

Posterior: 2–4

Glúteos: 1–3

Panturrilhas: 1–2

Total: 7–12 exercícios

🟣 UPPER

Peito: 2–3

Costas: 2–3

Ombros: 1–3

Bíceps: 1–2

Tríceps: 1–2

Total: 8–12 exercícios

🟠 LOWER

Igual ao Legs

⚠️ CLASSIFICAÇÃO OBRIGATÓRIA DOS DIAS
A IA DEVE SEGUIR ESSAS REGRAS SEM EXCEÇÃO:

1) PUSH (Empurrar)
   Permite:
     - Peitoral
     - Tríceps
     - Ombro (apenas porção LATERAL e posterior)
   PROIBIDO:
     - Costas
     - Bíceps
     - Ombro anterior como exercício primário
   Observação:
     Ombro NÃO pode ser treinado no dia seguinte ao peito.

2) PULL (Puxar)
   Permite:
     - Costas
     - Bíceps
     - Trapézio
     - Deltoide posterior
   PROIBIDO:
     - Peito
     - Tríceps
     - Ombro anterior

3) LEGS (Inferiores)
   Permite:
     - Quadríceps
     - Posterior de coxa
     - Glúteos
     - Panturrilhas
   PROIBIDO:
     - Peito
     - Costas
     - Ombros (qualquer porção)
     - Bíceps
     - Tríceps
   Observação:
     Deadlift, stiff e RDL DEVEM ser classificados como:
     ["posterior de coxa", "glúteos"]
     e NUNCA como "costas".

4) UPPER (Corpo superior completo)
   Permite músculos de Push + Pull **no mesmo dia**.
   Mas NÃO deve substituir Push e Pull quando a divisão for PPL.
   Upper só pode ser usado em treinos 2–3x/semana.

5) SHOULDERS & ARMS
   Permite:
     - Ombros
     - Bíceps
     - Tríceps
   PROIBIDO:
     - Costas (exceto exercícios de retração escapular marcados como "deltoide posterior" + "trapézio" e NÃO "costas")
   Exemplo:
     Face pull → ["deltoide posterior", "trapézio"]

⚠️ CLASSIFICAÇÃO CORRETA PARA EVITAR ERROS:
- Panturrilha → "panturrilhas"
- Ponte de glúteos → "glúteos"
- RDL / Terra romeno → "posterior de coxa, glúteos"
- Face pull → "deltoide posterior, trapézio"
- Elevação lateral → "ombros"
- Agachamento → "quadríceps, glúteos"

🎯 REGRAS PARA SAÍDA LONGA E COMPLETA

Para cada dia de treino, você DEVE gerar:

Uma lista completa de exercícios, nunca menos que 6

Volume compatível com a divisão

Notas técnicas detalhadas

Se a IA tentar encurtar o treino → REFAZER internamente antes de devolver.

🧾 FORMATAÇÃO OBRIGATÓRIA PARA O MODELO

Você deve retornar apenas o JSON, exatamente no formato pedido pelo schema.
Porém o conteúdo interno do treino NÃO deve ter formatação JSON (o PDF não precisa ver json interno).
A estrutura é:

{
  "trainingPlan": {
     "overview": "texto...",
     "weeklySchedule": [...],
     "progression": "texto..."
  }
}

O texto dentro de cada campo é texto normal, sem JSON, sem chaves.

🚀 INSTRUÇÃO FINAL

Sempre gere treinos:

Longos

Com bastante variedade

Alinhados com volume científico

Respeitando as regras

Sem NUNCA deixar um músculo com 1 exercício

Totalmente compatíveis com o schema JSON

Se algo não couber em um único dia → dividir corretamente.
`;

    const userPrompt = `
Gerar treino completo com base nos dados:

${JSON.stringify(userData, null, 2)}
`;

    // 5) Tentar gerar até 2 vezes
    let trainingPlan: TrainingPlan | null = null;

    for (let attempt = 1; attempt <= 2; attempt++) {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        temperature: 0.2,
        max_tokens: 12000,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_schema", json_schema: TRAINING_SCHEMA },
      });

      const content = completion.choices?.[0]?.message?.content;
      const parsed = safeParseJSON(
        typeof content === "string" ? content : null
      ) as TrainingResponseSchema | Record<string, unknown>;
      const candidate = (parsed as TrainingResponseSchema).trainingPlan;

      if (candidate && isTrainingPlanUsable(candidate, trainingDays)) {
        trainingPlan = candidate;
        break;
      }
    }

    if (!trainingPlan) {
      return NextResponse.json(
        { error: "Não foi possível gerar um treino válido" },
        { status: 500 }
      );
    }

    // 6) Salvar no Supabase
    const updated = {
      ...(activePlan.plan_data || {}),
      trainingPlan,
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from("user_plans")
      .update({ plan_data: updated })
      .eq("id", activePlan.id);

    if (updateError) {
      console.error("Erro ao atualizar plano:", updateError);
      return NextResponse.json(
        { error: "Erro ao salvar trainingPlan no plano", details: updateError },
        { status: 500 }
      );
    }

    // 7) Responder
    return NextResponse.json({
      success: true,
      trainingPlan,
      alreadyExists: false,
      planId: activePlan.id,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("Erro ao gerar trainingPlan:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
