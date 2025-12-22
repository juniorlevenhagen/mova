/**
 * Testes de Regressão - Validação de Dias do Mesmo Tipo
 *
 * OBJETIVO: Garantir que dias do mesmo tipo (ex: Push A e Push D) tenham os mesmos exercícios
 * e que a ordem dos exercícios esteja correta (grupos grandes primeiro, depois pequenos)
 */

import { describe, it, expect } from "vitest";
import {
  isTrainingPlanUsable,
  type TrainingPlan,
} from "@/lib/validators/trainingPlanValidator";

describe("Regressão - Validação de Dias do Mesmo Tipo", () => {
  /**
   * Teste: PPL 5x - Push A e Push D devem ter os mesmos exercícios
   */
  it("deve rejeitar se Push A e Push D tiverem exercícios diferentes", () => {
    const plan: TrainingPlan = {
      overview: "PPL 5x - Teste de repetição",
      progression: "Progressão padrão",
      weeklySchedule: [
        {
          day: "Treino A – Peito/Tríceps",
          type: "Push",
          exercises: [
            {
              name: "Supino reto com barra",
              primaryMuscle: "peitoral",
              sets: 4,
              reps: "8-12",
              rest: "90-120s",
            },
            {
              name: "Supino inclinado com halteres",
              primaryMuscle: "peitoral",
              sets: 4,
              reps: "8-12",
              rest: "90-120s",
            },
            {
              name: "Tríceps testa com barra EZ",
              primaryMuscle: "triceps",
              sets: 3,
              reps: "10-12",
              rest: "60-90s",
            },
          ],
        },
        {
          day: "Treino B – Costas/Bíceps",
          type: "Pull",
          exercises: [
            {
              name: "Puxada na barra fixa",
              primaryMuscle: "costas",
              sets: 4,
              reps: "6-10",
              rest: "90-120s",
            },
            {
              name: "Rosca direta com barra",
              primaryMuscle: "biceps",
              sets: 3,
              reps: "8-12",
              rest: "60-90s",
            },
          ],
        },
        {
          day: "Treino C – Pernas",
          type: "Legs",
          exercises: [
            {
              name: "Agachamento com barra",
              primaryMuscle: "quadriceps",
              sets: 4,
              reps: "8-12",
              rest: "90-120s",
            },
          ],
        },
        {
          day: "Treino D – Peito/Tríceps",
          type: "Push",
          exercises: [
            // ❌ EXERCÍCIOS DIFERENTES - deve ser rejeitado
            {
              name: "Supino inclinado com halteres", // Diferente do Push A
              primaryMuscle: "peitoral",
              sets: 4,
              reps: "8-12",
              rest: "90-120s",
            },
            {
              name: "Peck deck", // Diferente do Push A
              primaryMuscle: "peitoral",
              sets: 3,
              reps: "12-15",
              rest: "60-90s",
            },
            {
              name: "Tríceps na polia alta", // Diferente do Push A
              primaryMuscle: "triceps",
              sets: 3,
              reps: "10-12",
              rest: "60-90s",
            },
          ],
        },
        {
          day: "Treino E – Costas/Bíceps",
          type: "Pull",
          exercises: [
            {
              name: "Puxada na frente com barra",
              primaryMuscle: "costas",
              sets: 4,
              reps: "8-12",
              rest: "90-120s",
            },
            {
              name: "Rosca concentrada",
              primaryMuscle: "biceps",
              sets: 3,
              reps: "10-12",
              rest: "60-90s",
            },
          ],
        },
      ],
    };

    // Deve ser REJEITADO porque Push A e Push D têm exercícios diferentes
    const result = isTrainingPlanUsable(plan, 5, "atleta");
    expect(result).toBe(false);
  });

  /**
   * Teste: PPL 5x - Push A e Push D devem ter os MESMOS exercícios
   */
  it("deve aceitar se Push A e Push D tiverem os mesmos exercícios", () => {
    const pushExercises = [
      {
        name: "Supino reto com barra",
        primaryMuscle: "peitoral",
        sets: 4,
        reps: "8-12",
        rest: "90-120s",
      },
      {
        name: "Supino inclinado com halteres",
        primaryMuscle: "peitoral",
        sets: 4,
        reps: "8-12",
        rest: "90-120s",
      },
      {
        name: "Crossover com cabos",
        primaryMuscle: "peitoral",
        sets: 3,
        reps: "12-15",
        rest: "60-90s",
      },
      {
        name: "Tríceps testa com barra EZ",
        primaryMuscle: "triceps",
        sets: 3,
        reps: "10-12",
        rest: "60-90s",
      },
      {
        name: "Tríceps na polia alta",
        primaryMuscle: "triceps",
        sets: 3,
        reps: "10-12",
        rest: "60-90s",
      },
    ];

    // Adicionar mais exercícios de peito para atender volume mínimo de atleta (4 exercícios mínimo para Push)
    // E adicionar ombros (mínimo 2 para Avançado/Atleta)
    pushExercises.unshift(
      {
        name: "Supino declinado com barra",
        primaryMuscle: "peitoral",
        sets: 4,
        reps: "8-12",
        rest: "90-120s",
      },
      {
        name: "Supino com halteres",
        primaryMuscle: "peitoral",
        sets: 3,
        reps: "8-12",
        rest: "90-120s",
      }
    );

    // Adicionar ombros (mínimo 2 para Avançado/Atleta em Push)
    pushExercises.splice(
      5,
      0,
      {
        name: "Desenvolvimento militar com barra",
        primaryMuscle: "ombros",
        sets: 4,
        reps: "8-12",
        rest: "90-120s",
      },
      {
        name: "Elevação lateral com halteres",
        primaryMuscle: "ombros",
        sets: 3,
        reps: "10-12",
        rest: "60-90s",
      }
    );

    // Criar array de exercícios Pull que será reutilizado
    const pullExercises = [
      // 5 exercícios de costas (volume adequado para atleta)
      {
        name: "Puxada na barra fixa",
        primaryMuscle: "costas",
        sets: 4,
        reps: "6-10",
        rest: "90-120s",
      },
      {
        name: "Remada curvada com barra",
        primaryMuscle: "costas",
        sets: 4,
        reps: "8-12",
        rest: "90-120s",
      },
      {
        name: "Remada unilateral com halteres",
        primaryMuscle: "costas",
        sets: 3,
        reps: "8-12",
        rest: "90-120s",
      },
      {
        name: "Puxada na frente com barra",
        primaryMuscle: "costas",
        sets: 3,
        reps: "8-12",
        rest: "90-120s",
      },
      {
        name: "Remada baixa com polia",
        primaryMuscle: "costas",
        sets: 3,
        reps: "8-12",
        rest: "90-120s",
      },
      // 2 exercícios de bíceps (máximo permitido)
      {
        name: "Rosca direta com barra",
        primaryMuscle: "biceps",
        sets: 3,
        reps: "8-12",
        rest: "60-90s",
      },
      {
        name: "Rosca martelo com halteres",
        primaryMuscle: "biceps",
        sets: 3,
        reps: "10-12",
        rest: "60-90s",
      },
    ];

    const plan: TrainingPlan = {
      overview: "PPL 5x - Teste de repetição correto",
      progression: "Progressão padrão",
      weeklySchedule: [
        {
          day: "Treino A – Peito/Tríceps",
          type: "Push",
          exercises: [...pushExercises], // Mesmos exercícios
        },
        {
          day: "Treino B – Costas/Bíceps",
          type: "Pull",
          exercises: [...pullExercises], // Mesmos exercícios
        },
        {
          day: "Treino C – Pernas",
          type: "Legs",
          exercises: [
            // 5 exercícios de quadríceps (volume adequado para atleta)
            {
              name: "Agachamento com barra",
              primaryMuscle: "quadriceps",
              sets: 4,
              reps: "8-12",
              rest: "90-120s",
            },
            {
              name: "Leg press",
              primaryMuscle: "quadriceps",
              sets: 4,
              reps: "10-15",
              rest: "90-120s",
            },
            {
              name: "Cadeira extensora",
              primaryMuscle: "quadriceps",
              sets: 3,
              reps: "10-15",
              rest: "60-90s",
            },
            {
              name: "Agachamento frontal",
              primaryMuscle: "quadriceps",
              sets: 3,
              reps: "8-12",
              rest: "90-120s",
            },
            {
              name: "Afundo com halteres",
              primaryMuscle: "quadriceps",
              sets: 3,
              reps: "10-12",
              rest: "60-90s",
            },
            // 5 exercícios de posterior de coxa (volume adequado)
            {
              name: "Mesa flexora",
              primaryMuscle: "posterior de coxa",
              sets: 3,
              reps: "10-15",
              rest: "60-90s",
            },
            {
              name: "Stiff com barra",
              primaryMuscle: "posterior de coxa",
              sets: 3,
              reps: "8-12",
              rest: "90-120s",
            },
            {
              name: "Leg curl deitado",
              primaryMuscle: "posterior de coxa",
              sets: 3,
              reps: "10-15",
              rest: "60-90s",
            },
            {
              name: "Leg curl sentado",
              primaryMuscle: "posterior de coxa",
              sets: 3,
              reps: "10-15",
              rest: "60-90s",
            },
            {
              name: "Good morning",
              primaryMuscle: "posterior de coxa",
              sets: 3,
              reps: "8-12",
              rest: "90-120s",
            },
            {
              name: "Elevação de panturrilha em pé",
              primaryMuscle: "panturrilhas",
              sets: 4,
              reps: "12-15",
              rest: "60-90s",
            },
          ],
        },
        {
          day: "Treino D – Peito/Tríceps",
          type: "Push",
          exercises: [...pushExercises], // ✅ MESMOS exercícios
        },
        {
          day: "Treino E – Costas/Bíceps",
          type: "Pull",
          exercises: [...pullExercises], // ✅ MESMOS exercícios
        },
      ],
    };

    // Deve ser ACEITO porque Push A e Push D têm os mesmos exercícios
    const result = isTrainingPlanUsable(plan, 5, "atleta");
    expect(result).toBe(true);
  });

  /**
   * Teste: Ordem dos exercícios - grupos grandes primeiro, depois pequenos
   */
  it("deve rejeitar se a ordem dos exercícios estiver incorreta (alternando grupos)", () => {
    const plan: TrainingPlan = {
      overview: "PPL - Teste de ordem incorreta",
      progression: "Progressão padrão",
      weeklySchedule: [
        {
          day: "Treino A – Peito/Tríceps",
          type: "Push",
          exercises: [
            {
              name: "Supino reto",
              primaryMuscle: "peitoral",
              sets: 4,
              reps: "8-12",
              rest: "90s",
            },
            // ❌ ERRADO: Tríceps antes de terminar peito
            {
              name: "Tríceps testa",
              primaryMuscle: "triceps",
              sets: 3,
              reps: "10-12",
              rest: "60s",
            },
            {
              name: "Tríceps pulley",
              primaryMuscle: "triceps",
              sets: 3,
              reps: "10-12",
              rest: "60s",
            },
            {
              name: "Tríceps francês",
              primaryMuscle: "triceps",
              sets: 3,
              reps: "10-12",
              rest: "60s",
            },
            // ❌ ERRADO: Peito depois de tríceps
            {
              name: "Crossover",
              primaryMuscle: "peitoral",
              sets: 3,
              reps: "12-15",
              rest: "60s",
            },
          ],
        },
      ],
    };

    // Deve ser REJEITADO porque a ordem está incorreta (alternando grupos)
    const result = isTrainingPlanUsable(plan, 1, "atleta");
    expect(result).toBe(false);
  });

  /**
   * Teste: Ordem correta - todos os exercícios de peito primeiro, depois tríceps
   */
  it("deve aceitar se a ordem estiver correta (grupos grandes primeiro)", () => {
    const plan: TrainingPlan = {
      overview: "PPL - Teste de ordem correta",
      progression: "Progressão padrão",
      weeklySchedule: [
        {
          day: "Treino A – Peito/Tríceps",
          type: "Push",
          exercises: [
            // ✅ CORRETO: Todos os exercícios de peito primeiro (5 exercícios para atleta)
            {
              name: "Supino reto com barra",
              primaryMuscle: "peitoral",
              sets: 4,
              reps: "8-12",
              rest: "90-120s",
            },
            {
              name: "Supino inclinado com halteres",
              primaryMuscle: "peitoral",
              sets: 4,
              reps: "8-12",
              rest: "90-120s",
            },
            {
              name: "Supino declinado com barra",
              primaryMuscle: "peitoral",
              sets: 4,
              reps: "8-12",
              rest: "90-120s",
            },
            {
              name: "Crossover com cabos",
              primaryMuscle: "peitoral",
              sets: 3,
              reps: "12-15",
              rest: "60-90s",
            },
            {
              name: "Crucifixo com halteres",
              primaryMuscle: "peitoral",
              sets: 3,
              reps: "12-15",
              rest: "60-90s",
            },
            // ✅ CORRETO: Depois todos os exercícios de tríceps
            {
              name: "Tríceps testa com barra EZ",
              primaryMuscle: "triceps",
              sets: 3,
              reps: "10-12",
              rest: "60-90s",
            },
            {
              name: "Tríceps na polia alta",
              primaryMuscle: "triceps",
              sets: 3,
              reps: "10-12",
              rest: "60-90s",
            },
          ],
        },
      ],
    };

    // Deve ser ACEITO porque a ordem está correta
    const result = isTrainingPlanUsable(plan, 1, "atleta");
    expect(result).toBe(true);
  });

  /**
   * Teste: PPL 5x completo - verificar Push, Pull e Legs
   */
  it("deve validar PPL 5x completo com dias repetidos corretos", () => {
    const pushExercises = [
      // 5 exercícios de peito (volume adequado para atleta)
      {
        name: "Supino reto com barra",
        primaryMuscle: "peitoral",
        sets: 4,
        reps: "8-12",
        rest: "90-120s",
      },
      {
        name: "Supino inclinado com halteres",
        primaryMuscle: "peitoral",
        sets: 4,
        reps: "8-12",
        rest: "90-120s",
      },
      {
        name: "Supino declinado com barra",
        primaryMuscle: "peitoral",
        sets: 4,
        reps: "8-12",
        rest: "90-120s",
      },
      {
        name: "Crossover com cabos",
        primaryMuscle: "peitoral",
        sets: 3,
        reps: "12-15",
        rest: "60-90s",
      },
      {
        name: "Crucifixo com halteres",
        primaryMuscle: "peitoral",
        sets: 3,
        reps: "12-15",
        rest: "60-90s",
      },
      // 2 exercícios de tríceps (máximo permitido quando há 8 exercícios totais)
      {
        name: "Tríceps testa com barra EZ",
        primaryMuscle: "triceps",
        sets: 3,
        reps: "10-12",
        rest: "60-90s",
      },
      {
        name: "Tríceps na polia alta",
        primaryMuscle: "triceps",
        sets: 3,
        reps: "10-12",
        rest: "60-90s",
      },
    ];

    const pullExercises = [
      {
        name: "Puxada na barra fixa",
        primaryMuscle: "costas",
        sets: 4,
        reps: "6-10",
        rest: "90-120s",
      },
      {
        name: "Remada curvada com barra",
        primaryMuscle: "costas",
        sets: 4,
        reps: "8-12",
        rest: "90-120s",
      },
      {
        name: "Remada unilateral com halteres",
        primaryMuscle: "costas",
        sets: 3,
        reps: "8-12",
        rest: "90-120s",
      },
      {
        name: "Rosca direta com barra",
        primaryMuscle: "biceps",
        sets: 3,
        reps: "8-12",
        rest: "60-90s",
      },
      {
        name: "Rosca martelo com halteres",
        primaryMuscle: "biceps",
        sets: 3,
        reps: "10-12",
        rest: "60-90s",
      },
    ];

    const plan: TrainingPlan = {
      overview: "PPL 5x - Plano completo válido",
      progression: "Progressão padrão",
      weeklySchedule: [
        {
          day: "Treino A – Peito/Tríceps",
          type: "Push",
          exercises: [...pushExercises],
        },
        {
          day: "Treino B – Costas/Bíceps",
          type: "Pull",
          exercises: [...pullExercises],
        },
        {
          day: "Treino C – Pernas",
          type: "Legs",
          exercises: [
            // 5 exercícios de quadríceps (volume adequado para atleta)
            {
              name: "Agachamento com barra",
              primaryMuscle: "quadriceps",
              sets: 4,
              reps: "8-12",
              rest: "90-120s",
            },
            {
              name: "Leg press",
              primaryMuscle: "quadriceps",
              sets: 4,
              reps: "10-15",
              rest: "90-120s",
            },
            {
              name: "Cadeira extensora",
              primaryMuscle: "quadriceps",
              sets: 3,
              reps: "10-15",
              rest: "60-90s",
            },
            {
              name: "Agachamento frontal",
              primaryMuscle: "quadriceps",
              sets: 3,
              reps: "8-12",
              rest: "90-120s",
            },
            {
              name: "Afundo com halteres",
              primaryMuscle: "quadriceps",
              sets: 3,
              reps: "10-12",
              rest: "60-90s",
            },
            // 5 exercícios de posterior de coxa (volume adequado)
            {
              name: "Mesa flexora",
              primaryMuscle: "posterior de coxa",
              sets: 3,
              reps: "10-15",
              rest: "60-90s",
            },
            {
              name: "Stiff com barra",
              primaryMuscle: "posterior de coxa",
              sets: 3,
              reps: "8-12",
              rest: "90-120s",
            },
            {
              name: "Leg curl deitado",
              primaryMuscle: "posterior de coxa",
              sets: 3,
              reps: "10-15",
              rest: "60-90s",
            },
            {
              name: "Leg curl sentado",
              primaryMuscle: "posterior de coxa",
              sets: 3,
              reps: "10-15",
              rest: "60-90s",
            },
            {
              name: "Good morning",
              primaryMuscle: "posterior de coxa",
              sets: 3,
              reps: "8-12",
              rest: "90-120s",
            },
            {
              name: "Elevação de panturrilha em pé",
              primaryMuscle: "panturrilhas",
              sets: 4,
              reps: "12-15",
              rest: "60-90s",
            },
          ],
        },
        {
          day: "Treino D – Peito/Tríceps",
          type: "Push",
          exercises: [...pushExercises], // ✅ Mesmos exercícios do Push A
        },
        {
          day: "Treino E – Costas/Bíceps",
          type: "Pull",
          exercises: [...pullExercises], // ✅ Mesmos exercícios do Pull B
        },
      ],
    };

    // Deve ser ACEITO - plano completo e válido
    const result = isTrainingPlanUsable(plan, 5, "atleta");
    expect(result).toBe(true);
  });
});
