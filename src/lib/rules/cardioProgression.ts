/**
 * Progressão Automática de Cardio
 *
 * Implementa regras de progressão conservadora para usuários sedentários,
 * evitando sobrecarga inicial que pode levar a fadiga, lesões ou abandono.
 */

export interface UserProfile {
  nivelAtividade: string;
  imc: number;
  cardioFrequency?: number; // Frequência atual de cardio informada pelo usuário
  trainingFrequency?: number; // Frequência de musculação
}

export interface CardioProgression {
  initialFrequency: number; // Frequência inicial recomendada
  initialIntensity: "leve" | "moderada" | "intensa";
  progressionWeeks: number; // Semanas até atingir frequência desejada
  maxInitialFrequency: number; // Máximo absoluto inicial
  reason: string;
  wasAdjusted: boolean;
}

/**
 * Determina progressão automática de cardio baseada no perfil
 *
 * REGRAS:
 * 1. Sedentário: Iniciar com 2-3 sessões/semana (leve), não importa o que usuário informou
 * 2. Progressão após 2-4 semanas OU métrica de adesão positiva
 * 3. IMC ≥ 35: Máximo 2 sessões iniciais, intensidade leve
 * 4. Total de estímulos semanais (musculação + cardio) não deve exceder capacidade inicial
 */
export function determineCardioProgression(
  profile: UserProfile
): CardioProgression {
  const {
    nivelAtividade,
    imc,
    cardioFrequency = 0,
    trainingFrequency = 0,
  } = profile;

  // Normalizar nível de atividade
  const normalizedActivity = nivelAtividade?.toLowerCase().trim() || "";
  const isSedentary =
    normalizedActivity === "sedentário" ||
    normalizedActivity === "sedentario" ||
    normalizedActivity === "sedentary";

  // Total de estímulos semanais
  const totalStimuli = trainingFrequency + cardioFrequency;

  // REGRA 1: Sedentário + IMC ≥ 35 → Máximo 2 sessões iniciais, leve
  if (isSedentary && imc >= 35) {
    const desiredFrequency = Math.min(cardioFrequency, 2);

    return {
      initialFrequency: desiredFrequency,
      initialIntensity: "leve",
      progressionWeeks: 4, // 4 semanas para progredir
      maxInitialFrequency: 2,
      reason: `Nível sedentário + IMC ${imc.toFixed(1)} (obesidade grave). Início conservador com ${desiredFrequency}x/semana leve para evitar fadiga e risco articular. Progressão após 4 semanas.`,
      wasAdjusted: cardioFrequency > 2,
    };
  }

  // REGRA 2: Sedentário + IMC 30-34.9 → Máximo 3 sessões iniciais, leve a moderada
  if (isSedentary && imc >= 30) {
    const desiredFrequency = Math.min(cardioFrequency, 3);

    return {
      initialFrequency: desiredFrequency,
      initialIntensity: "leve",
      progressionWeeks: 3, // 3 semanas para progredir
      maxInitialFrequency: 3,
      reason: `Nível sedentário + IMC ${imc.toFixed(1)} (obesidade). Início conservador com ${desiredFrequency}x/semana leve para evitar sobrecarga. Progressão após 3 semanas.`,
      wasAdjusted: cardioFrequency > 3,
    };
  }

  // REGRA 3: Sedentário (qualquer IMC) → Máximo 3 sessões iniciais
  if (isSedentary) {
    const desiredFrequency = Math.min(cardioFrequency, 3);

    return {
      initialFrequency: desiredFrequency,
      initialIntensity: "leve",
      progressionWeeks: 2, // 2 semanas para progredir
      maxInitialFrequency: 3,
      reason: `Nível sedentário. Início conservador com ${desiredFrequency}x/semana leve para adaptação. Progressão após 2 semanas.`,
      wasAdjusted: cardioFrequency > 3,
    };
  }

  // REGRA 4: Total de estímulos muito alto para sedentário
  if (isSedentary && totalStimuli > 6) {
    // Limitar total a 6 estímulos semanais inicialmente
    const maxCardio = Math.max(0, 6 - trainingFrequency);
    const desiredFrequency = Math.min(cardioFrequency, maxCardio);

    return {
      initialFrequency: desiredFrequency,
      initialIntensity: "leve",
      progressionWeeks: 3,
      maxInitialFrequency: maxCardio,
      reason: `Total de ${totalStimuli} estímulos semanais (${trainingFrequency}x musculação + ${cardioFrequency}x cardio) é excessivo para nível sedentário. Reduzido para ${trainingFrequency + desiredFrequency} estímulos iniciais. Progressão após 3 semanas.`,
      wasAdjusted: true,
    };
  }

  // Sem ajuste necessário
  return {
    initialFrequency: cardioFrequency,
    initialIntensity: "moderada",
    progressionWeeks: 0,
    maxInitialFrequency: cardioFrequency,
    reason: "Frequência de cardio apropriada para o perfil do usuário.",
    wasAdjusted: false,
  };
}

import { recordPlanCorrection } from "../metrics/planCorrectionMetrics";

/**
 * Registra progressão de cardio para métricas/logs
 */
export function logCardioProgression(
  progression: CardioProgression,
  profile: UserProfile,
  originalCardioFrequency: number
): void {
  if (progression.wasAdjusted) {
    // 1. Log técnico
    console.log("🔄 Progressão de cardio aplicada:", {
      initialFrequency: progression.initialFrequency,
      intensity: progression.initialIntensity,
      progressionWeeks: progression.progressionWeeks,
      reason: progression.reason,
      timestamp: new Date().toISOString(),
    });

    // 2. Métrica Estratégica
    if (progression.reason.includes("estímulos semanais")) {
      recordPlanCorrection(
        {
          reason: "estimulos_totais_excedidos",
          data: {
            musculacaoCount: profile.trainingFrequency || 0,
            originalCardio: originalCardioFrequency,
            correctedCardio: progression.initialFrequency,
            totalStimuli:
              (profile.trainingFrequency || 0) + originalCardioFrequency,
          },
        },
        {
          imc: profile.imc,
          gender: "Não informado", // CardioProgression não recebe gender atualmente
          activityLevel: profile.nivelAtividade,
          age: 0,
        }
      );
    } else {
      recordPlanCorrection(
        {
          reason: "cardio_frequencia_reduzida_adaptacao",
          data: {
            originalFrequency: originalCardioFrequency,
            correctedFrequency: progression.initialFrequency,
            reason: progression.reason,
          },
        },
        {
          imc: profile.imc,
          gender: "Não informado",
          activityLevel: profile.nivelAtividade,
          age: 0,
        }
      );
    }
  }
}
