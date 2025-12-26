import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { generateTrainingPlanStructure } from "@/lib/generators/trainingPlanGenerator";
import { isTrainingPlanUsable } from "@/lib/validators/trainingPlanValidator";

const openaiApiKey = process.env.OPENAI_API_KEY!;

const openai = new OpenAI({
  apiKey: openaiApiKey,
});

const ANALYSIS_SCHEMA = {
  name: "analysis_plan",
  strict: true,
  schema: {
    type: "object",
    properties: {
      analysis: {
        type: "object",
        additionalProperties: false,
        properties: {
          currentStatus: { type: "string" },
          strengths: { type: "array", items: { type: "string" } },
          improvements: { type: "array", items: { type: "string" } },
          specialConsiderations: {
            type: "array",
            items: { type: "string" },
          },
        },
        required: ["currentStatus", "strengths", "improvements"],
      },
    },
    required: ["analysis"],
    additionalProperties: false,
  },
};

const TRAINING_SCHEMA = {
  name: "training_plan",
  strict: true,
  schema: {
    type: "object",
    properties: {
      trainingPlan: {
        type: "object",
        additionalProperties: false,
        properties: {
          overview: { type: "string" },
          weeklySchedule: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                day: { type: "string" },
                type: { type: "string" },
                exercises: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      name: { type: "string" },
                      sets: { type: "string" },
                      reps: { type: "string" },
                      rest: { type: "string" },
                      notes: { type: "string" },
                      primaryMuscle: { type: "string" },
                    },
                    // ⚠️ OpenAI strict json_schema exige `required` contendo TODAS as chaves em `properties`
                    required: [
                      "name",
                      "sets",
                      "reps",
                      "rest",
                      "notes",
                      "primaryMuscle",
                    ],
                  },
                },
              },
              required: ["day", "type", "exercises"],
            },
          },
          progression: { type: "string" },
        },
        required: ["overview", "weeklySchedule", "progression"],
      },
    },
    required: ["trainingPlan"],
    additionalProperties: false,
  },
};

