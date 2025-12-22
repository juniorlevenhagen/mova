/**
 * Tipagens Fortes para Métricas de Correção e Rejeição
 */

export type CorrectionReason =
  | "objetivo_convertido_fisiologico"
  | "proteina_ajustada_limite_seguranca"
  | "cardio_frequencia_reduzida_adaptacao"
  | "estimulos_totais_excedidos"
  | "ajuste_volume_minimo_obrigatorio"
  | "divisao_ajustada_tecnica"
  | "same_type_days_exercises"
  | "rebaixamento_por_tempo_insuficiente";

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

export interface VolumeCorrectionPayload {
  muscle: string;
  category: string;
  count: number;
  minRequired: number;
  day: string;
}

export interface DivisionCorrectionPayload {
  originalDivision: string;
  correctedDivision: string;
  trainingDays: number;
}

export interface SameTypeDaysCorrectionPayload {
  dayType: string;
  firstDay: string;
  correctedDay: string;
  exerciseCount: number;
}

export interface LevelDowngradeCorrectionPayload {
  declaredLevel: string;
  operationalLevel: string;
  availableTimeMinutes: number;
  timeRequired: number;
}

export type CorrectionPayload =
  | {
      reason: "proteina_ajustada_limite_seguranca";
      data: ProteinCorrectionPayload;
    }
  | {
      reason: "objetivo_convertido_fisiologico";
      data: ObjectiveCorrectionPayload;
    }
  | {
      reason: "cardio_frequencia_reduzida_adaptacao";
      data: CardioCorrectionPayload;
    }
  | { reason: "estimulos_totais_excedidos"; data: StimuliCorrectionPayload }
  | {
      reason: "ajuste_volume_minimo_obrigatorio";
      data: VolumeCorrectionPayload;
    }
  | { reason: "divisao_ajustada_tecnica"; data: DivisionCorrectionPayload }
  | {
      reason: "same_type_days_exercises";
      data: SameTypeDaysCorrectionPayload;
    }
  | {
      reason: "rebaixamento_por_tempo_insuficiente";
      data: LevelDowngradeCorrectionPayload;
    };

export interface CorrectionContext {
  imc: number;
  gender: string;
  activityLevel: string;
  age: number;
}
