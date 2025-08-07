import { useState } from "react";

interface EvolutionData {
  peso: string;
  treinos: string;
  bemEstar: string;
  observacoes: string;
  arquivoAvaliacao?: File;
}

export function useEvolution() {
  const [isAdding, setIsAdding] = useState(false);
  const [modalData, setModalData] = useState<EvolutionData>({
    peso: "",
    treinos: "",
    bemEstar: "3",
    observacoes: "",
  });

  const addEvolution = async (data: EvolutionData) => {
    setIsAdding(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      console.log("Dados da evolução:", data);

      if (data.arquivoAvaliacao) {
        console.log("Arquivo de avaliação:", data.arquivoAvaliacao.name);
        // Aqui você pode implementar o upload do arquivo para o servidor
      }
    } catch (error) {
      console.error("Erro ao salvar evolução:", error);
    } finally {
      setIsAdding(false);
    }
  };

  return { isAdding, modalData, addEvolution, setModalData };
}
