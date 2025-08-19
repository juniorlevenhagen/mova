import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

interface UserActivity {
  id: string;
  user_id: string;
  date: string;
  horario?: string; // Novo campo
  treinos_concluidos: number;
  calorias_queimadas: number;
  duracao_minutos: number;
  tipo_treino?: string;
  observacoes?: string;
  created_at: string;
}

interface CreateActivityData {
  date?: string;
  horario?: string; // Novo campo
  treinos_concluidos?: number | undefined; // Permitir undefined
  calorias_queimadas?: number | undefined;
  duracao_minutos?: number | undefined;
  tipo_treino?: string;
  observacoes?: string;
}

export function useActivity(user: User | null) {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Buscar atividades do usuário
  const fetchActivities = useCallback(async () => {
    if (!user) {
      setActivities([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("user_activities")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (error) {
        console.error("Erro ao buscar atividades:", error);
        setError("Erro ao carregar atividades: " + error.message);
        return;
      }

      console.log("Atividades carregadas:", data);
      setActivities(data || []);
    } catch (err) {
      console.error("Erro inesperado ao buscar atividades:", err);
      setError("Erro inesperado ao carregar atividades");
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Carregar atividades quando o usuário mudar
  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Adicionar nova atividade
  const addActivity = async (data: CreateActivityData) => {
    if (!user) {
      setError("Usuário não autenticado");
      return;
    }

    setIsAdding(true);
    setError(null);

    try {
      const activityData = {
        user_id: user.id,
        date: data.date || new Date().toISOString().split("T")[0],
        horario:
          data.horario ||
          new Date()
            .toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false, // Usar formato 24h
            })
            .slice(0, 5), // Pegar apenas HH:MM
        treinos_concluidos: data.treinos_concluidos || 1, // undefined vira 1 (padrão)
        calorias_queimadas: data.calorias_queimadas || 0, // undefined vira 0
        duracao_minutos: data.duracao_minutos || 0, // undefined vira 0
        tipo_treino: data.tipo_treino,
        observacoes: data.observacoes,
      };

      const { data: newActivity, error } = await supabase
        .from("user_activities")
        .insert(activityData)
        .select()
        .single();

      if (error) {
        console.error("Erro ao salvar atividade:", error);
        setError("Erro ao salvar atividade: " + error.message);
        return;
      }

      console.log("Atividade salva com sucesso:", newActivity);
      setActivities((prev) => [newActivity, ...prev]);
    } catch (err) {
      console.error("Erro inesperado ao salvar atividade:", err);
      setError("Erro inesperado ao salvar atividade");
    } finally {
      setIsAdding(false);
    }
  };

  // Calcular estatísticas
  const getStats = useCallback(() => {
    if (!activities.length) {
      return {
        totalTreinos: 0,
        caloriasSemana: 0,
        sequenciaAtual: 0,
        treinosSemana: 0,
      };
    }

    // Total de treinos
    const totalTreinos = activities.reduce(
      (sum, activity) => sum + (activity.treinos_concluidos || 0),
      0
    );

    // Calorias da semana atual
    const hoje = new Date();
    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(hoje.getDate() - hoje.getDay());
    inicioSemana.setHours(0, 0, 0, 0);

    const caloriasSemana = activities
      .filter((activity) => new Date(activity.date) >= inicioSemana)
      .reduce((sum, activity) => sum + (activity.calorias_queimadas || 0), 0);

    // Treinos da semana atual
    const treinosSemana = activities
      .filter((activity) => new Date(activity.date) >= inicioSemana)
      .reduce((sum, activity) => sum + (activity.treinos_concluidos || 0), 0);

    // Calcular sequência atual (dias consecutivos com treinos)
    let sequenciaAtual = 0;
    const hojeStr = hoje.toISOString().split("T")[0];
    let dataVerificacao = new Date(hoje);

    while (true) {
      const dataStr = dataVerificacao.toISOString().split("T")[0];
      const atividadeDia = activities.find(
        (activity) =>
          activity.date === dataStr && (activity.treinos_concluidos || 0) > 0
      );

      if (atividadeDia) {
        sequenciaAtual++;
        dataVerificacao.setDate(dataVerificacao.getDate() - 1);
      } else {
        break;
      }
    }

    return {
      totalTreinos,
      caloriasSemana,
      sequenciaAtual,
      treinosSemana,
    };
  }, [activities]);

  // Dados para gráfico semanal
  const getWeeklyData = useCallback(() => {
    const semanas = [];
    const hoje = new Date();

    // Gerar dados das últimas 6 semanas
    for (let i = 5; i >= 0; i--) {
      const inicioSemana = new Date(hoje);
      inicioSemana.setDate(hoje.getDate() - (hoje.getDay() + i * 7));
      inicioSemana.setHours(0, 0, 0, 0);

      const fimSemana = new Date(inicioSemana);
      fimSemana.setDate(inicioSemana.getDate() + 6);
      fimSemana.setHours(23, 59, 59, 999);

      const treinosSemana = activities
        .filter((activity) => {
          const activityDate = new Date(activity.date);
          return activityDate >= inicioSemana && activityDate <= fimSemana;
        })
        .reduce((sum, activity) => sum + (activity.treinos_concluidos || 0), 0);

      semanas.push({
        semana: `Sem ${6 - i}`,
        treinos: treinosSemana,
        meta: 5, // Meta padrão de 5 treinos por semana
      });
    }

    return semanas;
  }, [activities]);

  return {
    activities,
    loading,
    isAdding,
    error,
    addActivity,
    getStats,
    getWeeklyData,
    refetch: fetchActivities,
  };
}
