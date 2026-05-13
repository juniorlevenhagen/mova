import { generateTrainingPlanStructure } from "../generators/trainingPlanGenerator";
import { getTrainingProfile, normalizeUserLevel } from "../../lib/profiles/trainingProfiles";

const profilesToTest = [
  { level: "Sedentario", label: "Sedentário Base", time: 30 },
  { level: "Sedentario (Idoso)", label: "Sedentário + Idoso", time: 45 },
  { level: "Moderado", label: "Moderado Base", time: 60 },
  { level: "Moderado (Iniciante)", label: "Moderado + Iniciante", time: 45 },
  { level: "Atleta", label: "Atleta Base", time: 75 },
  { level: "Atleta (Limitado)", label: "Atleta + Limitação", time: 60 },
  { level: "AltoRendimento", label: "Alto Rendimento", time: 90 }
];

async function runExhaustiveTest() {
  console.log("================================================================");
  console.log("RELATÓRIO DE VARREDURA EXAUSTIVA DE PERFIS");
  console.log("================================================================");
  console.log("| Perfil | Exercícios/Dia | Séries/Ex | Tempo Est. | Variedade A/B |");
  console.log("|--------|----------------|-----------|------------|---------------|");

  for (const p of profilesToTest) {
    const plan = generateTrainingPlanStructure(
      4, // Frequência 4x (Upper/Lower)
      p.level,
      "Upper/Lower",
      p.time,
      24.0, // IMC Normal
      "Condicionamento",
      p.level.includes("Limitado"), // hasShoulderRestriction
      false, // hasKneeRestriction
      "Academia",
      p.level.includes("Idoso") ? 65 : 30,
      "Masculino"
    );

    const dayA = plan.weeklySchedule.find(d => d.day.includes("(A)"));
    const dayB = plan.weeklySchedule.find(d => d.day.includes("(B)"));
    
    const avgSets = dayA ? (dayA.exercises.reduce((acc, ex) => acc + ex.sets, 0) / dayA.exercises.length).toFixed(1) : 0;
    
    // Calcular variedade (exercícios diferentes entre A e B)
    const namesA = new Set(dayA?.exercises.map(e => e.name));
    const namesB = new Set(dayB?.exercises.map(e => e.name));
    const intersection = [...namesA].filter(name => namesB.has(name));
    const varietyScore = dayA ? `${namesA.size - intersection.length}/${namesA.size}` : "N/A";

    // Calcular tempo estimado (aproximado usando a lógica do gerador)
    const estimatedTime = dayA ? calculateTime(dayA.exercises) : 0;

    console.log(`| ${p.label.padEnd(18)} | ${dayA?.exercises.length.toString().padEnd(14)} | ${avgSets.toString().padEnd(9)} | ${estimatedTime.toString().padEnd(10)} | ${varietyScore.padEnd(13)} |`);
  }
  console.log("================================================================");
}

function calculateTime(exercises: any[]): number {
  let totalSeconds = 0;
  exercises.forEach((ex) => {
    const restSeconds = parseInt(ex.rest) || 60;
    totalSeconds += ex.sets * (45 + restSeconds);
  });
  totalSeconds += exercises.length * 120;
  return Math.ceil(totalSeconds / 60);
}

runExhaustiveTest();
