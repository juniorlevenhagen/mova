import { describe, it } from "vitest";

/**
 * Script para listar TODOS os exercícios disponíveis
 * organizados por ambiente de treino
 */

// Importar o banco de exercícios diretamente
// Como não podemos importar diretamente, vamos recriar a estrutura baseada no código
const EXERCISE_DATABASE: Record<
  string,
  Array<{
    name: string;
    primaryMuscle: string;
    equipment?: "gym" | "home" | "both" | "outdoor";
  }>
> = {
  peitoral: [
    {
      name: "Supino reto com barra",
      primaryMuscle: "peitoral",
      equipment: "gym",
    },
    {
      name: "Supino inclinado com halteres",
      primaryMuscle: "peitoral",
      equipment: "both",
    },
    {
      name: "Supino declinado com barra",
      primaryMuscle: "peitoral",
      equipment: "gym",
    },
    {
      name: "Supino com halteres",
      primaryMuscle: "peitoral",
      equipment: "both",
    },
    {
      name: "Crucifixo com halteres",
      primaryMuscle: "peitoral",
      equipment: "both",
    },
    {
      name: "Crossover com cabos",
      primaryMuscle: "peitoral",
      equipment: "gym",
    },
    {
      name: "Supino inclinado com barra",
      primaryMuscle: "peitoral",
      equipment: "gym",
    },
    { name: "Flexão de braços", primaryMuscle: "peitoral", equipment: "home" },
    { name: "Flexão inclinada", primaryMuscle: "peitoral", equipment: "home" },
    { name: "Flexão declinada", primaryMuscle: "peitoral", equipment: "home" },
    { name: "Flexão diamante", primaryMuscle: "peitoral", equipment: "home" },
    {
      name: "Flexão com pés elevados",
      primaryMuscle: "peitoral",
      equipment: "home",
    },
  ],
  costas: [
    {
      name: "Puxada na barra fixa",
      primaryMuscle: "costas",
      equipment: "both",
    },
    {
      name: "Barra fixa assistida",
      primaryMuscle: "costas",
      equipment: "both",
    },
    { name: "Remada invertida", primaryMuscle: "costas", equipment: "home" },
    { name: "Superman", primaryMuscle: "costas", equipment: "home" },
    {
      name: "Remada curvada com barra",
      primaryMuscle: "costas",
      equipment: "gym",
    },
    {
      name: "Remada unilateral com halteres",
      primaryMuscle: "costas",
      equipment: "both",
    },
    {
      name: "Puxada na frente com barra",
      primaryMuscle: "costas",
      equipment: "gym",
    },
    {
      name: "Remada baixa com polia",
      primaryMuscle: "costas",
      equipment: "gym",
    },
    { name: "Puxada aberta", primaryMuscle: "costas", equipment: "gym" },
    {
      name: "Puxada com pegada supinada",
      primaryMuscle: "costas",
      equipment: "gym",
    },
  ],
  triceps: [
    {
      name: "Tríceps testa com barra EZ",
      primaryMuscle: "triceps",
      equipment: "gym",
    },
    {
      name: "Tríceps na polia alta",
      primaryMuscle: "triceps",
      equipment: "gym",
    },
    { name: "Tríceps francês", primaryMuscle: "triceps", equipment: "both" },
    {
      name: "Mergulho entre bancos",
      primaryMuscle: "triceps",
      equipment: "both",
    },
    {
      name: "Tríceps coice com halteres",
      primaryMuscle: "triceps",
      equipment: "both",
    },
    {
      name: "Flexão de braços fechada",
      primaryMuscle: "triceps",
      equipment: "home",
    },
    {
      name: "Extensão de tríceps no chão",
      primaryMuscle: "triceps",
      equipment: "home",
    },
  ],
  biceps: [
    {
      name: "Rosca direta com barra",
      primaryMuscle: "biceps",
      equipment: "gym",
    },
    {
      name: "Rosca martelo com halteres",
      primaryMuscle: "biceps",
      equipment: "both",
    },
    { name: "Rosca concentrada", primaryMuscle: "biceps", equipment: "both" },
    {
      name: "Rosca alternada com halteres",
      primaryMuscle: "biceps",
      equipment: "both",
    },
    { name: "Rosca com barra W", primaryMuscle: "biceps", equipment: "gym" },
    {
      name: "Rosca isométrica na parede",
      primaryMuscle: "biceps",
      equipment: "home",
    },
  ],
  quadriceps: [
    {
      name: "Agachamento com barra",
      primaryMuscle: "quadriceps",
      equipment: "gym",
    },
    { name: "Leg press", primaryMuscle: "quadriceps", equipment: "gym" },
    {
      name: "Cadeira extensora",
      primaryMuscle: "quadriceps",
      equipment: "gym",
    },
    {
      name: "Agachamento frontal",
      primaryMuscle: "quadriceps",
      equipment: "gym",
    },
    {
      name: "Afundo com halteres",
      primaryMuscle: "quadriceps",
      equipment: "both",
    },
    {
      name: "Agachamento búlgaro",
      primaryMuscle: "quadriceps",
      equipment: "both",
    },
    { name: "Hack squat", primaryMuscle: "quadriceps", equipment: "gym" },
    {
      name: "Agachamento livre",
      primaryMuscle: "quadriceps",
      equipment: "home",
    },
    {
      name: "Agachamento com salto",
      primaryMuscle: "quadriceps",
      equipment: "home",
    },
    { name: "Afundo livre", primaryMuscle: "quadriceps", equipment: "home" },
    {
      name: "Agachamento sumô",
      primaryMuscle: "quadriceps",
      equipment: "home",
    },
  ],
  "posterior de coxa": [
    {
      name: "Mesa flexora",
      primaryMuscle: "posterior de coxa",
      equipment: "gym",
    },
    {
      name: "Stiff com barra",
      primaryMuscle: "posterior de coxa",
      equipment: "gym",
    },
    {
      name: "Leg curl deitado",
      primaryMuscle: "posterior de coxa",
      equipment: "gym",
    },
    {
      name: "Leg curl sentado",
      primaryMuscle: "posterior de coxa",
      equipment: "gym",
    },
    {
      name: "Good morning",
      primaryMuscle: "posterior de coxa",
      equipment: "both",
    },
    {
      name: "RDL (Romanian Deadlift)",
      primaryMuscle: "posterior de coxa",
      equipment: "gym",
    },
    {
      name: "Stiff com peso corporal",
      primaryMuscle: "posterior de coxa",
      equipment: "home",
    },
    {
      name: "Ponte de glúteo",
      primaryMuscle: "posterior de coxa",
      equipment: "home",
    },
  ],
  panturrilhas: [
    {
      name: "Elevação de panturrilha em pé",
      primaryMuscle: "panturrilhas",
      equipment: "both",
    },
    {
      name: "Elevação de panturrilha sentado",
      primaryMuscle: "panturrilhas",
      equipment: "both",
    },
    {
      name: "Elevação de panturrilha no leg press",
      primaryMuscle: "panturrilhas",
      equipment: "gym",
    },
    {
      name: "Elevação de panturrilha unipodal",
      primaryMuscle: "panturrilhas",
      equipment: "home",
    },
  ],
  ombros: [
    {
      name: "Desenvolvimento militar com barra",
      primaryMuscle: "ombros",
      equipment: "gym",
    },
    {
      name: "Desenvolvimento com halteres",
      primaryMuscle: "ombros",
      equipment: "both",
    },
    {
      name: "Elevação lateral com halteres",
      primaryMuscle: "ombros",
      equipment: "both",
    },
    {
      name: "Elevação frontal com halteres",
      primaryMuscle: "ombros",
      equipment: "both",
    },
    { name: "Face pull", primaryMuscle: "ombros", equipment: "gym" },
    {
      name: "Elevação lateral invertida",
      primaryMuscle: "ombros",
      equipment: "both",
    },
    { name: "Flexão pike", primaryMuscle: "ombros", equipment: "home" },
    {
      name: "Prancha com elevação de braço",
      primaryMuscle: "ombros",
      equipment: "home",
    },
  ],
  trapezio: [
    { name: "Remada alta", primaryMuscle: "trapezio", equipment: "gym" },
    {
      name: "Encolhimento com halteres",
      primaryMuscle: "trapezio",
      equipment: "both",
    },
    {
      name: "Encolhimento com barra",
      primaryMuscle: "trapezio",
      equipment: "gym",
    },
  ],
};

