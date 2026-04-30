import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { generateTrainingPlanStructure } from "../generators/trainingPlanGenerator";

type PerfProfile = {
  name: string;
  args: [
    trainingDays: number,
    activityLevel: string,
    division?: "PPL" | "Upper/Lower" | "Full Body",
    availableTimeMinutes?: number,
    imc?: number,
    objective?: string,
    jointLimitations?: boolean,
    kneeLimitations?: boolean,
    trainingLocation?: "academia" | "casa" | "ambos" | "ar_livre",
    age?: number,
    gender?: string,
  ];
  maxMs: number;
};

const PERF_PROFILES: PerfProfile[] = [
  {
    name: "sedentario-ppl-5x-emagrecimento-academia",
    args: [5, "Sedentário", "PPL", 60, 30, "Emagrecimento", false, false, "academia", 29, "male"],
    maxMs: 3000,
  },
  {
    name: "intermediario-upper-lower-4x-hipertrofia",
    args: [4, "Intermediário", "Upper/Lower", 75, 24, "Hipertrofia", false, false, "academia", 33, "female"],
    maxMs: 3000,
  },
  {
    name: "iniciante-full-body-3x-saude-em-casa",
    args: [3, "Iniciante", "Full Body", 40, 26, "Saúde", false, false, "casa", 25, "female"],
    maxMs: 3000,
  },
  {
    name: "avancado-ppl-6x-ganho-massa",
    args: [6, "Avançado", "PPL", 90, 22, "Ganhar massa", false, false, "academia", 31, "male"],
    maxMs: 3500,
  },
  {
    name: "sobrepeso-upper-lower-4x-recomposicao",
    args: [4, "Intermediário", "Upper/Lower", 55, 28, "Ganhar massa", false, false, "ambos", 37, "male"],
    maxMs: 3000,
  },
  {
    name: "idoso-full-body-3x-com-limitacao-ombro",
    args: [3, "Sedentário", "Full Body", 35, 27, "Condicionamento", true, false, "casa", 64, "female"],
    maxMs: 3500,
  },
  {
    name: "knee-limitation-upper-lower-4x",
    args: [4, "Intermediário", "Upper/Lower", 50, 25, "Reabilitação", false, true, "academia", 41, "male"],
    maxMs: 3500,
  },
  {
    name: "tempo-curto-full-body-5x",
    args: [5, "Intermediário", "Full Body", 25, 23, "Condicionamento", false, false, "casa", 28, "female"],
    maxMs: 3500,
  },
  {
    name: "ar-livre-full-body-4x",
    args: [4, "Iniciante", "Full Body", 45, 24, "Emagrecimento", false, false, "ar_livre", 30, "male"],
    maxMs: 3500,
  },
  {
    name: "automatic-division-sem-divisao-explicita",
    args: [4, "Intermediário", undefined, 60, 25, "Saúde", false, false, "ambos", 35, "female"],
    maxMs: 3500,
  },
];

