/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import pdfParse from "pdf-parse";
import OpenAI from "openai";
import { supabase } from "@/lib/supabase";

// Função para criar cliente OpenAI apenas quando necessário
function createOpenAIClient() {
  console.log("🔑 Verificando OPENAI_API_KEY...");
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("❌ OPENAI_API_KEY não configurada");
    throw new Error("OPENAI_API_KEY environment variable is not configured");
  }
  console.log("✅ OPENAI_API_KEY encontrada");
  return new OpenAI({ apiKey });
}

// Tipagens corretas
interface PDFInfo {
  PDFFormatVersion?: string;
  IsAcroFormPresent?: boolean;
  IsXFAPresent?: boolean;
  Title?: string;
  Author?: string;
  Subject?: string;
  Keywords?: string;
  Creator?: string;
  Producer?: string;
  CreationDate?: string;
  ModDate?: string;
}

interface PDFMetadata {
  [key: string]: string | number | boolean | undefined;
}

interface PDFData {
  numpages: number;
  numrender: number;
  info: PDFInfo;
  metadata: PDFMetadata | null;
  version: string;
  text: string;
}

// Função para criar entrada automática na evolução
async function createEvolutionEntry(
  supabaseUser: any,
  userId: string,
  summary: any,
  profile: any
) {
  try {
    const evolutionData = {
      user_id: userId,
      date: new Date().toISOString().split("T")[0], // Data atual
      peso: Number((summary.weight || profile.weight || 0).toFixed(2)),
      percentual_gordura: summary.percentageOfBodyFat
        ? Number(summary.percentageOfBodyFat.toFixed(1))
        : null,
      massa_magra: summary.muscleMass
        ? Number(summary.muscleMass.toFixed(1))
        : null,
      cintura: summary.waist ? Number(summary.waist.toFixed(0)) : null,
      quadril: summary.hip ? Number(summary.hip.toFixed(0)) : null,
      braco: summary.arm ? Number(summary.arm.toFixed(0)) : null,
      coxa: summary.thigh ? Number(summary.thigh.toFixed(0)) : null,
      objetivo: summary.goal || "Manter forma física",
      nivel_atividade: summary.trainingFrequency || "Moderado",
      bem_estar: 4, // Valor padrão positivo após avaliação
      observacoes: `Dados extraídos automaticamente de avaliação física. ${(
        summary.summary || ""
      ).substring(0, 200)}...`,
    };

    const { error: evolutionError } = await supabaseUser
      .from("user_evolutions")
      .insert(evolutionData)
      .select()
      .single();

    if (evolutionError) {
      console.error("❌ Erro ao criar evolução:", evolutionError);
      console.error("❌ Código do erro:", evolutionError.code);
      console.error("❌ Detalhes do erro:", evolutionError.details);
      console.error("❌ Mensagem do erro:", evolutionError.message);
    }
  } catch (error) {
    console.error("❌ Erro inesperado ao criar evolução:", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 Iniciando processamento de PDF...");
    console.log("🔧 Variáveis de ambiente:");
    console.log(
      "- NEXT_PUBLIC_SUPABASE_URL:",
      process.env.NEXT_PUBLIC_SUPABASE_URL ? "Configurada" : "Não configurada"
    );
    console.log(
      "- NEXT_PUBLIC_SUPABASE_ANON_KEY:",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        ? "Configurada"
        : "Não configurada"
    );
    console.log(
      "- OPENAI_API_KEY:",
      process.env.OPENAI_API_KEY ? "Configurada" : "Não configurada"
    );

    // Verificar se as dependências estão carregadas
    console.log("📦 Verificando dependências...");
    try {
      await import('pdf-parse');
      console.log("✅ pdf-parse disponível");
    } catch (error) {
      console.error("❌ Erro ao carregar pdf-parse:", error);
      throw new Error("Dependência pdf-parse não disponível");
    }

    try {
      await import('openai');
      console.log("✅ OpenAI disponível");
    } catch (error) {
      console.error("❌ Erro ao carregar OpenAI:", error);
      throw new Error("Dependência OpenAI não disponível");
    }

    // Verificar se o usuário está autenticado
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      console.error("❌ Token de autorização não encontrado");
      return NextResponse.json(
        { error: "Token de autorização não encontrado" },
        { status: 401 }
      );
    }

    console.log("✅ Token de autorização encontrado");

    // Obter o usuário atual
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));

    if (userError || !user) {
      console.error("❌ Erro de autenticação:", userError);
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    console.log("✅ Usuário autenticado:", user.id);

    console.log("📋 Obtendo formData...");
    const formData = await request.formData();
    console.log("✅ FormData obtido");
    
    const file = formData.get("file") as File;
    console.log("📄 Arquivo extraído do formData:", file ? "Sim" : "Não");

    if (!file) {
      console.error("❌ Nenhum arquivo fornecido");
      return NextResponse.json(
        { error: "Nenhum arquivo fornecido" },
        { status: 400 }
      );
    }

    console.log("📄 Arquivo recebido:", file.name, "Tamanho:", file.size);

    // Converter para buffer
    console.log("🔄 Convertendo arquivo para buffer...");
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log("✅ Buffer criado, tamanho:", buffer.length);

    // Verificar header
    console.log("🔍 Verificando header do PDF...");
    const header = buffer.toString("ascii", 0, 4);
    console.log("📄 Header detectado:", header);

    if (header !== "%PDF") {
      console.error("❌ Arquivo não é um PDF válido. Header:", header);
      return NextResponse.json(
        { error: "Arquivo não é um PDF válido" },
        { status: 400 }
      );
    }

    console.log("✅ PDF válido detectado");

    // Chamar pdf-parse
    console.log("📖 Extraindo texto do PDF...");
    let pdfData: PDFData;
    try {
      pdfData = await pdfParse(buffer);
      console.log("✅ PDF parseado com sucesso");
    } catch (pdfError) {
      console.error("❌ Erro ao fazer parse do PDF:", pdfError);
      throw new Error(`Erro ao processar PDF: ${pdfError instanceof Error ? pdfError.message : 'Erro desconhecido'}`);
    }
    console.log(
      "✅ Texto extraído. Páginas:",
      pdfData.numpages,
      "Caracteres:",
      pdfData.text.length
    );

    // const meusDados = ...
    // role: "user", content: JSON.stringify(meusDados)

    console.log("🤖 Processando com OpenAI...");
    const openai = createOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "Você é um assistente de IA que analisa documentos PDF e retorna um resumo do conteúdo. Nele voce encontrara dados de uma avaliacao fisica",
        },
        {
          role: "user",
          content: pdfData.text,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "summary_weight_something",
          schema: {
            type: "object",
            properties: {
              height: {
                type: "number",
                description: "Altura da pessoa",
              },
              weight: {
                type: "number",
                description: "Peso da pessoa",
              },

              percentageOfBodyFat: {
                type: "number",
                description: "Percentual de gordura da pessoa",
              },

              muscleMass: {
                type: "number",
                description: "Massa magra da pessoa",
              },

              fatMass: {
                type: "number",
                description: "Massa de gordura da pessoa",
              },

              imc: {
                type: "number",
                description: "IMC da pessoa",
              },
              gender: {
                type: "string",
                enum: ["male", "female"],
                description:
                  "Sexo da pessoa (use: male para masculino, female para feminino)",
              },
              basalCalories: {
                type: "number",
                description: "Calorias basais da pessoa",
              },
              waist: {
                type: "number",
                description: "Cintura da pessoa",
              },
              hip: {
                type: "number",
                description: "Quadril da pessoa",
              },
              arm: {
                type: "number",
                description: "Braço da pessoa",
              },
              thigh: {
                type: "number",
                description: "Coxa da pessoa",
              },
              calf: {
                type: "number",
                description: "Panturrilha da pessoa",
              },
              biceps: {
                type: "number",
                description: "Bíceps da pessoa",
              },
              triceps: {
                type: "number",
                description: "Tríceps da pessoa",
              },
              forearm: {
                type: "number",
                description: "Antebraço da pessoa",
              },
              neck: {
                type: "number",
                description: "Pescoço da pessoa",
              },
              summary: {
                type: "string",
                description: "Resumo do conteúdo do PDF",
              },
              goal: {
                type: "string",
                description: "Objetivo da pessoa",
              },
              trainingFrequency: {
                type: "string",
                description: "Frequência de treino da pessoa",
              },
              trainingLocation: {
                type: "string",
                description: "Local de treino da pessoa",
              },
              hasPain: {
                type: "string",
                description: "Se a pessoa tem dor",
              },
              dietaryRestrictions: {
                type: "string",
                description: "Restrições alimentares da pessoa",
              },
            },
            required: [
              "height",
              "weight",
              "imc",
              "gender",
              "basalCalories",
              "summary",
            ],
            additionalProperties: false,
          },
        },
      },
    });

    console.log("✅ Resposta da OpenAI recebida");
    const summary = JSON.parse(completion.choices[0].message.content || "{}");
    console.log("📊 Dados extraídos:", summary);

    // Atualizar o perfil do usuário com os dados extraídos
    try {
      const profileUpdates: {
        weight?: number;
        height?: number;
        gender?: string;
      } = {};

      if (summary.weight && typeof summary.weight === "number") {
        // Manter precisão decimal para peso corporal (ex: 75.5 kg)
        profileUpdates.weight = Number(summary.weight.toFixed(2));
      }

      if (summary.height && typeof summary.height === "number") {
        // Manter uma casa decimal para altura (ex: 175.5 cm)
        profileUpdates.height = Number(summary.height.toFixed(1));
      }

      if (summary.gender && typeof summary.gender === "string") {
        // Converter de inglês para português
        const genderMap: { [key: string]: string } = {
          male: "masculino",
          female: "feminino",
        };
        profileUpdates.gender =
          genderMap[summary.gender.toLowerCase()] || summary.gender;
      }

      if (Object.keys(profileUpdates).length > 0) {
        // Criar cliente Supabase com token do usuário para RLS
        const authToken = authHeader.replace("Bearer ", "");
        const { createClient } = await import("@supabase/supabase-js");
        const supabaseUser = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            global: {
              headers: {
                Authorization: `Bearer ${authToken}`,
              },
            },
          }
        );

        // Primeiro tentar atualizar o perfil existente
        const { data: updatedProfile, error: updateError } = await supabaseUser
          .from("user_profiles")
          .update(profileUpdates)
          .eq("user_id", user.id)
          .select()
          .single();

        if (updateError) {
          if (updateError.code === "PGRST116") {
            // Perfil não existe, criar um novo

            const newProfileData: {
              user_id: string;
              weight?: number;
              height?: number;
              gender?: string;
              age: number;
              birth_date: string;
              objective: string;
              training_frequency: string;
              training_location: string;
              has_pain: string;
              dietary_restrictions: string;
              initial_weight?: number;
            } = {
              user_id: user.id,
              ...profileUpdates,
              // Valores padrão para campos obrigatórios
              age: 30, // Valor padrão, pode ser ajustado depois
              birth_date: new Date().toISOString().split("T")[0],
              objective: "Emagrecimento",
              training_frequency: "3 vezes por semana",
              training_location: "Academia",
              has_pain: "Não",
              dietary_restrictions: "Nenhuma",
            };

            if (!profileUpdates.weight) newProfileData.weight = 70.0;
            if (!profileUpdates.height) newProfileData.height = 170.0;
            if (!profileUpdates.gender) newProfileData.gender = "male";

            // Garantir precisão decimal adequada
            if (newProfileData.weight)
              newProfileData.weight = Number(newProfileData.weight.toFixed(2));
            if (newProfileData.height)
              newProfileData.height = Number(newProfileData.height.toFixed(1));

            // Definir peso inicial igual ao peso atual
            newProfileData.initial_weight = newProfileData.weight;

            const { data: newProfile, error: createError } = await supabaseUser
              .from("user_profiles")
              .insert(newProfileData)
              .select()
              .single();

            if (createError) {
              console.error("Erro ao criar perfil:", createError);
            } else {
              // 🎯 NOVO: Criar entrada automática na evolução para perfil novo
              await createEvolutionEntry(
                supabaseUser,
                user.id,
                summary,
                newProfile
              );
            }
          } else {
            console.error("Erro ao atualizar perfil:", updateError);
          }
        } else {
          // 🎯 NOVO: Criar entrada automática na evolução
          await createEvolutionEntry(
            supabaseUser,
            user.id,
            summary,
            updatedProfile
          );
        }
      }
    } catch (profileError) {
      console.error("Erro inesperado ao atualizar perfil:", profileError);
      // Não retornar erro, apenas log - o PDF foi processado com sucesso
    }

    return NextResponse.json({
      success: true,
      message: "PDF processado com sucesso!",
      summary,
      profileUpdated: true,
    });
  } catch (error: unknown) {
    console.error("=== ERRO DETALHADO ===");
    console.error("Erro:", error);

    if (error instanceof Error) {
      console.error("Message:", error.message);
      console.error("Name:", error.name);
      console.error("Stack:", error.stack);
    }

    console.error("=== FIM DO ERRO ===");

    const errorMessage =
      error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json(
      { error: "Erro interno do servidor: " + errorMessage },
      { status: 500 }
    );
  }
}
