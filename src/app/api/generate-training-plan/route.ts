import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import {
  isTrainingPlanUsable,
  type TrainingPlan,
} from "@/lib/validators/trainingPlanValidator";

interface TrainingResponseSchema {
  trainingPlan: TrainingPlan;
}

/* --------------------------------------------------------
   Cliente OpenAI
-------------------------------------------------------- */

// Lazy initialization para permitir mocks em testes
let openaiInstance: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!openaiInstance) {
    openaiInstance = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  }
  return openaiInstance;
}

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
                      primaryMuscle: {
                        type: "string",
                        description:
                          "Músculo primário do exercício (obrigatório)",
                      },
                      secondaryMuscles: {
                        type: "array",
                        items: { type: "string" },
                        minItems: 0,
                        maxItems: 2,
                        description:
                          "Músculos secundários (opcional, máximo 2)",
                      },
                      sets: {
                        type: "number",
                        description: "Número de séries",
                      },
                      reps: { type: "string" },
                      rest: { type: "string" },
                      notes: {
                        type: "string",
                        description: "Notas técnicas (opcional)",
                      },
                    },
                    required: ["name", "primaryMuscle", "sets", "reps", "rest"],
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

/**
 * Parseia o tempo de treino de string para minutos (número)
 * Exemplos: "70 minutos" -> 70, "60" -> 60, "1 hora" -> 60
 */
function parseTrainingTime(
  timeStr: string | null | undefined
): number | undefined {
  if (!timeStr) return undefined;

  // Extrair número da string
  const match = timeStr.match(/(\d+)/);
  if (!match) return undefined;

  const num = parseInt(match[1]);

  // Se contém "hora", multiplicar por 60
  if (timeStr.toLowerCase().includes("hora")) {
    return num * 60;
  }

  return num;
}

