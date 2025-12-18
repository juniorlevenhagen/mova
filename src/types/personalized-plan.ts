export interface PersonalizedPlan {
  analysis: {
    currentStatus: string;
    strengths: string[];
    improvements: string[];
    specialConsiderations?: string[];
  };
  // Pode ser gerado sob demanda (ex.: ao abrir a aba "Treino") para evitar truncamento por tokens
  trainingPlan?: {
    overview: string;
    weeklySchedule: Array<{
      day: string;
      type: string;
      exercises: Array<{
        name: string;
        sets: number;
        reps: string;
        rest: string;
        notes?: string;
        primaryMuscle: string;
        secondaryMuscles?: string[];
      }>;
    }>;
    progression: string;
  };
  aerobicTraining?: {
    overview: string;
    weeklySchedule: Array<{
      day: string;
      activity: string;
      duration: string;
      intensity: string;
      heartRateZone?: string;
      notes?: string;
    }>;
    recommendations: string;
    progression: string;
  };
  // Pode ser gerado/atualizado separadamente (ex.: endpoint dedicado)
  nutritionPlan?: {
    dailyCalories: number;
    macros: {
      protein: string;
      carbs: string;
      fats: string;
    };
    mealPlan: Array<{
      meal: string;
      options: Array<{
        food: string;
        quantity: string;
        calories: number;
      }>;
      timing: string;
    }>;
    supplements?: string[];
    hydration: string;
  };
  goals?: {
    weekly: string[];
    monthly: string[];
    tracking: string[];
  };
  motivation?: {
    personalMessage: string;
    tips: string[];
  };
}
