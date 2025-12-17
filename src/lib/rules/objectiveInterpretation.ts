/**
 * Interpretação Inteligente de Objetivos
 *
 * Corrige interpretações literais de objetivos que não fazem sentido fisiológico.
 * Exemplo: "Ganho de Massa" para pessoa obesa (IMC 58) deve ser convertido para "Recomposição".
 */

export interface UserProfile {
  imc: number;
  nivelAtividade: string;
  objective: string;
  weight?: number;
  height?: number;
  age?: number;
  gender?: string;
}

export interface InterpretedObjective {
  originalObjective: string;
  interpretedObjective: string;
  reason: string;
  wasConverted: boolean;
}

/**
 * Interpreta o objetivo do usuário de forma inteligente, corrigindo casos que não fazem sentido fisiológico.
 *
 * REGRA 1: IMC ≥ 35 + Sedentário + "Ganho de Massa" → "Recomposição com foco em força"
 * REGRA 2: IMC ≥ 30 + Sedentário + "Ganho de Massa" → "Recomposição com foco em força"
 *
 * @param profile Perfil do usuário
 * @returns Objetivo interpretado com justificativa
 */
export function interpretObjective(profile: UserProfile): InterpretedObjective {
  const { imc, nivelAtividade, objective } = profile;

  // Normalizar nível de atividade
  const normalizedActivity = nivelAtividade?.toLowerCase().trim() || "";
  const isSedentary =
    normalizedActivity === "sedentário" ||
    normalizedActivity === "sedentario" ||
    normalizedActivity === "sedentary";

  // Normalizar objetivo
  const normalizedObjective = objective?.toLowerCase().trim() || "";
  const isGainMass =
    normalizedObjective.includes("ganho") &&
    (normalizedObjective.includes("massa") ||
      normalizedObjective.includes("peso"));

  // REGRA 1: IMC ≥ 35 + Sedentário + "Ganho de Massa" → Recomposição
  if (imc >= 35 && isSedentary && isGainMass) {
    return {
      originalObjective: objective,
      interpretedObjective:
        "Recomposição corporal com foco em força + preservação de massa magra",
      reason: `IMC ${imc.toFixed(1)} (obesidade grave) + nível sedentário. "Ganho de massa" não é fisiológicamente apropriado. Convertido para recomposição com déficit calórico e treino de força.`,
      wasConverted: true,
    };
  }

  // REGRA 2: IMC ≥ 30 + Sedentário + "Ganho de Massa" → Recomposição
  if (imc >= 30 && isSedentary && isGainMass) {
    return {
      originalObjective: objective,
      interpretedObjective:
        "Recomposição corporal com foco em força + preservação de massa magra",
      reason: `IMC ${imc.toFixed(1)} (obesidade) + nível sedentário. "Ganho de massa" não é fisiológicamente apropriado. Convertido para recomposição com déficit calórico e treino de força.`,
      wasConverted: true,
    };
  }

  // Sem conversão necessária
  return {
    originalObjective: objective,
    interpretedObjective: objective,
    reason: "Objetivo apropriado para o perfil do usuário.",
    wasConverted: false,
  };
}

import { recordPlanCorrection } from "../metrics/planCorrectionMetrics";

/**
 * Registra a conversão de objetivo para métricas/logs
 */
export function logObjectiveConversion(
  conversion: InterpretedObjective,
  profile: UserProfile
): void {
  if (conversion.wasConverted) {
    // 1. Log técnico
    console.log("🔄 Conversão de objetivo aplicada:", {
      original: conversion.originalObjective,
      interpreted: conversion.interpretedObjective,
      reason: conversion.reason,
      timestamp: new Date().toISOString(),
    });

    // 2. Métrica Estratégica (Assíncrona)
    recordPlanCorrection(
      {
        reason: "objetivo_convertido_fisiologico",
        data: {
          originalObjective: conversion.originalObjective,
          correctedObjective: conversion.interpretedObjective,
          imc: profile.imc,
        },
      },
      {
        imc: profile.imc,
        gender: profile.gender || "Não informado",
        activityLevel: profile.nivelAtividade,
        age: profile.age || 0,
      }
    );
  }
}
