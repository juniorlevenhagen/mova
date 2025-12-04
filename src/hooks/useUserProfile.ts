import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

interface UserProfile {
  id: string;
  user_id: string;
  age: number;
  birth_date: string; // Adicionar este campo
  height: number;
  weight: number; // Peso atual
  initial_weight: number; // Peso inicial
  gender: string;
  objective: string;
  training_frequency: string;
  training_location: string;
  has_pain: string;
  nivel_atividade: string;
  dietary_restrictions: string;
  food_budget?: string;
  created_at: string;
  updated_at: string;
}

interface UserData {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
}

export function useUserProfile(user: User | null) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Resetar dados quando o usuário mudar
    setProfile(null);
    setUserData(null);
    setError(null);

    if (!user) {
      setLoading(false);
      return;
    }

    console.log("Carregando dados para usuário:", user.id);

    const fetchUserData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Buscar dados básicos do usuário
        const { data: userDataResult, error: userError } = await supabase
          .from("users")
          .select("id, email, full_name, created_at")
          .eq("id", user.id)
          .maybeSingle();

        if (userError) {
          console.error("Erro ao buscar dados do usuário:", userError);
          setError("Erro ao carregar dados do usuário");
          return;
        }

        setUserData(userDataResult);

        // Buscar perfil do usuário

        // Buscar perfil específico do usuário

        const { data: profileResult, error: profileError } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profileError) {
          if (profileError.code === "PGRST116") {
            // Perfil não encontrado - isso é normal para usuários novos

            setProfile(null);
          } else {
            console.error("Erro ao buscar perfil:", profileError);
            setError("Erro ao carregar perfil");
            return;
          }
        } else {
          setProfile(profileResult);
        }
      } catch (error) {
        console.error("Erro inesperado ao buscar dados:", error);
        setError("Erro inesperado ao carregar dados");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  // Função para atualizar o perfil do usuário
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !profile) {
      setError("Usuário ou perfil não encontrado");
      return false;
    }

    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .update(updates)
        .eq("user_id", user.id)
        .select()
        .maybeSingle();

      if (error) {
        console.error("Erro ao atualizar perfil:", error);
        setError("Erro ao atualizar perfil");
        return false;
      }

      // Atualizar o estado local
      setProfile(data);
      return true;
    } catch (error) {
      console.error("Erro inesperado ao atualizar perfil:", error);
      setError("Erro inesperado ao atualizar perfil");
      return false;
    }
  };

  // Função para recarregar os dados do perfil
  const refreshProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: profileResult, error: profileError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileError) {
        if (profileError.code !== "PGRST116") {
          console.error("Erro ao recarregar perfil:", profileError);
          setError("Erro ao recarregar perfil");
        }
      } else {
        setProfile(profileResult);
        setError(null);
      }
    } catch (error) {
      console.error("Erro inesperado ao recarregar perfil:", error);
      setError("Erro inesperado ao recarregar perfil");
    } finally {
      setLoading(false);
    }
  };

  return {
    profile,
    userData,
    loading,
    error,
    updateProfile,
    refreshProfile,
  };
}