function safeParseJSON(rawContent: string | null | undefined) {
  if (!rawContent) return {};

  try {
    return JSON.parse(rawContent);
  } catch (error) {
    console.error("❌ Erro ao fazer parse do JSON:", error);
    return {};
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userData, fieldType, existingPlan } = body;

    if (!userData || !fieldType) {
      return NextResponse.json(
        { error: "Dados do usuário e tipo de campo são obrigatórios" },
        { status: 400 }
      );
    }

    if (fieldType !== "analysis" && fieldType !== "trainingPlan") {
      return NextResponse.json(
        { error: "Tipo de campo inválido. Use 'analysis' ou 'trainingPlan'" },
        { status: 400 }
      );
    }

    console.log(`🔧 Gerando ${fieldType}...`);

    // Se for trainingPlan, usar gerador de padrões primeiro
    if (fieldType === "trainingPlan") {
      // Parsear frequência de treino
      const parseTrainingDays = (freq: string | null | undefined): number => {
        if (!freq) return 3;
        const digits = String(freq).replace(/\D/g, "");
        const n = parseInt(digits, 10);
        if (!n || n < 1 || n > 7) return 3;
        return n;
      };

      const trainingDays = parseTrainingDays(userData.trainingFrequency);
      const activityLevel = userData.nivelAtividade || "Moderado";

      // Determinar divisão baseada na frequência
      let division: "PPL" | "Upper/Lower" | "Full Body" = "PPL";
      if (trainingDays <= 3) {
        division = "Full Body";
      } else if (trainingDays === 4) {
        division = "Upper/Lower";
      }

      console.log(
        `🔧 Gerando trainingPlan via padrões: ${trainingDays}x/semana, nível ${activityLevel}, divisão ${division}`
      );

      // Parsear tempo disponível
      const parseTrainingTime = (
        timeStr: string | null | undefined
      ): number | undefined => {
        if (!timeStr) return undefined;
        const match = timeStr.match(/(\d+)/);
        if (!match) return undefined;
        const num = parseInt(match[1]);
        if (timeStr.toLowerCase().includes("hora")) {
          return num * 60;
        }
        return num;
      };

      const availableTimeMinutes = parseTrainingTime(userData.trainingTime);

      // Calcular IMC se disponível
      const imc =
        userData.height && userData.weight
          ? parseFloat(
              (userData.weight / Math.pow(userData.height / 100, 2)).toFixed(1)
            )
          : undefined;

      // 🥇 Passo 1: Detectar restrição de ombro
      // Verificar se há limitações articulares no userData
      const hasJointLimitations =
        (userData.limitations &&
          (userData.limitations.toLowerCase().includes("ombro") ||
            userData.limitations.toLowerCase().includes("shoulder") ||
            userData.limitations.toLowerCase().includes("articular") ||
            userData.limitations.toLowerCase().includes("limitação"))) ||
        (userData.hasPain &&
          (userData.hasPain.toLowerCase().includes("ombro") ||
            userData.hasPain.toLowerCase().includes("shoulder")));

      const hasKneeLimitations =
        userData.limitations &&
        (userData.limitations.toLowerCase().includes("joelho") ||
          userData.limitations.toLowerCase().includes("knee"));

      // Gerar estrutura via padrões (com tempo disponível, IMC e objetivo)
      const generatedPlan = generateTrainingPlanStructure(
        trainingDays,
        activityLevel,
        division,
        availableTimeMinutes,
        imc,
        userData.objective || undefined,
        hasJointLimitations, // 🥇 Passo 1: Restrição de ombro
        hasKneeLimitations // 🔴 Restrição de joelho
      );

      // O generateTrainingPlanStructure já retorna o plano com séries ajustadas
      // Não precisa chamar correctSameTypeDaysExercises novamente, pois já foi chamado dentro
      // Validar (usar o mesmo availableTimeMinutes já calculado)

      const isValid = isTrainingPlanUsable(
        generatedPlan,
        trainingDays,
        activityLevel,
        availableTimeMinutes
      );

      if (isValid) {
        console.log("✅ TrainingPlan gerado via padrões e validado!");
        return NextResponse.json({
          success: true,
          trainingPlan: generatedPlan,
        });
      } else {
        console.warn(
          "⚠️ TrainingPlan gerado via padrões falhou na validação. Retornando erro (fallback IA desativado)."
        );
        return NextResponse.json(
          {
            error: "TRAINING_PLAN_INVALID",
            message:
              "O plano de treino gerado não atende às regras de validação. Tente novamente em alguns minutos.",
          },
          { status: 500 }
        );
      }
    }

    const schema = fieldType === "analysis" ? ANALYSIS_SCHEMA : TRAINING_SCHEMA;

    let systemPrompt = "";
    let userPrompt = "";

    if (fieldType === "analysis") {
      systemPrompt = `Você é um personal trainer e nutricionista especialista de ALTO NÍVEL.

IMPORTANTE: Você DEVE retornar uma análise completa e detalhada do status atual do usuário baseada nos dados fornecidos.

A análise DEVE incluir:
1. currentStatus - descrição completa do status atual do usuário em relação ao objetivo
2. strengths - array com pelo menos 3 pontos fortes do usuário
3. improvements - array com pelo menos 3 áreas de melhoria
4. specialConsiderations (opcional) - considerações especiais ou limitações

Seja específico, detalhado e personalizado para o usuário.`;

      userPrompt = `Gere uma análise completa para este usuário:

Dados do usuário:
- Objetivo: ${userData.objective || "Não informado"}
- Peso atual: ${userData.weight || "Não informado"} kg
- Peso inicial: ${userData.pesoInicial || userData.weight || "Não informado"} kg
- Altura: ${userData.height || "Não informado"} cm
- IMC: ${userData.imc || "Não calculado"}
- Sexo: ${userData.sexo || "Não informado"}
- Frequência de treino: ${userData.trainingFrequency || "Não informado"}
- Nível de atividade: ${userData.nivelAtividade || "Moderado"}
${userData.trainingTime ? `- Tempo disponível por treino: ${userData.trainingTime}` : ""}
${userData.dietaryRestrictions ? `- Restrições alimentares: ${userData.dietaryRestrictions}` : ""}

${existingPlan ? `Plano parcial existente:\n${JSON.stringify(existingPlan, null, 2)}` : ""}

Gere uma análise completa, detalhada e personalizada.`;
    } else {
      systemPrompt = `Você é um Personal Trainer profissional com base em evidências científicas
(Schoenfeld, Grgic, Helms, Morton e outros pesquisadores de musculação e força).

Sua função é criar treinos de FORÇA/MUSCULAÇÃO específicos, seguros e eficientes para cada aluno,
RESPEITANDO o formato JSON do campo trainingPlan (overview, weeklySchedule, progression) definido no schema.

⚠️ MUITO IMPORTANTE SOBRE O FORMATO (trainingPlan):
- Você NÃO deve inventar outro formato externo (como "divisao", "treinos" soltos, etc.).
- SEMPRE preencha o objeto trainingPlan com:
  1. overview: texto explicando divisão, estratégia, nível e justificativa.
  2. weeklySchedule: array de dias; cada dia com:
     - day: nome do dia ou rótulo do treino (ex.: "Treino A – Upper", "Segunda-feira – Peito/Tríceps").
     - type: tipo de treino (ex.: "Upper", "Lower", "Pull", "Push", "Full Body").
     - exercises: lista de exercícios com name, sets, reps, rest, notes (opcional).
  3. progression: explicação de como progredir carga/volume ao longo das semanas.

⚠️ IMPORTANTE (schema estrito):
- O campo "notes" existe no schema e DEVE ser preenchido para TODOS os exercícios.
- Se não houver nota relevante, use string vazia "".

## CONTEXTO E REGRAS GERAIS

Você deve sempre considerar:
- Objetivo: emagrecimento, perda de gordura, manutenção de massa, hipertrofia, hipertrofia máxima ou força.
- Nível (inferido a partir dos dados): iniciante, intermediário ou avançado.
- Frequência semanal informada pelo aluno (${userData.trainingFrequency || "não informado"}).
- Nível de atividade (${userData.nivelAtividade || "Moderado"}) para ajustar volume e intensidade.
- Tempo disponível por treino (${userData.trainingTime || "não informado"}) para limitar o número de exercícios e séries por sessão.
- Divisão muscular mais eficiente para a frequência e objetivo.
- Volume semanal ideal baseado em estudos.
- Técnicas adequadas ao nível.
- Segurança primeiro: prescrever apenas exercícios comuns de academia.

### PRINCÍPIOS CIENTÍFICOS QUE VOCÊ DEVE SEGUIR

1. Hipertrofia é maximizada com ~10–20 séries semanais por grupo muscular,
   preferencialmente distribuídas em ≥ 2 sessões por semana.

2. Iniciantes respondem melhor a divisões simples:
   - Full Body 2–3x/semana OU
   - Upper/Lower 2x/semana.

3. Intermediários se beneficiam de:
   - Upper/Lower 2x/semana OU
   - PPL (Push/Pull/Legs) 1x/semana (3–4 dias) OU variações bem estruturadas.

4. Avançados respondem melhor a:
   - PPL 2x/semana (até 6 dias) OU
   - Divisões com maior volume semanal e foco em grupos específicos.

5. Faixas de repetições recomendadas (para musculação/força):
   - Emagrecimento (foco em gasto calórico, preservando músculo):
     • 12–20 reps, descansos curtos (30–60s), exercícios multiarticulares.
   - Perda de gordura com preservação muscular:
     • Treino igual ao de hipertrofia (6–12 reps), com foco em progressão de carga/técnica.
   - Hipertrofia “clássica”:
     • 6–12 reps, descansos 1,5–3 min.
   - Hipertrofia máxima (avançados):
     • Faixas variadas (5–8, 8–12, 12–20), proximidade alta da falha.
   - Força (apenas avançados):
     • 1–5 reps, 85–95% 1RM (volume total controlado e exercícios muito seguros).

6. A divisão deve respeitar sinergias naturais:
   - Peito + tríceps;
   - Costas + bíceps;
   - Pernas (quadríceps, posterior, glúteos) no mesmo dia ou bem distribuídos;
   - Ombros, quando possível, em dia separado de peito (deltoide anterior já é muito ativado em supino).

7. Técnicas avançadas (rest-pause, drop-set, cluster, supersets muito pesados):
   - DEVEM ser usadas SOMENTE com alunos avançados.
   - NUNCA use essas técnicas com iniciantes.

8. Segurança sempre em primeiro lugar:
   - Use apenas exercícios comuns de academia (supino, agachamento, remada, puxada, leg press, cadeira extensora, mesa flexora, etc.).
   - Evite exercícios extremamente avançados, circenses ou de alto risco articular.
   - Sempre priorize amplitude completa, boa técnica e progressão controlada.

### REGRAS ESPECÍFICAS POR NÍVEL DE ATIVIDADE

Use o NÍVEL DE ATIVIDADE como referência de quantos exercícios/séries o aluno aguenta por sessão:

**Sedentário / Moderado:**
- Foco em exercícios BÁSICOS e eficientes.
- Priorizar MULTIARTICULARES (agachamento, supino, remada, desenvolvimento).
- Volume típico por sessão: 4–5 exercícios, 2–3 séries cada.
- NUNCA mais de 4–5 exercícios por treino.
- NUNCA mais de 3 séries por exercício.
- Evitar técnicas avançadas.

**Atleta:**
- Exercícios intermediários a avançados.
- 5–7 exercícios por treino, 3–5 séries por exercício.
- Pode incluir alguns exercícios isolados para detalhamento muscular.
- Pode usar técnicas avançadas com moderação.

**Atleta Alto Rendimento:**
- Treinos de alto volume e maior complexidade.
- 6–8 exercícios por treino, 4–6 séries por exercício.
- Pode incluir exercícios compostos avançados e isolados específicos.
- Pode usar técnicas avançadas (drop sets, rest-pause, supersets), sempre com segurança.

### COMO VOCÊ DEVE MONTAR O trainingPlan

1) overview:
   - Descreva a divisão (ex.: “Upper/Lower 2x”, “PPL 2x”, “Full Body 3x”).
   - Justifique a escolha com base em objetivo, nível e frequência.
   - Explique brevemente o volume semanal por grupo muscular.

2) weeklySchedule:
   - ⚠️⚠️⚠️ CRÍTICO: Deve ter EXATAMENTE ${(() => {
     const freq = userData.trainingFrequency || "não informado";
     const digits = String(freq).replace(/\D/g, "");
     const n = parseInt(digits, 10);
     return n || 3;
   })()} dias de treino no array weeklySchedule. 
   - O número foi extraído de "${userData.trainingFrequency || "não informado"}".
   - NUNCA gere apenas 1 dia! O array weeklySchedule DEVE ter ${(() => {
     const freq = userData.trainingFrequency || "não informado";
     const digits = String(freq).replace(/\D/g, "");
     const n = parseInt(digits, 10);
     return n || 3;
   })()} elementos.
   - ⚠️ REGRA OBRIGATÓRIA PARA 5 DIAS/SEMANA: SEMPRE use divisão PPL (Push/Pull/Legs) para 5 dias por semana.
     • Para 5 dias, a divisão DEVE ser: Push, Pull, Legs, Push, Pull (repetindo o ciclo PPL)
     • NUNCA use Upper/Lower ou Full Body para 5 dias
     • Os tipos de dia devem ser: "Push", "Pull", "Legs" (ou "Lower" como sinônimo de "Legs")
   - Cada entrada (dia/treino) deve conter:
     • day: nome do dia ou do treino (ex.: "Treino A – Peito/Tríceps").
     • type: "Upper", "Lower", "Pull", "Push", "Full Body", "Legs", etc.
     • exercises: lista de exercícios com:
       - name: nome do exercício (ex.: “Supino reto com barra”);
       - sets: número de séries (respeitando nível e objetivo);
       - reps: faixa de repetições (ex.: “8–12”);
       - rest: tempo de descanso (ex.: “60–90s”, “90–120s”);
       - notes (opcional): instruções de técnica, RIR, progressão.

3) progression:
   - Explique como o aluno deve progredir (ex.: adicionar carga quando fizer o topo da faixa de reps, aumentar séries apenas após adaptação, etc.).

### LIMITAÇÕES IMPORTANTES

- NUNCA prescreva repetições abaixo de 5 para iniciantes ou intermediários.
- NUNCA use protocolos de força máxima (1–3 reps pesadas) para iniciantes.
- SEMPRE adapte o volume semanal ao objetivo e ao nível (iniciante/intermediário/avançado).
- Lembre-se: treino aeróbico (cardio) NÃO deve ser incluído no trainingPlan.weeklySchedule; ele é tratado separadamente no campo aerobicTraining de outra parte do sistema.

Seja extremamente específico, detalhado e baseado em evidências, mas SEMPRE retornando um objeto JSON válido para o campo trainingPlan, conforme o schema fornecido.`;

      userPrompt = `Gere um plano de treino completo para este usuário:

⚠️ CRÍTICO: Para frequência de 5 dias, a divisão DEVE ser PPL (Push/Pull/Legs). Não use Upper/Lower ou Full Body.

Dados do usuário:
- Objetivo: ${userData.objective || "Não informado"}
- Peso atual: ${userData.weight || "Não informado"} kg
- Altura: ${userData.height || "Não informado"} cm
- IMC: ${userData.imc || "Não calculado"}
- Sexo: ${userData.sexo || "Não informado"}
- Frequência de MUSCULAÇÃO: ${userData.trainingFrequency || "Não informado"} (⚠️ Esta frequência se refere APENAS aos dias de treino de força/musculação)
- Nível de atividade: ${userData.nivelAtividade || "Moderado"}
- Local de treino: ${userData.trainingLocation || "Academia"}
${userData.trainingTime ? `- Tempo disponível por treino: ${userData.trainingTime}` : ""}
${userData.injuries ? `- Lesões/limitações: ${userData.injuries}` : ""}

${existingPlan ? `Plano parcial existente:\n${JSON.stringify(existingPlan, null, 2)}` : ""}

Gere um plano de treino completo, detalhado e personalizado para atingir o objetivo do usuário.`;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      max_tokens: 2048,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: schema,
      },
    });

    const choice = completion.choices[0];
    const result = safeParseJSON(choice.message.content);

    console.log(`✅ ${fieldType} gerado:`, {
      hasField: !!result[fieldType],
      finishReason: choice.finish_reason,
    });

    if (!result[fieldType]) {
      return NextResponse.json(
        { error: `Erro ao gerar ${fieldType}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      [fieldType]: result[fieldType],
    });
  } catch (error: unknown) {
    console.error(`❌ Erro ao gerar campo:`, error);
    const errorMessage =
      error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json(
      { error: "Erro interno: " + errorMessage },
      { status: 500 }
    );
  }
}
