export interface PersonalizedPlan {
  analysis: {
    currentStatus: string;
    strengths: string[];
    improvements: string[];
    specialConsiderations?: string[];
  };
  trainingPlan: {
    overview: string;
    weeklySchedule: Array<{
      day: string;
      type: string;
      exercises: Array<{
        name: string;
        sets: string;
        reps: string;
        rest: string;
        notes?: string;
        muscleGroups?: string;
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
  nutritionPlan: {
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
  goals: {
    weekly: string[];
    monthly: string[];
    tracking: string[];
  };
  motivation: {
    personalMessage: string;
    tips: string[];
  };
}
