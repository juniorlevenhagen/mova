import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

interface EvolutionData {
  peso: string;
  treinos: string;
  bemEstar: string;
  observacoes: string;
  arquivoAvaliacao?: File;
}

interface UserEvolution {
  id: string;
  user_id: string;
  date: string;
  peso: number;
  percentual_gordura?: number;
  massa_magra?: number;
  cintura?: number;
  quadril?: number;
  braco?: number;
  objetivo?: string;
  nivel_atividade?: string;
  bem_estar: number;
  observacoes: string;
  created_at: string;
  updated_at: string;
}

export function useEvolution(user: User | null) {
  const [evolutions, setEvolutions] = useState<UserEvolution[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Buscar evoluções do usuário - usando useCallback para evitar re-renders
  const fetchEvolutions = useCallback(async () => {
    if (!user) {
      setEvolutions([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("user_evolutions")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: true });

      if (error) {
        console.error("Erro ao buscar evoluções:", error);
        setError("Erro ao carregar evoluções");
        setEvolutions([]);
        return;
      }

      setEvolutions(data || []);
      console.log("Evoluções carregadas:", data);
    } catch (error) {
      console.error("Erro inesperado ao buscar evoluções:", error);
      setError("Erro inesperado ao carregar evoluções");
      setEvolutions([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Adicionar nova evolução
  const addEvolution = async (data: EvolutionData) => {
    if (!user) {
      setError("Usuário não autenticado");
      return;
    }

    setIsAdding(true);
    setError(null);

    try {
      // Validação dos dados
      if (!data.peso || !data.bemEstar || !data.observacoes) {
        setError("Todos os campos são obrigatórios");
        return;
      }

      const peso = parseFloat(data.peso);
      const bemEstar = parseInt(data.bemEstar);

      if (isNaN(peso) || isNaN(bemEstar)) {
        setError("Dados inválidos");
        return;
      }

      const evolutionData = {
        user_id: user.id,
        date: new Date().toISOString().split("T")[0],
        peso,
        bem_estar: bemEstar,
        observacoes: data.observacoes.trim(),
        objetivo: "Emagrecimento",
        nivel_atividade: "Moderado",
      };

      console.log("Salvando evolução:", evolutionData);

      const { data: newEvolution, error } = await supabase
        .from("user_evolutions")
        .insert(evolutionData)
        .select()
        .single();

      if (error) {
        console.error("Erro ao salvar evolução:", error);
        setError("Erro ao salvar evolução: " + error.message);
        return;
      }

      console.log("Evolução salva com sucesso:", newEvolution);

      // Atualizar lista de evoluções (adicionar no final)
      setEvolutions((prev) => [...prev, newEvolution]);
    } catch (error) {
      console.error("Erro inesperado ao salvar evolução:", error);
      setError("Erro inesperado ao salvar evolução");
    } finally {
      setIsAdding(false);
    }
  };

  // Buscar evoluções quando o usuário mudar
  useEffect(() => {
    fetchEvolutions();
  }, [fetchEvolutions]);

  return {
    evolutions,
    loading,
    isAdding,
    error,
    addEvolution,
    refetch: fetchEvolutions,
  };
}
