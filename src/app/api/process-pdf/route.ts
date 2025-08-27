import { NextRequest, NextResponse } from "next/server";
import pdfParse from "pdf-parse";
import OpenAI from "openai";
import { supabase } from "@/lib/supabase";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

export async function POST(request: NextRequest) {
  console.log("=== TESTE COM IMPORTAÇÃO DIRETA ===");
  console.log("pdf-parse type:", typeof pdfParse);
  console.log("pdf-parse:", pdfParse);

  console.log("Request:", request);

  try {
    // Verificar se o usuário está autenticado
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "Token de autorização não encontrado" },
        { status: 401 }
      );
    }

    // Obter o usuário atual
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));

    if (userError || !user) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
    }
    const formData = await request.formData();
    const file = formData.get("file") as File;

    console.log("File:", file);
    console.log("FormData:", formData);

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo fornecido" },
        { status: 400 }
      );
    }

    console.log("File obtido:", file.name, file.size, file.type);

    // Converter para buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log("Buffer criado, tamanho:", buffer.length);
    console.log("Buffer válido:", Buffer.isBuffer(buffer));

    // Verificar header
    const header = buffer.toString("ascii", 0, 4);
    console.log("Header:", header);

    if (header !== "%PDF") {
      return NextResponse.json(
        { error: "Arquivo não é um PDF válido" },
        { status: 400 }
      );
    }

    // Chamar pdf-parse
    console.log("Chamando pdf-parse...");
    const pdfData: PDFData = await pdfParse(buffer);

    console.log("Sucesso! Páginas:", pdfData.numpages);
    console.log("Tamanho do texto:", pdfData.text.length);

    // const meusDados = ...
    // role: "user", content: JSON.stringify(meusDados)

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
              imc: {
                type: "number",
                description: "IMC da pessoa",
              },
              gender: {
                type: "string",
                enum: ["male", "female"],
                description: "Sexo da pessoa",
              },
              basalCalories: {
                type: "number",
                description: "Calorias basais da pessoa",
              },
              summary: {
                type: "string",
                description: "Resumo do conteúdo do PDF",
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

    console.log(
      "Completion:",
      JSON.parse(completion.choices[0].message.content || "{}")
    );

    const summary = JSON.parse(completion.choices[0].message.content || "{}");

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
        console.log(
          `🔍 Processando peso: PDF=${summary.weight} → Salvar=${profileUpdates.weight}`
        );
      }

      if (summary.height && typeof summary.height === "number") {
        // Manter uma casa decimal para altura (ex: 175.5 cm)
        profileUpdates.height = Number(summary.height.toFixed(1));
      }

      if (summary.gender && typeof summary.gender === "string") {
        profileUpdates.gender = summary.gender;
      }

      if (Object.keys(profileUpdates).length > 0) {
        console.log("Atualizando perfil do usuário com:", profileUpdates);
        console.log(`⚖️ Tentando salvar peso: ${profileUpdates.weight}`);

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
            console.log("Perfil não encontrado, criando novo perfil...");

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
              console.log("✅ Perfil criado com sucesso!");
              console.log("👤 Novo perfil:", newProfile);
              console.log("⚖️ Peso salvo:", newProfile.weight);
            }
          } else {
            console.error("Erro ao atualizar perfil:", updateError);
          }
        } else {
          console.log("✅ Perfil existente atualizado com sucesso!");
          console.log("👤 Perfil atualizado:", updatedProfile);
          console.log("⚖️ Novo peso salvo na base:", updatedProfile.weight);
          console.log(
            "🔍 Comparação: PDF tinha",
            summary.weight,
            "→ Base tem",
            updatedProfile.weight
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
