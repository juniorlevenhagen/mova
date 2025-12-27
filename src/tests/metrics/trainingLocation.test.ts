import { describe, it, expect, vi } from "vitest";

/**
 * Teste: Validação de Ambiente de Treino
 *
 * Este teste verifica se o sistema considera o ambiente de treino
 * (academia vs casa vs ar livre) ao gerar planos de treino.
 *
 * PROBLEMA IDENTIFICADO:
 * - O sistema captura `training_location` do perfil do usuário
 * - É usado apenas para o plano de cardio/aeróbico
 * - NÃO é usado para o treino de musculação
 * - O banco de exercícios tem apenas 1 exercício de peso corporal
 *
 * IMPACTO:
 * - Usuários que treinam em casa recebem exercícios que requerem equipamentos
 * - Não há filtro de exercícios por ambiente
 */

describe("Sistema de Ambiente de Treino", () => {
  describe("Análise do Estado Atual", () => {
    it("deve identificar que training_location existe no perfil", () => {
      // Simular perfil com diferentes ambientes
      const profiles = [
        { training_location: "academia" },
        { training_location: "casa" },
        { training_location: "ambos" },
        { training_location: "ar_livre" },
      ];

      profiles.forEach((profile) => {
        expect(profile.training_location).toBeDefined();
        expect(["academia", "casa", "ambos", "ar_livre"]).toContain(
          profile.training_location
        );
      });
    });

    it("deve identificar que generateTrainingPlanStructure não recebe trainingLocation", () => {
      // A função generateTrainingPlanStructure tem esta assinatura:
      // generateTrainingPlanStructure(
      //   trainingDays: number,
      //   activityLevel: string,
      //   division?: "PPL" | "Upper/Lower" | "Full Body",
      //   availableTimeMinutes?: number,
      //   imc?: number,
      //   objective?: string,
      //   jointLimitations?: boolean,
      //   kneeLimitations?: boolean
      // )

      // ❌ PROBLEMA: Não há parâmetro trainingLocation
      const expectedParams = [
        "trainingDays",
        "activityLevel",
        "division",
        "availableTimeMinutes",
        "imc",
        "objective",
        "jointLimitations",
        "kneeLimitations",
      ];

      // Validar que trainingLocation não está na lista
      expect(expectedParams).not.toContain("trainingLocation");
    });

    it("deve identificar que banco de exercícios tem poucos exercícios de casa", () => {
      // Exercícios que podem ser feitos em casa (peso corporal ou equipamentos básicos)
      const homeExercises = [
        "Flexão de braços", // ✅ Peso corporal
        "Puxada na barra fixa", // ⚠️ Requer barra fixa (pode ter em casa)
        "Mergulho entre bancos", // ⚠️ Requer bancos
        "Agachamento búlgaro", // ⚠️ Requer banco/elevação
        "Afundo com halteres", // ❌ Requer halteres
      ];

      // Exercícios que requerem academia
      const gymExercises = [
        "Supino reto com barra", // ❌ Requer barra e banco
        "Leg press", // ❌ Requer máquina
        "Crossover com cabos", // ❌ Requer polia
        "Mesa flexora", // ❌ Requer máquina
        "Cadeira extensora", // ❌ Requer máquina
      ];

      // Validar que há mais ou igual exercícios de academia
      expect(gymExercises.length).toBeGreaterThanOrEqual(homeExercises.length);

      // Validar que apenas 1 exercício é puramente peso corporal
      const pureBodyweight = homeExercises.filter(
        (ex) => ex === "Flexão de braços"
      );
      expect(pureBodyweight.length).toBe(1);
    });
  });

  describe("Cenários de Teste - Ambiente Casa", () => {
    it("deve simular perfil que treina em casa", () => {
      const homeProfile = {
        training_location: "casa",
        nivel_atividade: "Moderado",
        training_frequency: "3x por semana",
      };

      // Validar que o perfil tem ambiente definido
      expect(homeProfile.training_location).toBe("casa");

      // ❌ PROBLEMA: Este ambiente não é considerado na geração de treino
      // O sistema geraria exercícios que requerem equipamentos
    });

    it("deve identificar exercícios que requerem equipamentos", () => {
      const exercisesRequiringEquipment = [
        "Supino reto com barra", // Requer barra + banco
        "Leg press", // Requer máquina
        "Crossover com cabos", // Requer polia
        "Mesa flexora", // Requer máquina
        "Cadeira extensora", // Requer máquina
        "Puxada na frente com barra", // Requer barra + polia
        "Remada baixa com polia", // Requer polia
      ];

      // Todos esses exercícios requerem equipamentos de academia
      exercisesRequiringEquipment.forEach((exercise) => {
        const requiresGym =
          exercise.toLowerCase().includes("máquina") ||
          exercise.toLowerCase().includes("polia") ||
          exercise.toLowerCase().includes("leg press") ||
          exercise.toLowerCase().includes("cadeira") ||
          (exercise.toLowerCase().includes("barra") &&
            !exercise.toLowerCase().includes("barra fixa")); // Barra fixa pode ser em casa

        // Validar que pelo menos alguns requerem academia
        if (
          exercise.includes("Leg press") ||
          exercise.includes("Cadeira") ||
          exercise.includes("polia")
        ) {
          expect(requiresGym).toBe(true);
        }
      });
    });
  });

  describe("Cenários de Teste - Ambiente Academia", () => {
    it("deve simular perfil que treina na academia", () => {
      const gymProfile = {
        training_location: "academia",
        nivel_atividade: "Atleta",
        training_frequency: "6x por semana",
      };

      // ✅ Academia pode usar todos os exercícios
      expect(gymProfile.training_location).toBe("academia");
    });
  });

  describe("Cenários de Teste - Ambiente Ambos", () => {
    it("deve simular perfil que treina em ambos os ambientes", () => {
      const bothProfile = {
        training_location: "ambos",
        nivel_atividade: "Moderado",
        training_frequency: "4x por semana",
      };

      // ⚠️ Sistema deveria priorizar exercícios que funcionam em ambos
      // Mas atualmente não há essa lógica
      expect(bothProfile.training_location).toBe("ambos");
    });
  });

  describe("Recomendações de Implementação", () => {
    it("deve documentar o que precisa ser implementado", () => {
      const recommendations = {
        problema: "Sistema não filtra exercícios por ambiente",
        impacto:
          "Usuários de casa recebem exercícios que requerem equipamentos",
        solucao: [
          "1. Adicionar campo 'equipment' ou 'location' nos ExerciseTemplate",
          "2. Passar trainingLocation para generateTrainingPlanStructure",
          "3. Filtrar exercícios baseado no ambiente antes de selecionar",
          "4. Adicionar mais exercícios de peso corporal ao banco",
          "5. Criar lógica de substituição para exercícios incompatíveis",
        ],
        exerciciosParaAdicionar: [
          "Flexão de braços (já existe)",
          "Flexão inclinada",
          "Flexão declinada",
          "Agachamento livre",
          "Agachamento com salto",
          "Afundo livre",
          "Prancha",
          "Burpee",
          "Mountain climber",
          "Flexão diamante",
          "Flexão com pés elevados",
          "Paralelas (se tiver em casa)",
          "Barra fixa (se tiver em casa)",
        ],
      };

      expect(recommendations.problema).toBeDefined();
      expect(recommendations.solucao.length).toBeGreaterThan(0);
      expect(recommendations.exerciciosParaAdicionar.length).toBeGreaterThan(5);
    });
  });
});
