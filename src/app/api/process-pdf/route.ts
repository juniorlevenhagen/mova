import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    console.log("=== INÍCIO DO PROCESSAMENTO ===");

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      console.log("ERRO: Nenhum arquivo fornecido");
      return NextResponse.json(
        { error: "Nenhum arquivo fornecido" },
        { status: 400 }
      );
    }

    console.log("=== INFORMAÇÕES DO ARQUIVO ===");
    console.log("Nome:", file.name);
    console.log("Tipo:", file.type);
    console.log("Tamanho:", file.size, "bytes");
    console.log("Última modificação:", file.lastModified);

    // Converter o arquivo para buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    console.log("Buffer criado, tamanho:", buffer.length, "bytes");

    // Verificar se é realmente um PDF
    const header = buffer.toString("ascii", 0, 4);
    console.log("Header do arquivo:", header);

    // TESTE SIMPLES: Retornar apenas informações do arquivo
    return NextResponse.json({
      success: true,
      message: "Arquivo recebido com sucesso!",
      fileInfo: {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified,
        header: header,
        bufferSize: buffer.length,
        isPDF: header === "%PDF",
      },
    });
  } catch (error) {
    console.log("=== ERRO GERAL ===");
    console.error("Erro completo:", error);
    console.error(
      "Mensagem:",
      error instanceof Error ? error.message : "Erro desconhecido"
    );

    const errorMessage =
      error instanceof Error ? error.message : "Erro desconhecido";

    return NextResponse.json(
      { error: "Erro interno do servidor: " + errorMessage },
      { status: 500 }
    );
  }
}
