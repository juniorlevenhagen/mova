import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

interface GoalData {
  pesoObjetivo: string;
  prazoMeses: string;
  observacoes: string;
}

interface UserGoal {
  id: string;
  user_id: string;
  tipo_meta: string;
  valor_atual?: number;
  valor_meta: number;
  data_inicio: string;
  data_fim?: string;
  ativo: boolean;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

export function useGoals(user: User | null) {
  const [goals, setGoals] = useState<UserGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Buscar metas do usuário
  const fetchGoals = useCallback(async () => {
    if (!user) {
      setGoals([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("user_goals")
        .select("*")
        .eq("user_id", user.id)
        .eq("ativo", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao buscar metas:", error);
        setError("Erro ao carregar metas: " + error.message);
        return;
      }

      setGoals(data || []);
    } catch (err) {
      console.error("Erro inesperado ao buscar metas:", err);
      setError("Erro inesperado ao carregar metas");
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Carregar metas quando o usuário mudar
  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  // Adicionar nova meta
  const addGoal = async (data: GoalData) => {
    if (!user) {
      setError("Usuário não autenticado");
      return;
    }

    setIsAdding(true);
    setError(null);

    try {
      const pesoObjetivo = parseFloat(data.pesoObjetivo);
      const prazoMeses = parseInt(data.prazoMeses);

      if (isNaN(pesoObjetivo) || isNaN(prazoMeses)) {
        setError("Dados inválidos");
        return;
      }

      // Calcular data de fim baseada no prazo
      const dataInicio = new Date();
      const dataFim = new Date();
      dataFim.setMonth(dataFim.getMonth() + prazoMeses);

      const goalData = {
        user_id: user.id,
        tipo_meta: "peso",
        valor_meta: pesoObjetivo,
        data_inicio: dataInicio.toISOString().split("T")[0],
        data_fim: dataFim.toISOString().split("T")[0],
        ativo: true,
        observacoes: data.observacoes.trim() || null,
      };

      console.log("Salvando meta no banco:", goalData);

      const { data: newGoal, error } = await supabase
        .from("user_goals")
        .insert(goalData)
        .select()
        .single();

      if (error) {
        console.error("Erro ao salvar meta:", error);
        setError("Erro ao salvar meta: " + error.message);
        return;
      }

      console.log("Meta salva com sucesso:", newGoal);
      setGoals((prev) => [newGoal, ...prev]);
    } catch (err) {
      console.error("Erro inesperado ao salvar meta:", err);
      setError("Erro inesperado ao salvar meta");
    } finally {
      setIsAdding(false);
    }
  };

  // Desativar meta (soft delete)
  const deactivateGoal = async (goalId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("user_goals")
        .update({ ativo: false })
        .eq("id", goalId)
        .eq("user_id", user.id);

      if (error) {
        console.error("Erro ao desativar meta:", error);
        return;
      }

      setGoals((prev) => prev.filter((goal) => goal.id !== goalId));
    } catch (err) {
      console.error("Erro inesperado ao desativar meta:", err);
    }
  };

  return {
    goals,
    loading,
    isAdding,
    error,
    addGoal,
    deactivateGoal,
    refetch: fetchGoals,
  };
}
