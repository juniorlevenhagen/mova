/**
 * Banco de dados de exercícios para geração determinística
 */

import type { Exercise } from "@/lib/validators/trainingPlanValidator";

export interface ExerciseTemplate
  extends Omit<Exercise, "sets" | "reps" | "rest"> {
  isCompound: boolean;
  isLarge: boolean; // Grupo grande (peito, costas, quadríceps, posterior)
  motorPattern: string;
  isHighAxialLoad?: boolean; // 🚨 Alta compressão axial (Agachamento Livre, Stiff, Sumô)
}

export const EXERCISE_DATABASE: Record<string, ExerciseTemplate[]> = {
  peito: [
    {
      name: "Supino Reto com Barra",
      primaryMuscle: "Peito",
      secondaryMuscles: ["Tríceps", "Ombro"],
      isCompound: true,
      isLarge: true,
      motorPattern: "horizontal_push",
      notes: "Mantenha as escápulas em depressão e os pés firmes no chão.",
    },
    {
      name: "Supino Inclinado com Halteres",
      primaryMuscle: "Peito",
      secondaryMuscles: ["Tríceps", "Ombro"],
      isCompound: true,
      isLarge: true,
      motorPattern: "horizontal_push",
      notes: "Foco na parte superior do peito. Não bata os halteres no topo.",
    },
    {
      name: "Supino Reto com Halteres",
      primaryMuscle: "Peito",
      secondaryMuscles: ["Tríceps", "Ombro"],
      isCompound: true,
      isLarge: true,
      motorPattern: "horizontal_push",
      notes: "Maior amplitude que a barra. Controle o movimento.",
    },
    {
      name: "Crucifixo Reto com Halteres",
      primaryMuscle: "Peito",
      secondaryMuscles: ["Ombro"],
      isCompound: false,
      isLarge: true,
      motorPattern: "horizontal_push",
      notes:
        "Sinta o alongamento das fibras do peitoral. Cotovelos levemente flexionados.",
    },
    {
      name: "Crossover na Polia Média",
      primaryMuscle: "Peito",
      secondaryMuscles: ["Ombro"],
      isCompound: false,
      isLarge: true,
      motorPattern: "horizontal_push",
      notes: "Pico de contração no final do movimento. Controle a volta.",
    },
  ],
  costas: [
    {
      name: "Puxada Frente na Polia Alta",
      primaryMuscle: "Costas",
      secondaryMuscles: ["Bíceps", "Ombro"],
      isCompound: true,
      isLarge: true,
      motorPattern: "vertical_pull",
      notes:
        "Traga a barra em direção ao peito, não ao pescoço. Estenda bem os braços.",
    },
    {
      name: "Remada Curvada com Barra",
      primaryMuscle: "Costas",
      secondaryMuscles: ["Bíceps", "Ombro"],
      isCompound: true,
      isLarge: true,
      motorPattern: "horizontal_pull",
      isHighAxialLoad: true,
      notes: "Mantenha a coluna neutra e puxe a barra em direção ao umbigo.",
    },
    {
      name: "Puxada com Triângulo",
      primaryMuscle: "Costas",
      secondaryMuscles: ["Bíceps", "Antebraço"],
      isCompound: true,
      isLarge: true,
      motorPattern: "vertical_pull",
      notes: "Pegada neutra. Foque em puxar com os cotovelos.",
    },
    {
      name: "Remada Unilateral com Halter (Serrote)",
      primaryMuscle: "Costas",
      secondaryMuscles: ["Bíceps", "Ombro"],
      isCompound: true,
      isLarge: true,
      motorPattern: "horizontal_pull",
      notes: "Foque em levar o cotovelo para trás. Evite girar o tronco.",
    },
    {
      name: "Remada Baixa na Polia",
      primaryMuscle: "Costas",
      secondaryMuscles: ["Bíceps"],
      isCompound: true,
      isLarge: true,
      motorPattern: "horizontal_pull",
      notes: "Mantenha o tronco estável. Puxe em direção ao abdome inferior.",
    },
    {
      name: "Pulldown com Corda",
      primaryMuscle: "Costas",
      secondaryMuscles: ["Tríceps"],
      isCompound: false,
      isLarge: true,
      motorPattern: "vertical_pull",
      notes: "Mantenha os braços quase esticados. Foco no latíssimo do dorso.",
    },
  ],
  ombro: [
    {
      name: "Desenvolvimento com Halteres",
      primaryMuscle: "Ombro",
      secondaryMuscles: ["Tríceps"],
      isCompound: true,
      isLarge: false,
      motorPattern: "vertical_push",
      notes:
        "Suba os halteres acima da cabeça sem esticar totalmente os cotovelos.",
    },
    {
      name: "Elevação Lateral com Halteres",
      primaryMuscle: "Ombro",
      secondaryMuscles: [],
      isCompound: false,
      isLarge: false,
      motorPattern: "overhead_movement",
      notes:
        "Suba os braços até a altura dos ombros. Mantenha os ombros relaxados.",
    },
    {
      name: "Crucifixo Inverso com Halteres",
      primaryMuscle: "Ombro",
      secondaryMuscles: ["Costas"],
      isCompound: false,
      isLarge: false,
      motorPattern: "horizontal_pull",
      notes: "Foco no deltoide posterior. Tronco inclinado à frente.",
    },
    {
      name: "Elevação Frontal com Halteres",
      primaryMuscle: "Ombro",
      secondaryMuscles: [],
      isCompound: false,
      isLarge: false,
      motorPattern: "vertical_push",
      notes: "Foco no deltoide anterior. Evite usar o impulso do corpo.",
    },
  ],
  quadriceps: [
    {
      name: "Agachamento Livre com Barra",
      primaryMuscle: "Quadríceps",
      secondaryMuscles: ["Glúteos", "Posterior"],
      isCompound: true,
      isLarge: true,
      motorPattern: "squat",
      isHighAxialLoad: true,
      notes:
        "Mantenha o calcanhar firme e a coluna alinhada durante todo o movimento.",
    },
    {
      name: "Leg Press 45 Graus",
      primaryMuscle: "Quadríceps",
      secondaryMuscles: ["Glúteos", "Posterior"],
      isCompound: true,
      isLarge: true,
      motorPattern: "squat",
      isHighAxialLoad: false,
      notes: "Não estenda totalmente os joelhos no topo para manter a tensão.",
    },
    {
      name: "Afundo com Halteres",
      primaryMuscle: "Quadríceps",
      secondaryMuscles: ["Glúteos", "Posterior"],
      isCompound: true,
      isLarge: true,
      motorPattern: "squat",
      isHighAxialLoad: false,
      notes: "Mantenha o tronco vertical e o joelho de trás em direção ao chão.",
    },
    {
      name: "Cadeira Extensora",
      primaryMuscle: "Quadríceps",
      secondaryMuscles: [],
      isCompound: false,
      isLarge: true,
      motorPattern: "isolation_quad",
      notes: "Controle bem a descida. Tente segurar 1 segundo no topo.",
    },
  ],
  posterior: [
    {
      name: "Mesa Flexora",
      primaryMuscle: "Posterior de coxa",
      secondaryMuscles: ["Glúteos"],
      isCompound: false,
      isLarge: true,
      motorPattern: "isolation_posterior",
      notes: "Mantenha o quadril colado no banco. Movimento controlado.",
    },
    {
      name: "Stiff com Halteres",
      primaryMuscle: "Posterior de coxa",
      secondaryMuscles: ["Glúteos", "Lombar"],
      isCompound: true,
      isLarge: true,
      motorPattern: "hinge",
      isHighAxialLoad: true,
      notes: "Desça os halteres rente às pernas até sentir o alongamento.",
    },
    {
      name: "Levantamento Terra Romeno (RDL)",
      primaryMuscle: "Posterior de coxa",
      secondaryMuscles: ["Glúteos", "Costas"],
      isCompound: true,
      isLarge: true,
      motorPattern: "hinge",
      isHighAxialLoad: true,
      notes: "Foque em levar o quadril para trás. Joelhos levemente destravados.",
    },
    {
      name: "Cadeira Flexora",
      primaryMuscle: "Posterior de coxa",
      secondaryMuscles: ["Glúteos"],
      isCompound: false,
      isLarge: true,
      motorPattern: "isolation_posterior",
      notes: "Ajuste o encosto para que o joelho alinhe com o eixo da máquina.",
    },
  ],
  gluteos: [
    {
      name: "Elevação Pélvica com Barra",
      primaryMuscle: "Glúteos",
      secondaryMuscles: ["Posterior"],
      isCompound: true,
      isLarge: true,
      motorPattern: "hinge",
      isHighAxialLoad: false,
      notes: "Contraia bem os glúteos no topo. Pés na largura do quadril.",
    },
    {
      name: "Agachamento Sumô com Halter",
      primaryMuscle: "Glúteos",
      secondaryMuscles: ["Quadríceps", "Adutores"],
      isCompound: true,
      isLarge: true,
      motorPattern: "squat",
      isHighAxialLoad: true,
      notes: "Pés afastados e pontas para fora. Coluna reta.",
    },
    {
      name: "Cadeira Abdutora",
      primaryMuscle: "Glúteos",
      secondaryMuscles: [],
      isCompound: false,
      isLarge: false,
      motorPattern: "isolation_glute",
      notes: "Foco no glúteo médio. Movimento controlado.",
    },
  ],
  triceps: [
    {
      name: "Tríceps Pulley com Barra Reta",
      primaryMuscle: "Tríceps",
      secondaryMuscles: [],
      isCompound: false,
      isLarge: false,
      motorPattern: "isolation_push",
      notes: "Cotovelos fixos ao lado do corpo. Estenda totalmente os braços.",
    },
    {
      name: "Tríceps Corda",
      primaryMuscle: "Tríceps",
      secondaryMuscles: [],
      isCompound: false,
      isLarge: false,
      motorPattern: "isolation_push",
      notes: "Abra a corda no final do movimento para maior contração.",
    },
  ],
  biceps: [
    {
      name: "Rosca Direta com Barra W",
      primaryMuscle: "Bíceps",
      secondaryMuscles: ["Antebraço"],
      isCompound: false,
      isLarge: false,
      motorPattern: "isolation_pull",
      notes: "Evite balançar o corpo. Controle a descida do peso.",
    },
    {
      name: "Rosca Martelo com Halteres",
      primaryMuscle: "Bíceps",
      secondaryMuscles: ["Antebraço"],
      isCompound: false,
      isLarge: false,
      motorPattern: "isolation_pull",
      notes: "Pegada neutra (palmas voltadas para o corpo).",
    },
  ],
  panturrilhas: [
    {
      name: "Gêmeos em Pé (Panturrilha)",
      primaryMuscle: "Panturrilhas",
      secondaryMuscles: [],
      isCompound: false,
      isLarge: false,
      motorPattern: "calf_raise",
      notes: "Alongue bem na descida e contraia no topo.",
    },
    {
      name: "Gêmeos Sentado",
      primaryMuscle: "Panturrilhas",
      secondaryMuscles: [],
      isCompound: false,
      isLarge: false,
      motorPattern: "calf_raise",
      notes: "Movimento lento e controlado. Máxima amplitude.",
    },
  ],
};