function parseTrainingDays(freq: string | null | undefined): number {
  if (!freq) return 3;
  const digits = String(freq).replace(/\D/g, "");
  const n = parseInt(digits, 10);
  if (!n || n < 1 || n > 7) return 3;
  return n;
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
    const availableTimeMinutes = parseTrainingTime(profile?.training_time);

    const existing =
      (activePlan.plan_data?.trainingPlan as TrainingPlan | undefined) ?? null;

    if (
      isTrainingPlanUsable(
        existing,
        trainingDays,
        profile?.nivel_atividade,
        availableTimeMinutes
      )
    ) {
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
Você é um treinador profissional especializado em musculação, força e periodização, baseado em evidências científicas.

Sua tarefa é gerar APENAS o campo trainingPlan, respeitando rigorosamente as regras abaixo.
Não gere explicações extras, não gere textos fora do escopo do treino.

⚠️ Você NÃO deve gerar nada fora do JSON.

====================================================================
REGRAS GERAIS (OBRIGATÓRIO)
====================================================================

- Gere apenas treino de MUSCULAÇÃO.
- Use apenas exercícios amplamente reconhecidos e comuns em academias comerciais.
- Evite variações técnicas avançadas se o nível não for atleta ou atleta de alto rendimento.
- Respeite limitações físicas ou dores informadas; quando existirem, priorize máquinas e exercícios seguros.
- Utilize nomenclatura clara e padronizada dos exercícios.
- Não enfatize nenhum grupo muscular específico, a menos que o usuário solicite explicitamente.
- Seja objetivo e técnico.
- Evite redundâncias.
- Não gere texto motivacional.
- Não gere observações fora do treino.

====================================================================
BLOCO DE REGRAS OBRIGATÓRIAS – DIVISÃO E VOLUME DE TREINO
====================================================================

Leia e siga TODAS as regras abaixo antes de gerar o treino.
Nenhuma regra pode ser ignorada.

1️⃣ Escolha da divisão (OBRIGATÓRIA)

A divisão do treino DEVE ser escolhida exclusivamente com base na frequência semanal de musculação:

2–3x por semana → Full Body

4x por semana → Upper / Lower

5x por semana → Push / Pull / Legs (PPL)

6x por semana → Push / Pull / Legs (PPL) 2x

7x por semana → PPL com ajustes regenerativos ou técnicos

⚠️ Não utilize divisões diferentes das listadas acima.
⚠️ Nunca misture divisões no mesmo plano.
⚠️ A divisão escolhida deve ser aplicada de forma consistente durante toda a semana.

2️⃣ Definição rígida das divisões

Full Body
Cada sessão DEVE conter exercícios para:
- Peitoral
- Costas
- Pernas (quadríceps ou posteriores)
- Ombros
- Braços ou Core

Upper
Pode conter APENAS:
- Peitoral
- Costas
- Ombros
- Bíceps
- Tríceps
❌ Não incluir pernas ou panturrilhas.

Lower
Pode conter APENAS:
- Quadríceps
- Posteriores de coxa
- Glúteos
- Panturrilhas
- Core (opcional)

Obrigatório em todo treino Lower:
- ≥ 1 exercício de quadríceps
- ≥ 1 exercício de posteriores
- ≥ 1 exercício de glúteos ou panturrilhas
❌ Não incluir peitoral, costas ou braços.

Push
Pode conter APENAS:
- Peitoral
- Ombros (anterior e lateral)
- Tríceps

Pull
Pode conter APENAS:
- Costas
- Bíceps
- Posterior de ombro
- Trapézio (opcional)

3️⃣ Limite de exercícios por dia (OBRIGATÓRIO)

O número de exercícios por sessão DEVE respeitar o nível do usuário:

- Idoso / Limitado: 3–5 exercícios
- Iniciante: 4–6 exercícios
- Intermediário: 5–8 exercícios
- Avançado: 6–10 exercícios
- Atleta / Alto rendimento: 8–12 exercícios

🔒 Limites globais:
- Mínimo absoluto: 3 exercícios por dia
- Máximo absoluto: 12 exercícios por dia

4️⃣ Regras de volume por grupo muscular

- Grupos musculares principais PODEM e DEVEM ter mais de um exercício na mesma sessão quando o nível permitir
- Para Atleta / Alto rendimento, utilize 2–4 exercícios por grupo principal quando fizer sentido
- Evite repetir o mesmo padrão de movimento no mesmo dia

VOLUME POR GRUPO MUSCULAR (OBRIGATÓRIO):
- Grupo muscular grande principal do dia: 3 a 8 exercícios (ajustar conforme nível)
- Grupos musculares grandes secundários: 2 a 4 exercícios
- Grupos musculares pequenos (bíceps, tríceps, panturrilhas, abdômen): 1 a 4 exercícios

EQUILÍBRIO DE VOLUME (OBRIGATÓRIO):
- A menos que o usuário solicite foco específico:
  - Não priorize nenhum grupo muscular isoladamente
  - A diferença de volume entre grupos musculares grandes no mesmo dia NÃO deve ultrapassar 1 exercício

5️⃣ Validação final obrigatória (ANTES DE RESPONDER)

Antes de finalizar o plano, verifique internamente:
- A divisão corresponde corretamente à frequência semanal
- Nenhum grupo muscular aparece fora da divisão correta
- O número de exercícios por dia está dentro dos limites do nível
- Todo treino Lower atende às regras mínimas obrigatórias
- Todo treino Full Body contém todos os grupos obrigatórios

Somente após essa validação, gere a resposta final.

6️⃣ Respeitar limitações: substituir exercícios que possam causar dor por máquinas ou variações seguras.

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
- TOTAL POR DIA: 3–5 exercícios (máximo)

INICIANTE:
- Grupos grandes: 2 exercícios
- Grupos pequenos: 1–2 exercícios
- TOTAL POR DIA: 4–6 exercícios (máximo)

INTERMEDIÁRIO:
- Grupos grandes: 3–4 exercícios
- Grupos pequenos: 2 exercícios
- TOTAL POR DIA: 5–8 exercícios (máximo)

AVANÇADO:
- Grupos grandes: 4–6 exercícios
- Grupos pequenos: 2–3 exercícios
- TOTAL POR DIA: 6–10 exercícios (máximo)

ATLETA / ALTO RENDIMENTO:
- Grupos grandes: 5–7 exercícios
- Grupos pequenos: 3 exercícios
- TOTAL POR DIA: 8–12 exercícios (máximo)

⚠️ SE O USUÁRIO NÃO FOR IDOSO OU LIMITADO, NUNCA USE APENAS 1 EXERCÍCIO POR GRUPO.
⚠️ RESPEITE O LIMITE MÁXIMO DE EXERCÍCIOS POR DIA CONFORME O NÍVEL DETERMINADO.

====================================================================
LIMITES DIÁRIOS DE EXERCÍCIOS (OBRIGATÓRIO)
====================================================================

Cada dia de treino DEVE respeitar os seguintes limites totais de exercícios:

- IDOSO / LIMITADO: 3–5 exercícios por dia (máximo)
- INICIANTE: 4–6 exercícios por dia (máximo)
- INTERMEDIÁRIO: 5–8 exercícios por dia (máximo)
- AVANÇADO: 6–10 exercícios por dia (máximo)
- ATLETA / ALTO RENDIMENTO: 8–12 exercícios por dia (máximo)

⚠️ NUNCA exceda esses limites. Treinos muito longos comprometem a qualidade e recuperação.
⚠️ O número mínimo de exercícios por dia é 3 (exceto casos muito específicos de idosos/limitados).

====================================================================
ESTRUTURA DOS EXERCÍCIOS (OBRIGATÓRIO - NOVO FORMATO)
====================================================================

⚠️ MODELO DE EXERCÍCIO OBRIGATÓRIO:

Cada exercício DEVE conter:

{
  "name": "Nome do exercício",
  "primaryMuscle": "músculo principal",
  "secondaryMuscles": ["músculo secundário opcional"],
  "sets": number,
  "reps": "faixa de repetições",
  "rest": "tempo de descanso",
  "notes": "notas técnicas (opcional)"
}

REGRAS FISIOLÓGICAS CRÍTICAS:
- ❌ PROIBIDO usar muscleGroups genérico
- ✔️ Apenas 1 músculo primário por exercício (OBRIGATÓRIO)
- ✔️ Máximo de 2 músculos secundários (opcional)
- ✔️ O volume conta SOMENTE para o músculo primário
- ✔️ sets é um NÚMERO (não string)

Exemplos CORRETOS:
- Supino reto → { "primaryMuscle": "peitoral", "secondaryMuscles": ["tríceps"], "sets": 4, ... }
- Remada curvada → { "primaryMuscle": "costas", "secondaryMuscles": ["bíceps"], "sets": 3, ... }
- Agachamento → { "primaryMuscle": "quadríceps", "secondaryMuscles": ["glúteos", "posterior de coxa"], "sets": 4, ... }
- Levantamento terra → { "primaryMuscle": "posterior de coxa", "secondaryMuscles": ["costas", "glúteos"], "sets": 3, ... }

====================================================================
EXERCÍCIOS VÁLIDOS POR GRUPO MUSCULAR (OBRIGATÓRIO)
====================================================================

⚠️ CRÍTICO: O nome do exercício DEVE corresponder ao primaryMuscle atribuído.

❌ ERROS PROIBIDOS (NUNCA FAZER):
- "Elevação de panturrilha" com primaryMuscle "ombros" → INCORRETO (panturrilha trabalha panturrilhas, não ombros)
- "Remada unilateral" com primaryMuscle "ombros" → INCORRETO (remada trabalha costas, não ombros como primário)
- Qualquer exercício de pernas com primaryMuscle de braço ou vice-versa

✅ EXERCÍCIOS VÁLIDOS PARA OMBROS (primaryMuscle: "ombros"):

Exercícios Compostos:
- Desenvolvimento com halteres (ombros)
- Desenvolvimento militar com barra (ombros)
- Desenvolvimento Arnold (ombros)
- Desenvolvimento sentado com halteres (ombros)
- Desenvolvimento com barra (ombros)

Exercícios de Isolamento - Deltóide Anterior:
- Elevação frontal com halteres (ombros)
- Elevação frontal com barra (ombros)
- Elevação frontal na polia (ombros)

Exercícios de Isolamento - Deltóide Lateral:
- Elevação lateral com halteres (ombros)
- Elevação lateral na polia (ombros)
- Elevação lateral inclinada (ombros)

Exercícios de Isolamento - Deltóide Posterior:
- Elevação lateral invertida (ombros)
- Crucifixo invertido (ombros)
- Face pull (ombros) - pode ter "deltoide posterior" ou "trapézio" como secundário

⚠️ IMPORTANTE SOBRE REMADA E OMBROS:
- Remada unilateral/com halteres → primaryMuscle DEVE ser "costas" (não "ombros")
- Remada pode ter "deltoide posterior" ou "trapézio" como secondaryMuscles, mas NUNCA como primaryMuscle
- Se o dia é Pull e precisa trabalhar ombros posteriores, use exercícios específicos como Face Pull ou Elevação lateral invertida

✅ EXERCÍCIOS VÁLIDOS PARA OUTROS GRUPOS:

Panturrilhas (primaryMuscle: "panturrilhas"):
- Elevação de panturrilha em pé
- Elevação de panturrilha sentado
- Elevação de panturrilha no leg press
- Elevação de panturrilha unilateral

Costas (primaryMuscle: "costas"):
- Remada curvada com barra
- Remada unilateral com halteres
- Puxada frontal
- Puxada aberta
- Remada alta
- Barra fixa

Peitoral (primaryMuscle: "peitoral"):
- Supino reto
- Supino inclinado
- Supino declinado
- Crucifixo
- Flexão de braços

Quadríceps (primaryMuscle: "quadríceps"):
- Agachamento
- Agachamento frontal
- Leg press
- Extensão de pernas
- Afundo

Posterior de coxa (primaryMuscle: "posterior de coxa"):
- Levantamento terra
- Stiff
- RDL (Romanian Deadlift)
- Flexão de pernas
- Good morning

Glúteos (primaryMuscle: "glúteos"):
- Agachamento (pode ser secundário)
- Elevação pélvica
- Ponte de glúteos
- Abdução de quadril

====================================================================
VALIDAÇÃO DE CORRESPONDÊNCIA EXERCÍCIO × MÚSCULO (OBRIGATÓRIO)
====================================================================

ANTES DE ATRIBUIR primaryMuscle a um exercício, verifique:

1. O nome do exercício corresponde ao grupo muscular?
   - "Elevação de panturrilha" → primaryMuscle DEVE ser "panturrilhas" (NUNCA "ombros")
   - "Remada" → primaryMuscle DEVE ser "costas" (NUNCA "ombros")
   - "Desenvolvimento" → primaryMuscle DEVE ser "ombros"
   - "Elevação lateral" → primaryMuscle DEVE ser "ombros"

2. O exercício está no grupo muscular correto para o dia?
   - Push: ombros (anterior/lateral) são permitidos
   - Pull: ombros posteriores são permitidos, mas use exercícios específicos (Face Pull, Elevação lateral invertida)
   - Lower: NUNCA incluir exercícios de ombros

3. Se houver dúvida sobre qual músculo é primário:
   - Consulte a biomecânica do movimento
   - O músculo que realiza o movimento principal é o primário
   - Exercícios compostos: o músculo que mais trabalha é o primário

⚠️ SE O EXERCÍCIO NÃO CORRESPONDER AO primaryMuscle → PLANO INVÁLIDO

====================================================================
LIMITE DE VOLUME POR MÚSCULO PRIMÁRIO (REGRA CRÍTICA)
====================================================================

⚠️ O número de exercícios com o mesmo músculo primário no mesmo dia NÃO PODE EXCEDER:

- Idoso / Limitado: 3 exercícios por músculo/dia
- Iniciante: 4 exercícios por músculo/dia
- Moderado: 5 exercícios por músculo/dia
- Atleta: 6 exercícios por músculo/dia
- Atleta Alto Rendimento: 8 exercícios por músculo/dia

⚠️ Se ultrapassar → plano inválido.

====================================================================
DISTRIBUIÇÃO INTELIGENTE (OBRIGATÓRIO)
====================================================================

Dias Push:
- Alternar primaryMuscle entre: Peitoral, Ombros
- Tríceps NUNCA deve ser primário na maioria dos exercícios (máximo 30%)

Dias Pull:
- Alternar primaryMuscle entre: Costas (dorsal), Posterior de coxa
- Bíceps NUNCA deve dominar o dia (máximo 30%)

Lower / Legs:
- Distribuir primaryMuscle entre: Quadríceps, Posterior de coxa, Glúteos
- Não concentrar tudo em um único músculo (máximo 50% por músculo)

⏱️ TEMPO DE TREINO:
- O volume total (exercícios × séries × descanso) DEVE caber no tempo informado
- Priorizar exercícios compostos para objetivos de força e performance

====================================================================
ORDEM DOS EXERCÍCIOS (OBRIGATÓRIO)
====================================================================

- Exercícios compostos antes de isoladores
- Grupos grandes antes de grupos pequenos
- Bíceps sempre após costas
- Tríceps sempre após peito ou ombros
- Organize os exercícios agrupados por músculo, um abaixo do outro

====================================================================
SINERGIAS E RESTRIÇÕES (OBRIGATÓRIO)
====================================================================

Permitido:
- Peito + tríceps
- Costas + bíceps
- Ombros isolados OU com Pull

Evitar:
- Peito + ombros no mesmo dia
- Ombros no dia seguinte ao treino de peito
- Overlap excessivo de braços em dias consecutivos

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
INTENSIDADE E DESCANSO
====================================================================

- Força: reps baixas, descanso maior
- Hipertrofia: reps moderadas, descanso moderado
- Resistência / Emagrecimento: reps mais altas, descanso curto
- Ajuste o descanso de acordo com o objetivo e o nível do usuário

====================================================================
REGRAS DE PROGRESSÃO (OBRIGATÓRIO)
====================================================================

- A progressão deve ocorrer aumentando carga ao atingir o topo da faixa de repetições com boa técnica
- Após 4 semanas, pode-se adicionar séries aos exercícios principais se a recuperação permitir
- Priorize técnica, segurança e consistência

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
      const completion = await getOpenAI().chat.completions.create({
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

      if (
        candidate &&
        isTrainingPlanUsable(
          candidate,
          trainingDays,
          profile?.nivel_atividade,
          availableTimeMinutes
        )
      ) {
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
