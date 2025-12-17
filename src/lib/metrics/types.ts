/**
 * Tipagens Fortes para Métricas de Correção e Rejeição
 */

export type CorrectionReason =
  | "objetivo_convertido_fisiologico"
  | "proteina_ajustada_limite_seguranca"
  | "cardio_frequencia_reduzida_adaptacao"
  | "estimulos_totais_excedidos";

export interface ProteinCorrectionPayload {
  originalProtein: number;
  correctedProtein: number;
  leanMass: number;
  reason: "cap_absoluto" | "massa_magra";
}

export interface ObjectiveCorrectionPayload {
  originalObjective: string;
  correctedObjective: string;
  imc: number;
}

export interface CardioCorrectionPayload {
  originalFrequency: number;
  correctedFrequency: number;
  reason: string;
}

export interface StimuliCorrectionPayload {
  musculacaoCount: number;
  originalCardio: number;
  correctedCardio: number;
  totalStimuli: number;
}

export type CorrectionPayload =
  | { reason: "proteina_ajustada_limite_seguranca"; data: ProteinCorrectionPayload }
  | { reason: "objetivo_convertido_fisiologico"; data: ObjectiveCorrectionPayload }
  | { reason: "cardio_frequencia_reduzida_adaptacao"; data: CardioCorrectionPayload }
  | { reason: "estimulos_totais_excedidos"; data: StimuliCorrectionPayload };

export interface CorrectionContext {
  imc: number;
  gender: string;
  activityLevel: string;
  age: number;
}