export const DAY_STRUCTURES: Record<string, string[]> = {
  Push: ["peito", "ombro", "triceps", "peito", "ombro", "triceps"],
  Pull: ["costas", "ombro", "biceps", "costas", "biceps"],
  Legs: ["quadriceps", "posterior", "panturrilhas", "quadriceps", "gluteos"],
  // Divisão Upper/Lower Especializada (A/B)
  "Upper A": [
    "peito", // Supino Reto (Horizontal)
    "costas", // Remada (Horizontal)
    "ombro", // Elevação Lateral
    "triceps",
    "biceps",
    "peito", // Crucifixo/Crossover
    "costas", // Serrote
    "ombro", // Elevação Frontal
    "triceps", // Corda
  ],
  "Upper B": [
    "costas", // Puxada (Vertical)
    "ombro", // Desenvolvimento (Vertical)
    "peito", // Inclinado
    "triceps",
    "biceps",
    "costas", // Pulldown
    "ombro", // Crucifixo Inverso
    "peito", // Halteres
    "biceps", // Martelo
  ],
  "Lower A": [
    "quadriceps", // Agachamento (Foco Quad)
    "posterior", // Mesa Flexora (Manutenção)
    "panturrilhas",
    "quadriceps", // Leg Press (Foco Quad)
    "gluteos", // Elevação Pélvica
    "quadriceps", // Cadeira Extensora
  ],
  "Lower B": [
    "posterior", // RDL/Stiff (Foco Posterior)
    "quadriceps", // Afundo (Unilateral)
    "gluteos", // Sumô
    "posterior", // Cadeira Flexora
    "panturrilhas",
    "gluteos", // Abdutora
  ],
  "Full Body": [
    "peito",
    "costas",
    "quadriceps",
    "posterior",
    "ombro",
    "triceps",
    "biceps",
    "panturrilhas",
  ],
};