describe("Listagem Completa de Exercícios por Ambiente", () => {
  it("deve listar todos os exercícios organizados por ambiente", () => {
    // Organizar por ambiente
    const byEnvironment: Record<string, Record<string, string[]>> = {
      academia: {},
      casa: {},
      ambos: {},
      ar_livre: {},
    };

    // Mapear exercícios para ambientes
    // IMPORTANTE: A lógica segue o comportamento real do sistema
    Object.entries(EXERCISE_DATABASE).forEach(([muscle, exercises]) => {
      exercises.forEach((exercise) => {
        const equipment = exercise.equipment || "gym"; // Default para gym se não especificado

        // Academia: TODOS os exercícios (gym + both + home + outdoor)
        // O sistema permite todos quando o ambiente é "academia"
        if (!byEnvironment.academia[muscle]) {
          byEnvironment.academia[muscle] = [];
        }
        byEnvironment.academia[muscle].push(exercise.name);

        // Casa: apenas "home" e "both" (sem máquinas de academia)
        if (equipment === "home" || equipment === "both") {
          if (!byEnvironment.casa[muscle]) {
            byEnvironment.casa[muscle] = [];
          }
          byEnvironment.casa[muscle].push(exercise.name);
        }

        // Ambos: TODOS os exercícios (prioriza "both" e "home", mas permite todos)
        // O sistema permite todos quando o ambiente é "ambos"
        if (!byEnvironment.ambos[muscle]) {
          byEnvironment.ambos[muscle] = [];
        }
        byEnvironment.ambos[muscle].push(exercise.name);

        // Ar livre: "home", "both" e "outdoor" (sem máquinas de academia)
        if (
          equipment === "home" ||
          equipment === "both" ||
          equipment === "outdoor"
        ) {
          if (!byEnvironment.ar_livre[muscle]) {
            byEnvironment.ar_livre[muscle] = [];
          }
          byEnvironment.ar_livre[muscle].push(exercise.name);
        }
      });
    });

    // Exibir resultados
    console.log("\n" + "=".repeat(80));
    console.log("📋 LISTAGEM COMPLETA DE EXERCÍCIOS POR AMBIENTE");
    console.log("=".repeat(80) + "\n");

    Object.entries(byEnvironment).forEach(([env, muscles]) => {
      console.log(`\n🏋️ AMBIENTE: ${env.toUpperCase()}`);
      console.log("-".repeat(80));

      let totalExercises = 0;
      Object.entries(muscles).forEach(([muscle, exercises]) => {
        console.log(
          `\n  📍 ${muscle.toUpperCase()} (${exercises.length} exercícios):`
        );
        exercises.forEach((exercise) => {
          console.log(`    • ${exercise}`);
        });
        totalExercises += exercises.length;
      });

      console.log(`\n  📊 Total: ${totalExercises} exercícios disponíveis`);
    });

    // Resumo comparativo
    console.log("\n" + "=".repeat(80));
    console.log("📊 RESUMO COMPARATIVO");
    console.log("=".repeat(80) + "\n");

    Object.entries(byEnvironment).forEach(([env, muscles]) => {
      const total = Object.values(muscles).reduce(
        (sum, ex) => sum + ex.length,
        0
      );
      console.log(
        `  ${env.padEnd(15)}: ${total.toString().padStart(3)} exercícios`
      );
    });

    // Estatísticas por grupo muscular
    console.log("\n" + "=".repeat(80));
    console.log("📈 ESTATÍSTICAS POR GRUPO MUSCULAR");
    console.log("=".repeat(80) + "\n");

    const allMuscles = new Set(
      Object.values(EXERCISE_DATABASE).flatMap((ex) =>
        ex.map((e) => e.primaryMuscle)
      )
    );

    allMuscles.forEach((muscle) => {
      const academiaCount = byEnvironment.academia[muscle]?.length || 0;
      const casaCount = byEnvironment.casa[muscle]?.length || 0;
      const ambosCount = byEnvironment.ambos[muscle]?.length || 0;
      const arLivreCount = byEnvironment.ar_livre[muscle]?.length || 0;

      // Contar por tipo de equipamento no banco original
      const allExercises = EXERCISE_DATABASE[muscle] || [];
      const gymOnly = allExercises.filter((e) => e.equipment === "gym").length;
      const homeOnly = allExercises.filter(
        (e) => e.equipment === "home"
      ).length;
      const bothOnly = allExercises.filter(
        (e) => e.equipment === "both"
      ).length;
      const total = allExercises.length;

      console.log(
        `  ${muscle.padEnd(20)}: Academia=${academiaCount.toString().padStart(2)} | Casa=${casaCount.toString().padStart(2)} | Ambos=${ambosCount.toString().padStart(2)} | Ar Livre=${arLivreCount.toString().padStart(2)} | [Gym=${gymOnly} Home=${homeOnly} Both=${bothOnly} Total=${total}]`
      );
    });

    console.log("\n" + "=".repeat(80) + "\n");
  });
});
