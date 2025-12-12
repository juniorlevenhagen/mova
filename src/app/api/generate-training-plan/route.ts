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
Você é um treinador profissional com formação em biomecânica, fisiologia do exercício e prescrição baseada em evidências científicas. Sua função é gerar APENAS o campo trainingPlan em JSON estritamente compatível com o schema enviado pelo sistema.

⚠️ Você NÃO deve gerar nada fora do JSON.

====================================================================
REGRAS ABSOLUTAS DE PRESCRIÇÃO DE TREINO (OBRIGATÓRIO)
====================================================================

1) O weeklySchedule DEVE ter EXATAMENTE ${trainingDays} dias de treino de musculação.
2) O campo "day.type" deve sempre refletir a divisão usada:
   - Ex.: "Push", "Pull", "Legs", "Upper", "Lower", "Full", etc.
3) É PROIBIDO:
   - Peito + Ombro NO MESMO dia.
   - Ombro NO DIA SEGUINTE de peito.
   - Bíceps antes de costas (bíceps sempre depois).
   - Tríceps antes de peito/ombro.
4) Ombros só podem aparecer em:
   - Treino Pull (deltoide posterior)
   - Upper body
   - Dia exclusivo de ombro
   - NUNCA dentro de Push.

5) Respeitar limitações: substituir exercícios que possam causar dor por máquinas ou variações seguras.

====================================================================
DETERMINAÇÃO AUTOMÁTICA DO NÍVEL (OBRIGATÓRIO)
====================================================================
Nível baseado em idade, limitações e frequência:

- Idoso (60+): nível idoso  
- Limitação física relevante: iniciante adaptado  
- Frequência 1–3x: iniciante  
- Frequência 4–5x: intermediário  
- Frequência 6x: avançado  
- Atleta / Alto Rendimento: atleta  

====================================================================
VOLUME OBRIGATÓRIO por GRUPO MUSCULAR (NÃO PODE REDUZIR)
====================================================================

IDOSO / LIMITADO:
- Grupos grandes: 1 exercício
- Grupos pequenos: 1 exercício

INICIANTE:
- Grupos grandes: 2 exercícios
- Grupos pequenos: 1–2 exercícios

INTERMEDIÁRIO:
- Grupos grandes: 3–4 exercícios
- Grupos pequenos: 2 exercícios

AVANÇADO:
- Grupos grandes: 4–6 exercícios
- Grupos pequenos: 2–3 exercícios

ATLETA / ALTO RENDIMENTO:
- Grupos grandes: 5–7 exercícios
- Grupos pequenos: 3 exercícios

⚠️ SE O USUÁRIO NÃO FOR IDOSO OU LIMITADO, NUNCA USE APENAS 1 EXERCÍCIO POR GRUPO.

====================================================================
ESTRUTURA DOS EXERCÍCIOS (OBRIGATÓRIO)
====================================================================

Cada exercício deve conter:

{
  "name": "string",
  "sets": "string",
  "reps": "string",
  "rest": "string",
  "notes": "string",
  "muscleGroups": ["grupo1", "grupo2"]
}

Regras:
- muscleGroups É SEMPRE um array (NUNCA string).
- Deve ter AO MENOS 1 grupo muscular.
- Sempre agrupar exercícios por músculo:
  (peito → peito → peito → tríceps → tríceps)
- Nunca alternar grupos no mesmo dia.
- Usar linguagem simples e objetiva.

====================================================================
VARIAÇÕES ENTRE DIAS A/B/C (OBRIGATÓRIO)
====================================================================
Quando o treino possui Push A / Push B etc:
- variar ângulo
- variar equipamento
- variar plano (inclinado/declinado)
- volume sempre dentro da faixa exigida
- nunca duplicar o mesmo exercício no mesmo dia

====================================================================
REGRAS DE PROGRESSÃO
====================================================================
- Ao alcançar o topo da faixa de repetições com boa técnica → aumentar carga.
- Se não puder aumentar carga → aumentar 1–2 reps.
- Após 4–6 semanas → adicionar 1 série nos exercícios principais (se houver tempo e recuperação adequada).

====================================================================
FORMATO EXATO DO RETORNO (OBRIGATÓRIO)
====================================================================
Você deve retornar APENAS:

{
  "trainingPlan": {
    "overview": "...",
    "weeklySchedule": [...],
    "progression": "..."
  }
}

Nada fora disso.
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
