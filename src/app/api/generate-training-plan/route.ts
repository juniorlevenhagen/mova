import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import {
  isTrainingPlanUsable,
  correctSameTypeDaysExercises,
  sanitizeTrainingPlan,
  type TrainingPlan,
  type TrainingDay,
} from "@/lib/validators/trainingPlanValidator";
import { generateTrainingPlanStructure } from "@/lib/generators/trainingPlanGenerator";

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
  strict: true,
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
                        description: "Notas técnicas detalhadas (obrigatório)",
                      },
                    },
                    required: [
                      "name",
                      "primaryMuscle",
                      "secondaryMuscles",
                      "sets",
                      "reps",
                      "rest",
                      "notes",
                    ],
                    additionalProperties: false,
                  },
                },
              },
              required: ["day", "type", "exercises"],
              additionalProperties: false,
            },
          },
          progression: { type: "string" },
        },
        required: ["overview", "weeklySchedule", "progression"],
        additionalProperties: false,
      },
    },
    required: ["trainingPlan"],
    additionalProperties: false,
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
      trainingTime: profile?.training_time || "60 minutos",
      limitations: profile?.limitations || "Nenhuma",
    };

    // 3.5) OPÇÃO: Gerar estrutura baseada em padrões (economiza tokens)
    // Se habilitado, gera a estrutura completa sem usar IA
    const USE_PATTERN_GENERATION = true; // TODO: tornar configurável via env

    if (USE_PATTERN_GENERATION) {
      console.log("🔧 Gerando plano baseado em padrões pré-definidos...");

      // Determinar divisão baseada na frequência
      let division: "PPL" | "Upper/Lower" | "Full Body" = "PPL";
      if (trainingDays <= 3) {
        division = "Full Body";
      } else if (trainingDays === 4) {
        division = "Upper/Lower";
      }

      // Calcular IMC antes de gerar o plano
      const imc =
        profile?.height && profile?.weight
          ? parseFloat(
              (profile.weight / Math.pow(profile.height / 100, 2)).toFixed(1)
            )
          : undefined;

      // 🥇 Passo 1: Detectar restrição de ombro
      // Verificar se há limitações articulares no perfil
      const hasJointLimitations =
        profile?.limitations &&
        (profile.limitations.toLowerCase().includes("ombro") ||
          profile.limitations.toLowerCase().includes("shoulder") ||
          profile.limitations.toLowerCase().includes("articular") ||
          profile.limitations.toLowerCase().includes("limitação"));

      const hasKneeLimitations =
        profile?.limitations &&
        (profile.limitations.toLowerCase().includes("joelho") ||
          profile.limitations.toLowerCase().includes("knee"));

      const generatedPlan = generateTrainingPlanStructure(
        trainingDays,
        profile?.nivel_atividade || "Moderado",
        division,
        availableTimeMinutes,
        imc,
        profile?.objective || undefined,
        hasJointLimitations, // 🥇 Passo 1: Restrição de ombro
        hasKneeLimitations, // 🔴 Restrição de joelho
        profile?.training_location as
          | "academia"
          | "casa"
          | "ambos"
          | "ar_livre"
          | undefined, // 🏠 Novo: Ambiente de treino
        profile?.age || undefined, // 🛡️ Idade para validação de risco
        profile?.gender || undefined // 🆕 Gênero para regras de séries
      );

      // 🥈 Passo 2: Sanitizar plano (Substituição de segurança para idosos/iniciantes)
      const { plan: sanitizedGeneratedPlan, corrections } =
        sanitizeTrainingPlan(
          generatedPlan,
          profile?.age || undefined,
          profile?.nivel_atividade || undefined
        );

      if (corrections.length > 0) {
        console.log(
          `🛡️ [SEGURANÇA] Plano sanitizado: ${corrections.join(", ")}`
        );
      }

      const isValid = isTrainingPlanUsable(
        sanitizedGeneratedPlan,
        trainingDays,
        profile?.nivel_atividade,
        availableTimeMinutes,
        profile
          ? {
              imc,
              gender: profile.gender || "Não informado",
              age: profile.age || 0,
              objective: profile.objective || undefined,
              hasShoulderRestriction: hasJointLimitations,
              hasKneeRestriction: hasKneeLimitations,
            }
          : undefined
      );

      if (isValid) {
        console.log("✅ Plano gerado via padrões e validado com sucesso!");

        // Salvar no Supabase
        const updated = {
          ...(activePlan.plan_data || {}),
          trainingPlan: sanitizedGeneratedPlan,
          updated_at: new Date().toISOString(),
        };

        const { error: updateError } = await supabase
          .from("user_plans")
          .update({ plan_data: updated })
          .eq("id", activePlan.id);

        if (updateError) {
          console.error("Erro ao atualizar plano:", updateError);
          return NextResponse.json(
            {
              error: "Erro ao salvar trainingPlan no plano",
              details: updateError,
            },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          trainingPlan: generatedPlan,
          planId: activePlan.id,
          generatedViaPatterns: true,
        });
      } else {
        console.warn(
          "⚠️ Plano gerado via padrões falhou na validação. Retornando erro."
        );
        return NextResponse.json(
          {
            error: "TRAINING_PLAN_INVALID",
            message:
              "O plano de treino gerado não atendeu às regras de validação. Tente novamente em alguns minutos.",
          },
          { status: 500 }
        );
      }
    }

    // Se chegou aqui, USE_PATTERN_GENERATION está desativado (não deveria acontecer)
    return NextResponse.json(
      {
        error: "TRAINING_PLAN_INVALID",
        message:
          "O plano de treino gerado não atendeu às regras de validação. Tente novamente em alguns minutos.",
      },
      { status: 500 }
    );

    // 4) Prompts (fallback para IA se padrões não funcionarem) - DESATIVADO
    // NOTA: Este prompt foi simplificado porque a estrutura (exercícios, volume, repetição)
    // é gerada por funções determinísticas. A IA só precisa preencher notas técnicas, overview e progression.
    const systemPrompt = `
Você é um treinador profissional especializado em musculação, força e periodização, baseado em evidências científicas.

Sua tarefa é gerar APENAS o campo trainingPlan, respeitando rigorosamente as regras abaixo.
Não gere explicações extras, não gere textos fora do escopo do treino.

⚠️ Você NÃO deve gerar nada fora do JSON.

====================================================================
⚠️ IMPORTANTE: ESTRUTURA JÁ ESTABELECIDA
====================================================================

A estrutura do treino (exercícios, volume, séries, reps, descanso) já foi gerada por funções determinísticas.
Você NÃO deve alterar:
- Nomes dos exercícios
- Número de exercícios por dia
- Séries, repetições ou descanso
- Ordem dos exercícios (já está correta: grandes → pequenos, compostos → isoladores)
- Repetição de dias do mesmo tipo (já está garantida)

Você DEVE preencher apenas:
1. **notes** (notas técnicas detalhadas para cada exercício)
2. **overview** (descrição do plano, estratégia, nível)
3. **progression** (como progredir carga/volume ao longo das semanas)

====================================================================
REGRAS PARA PREENCHIMENTO
====================================================================

1. **NOTES (Notas Técnicas)** - Para cada exercício:
   - Forneça instruções biomecânicas detalhadas
   - Inclua dicas de técnica (ex: "foco na fase excêntrica", "manter escápulas em depressão", "pico de contração")
   - Mencione pontos de atenção para segurança
   - Seja específico e técnico, não genérico

2. **OVERVIEW (Descrição do Plano)**:
   - Descreva a divisão do treino (PPL, Upper/Lower, Full Body)
   - Explique a estratégia baseada no objetivo e nível do usuário
   - Justifique brevemente o volume e a periodização
   - Seja objetivo e técnico, sem texto motivacional

3. **PROGRESSION (Progressão)**:
   - Explique como aumentar carga quando atingir o topo da faixa de repetições
   - Mencione quando considerar adicionar séries (após 4-6 semanas)
   - Priorize técnica, segurança e consistência
   - Adapte ao nível do usuário (iniciante precisa de progressão mais gradual)

====================================================================
REGRAS GERAIS
====================================================================

- Seja objetivo e técnico
- Evite redundâncias
- Não gere texto motivacional
- Não gere observações fora do treino
- Respeite limitações físicas informadas (ajuste notas técnicas se necessário)
- 🛡️ **SEGURANÇA (CRÍTICO)**: NUNCA sugira Pike Push-up, Burpees ou Saltos para Iniciantes ou Idosos (60+).

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
⚠️ SOLICITAÇÃO DE ALTA PERFORMANCE ⚠️
Gere um plano de treino nível ELITE para o seguinte usuário:
${JSON.stringify(userData, null, 2)}

REQUISITOS PARA A RESPOSTA PERFEITA:
1. EXTRATÉGIA: O treino deve ser a aplicação prática perfeita do objetivo e nível do usuário.
2. VOLUME: Não economize exercícios. Use o máximo permitido pelo nível e tempo disponível.
3. TÉCNICA: No campo "notes", forneça instruções biomecânicas avançadas (ex: "foco na fase excêntrica", "manter escápulas em depressão", "pico de contração").
4. VARIEDADE: Escolha exercícios que se complementam, cobrindo todos os ângulos do músculo.
5. REALISMO: O treino deve ser desafiador, mas possível dentro do tempo informado (${userData.trainingTime}).

Seja o melhor treinador que este usuário já teve.
`;

    // 5) Tentar gerar até 2 vezes com feedback específico
    let trainingPlan: TrainingPlan | null = null;
    let lastRejectionReason: string | null = null;

    for (let attempt = 1; attempt <= 2; attempt++) {
      console.log(`🔄 Tentativa ${attempt} de gerar Resposta Perfeita...`);

      // Adicionar feedback específico na segunda tentativa
      let enhancedUserPrompt = userPrompt;
      if (attempt === 2 && lastRejectionReason) {
        enhancedUserPrompt = `${userPrompt}

⚠️ CORREÇÃO NECESSÁRIA (Tentativa anterior foi rejeitada):
${lastRejectionReason}

Por favor, corrija o problema acima e gere um plano válido.`;
      }

      const completion = await getOpenAI().chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.2, // Reduzir temperatura para mais consistência nas regras
        max_tokens: 4096, // Garantir que o texto longo não seja cortado
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: enhancedUserPrompt },
        ],
        response_format: { type: "json_schema", json_schema: TRAINING_SCHEMA },
      });

      const content = completion.choices?.[0]?.message?.content;
      const parsed = safeParseJSON(
        typeof content === "string" ? content : null
      ) as TrainingResponseSchema | Record<string, unknown>;
      const candidate = (parsed as TrainingResponseSchema).trainingPlan;

      if (candidate) {
        // 🔧 CORREÇÃO AUTOMÁTICA: Garantir que dias do mesmo tipo tenham os mesmos exercícios
        // 🔒 Passar activityLevel para validar limites semanais antes de duplicar
        const { plan: correctedPlan, wasCorrected } =
          correctSameTypeDaysExercises(candidate, profile?.nivel_atividade);

        if (wasCorrected) {
          console.log(
            `🔧 Plano corrigido automaticamente: dias do mesmo tipo agora têm exercícios idênticos`
          );

          // Registrar métrica de correção com contexto completo
          if (profile) {
            const imc =
              profile.height && profile.weight
                ? parseFloat(
                    (
                      profile.weight / Math.pow(profile.height / 100, 2)
                    ).toFixed(1)
                  )
                : 0;

            const { recordPlanCorrection } = await import(
              "@/lib/metrics/planCorrectionMetrics"
            );

            // Encontrar primeiro dia corrigido para métrica
            const daysByType = new Map<
              string,
              typeof candidate.weeklySchedule
            >();
            for (const day of correctedPlan.weeklySchedule) {
              const dayType = (day.type || "").toLowerCase();
              if (!daysByType.has(dayType)) {
                daysByType.set(dayType, []);
              }
              daysByType.get(dayType)!.push(day);
            }

            const firstRepeatedTypeEntry = Array.from(
              daysByType.entries()
            ).find(([, days]) => days.length > 1);

            if (firstRepeatedTypeEntry) {
              const dayType = firstRepeatedTypeEntry![0];
              const days: TrainingDay[] = firstRepeatedTypeEntry![1];
              recordPlanCorrection(
                {
                  reason: "same_type_days_exercises",
                  data: {
                    dayType,
                    firstDay: days[0].day,
                    correctedDay: days[1].day,
                    exerciseCount: days[0].exercises.length,
                  },
                },
                {
                  imc,
                  gender: profile.gender || "Não informado",
                  activityLevel: profile.nivel_atividade || "Moderado",
                  age: profile.age || 0,
                }
              ).catch(() => {});
            }
          }
        }

        const imcForValidation =
          profile?.height && profile?.weight
            ? parseFloat(
                (profile.weight / Math.pow(profile.height / 100, 2)).toFixed(1)
              )
            : 0;

        // Detectar restrições articulares para validação
        const hasShoulderRestriction =
          profile?.limitations &&
          (profile.limitations.toLowerCase().includes("ombro") ||
            profile.limitations.toLowerCase().includes("shoulder") ||
            profile.limitations.toLowerCase().includes("articular") ||
            profile.limitations.toLowerCase().includes("limitação"));

        const hasKneeRestriction =
          profile?.limitations &&
          (profile.limitations.toLowerCase().includes("joelho") ||
            profile.limitations.toLowerCase().includes("knee"));

        const isValid = isTrainingPlanUsable(
          correctedPlan,
          trainingDays,
          profile?.nivel_atividade,
          availableTimeMinutes,
          profile
            ? {
                imc: imcForValidation,
                gender: profile.gender || "Não informado",
                age: profile.age || 0,
                objective: profile.objective || undefined,
                hasShoulderRestriction,
                hasKneeRestriction,
              }
            : undefined
        );

        if (isValid) {
          trainingPlan = correctedPlan;
          console.log(
            `✅ Plano válido gerado na tentativa ${attempt}${wasCorrected ? " (corrigido automaticamente)" : ""}`
          );
          break;
        } else {
          // Capturar motivo da rejeição para feedback na próxima tentativa
          // Verificar se dias do mesmo tipo têm exercícios diferentes
          const daysByType = new Map<string, typeof candidate.weeklySchedule>();
          for (const day of candidate.weeklySchedule) {
            const dayType = (day.type || "").toLowerCase();
            if (!daysByType.has(dayType)) {
              daysByType.set(dayType, []);
            }
            daysByType.get(dayType)!.push(day);
          }

          for (const [type, days] of daysByType.entries()) {
            // Pular verificação de exercícios diferentes (já foi corrigido)
            continue;
            if (days.length > 1) {
              const firstDay = days[0];
              const firstExercises = firstDay.exercises.map((e) => ({
                name: e.name.toLowerCase(),
                sets: e.sets,
                reps: e.reps,
                rest: e.rest,
              }));
              const secondDay = days[1];
              const secondExercises = secondDay.exercises.map((e) => ({
                name: e.name.toLowerCase(),
                sets: e.sets,
                reps: e.reps,
                rest: e.rest,
              }));

              if (
                JSON.stringify(firstExercises) !==
                JSON.stringify(secondExercises)
              ) {
                lastRejectionReason = `ERRO CRÍTICO: Os dias do tipo "${type}" (${firstDay.day} e ${secondDay.day}) têm exercícios DIFERENTES. Eles devem ter EXATAMENTE os mesmos exercícios, séries, repetições e descanso. Primeiro dia: ${firstDay.exercises.map((e) => e.name).join(", ")}. Segundo dia: ${secondDay.exercises.map((e) => e.name).join(", ")}.`;
                console.warn(`⚠️ ${lastRejectionReason}`);
                break;
              }
            }
          }

          // Verificar ordem dos exercícios
          if (!lastRejectionReason) {
            for (const day of correctedPlan.weeklySchedule) {
              const exercises = day.exercises || [];
              if (exercises.length > 0) {
                const groups = exercises.map((ex) => {
                  const primary = (ex.primaryMuscle || "").toLowerCase();
                  return primary;
                });

                // Verificar se está alternando grupos (ordem incorreta)
                let lastGroup: string | null = null;
                let groupChanges = 0;
                const groupSequence: string[] = [];
                groups.forEach((group) => {
                  if (group !== lastGroup) {
                    groupChanges++;
                    groupSequence.push(group);
                    lastGroup = group;
                  }
                });

                // Se há mais de 2 mudanças de grupo, pode estar alternando incorretamente
                if (groupChanges > 2) {
                  const dayType = day.type || "desconhecido";
                  lastRejectionReason = `ERRO: A ordem dos exercícios no dia "${day.day}" (${dayType}) está INCORRETA. Os exercícios devem estar AGRUPADOS por grupo muscular: primeiro TODOS os exercícios do grupo grande (ex: peito), depois TODOS do grupo pequeno (ex: tríceps). Ordem atual detectada: ${groupSequence.join(" → ")}.`;
                  console.warn(`⚠️ ${lastRejectionReason}`);
                  break;
                }
              }
            }
          }

          if (!lastRejectionReason) {
            lastRejectionReason =
              "O plano foi rejeitado por não atender às regras de validação. Verifique volume mínimo, ordem dos exercícios e repetição de dias do mesmo tipo.";
          }

          console.warn(
            `❌ Plano rejeitado na tentativa ${attempt}. Motivo: ${lastRejectionReason}`
          );
        }
      } else {
        console.warn(`❌ Falha ao parsear resposta na tentativa ${attempt}`);
        lastRejectionReason =
          "Falha ao processar a resposta da API. Verifique o formato JSON.";
      }
    }

    if (!trainingPlan) {
      return NextResponse.json(
        { error: "Não foi possível gerar um treino válido" },
        { status: 500 }
      );
    }

    if (!activePlan) {
      return NextResponse.json(
        { error: "Nenhum plano ativo" },
        { status: 404 }
      );
    }

    // 6) Salvar no Supabase
    const updated = {
      ...(activePlan!.plan_data || {}),
      trainingPlan,
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from("user_plans")
      .update({ plan_data: updated })
      .eq("id", activePlan!.id);

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
      planId: activePlan!.id,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("Erro ao gerar trainingPlan:", err);

    // ✅ Detectar erro de cota da OpenAI
    const isQuotaError =
      message.includes("quota") ||
      message.includes("limit") ||
      message.includes("429") ||
      (err && typeof err === "object" && "status" in err && err.status === 429);

    if (isQuotaError) {
      return NextResponse.json(
        {
          error: "OPENAI_QUOTA_EXCEEDED",
          message:
            "O sistema está temporariamente indisponível devido a limites de processamento. Por favor, tente novamente em alguns instantes ou entre em contato com o suporte.",
          details: message,
        },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
