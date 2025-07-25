import { useState } from "react";

export function usePlanGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePlan = async () => {
    setIsGenerating(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      console.log("Gerando plano personalizado...");
    } catch (error) {
      console.error("Erro ao gerar plano:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return { isGenerating, generatePlan };
}
