import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

interface UserEvaluation {
  id: string;
  user_id: string;
  file_name: string;
  file_size?: number;
  file_type?: string;
  upload_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface EvaluationData {
  fileName: string;
  fileSize?: number;
  fileType?: string;
}

export function useEvaluation(user: User | null) {
  const [evaluation, setEvaluation] = useState<UserEvaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buscar avaliação ativa do usuário
  const fetchEvaluation = useCallback(async () => {
    if (!user?.id) {
      setEvaluation(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("user_evaluations")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        if (error.code === "PGRST116") {
          // Nenhuma avaliação encontrada - isso é normal
          setEvaluation(null);
        } else {
          console.error("Erro ao buscar avaliação:", error);
          setError("Erro ao carregar avaliação");
          setEvaluation(null);
        }
        return;
      }

      setEvaluation(data);
    } catch (error) {
      console.error("Erro inesperado ao buscar avaliação:", error);
      setError("Erro inesperado ao carregar avaliação");
      setEvaluation(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id]); // Usar apenas o ID do usuário como dependência

  // Carregar avaliação quando o usuário mudar
  useEffect(() => {
    if (user?.id) {
      fetchEvaluation();
    }
  }, [user?.id, fetchEvaluation]); // Incluir fetchEvaluation como dependência

  // Salvar nova avaliação (otimizado para evitar re-renderizações)
  const saveEvaluation = useCallback(
    async (fileData: EvaluationData) => {
      if (!user) {
        setError("Usuário não autenticado");
        return false;
      }

      setError(null);

      try {
        // Primeiro, desativar avaliações anteriores
        await supabase
          .from("user_evaluations")
          .update({ is_active: false })
          .eq("user_id", user.id)
          .eq("is_active", true);

        // Inserir nova avaliação
        const { data, error } = await supabase
          .from("user_evaluations")
          .insert({
            user_id: user.id,
            file_name: fileData.fileName,
            file_size: fileData.fileSize,
            file_type: fileData.fileType,
            is_active: true,
          })
          .select()
          .maybeSingle();

        if (error) {
          console.error("Erro ao salvar avaliação:", error);
          setError("Erro ao salvar avaliação: " + error.message);
          return false;
        }

        // Atualizar estado de forma otimizada
        setEvaluation((prev) => {
          // Só atualizar se realmente mudou
          if (!prev || prev.id !== data.id) {
            return data;
          }
          return prev;
        });

        // Também salvar no localStorage como fallback
        localStorage.setItem(
          "userEvaluation",
          JSON.stringify({
            fileName: fileData.fileName,
            fileSize: fileData.fileSize,
            uploadDate: new Date().toISOString(),
          })
        );

        return true;
      } catch (error) {
        console.error("Erro inesperado ao salvar avaliação:", error);
        setError("Erro inesperado ao salvar avaliação");
        return false;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.id]
  );

  // Remover avaliação
  const removeEvaluation = async () => {
    if (!user) {
      setError("Usuário não autenticado");
      return false;
    }

    setError(null);

    try {
      // Marcar como inativo no banco
      const { error } = await supabase
        .from("user_evaluations")
        .update({ is_active: false })
        .eq("user_id", user.id)
        .eq("is_active", true);

      if (error) {
        console.error("Erro ao remover avaliação:", error);
        setError("Erro ao remover avaliação: " + error.message);
        return false;
      }

      setEvaluation(null);

      // Remover do localStorage
      localStorage.removeItem("userEvaluation");

      return true;
    } catch (error) {
      console.error("Erro inesperado ao remover avaliação:", error);
      setError("Erro inesperado ao remover avaliação");
      return false;
    }
  };

  // Recarregar avaliação
  const refreshEvaluation = async () => {
    await fetchEvaluation();
  };

  return {
    evaluation,
    loading,
    error,
    saveEvaluation,
    removeEvaluation,
    refreshEvaluation,
  };
}
