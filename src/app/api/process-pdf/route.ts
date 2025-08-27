import { NextRequest, NextResponse } from "next/server";
import pdfParse from "pdf-parse";
import OpenAI from "openai";

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

    return NextResponse.json({
      success: true,
      message: "PDF processado com sucesso!",
      summary,
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
