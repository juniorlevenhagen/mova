import { describe, it, expect } from "vitest";
import {
  isTrainingPlanUsable,
  type TrainingPlan,
  type Exercise,
} from "@/lib/validators/trainingPlanValidator";

describe("Simulação de Leg Day para Usuário Avançado", () => {
  const activityLevel = "Avançado";
  const trainingDays = 5;
  const availableTime = 60;

  const createLegsWorkout = (
    distribution: Record<string, number>
  ): TrainingPlan => {
    const exercises: Exercise[] = [];

    for (const [muscle, count] of Object.entries(distribution)) {
      for (let i = 0; i < count; i++) {
        exercises.push({
          name: `${muscle} exercício ${i + 1}`,
          primaryMuscle: muscle,
          sets: 3,
          reps: "10",
          rest: "60s",
        });
      }
    }

    return {
      overview: "Teste de distribuição de pernas",
      progression: "...",
      weeklySchedule: [
        { day: "Segunda", type: "Legs", exercises },
        {
          day: "Terça",
          type: "Push",
          exercises: [
            {
              name: "Peito",
              primaryMuscle: "peitoral",
              sets: 3,
              reps: "10",
              rest: "60s",
            },
            {
              name: "Ombro",
              primaryMuscle: "ombros",
              sets: 3,
              reps: "10",
              rest: "60s",
            },
            {
              name: "Triceps",
              primaryMuscle: "triceps",
              sets: 3,
              reps: "10",
              rest: "60s",
            },
          ],
        },
        {
          day: "Quarta",
          type: "Pull",
          exercises: [
            {
              name: "Costas",
              primaryMuscle: "costas",
              sets: 3,
              reps: "10",
              rest: "60s",
            },
            {
              name: "Biceps",
              primaryMuscle: "biceps",
              sets: 3,
              reps: "10",
              rest: "60s",
            },
          ],
        },
        { day: "Quinta", type: "Push", exercises: [] },
        { day: "Sexta", type: "Pull", exercises: [] },
      ],
    };
  };

  it("deve ACEITAR uma distribuição equilibrada (4 Quad, 3 Posterior, 2 Glúteo, 1 Panturrilha = 10 total)", () => {
    // Quad = 4/10 (40%) -> OK (<= 50%)
    const plan = createLegsWorkout({
      quadriceps: 4,
      "posterior de coxa": 3,
      gluteos: 2,
      panturrilhas: 1,
    });
    const result = isTrainingPlanUsable(
      plan,
      trainingDays,
      activityLevel,
      availableTime
    );
    expect(result).toBe(true);
  });

  it("deve REJEITAR se um músculo exceder 50% (6 Quad, 2 Posterior, 2 Panturrilha = 10 total)", () => {
    // Quad = 6/10 (60%) -> REJEITAR (> 50%)
    const plan = createLegsWorkout({
      quadriceps: 6,
      "posterior de coxa": 2,
      panturrilhas: 2,
    });
    const result = isTrainingPlanUsable(
      plan,
      trainingDays,
      activityLevel,
      availableTime
    );
    expect(result).toBe(false); // Falha pela regra de concentração no dia Lower
  });

  it("deve REJEITAR se um grupo obrigatório estiver ausente (Apenas Quad e Glúteo)", () => {
    const plan = createLegsWorkout({
      quadriceps: 5,
      gluteos: 5,
    });
    // Falha porque falta 'posterior de coxa' (Regra lower_sem_grupos_obrigatorios)
    const result = isTrainingPlanUsable(
      plan,
      trainingDays,
      activityLevel,
      availableTime
    );
    expect(result).toBe(false);
  });

  it("deve ACEITAR volume máximo permitido (5 Quad, 5 Posterior, 2 Glúteo = 12 total)", () => {
    // 12 é o máximo absoluto permitido pelo validador para Atleta Alto Rendimento,
    // mas o Avançado para em 10. Vamos testar com 10 total para Avançado.
    const plan = createLegsWorkout({
      quadriceps: 5,
      "posterior de coxa": 3,
      gluteos: 2,
    });
    // Quad = 5/10 (50%) -> OK (limite exato)
    const result = isTrainingPlanUsable(
      plan,
      trainingDays,
      activityLevel,
      availableTime
    );
    expect(result).toBe(true);
  });
});
