import { describe, it, expect } from "vitest";
import { EXERCISE_DATABASE } from "@/lib/generators/trainingPlanGenerator";

describe("Análise de Nomes dos Exercícios em Português", () => {
  it("deve listar todos os nomes de exercícios e verificar disponibilidade", () => {
    console.log("\n" + "=".repeat(80));
    console.log("📋 ANÁLISE DE NOMES DOS EXERCÍCIOS EM PORTUGUÊS");
    console.log("=".repeat(80) + "\n");

    const allExercises: Array<{
      name: string;
      muscle: string;
      equipment: string;
      role?: string;
      pattern?: string;
    }> = [];

    // Coletar todos os exercícios
    Object.entries(EXERCISE_DATABASE).forEach(([muscleGroup, exercises]) => {
      exercises.forEach((ex) => {
        allExercises.push({
          name: ex.name,
          muscle: muscleGroup,
          equipment: ex.equipment || "não especificado",
          role: ex.role,
          pattern: ex.pattern,
        });
      });
    });

    // Verificar duplicatas
    const nameCounts = new Map<string, number>();
    allExercises.forEach((ex) => {
      nameCounts.set(ex.name, (nameCounts.get(ex.name) || 0) + 1);
    });

    const duplicates = Array.from(nameCounts.entries())
      .filter(([_, count]) => count > 1)
      .map(([name, count]) => ({ name, count }));

    // Agrupar por grupo muscular
    const byMuscle = new Map<string, string[]>();
    allExercises.forEach((ex) => {
      if (!byMuscle.has(ex.muscle)) {
        byMuscle.set(ex.muscle, []);
      }
      byMuscle.get(ex.muscle)!.push(ex.name);
    });

    // Agrupar por equipamento
    const byEquipment = new Map<string, string[]>();
    allExercises.forEach((ex) => {
      const eq = ex.equipment;
      if (!byEquipment.has(eq)) {
        byEquipment.set(eq, []);
      }
      byEquipment.get(eq)!.push(ex.name);
    });

    // Estatísticas
    console.log("📊 ESTATÍSTICAS GERAIS");
    console.log("-".repeat(80));
    console.log(`  Total de exercícios: ${allExercises.length}`);
    console.log(`  Total de grupos musculares: ${byMuscle.size}`);
    console.log(
      `  Exercícios com metadados (role): ${allExercises.filter((ex) => ex.role).length}`
    );
    console.log(
      `  Exercícios com metadados (pattern): ${allExercises.filter((ex) => ex.pattern).length}`
    );
    console.log(`  Exercícios duplicados: ${duplicates.length}`);

    if (duplicates.length > 0) {
      console.log("\n⚠️  EXERCÍCIOS DUPLICADOS:");
      console.log("-".repeat(80));
      duplicates.forEach(({ name, count }) => {
        console.log(`  🔴 "${name}" aparece ${count} vezes`);
      });
    }

    console.log("\n" + "=".repeat(80));
    console.log("📂 EXERCÍCIOS POR GRUPO MUSCULAR");
    console.log("=".repeat(80) + "\n");

    Array.from(byMuscle.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .forEach(([muscle, exercises]) => {
        console.log(
          `\n${muscle.toUpperCase()} (${exercises.length} exercícios):`
        );
        console.log("-".repeat(80));
        exercises.forEach((name, index) => {
          const ex = allExercises.find(
            (e) => e.name === name && e.muscle === muscle
          );
          const roleEmoji =
            ex?.role === "structural"
              ? "🏗️"
              : ex?.role === "isolated"
                ? "🎯"
                : "❓";
          const patternInfo = ex?.pattern ? ` [${ex.pattern}]` : "";
          const equipmentInfo = ` (${ex?.equipment})`;
          console.log(
            `  ${(index + 1).toString().padStart(2, " ")}. ${roleEmoji} ${name}${patternInfo}${equipmentInfo}`
          );
        });
      });

    console.log("\n" + "=".repeat(80));
    console.log("🏋️ EXERCÍCIOS POR EQUIPAMENTO");
    console.log("=".repeat(80) + "\n");

    Array.from(byEquipment.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .forEach(([equipment, exercises]) => {
        console.log(
          `\n${equipment.toUpperCase()} (${exercises.length} exercícios):`
        );
        console.log("-".repeat(80));
        exercises.slice(0, 10).forEach((name, index) => {
          console.log(`  ${(index + 1).toString().padStart(2, " ")}. ${name}`);
        });
        if (exercises.length > 10) {
          console.log(`  ... e mais ${exercises.length - 10} exercícios`);
        }
      });

    console.log("\n" + "=".repeat(80));
    console.log("✅ EXERCÍCIOS COM METADADOS EXPLÍCITOS");
    console.log("=".repeat(80) + "\n");

    const withMetadata = allExercises.filter((ex) => ex.role && ex.pattern);
    const withoutMetadata = allExercises.filter(
      (ex) => !ex.role || !ex.pattern
    );

    console.log(
      `  Com role + pattern: ${withMetadata.length} (${((withMetadata.length / allExercises.length) * 100).toFixed(1)}%)`
    );
    console.log(
      `  Sem role ou pattern: ${withoutMetadata.length} (${((withoutMetadata.length / allExercises.length) * 100).toFixed(1)}%)`
    );

    if (withoutMetadata.length > 0) {
      console.log("\n  Exercícios sem metadados completos:");
      withoutMetadata.slice(0, 20).forEach((ex) => {
        const missing = [];
        if (!ex.role) missing.push("role");
        if (!ex.pattern) missing.push("pattern");
        console.log(
          `    - ${ex.name} (${ex.muscle}) - falta: ${missing.join(", ")}`
        );
      });
      if (withoutMetadata.length > 20) {
        console.log(`    ... e mais ${withoutMetadata.length - 20} exercícios`);
      }
    }

    console.log("\n" + "=".repeat(80));
    console.log("🔍 VERIFICAÇÃO DE CONSISTÊNCIA");
    console.log("=".repeat(80) + "\n");

    // Verificar se há exercícios sem equipment
    const withoutEquipment = allExercises.filter(
      (ex) => !ex.equipment || ex.equipment === "não especificado"
    );
    if (withoutEquipment.length > 0) {
      console.log(
        `⚠️  Exercícios sem equipamento definido: ${withoutEquipment.length}`
      );
      withoutEquipment.forEach((ex) => {
        console.log(`    - ${ex.name} (${ex.muscle})`);
      });
    } else {
      console.log("✅ Todos os exercícios têm equipamento definido");
    }

    // Verificar nomes muito similares
    const similarNames: Array<{
      name1: string;
      name2: string;
      similarity: number;
    }> = [];
    for (let i = 0; i < allExercises.length; i++) {
      for (let j = i + 1; j < allExercises.length; j++) {
        const name1 = allExercises[i].name.toLowerCase();
        const name2 = allExercises[j].name.toLowerCase();
        const similarity = calculateSimilarity(name1, name2);
        if (similarity > 0.8 && name1 !== name2) {
          similarNames.push({
            name1: allExercises[i].name,
            name2: allExercises[j].name,
            similarity,
          });
        }
      }
    }

    if (similarNames.length > 0) {
      console.log(
        `\n⚠️  Nomes muito similares (possíveis duplicatas): ${similarNames.length}`
      );
      similarNames.slice(0, 10).forEach(({ name1, name2, similarity }) => {
        console.log(
          `    - "${name1}" vs "${name2}" (${(similarity * 100).toFixed(0)}% similar)`
        );
      });
    } else {
      console.log("✅ Nenhum nome muito similar encontrado");
    }

    console.log("\n" + "=".repeat(80) + "\n");

    // Validações
    expect(allExercises.length).toBeGreaterThan(0);
    // Nota: Pode haver duplicatas se o mesmo exercício aparecer em grupos diferentes
    // (ex: "Ponte de glúteo" em posterior de coxa e glúteos)
    if (duplicates.length > 0) {
      console.log(
        "\n⚠️  ATENÇÃO: Duplicatas encontradas - verificar se são intencionais"
      );
    }
  });

  function calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    if (longer.length === 0) return 1.0;
    const distance = levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  function levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[str2.length][str1.length];
  }
});