const FEMALE_BR_PROFILES: PerfProfile[] = [
  { name: "mulher-jovem-iniciante-fullbody-casa", args: [3, "Iniciante", "Full Body", 35, 22, "Saúde", false, false, "casa", 22, "female"], maxMs: 4000 },
  { name: "mulher-jovem-intermediaria-upper-lower-academia", args: [4, "Intermediário", "Upper/Lower", 60, 23, "Hipertrofia", false, false, "academia", 24, "female"], maxMs: 4000 },
  { name: "mulher-25-emagrecimento-fullbody-ambos", args: [4, "Intermediário", "Full Body", 45, 27, "Emagrecimento", false, false, "ambos", 25, "female"], maxMs: 4000 },
  { name: "mulher-26-ppl-academia-ganho-massa", args: [5, "Intermediário", "PPL", 70, 24, "Ganhar massa", false, false, "academia", 26, "female"], maxMs: 4000 },
  { name: "mulher-27-pos-parto-condicionamento-casa", args: [3, "Sedentário", "Full Body", 30, 26, "Condicionamento", true, false, "casa", 27, "female"], maxMs: 4000 },
  { name: "mulher-28-recomposicao-upper-lower", args: [4, "Intermediário", "Upper/Lower", 55, 28, "Ganhar massa", false, false, "ambos", 28, "female"], maxMs: 4000 },
  { name: "mulher-29-iniciante-ar-livre", args: [3, "Iniciante", "Full Body", 40, 25, "Emagrecimento", false, false, "ar_livre", 29, "female"], maxMs: 4000 },
  { name: "mulher-30-ppl-hipertrofia-academia", args: [6, "Avançado", "PPL", 80, 22, "Hipertrofia", false, false, "academia", 30, "female"], maxMs: 4000 },
  { name: "mulher-31-home-office-tempo-curto", args: [5, "Intermediário", "Full Body", 25, 24, "Saúde", false, false, "casa", 31, "female"], maxMs: 4000 },
  { name: "mulher-32-sedentaria-emagrecimento", args: [3, "Sedentário", "Full Body", 35, 31, "Emagrecimento", false, false, "ambos", 32, "female"], maxMs: 4000 },
  { name: "mulher-33-intermediaria-knee-limitation", args: [4, "Intermediário", "Upper/Lower", 50, 27, "Condicionamento", false, true, "academia", 33, "female"], maxMs: 4000 },
  { name: "mulher-34-corrida-ar-livre-full-body", args: [4, "Intermediário", "Full Body", 45, 23, "Performance", false, false, "ar_livre", 34, "female"], maxMs: 4000 },
  { name: "mulher-35-mae-rotina-intensa-casa", args: [3, "Iniciante", "Full Body", 28, 29, "Emagrecimento", false, false, "casa", 35, "female"], maxMs: 4000 },
  { name: "mulher-36-hipertrofia-gluteos-academia", args: [5, "Intermediário", "Upper/Lower", 65, 24, "Hipertrofia", false, false, "academia", 36, "female"], maxMs: 4000 },
  { name: "mulher-37-reabilitacao-ombro", args: [3, "Sedentário", "Full Body", 35, 26, "Reabilitação", true, false, "ambos", 37, "female"], maxMs: 4000 },
  { name: "mulher-38-pre-diabetes-emagrecimento", args: [4, "Sedentário", "Full Body", 40, 32, "Emagrecimento", false, false, "casa", 38, "female"], maxMs: 4000 },
  { name: "mulher-39-intermediaria-divisao-automatica", args: [4, "Intermediário", undefined, 55, 26, "Saúde", false, false, "ambos", 39, "female"], maxMs: 4000 },
  { name: "mulher-40-upper-lower-condicionamento", args: [4, "Intermediário", "Upper/Lower", 50, 25, "Condicionamento", false, false, "academia", 40, "female"], maxMs: 4000 },
  { name: "mulher-41-sedentaria-inicio-academia", args: [3, "Sedentário", "Full Body", 35, 30, "Saúde", false, false, "academia", 41, "female"], maxMs: 4000 },
  { name: "mulher-42-menopausa-ativa-casa", args: [4, "Intermediário", "Full Body", 40, 28, "Condicionamento", false, false, "casa", 42, "female"], maxMs: 4000 },
  { name: "mulher-43-hipertrofia-ppl", args: [5, "Intermediário", "PPL", 70, 24, "Hipertrofia", false, false, "academia", 43, "female"], maxMs: 4000 },
  { name: "mulher-44-knee-care-emagrecimento", args: [3, "Sedentário", "Full Body", 30, 33, "Emagrecimento", false, true, "casa", 44, "female"], maxMs: 4000 },
  { name: "mulher-45-funcional-ar-livre", args: [4, "Iniciante", "Full Body", 45, 27, "Condicionamento", false, false, "ar_livre", 45, "female"], maxMs: 4000 },
  { name: "mulher-46-sobrepeso-recomposicao", args: [4, "Intermediário", "Upper/Lower", 55, 31, "Ganhar massa", false, false, "ambos", 46, "female"], maxMs: 4000 },
  { name: "mulher-47-home-gym-upper-lower", args: [4, "Intermediário", "Upper/Lower", 60, 26, "Hipertrofia", false, false, "casa", 47, "female"], maxMs: 4000 },
  { name: "mulher-48-sedentarismo-para-saude", args: [3, "Sedentário", "Full Body", 35, 29, "Saúde", false, false, "ambos", 48, "female"], maxMs: 4000 },
  { name: "mulher-49-avancada-ppl-academia", args: [6, "Avançado", "PPL", 85, 23, "Performance", false, false, "academia", 49, "female"], maxMs: 4000 },
  { name: "mulher-50-menopausa-fullbody", args: [4, "Intermediário", "Full Body", 40, 30, "Condicionamento", false, false, "casa", 50, "female"], maxMs: 4000 },
  { name: "mulher-52-idosa-ativa-fullbody", args: [3, "Intermediário", "Full Body", 35, 27, "Saúde", false, false, "ambos", 52, "female"], maxMs: 4000 },
  { name: "mulher-55-idosa-com-limitacao-ombro", args: [3, "Sedentário", "Full Body", 30, 29, "Reabilitação", true, false, "casa", 55, "female"], maxMs: 4000 },
];

let logSpy: ReturnType<typeof vi.spyOn>;
let warnSpy: ReturnType<typeof vi.spyOn>;
let errorSpy: ReturnType<typeof vi.spyOn>;

describe("generateTrainingPlanStructure - performance profiles", () => {
  beforeAll(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterAll(() => {
    logSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it.each(PERF_PROFILES)(
    "should generate plan within threshold: $name",
    ({ args, maxMs }) => {
      const start = performance.now();
      const plan = generateTrainingPlanStructure(...args);
      const elapsedMs = performance.now() - start;

      expect(plan).toBeDefined();
      expect(plan.weeklySchedule.length).toBe(args[0]);
      expect(plan.weeklySchedule.every((day) => day.day.length > 0)).toBe(true);
      expect(plan.weeklySchedule.every((day) => day.type.length > 0)).toBe(true);
      expect(plan.weeklySchedule.every((day) => Array.isArray(day.exercises))).toBe(
        true
      );
      expect(plan.overview.length).toBeGreaterThan(0);
      expect(elapsedMs).toBeLessThan(maxMs);
    }
  );

  it.each(FEMALE_BR_PROFILES)(
    "should generate female brazilian profile within threshold: $name",
    ({ args, maxMs }) => {
      const start = performance.now();
      const plan = generateTrainingPlanStructure(...args);
      const elapsedMs = performance.now() - start;

      expect(plan).toBeDefined();
      expect(args[10]).toBe("female");
      expect(plan.weeklySchedule.length).toBe(args[0]);
      expect(plan.weeklySchedule.every((day) => day.day.length > 0)).toBe(true);
      expect(plan.weeklySchedule.every((day) => day.type.length > 0)).toBe(true);
      expect(plan.weeklySchedule.every((day) => Array.isArray(day.exercises))).toBe(
        true
      );
      expect(plan.overview.length).toBeGreaterThan(0);
      expect(elapsedMs).toBeLessThan(maxMs);
    }
  );
});
