import { z } from "zod";

// Schema para Step 1 - Dados básicos
export const step1Schema = z
  .object({
    name: z
      .string()
      .min(2, "Nome deve ter pelo menos 2 caracteres")
      .max(50, "Nome deve ter no máximo 50 caracteres")
      .trim(),
    email: z
      .string()
      .email("Email inválido")
      .min(1, "Email é obrigatório")
      .toLowerCase()
      .trim(),
    password: z
      .string()
      .min(8, "Senha deve ter pelo menos 8 caracteres")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Senha deve conter pelo menos 1 letra minúscula, 1 maiúscula e 1 número"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Senhas não coincidem",
    path: ["confirmPassword"],
  });

// Schema para Step 2 - Dados físicos
export const step2Schema = z.object({
  age: z
    .number({ message: "Idade é obrigatória" })
    .int("Idade deve ser um número inteiro")
    .min(16, "Idade mínima é 16 anos")
    .max(100, "Idade máxima é 100 anos"),
  height: z
    .number({ message: "Altura é obrigatória" })
    .int("Altura deve ser um número inteiro")
    .min(100, "Altura mínima é 100cm")
    .max(250, "Altura máxima é 250cm"),
  weight: z
    .number({ message: "Peso é obrigatório" })
    .positive("Peso deve ser positivo")
    .min(30, "Peso mínimo é 30kg")
    .max(300, "Peso máximo é 300kg"),
  gender: z.enum(["male", "female", "other"], {
    message: "Selecione seu gênero",
  }),
  activityLevel: z.enum(
    ["sedentary", "light", "moderate", "active", "very_active"],
    {
      message: "Selecione seu nível de atividade",
    }
  ),
  goals: z
    .array(z.string())
    .min(1, "Selecione pelo menos um objetivo")
    .max(5, "Máximo 5 objetivos"),
});

// Schema para Step 3 - Objetivos e preferências
export const step3Schema = z.object({
  primaryGoal: z.enum(
    ["weight_loss", "muscle_gain", "endurance", "general_fitness"],
    {
      message: "Selecione seu objetivo principal",
    }
  ),
  experience: z.enum(["beginner", "intermediate", "advanced"], {
    message: "Selecione seu nível de experiência",
  }),
  equipment: z.array(z.string()).min(1, "Selecione pelo menos um equipamento"),
  timePerSession: z
    .number({ message: "Tempo por sessão é obrigatório" })
    .int("Tempo deve ser um número inteiro")
    .min(15, "Mínimo 15 minutos por sessão")
    .max(180, "Máximo 180 minutos por sessão"),
  sessionsPerWeek: z
    .number({ message: "Sessões por semana é obrigatório" })
    .int("Número de sessões deve ser inteiro")
    .min(1, "Mínimo 1 sessão por semana")
    .max(7, "Máximo 7 sessões por semana"),
  injuries: z
    .string()
    .max(500, "Máximo 500 caracteres")
    .optional()
    .or(z.literal("")),
  preferences: z
    .string()
    .max(500, "Máximo 500 caracteres")
    .optional()
    .or(z.literal("")),
});

// Tipos inferidos
export type Step1Data = z.infer<typeof step1Schema>;
export type Step2Data = z.infer<typeof step2Schema>;
export type Step3Data = z.infer<typeof step3Schema>;
